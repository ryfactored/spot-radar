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
    // Identify the caller from their JWT — never trust a userId from the body,
    // or any unauthenticated caller could sync (and enumerate) arbitrary users.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = user.id;

    const { skipRecent = true } = await req.json().catch(() => ({}));

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

    // Get user's artist IDs (paginate past PostgREST 1000-row limit)
    const artistRows: ArtistRow[] = [];
    const PAGE_SIZE = 1000;
    let from = 0;
    while (true) {
      const { data } = await supabase
        .schema('spot_radar')
        .from('user_artists')
        .select('spotify_artist_id')
        .eq('user_id', userId)
        .range(from, from + PAGE_SIZE - 1);
      if (!data || data.length === 0) break;
      artistRows.push(...(data as ArtistRow[]));
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    if (artistRows.length === 0) {
      return new Response(JSON.stringify({ message: 'No artists to sync' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Set up Realtime broadcast channel early so we can report progress during setup
    const channelName = `sync-progress:${userId}`;
    const channel = supabase.channel(channelName);
    await new Promise<void>((resolve) => {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') resolve();
      });
      setTimeout(resolve, 2000);
    });

    const sendStatus = (artistName: string, checked: number, total: number) => {
      channel.send({
        type: 'broadcast',
        event: 'artist-progress',
        payload: { artistName, checked, total },
      });
    };

    sendStatus(`Found ${artistRows.length} artists, filtering...`, 0, artistRows.length);

    // Skip artists already checked in last 24h (only for background/cron syncs)
    let artistsToCheck = artistRows;
    if (skipRecent) {
      const recentIds = new Set<string>();
      let rFrom = 0;
      while (true) {
        const { data: recentlyChecked } = await supabase
          .schema('spot_radar')
          .from('artists')
          .select('spotify_artist_id')
          .gt('last_release_check', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .range(rFrom, rFrom + PAGE_SIZE - 1);
        if (!recentlyChecked || recentlyChecked.length === 0) break;
        for (const r of recentlyChecked) recentIds.add((r as ArtistRow).spotify_artist_id);
        if (recentlyChecked.length < PAGE_SIZE) break;
        rFrom += PAGE_SIZE;
      }

      artistsToCheck = artistRows.filter((r: ArtistRow) => !recentIds.has(r.spotify_artist_id));
    }

    // Fetch artist names for progress reporting
    const artistNameMap = new Map<string, string>();
    const artistIdList = artistsToCheck.map((r: ArtistRow) => r.spotify_artist_id);
    for (let i = 0; i < artistIdList.length; i += 500) {
      sendStatus(`Loading artist names... ${i}/${artistIdList.length}`, 0, artistsToCheck.length);
      const chunk = artistIdList.slice(i, i + 500);
      const { data: artistData } = await supabase
        .schema('spot_radar')
        .from('artists')
        .select('spotify_artist_id, artist_name')
        .in('spotify_artist_id', chunk);
      if (artistData) {
        for (const a of artistData) {
          artistNameMap.set(a.spotify_artist_id, a.artist_name);
        }
      }
    }

    let checked = 0;
    const total = artistsToCheck.length;

    try {
      // Process in batches
      for (let i = 0; i < artistsToCheck.length; i += BATCH_SIZE) {
        const batch = artistsToCheck.slice(i, i + BATCH_SIZE);

        const results = await Promise.allSettled(
          batch.map(async (row: ArtistRow) => {
            const artistId = row.spotify_artist_id;
            const url = `${SPOTIFY_API}/artists/${artistId}/albums?include_groups=album,single&limit=5`;
            const fetchAlbums = () =>
              fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });

            let resp = await fetchAlbums();
            if (resp.status === 429) {
              const retryAfter = parseInt(resp.headers.get('Retry-After') || '5', 10);
              await new Promise((r) => setTimeout(r, retryAfter * 1000));
              resp = await fetchAlbums();
            }

            // Report ok:false so a failed fetch doesn't get marked "checked"
            // and silently suppressed from re-checking for the next 24h.
            if (!resp.ok) return { artistId, ok: false, items: [] as unknown[] };
            const data = await resp.json();
            return { artistId, ok: true, items: (data.items ?? []) as unknown[] };
          }),
        );

        const cutoffYear = new Date().getFullYear() - 1;
        const succeededIds: string[] = [];

        // deno-lint-ignore no-explicit-any
        const releases = results
          .filter(
            (r): r is PromiseFulfilledResult<{ artistId: string; ok: boolean; items: unknown[] }> =>
              r.status === 'fulfilled',
          )
          .flatMap((r) => {
            if (r.value.ok) succeededIds.push(r.value.artistId);
            // Attribute each album to the artist we actually queried, not
            // album.artists[0] — on a collaboration the followed artist may be
            // listed second, which would key the release to an artist the user
            // doesn't follow and hide it from their feed entirely.
            return r.value.items.map((album) => ({ artistId: r.value.artistId, album }));
          })
          // deno-lint-ignore no-explicit-any
          .filter(({ album }: any) => {
            const year = parseInt(String(album?.release_date ?? '').substring(0, 4), 10);
            return Number.isFinite(year) && year >= cutoffYear;
          })
          // deno-lint-ignore no-explicit-any
          .map(({ artistId, album }: any) => ({
            spotify_album_id: album.id,
            spotify_artist_id: artistId,
            artist_name: artistNameMap.get(artistId) ?? album.artists?.[0]?.name ?? 'Unknown',
            title: album.name,
            release_type: album.album_type ?? 'album',
            release_date: album.release_date,
            image_url: album.images?.[0]?.url ?? null,
            track_count: album.total_tracks ?? 0,
          }));

        // Upsert releases
        if (releases.length > 0) {
          const { error: upsertError } = await supabase
            .schema('spot_radar')
            .from('releases')
            .upsert(releases, { onConflict: 'spotify_album_id' });
          if (upsertError) {
            throw new Error(`Failed to save releases: ${upsertError.message}`);
          }
        }

        // Only mark artists whose fetch succeeded as checked; failed ones stay
        // stale so the next sync retries them instead of skipping for 24h.
        if (succeededIds.length > 0) {
          await supabase
            .schema('spot_radar')
            .from('artists')
            .update({ last_release_check: new Date().toISOString() })
            .in('spotify_artist_id', succeededIds);
        }

        // Broadcast progress for each artist in this batch
        for (const row of batch) {
          checked++;
          const artistName = artistNameMap.get(row.spotify_artist_id) ?? row.spotify_artist_id;
          sendStatus(artistName, checked, total);
        }
      }

      // Broadcast completion
      channel.send({
        type: 'broadcast',
        event: 'sync-complete',
        payload: { checked, releasesFound: 0 },
      });
    } finally {
      // Small delay to let the final broadcast flush before unsubscribing
      await new Promise((r) => setTimeout(r, 200));
      supabase.removeChannel(channel);
    }

    return new Response(JSON.stringify({ total, checked, releases: 'synced' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
