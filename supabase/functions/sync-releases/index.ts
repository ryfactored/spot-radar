import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SPOTIFY_API = 'https://api.spotify.com/v1';
const BATCH_SIZE = 10;

interface ArtistRow {
  spotify_artist_id: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, skipRecent = true } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Get user's Spotify token
    const { data: tokenRow, error: tokenError } = await supabase
      .schema('spot_radar')
      .from('user_spotify_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .single();

    if (tokenError || !tokenRow) {
      return new Response(JSON.stringify({ error: 'No Spotify token found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let accessToken = tokenRow.access_token;

    // Refresh token if expired
    if (new Date(tokenRow.expires_at) < new Date()) {
      const clientId = Deno.env.get('SPOTIFY_CLIENT_ID')!;
      const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET')!;
      const credentials = btoa(`${clientId}:${clientSecret}`);

      const refreshResp = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokenRow.refresh_token,
        }),
      });

      if (!refreshResp.ok) {
        return new Response(JSON.stringify({ error: 'Token refresh failed' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const refreshData = await refreshResp.json();
      accessToken = refreshData.access_token;

      await supabase
        .schema('spot_radar')
        .from('user_spotify_tokens')
        .update({
          access_token: accessToken,
          expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }

    // Get user's artist IDs
    const { data: artistRows } = await supabase
      .schema('spot_radar')
      .from('user_artists')
      .select('spotify_artist_id')
      .eq('user_id', userId);

    if (!artistRows || artistRows.length === 0) {
      return new Response(JSON.stringify({ message: 'No artists to sync' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Skip artists already checked in last 24h (only for background/cron syncs)
    let artistsToCheck = artistRows;
    if (skipRecent) {
      const { data: recentlyChecked } = await supabase
        .schema('spot_radar')
        .from('artists')
        .select('spotify_artist_id')
        .gt('last_release_check', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const recentIds = new Set((recentlyChecked ?? []).map((r: ArtistRow) => r.spotify_artist_id));
      artistsToCheck = artistRows.filter((r: ArtistRow) => !recentIds.has(r.spotify_artist_id));
    }

    let checked = 0;
    const total = artistsToCheck.length;
    const startTime = Date.now();
    const MAX_RUNTIME_MS = 45_000; // Stop before 60s edge function timeout

    // Process in batches
    for (let i = 0; i < artistsToCheck.length; i += BATCH_SIZE) {
      // Check if we're running low on time
      if (Date.now() - startTime > MAX_RUNTIME_MS) {
        return new Response(
          JSON.stringify({ total, checked, remaining: total - checked, done: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const batch = artistsToCheck.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (row: ArtistRow) => {
          const url = `${SPOTIFY_API}/artists/${row.spotify_artist_id}/albums?include_groups=album,single&limit=5`;
          const resp = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (resp.status === 429) {
            const retryAfter = parseInt(resp.headers.get('Retry-After') || '5', 10);
            await new Promise((r) => setTimeout(r, retryAfter * 1000));
            const retryResp = await fetch(url, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!retryResp.ok) return [];
            const retryData = await retryResp.json();
            return retryData.items;
          }

          if (!resp.ok) return [];
          const data = await resp.json();
          return data.items;
        }),
      );

      const cutoffYear = new Date().getFullYear() - 1;

      // deno-lint-ignore no-explicit-any
      const releases = results
        .filter((r): r is PromiseFulfilledResult<unknown[]> => r.status === 'fulfilled')
        .flatMap((r) => r.value)
        .filter(Boolean)
        // deno-lint-ignore no-explicit-any
        .filter((album: any) => parseInt(album.release_date.substring(0, 4), 10) >= cutoffYear)
        // deno-lint-ignore no-explicit-any
        .map((album: any) => ({
          spotify_album_id: album.id,
          spotify_artist_id: album.artists[0]?.id ?? '',
          artist_name: album.artists[0]?.name ?? 'Unknown',
          title: album.name,
          release_type: album.album_type ?? 'album',
          release_date: album.release_date,
          image_url: album.images?.[0]?.url ?? null,
          track_count: album.total_tracks ?? 0,
        }));

      // Upsert releases
      if (releases.length > 0) {
        await supabase
          .schema('spot_radar')
          .from('releases')
          .upsert(releases, { onConflict: 'spotify_album_id' });
      }

      // Update last_release_check on shared artists table
      const checkedIds = batch.map((r: ArtistRow) => r.spotify_artist_id);
      await supabase
        .schema('spot_radar')
        .from('artists')
        .update({ last_release_check: new Date().toISOString() })
        .in('spotify_artist_id', checkedIds);

      checked += batch.length;
    }

    return new Response(JSON.stringify({ total, checked, remaining: 0, done: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
