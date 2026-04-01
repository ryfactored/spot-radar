import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SPOTIFY_API = 'https://api.spotify.com/v1';
const BATCH_LIMIT = 200;
const CONCURRENT = 10;

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Get stale artists (oldest last_release_check)
    const { data: staleArtists } = await supabase
      .schema('angular_starter')
      .from('artists')
      .select('spotify_artist_id')
      .order('last_release_check', { ascending: true, nullsFirst: true })
      .limit(BATCH_LIMIT);

    if (!staleArtists || staleArtists.length === 0) {
      return new Response(JSON.stringify({ message: 'No artists to refresh' }));
    }

    // Get a valid token — pick the user with the freshest token
    const { data: tokenRow } = await supabase
      .schema('angular_starter')
      .from('user_spotify_tokens')
      .select('user_id, access_token, refresh_token, expires_at')
      .order('expires_at', { ascending: false })
      .limit(1)
      .single();

    if (!tokenRow) {
      return new Response(JSON.stringify({ message: 'No valid tokens available' }));
    }

    let accessToken = tokenRow.access_token;

    // Refresh if expired
    if (new Date(tokenRow.expires_at) < new Date()) {
      const refreshResp = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokenRow.refresh_token,
        }),
      });

      if (!refreshResp.ok) {
        return new Response(JSON.stringify({ error: 'Token refresh failed' }), {
          status: 401,
        });
      }

      const refreshData = await refreshResp.json();
      accessToken = refreshData.access_token;

      await supabase
        .schema('angular_starter')
        .from('user_spotify_tokens')
        .update({
          access_token: accessToken,
          expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', tokenRow.user_id);
    }

    // Process in concurrent batches
    let checked = 0;

    for (let i = 0; i < staleArtists.length; i += CONCURRENT) {
      const batch = staleArtists.slice(i, i + CONCURRENT);

      const results = await Promise.allSettled(
        // deno-lint-ignore no-explicit-any
        batch.map(async (artist: any) => {
          const url = `${SPOTIFY_API}/artists/${artist.spotify_artist_id}/albums?include_groups=album,single&limit=1`;
          const resp = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (resp.status === 429) {
            const retryAfter = parseInt(resp.headers.get('Retry-After') || '5', 10);
            await new Promise((r) => setTimeout(r, retryAfter * 1000));
            return null;
          }

          if (!resp.ok) return null;
          const data = await resp.json();
          return {
            artistId: artist.spotify_artist_id,
            items: data.items ?? [],
          };
        }),
      );

      // deno-lint-ignore no-explicit-any
      const releases = results
        .filter(
          (r): r is PromiseFulfilledResult<{ artistId: string; items: unknown[] } | null> =>
            r.status === 'fulfilled' && r.value !== null,
        )
        // deno-lint-ignore no-explicit-any
        .flatMap((r) => (r.value as any).items)
        .filter(Boolean)
        // deno-lint-ignore no-explicit-any
        .map((album: any) => ({
          spotify_album_id: album.id,
          spotify_artist_id: album.artists[0]?.id ?? '',
          artist_name: album.artists[0]?.name ?? 'Unknown',
          title: album.name,
          release_type: album.album_type === 'album' ? 'album' : 'single',
          release_date: album.release_date,
          image_url: album.images?.[0]?.url ?? null,
          spotify_url: album.external_urls?.spotify ?? '',
          track_count: album.total_tracks ?? 0,
          fetched_at: new Date().toISOString(),
        }));

      if (releases.length > 0) {
        await supabase
          .schema('angular_starter')
          .from('releases')
          .upsert(releases, { onConflict: 'spotify_album_id' });
      }

      // Update last_release_check for all artists in this batch
      // deno-lint-ignore no-explicit-any
      const batchIds = batch.map((a: any) => a.spotify_artist_id);
      await supabase
        .schema('angular_starter')
        .from('artists')
        .update({ last_release_check: new Date().toISOString() })
        .in('spotify_artist_id', batchIds);

      checked += batch.length;
    }

    return new Response(JSON.stringify({ checked, total: staleArtists.length }));
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
    });
  }
});
