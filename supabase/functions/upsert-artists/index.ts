import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_ARTISTS = 10000;
const CHUNK = 500;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

interface ArtistInput {
  spotify_artist_id?: unknown;
  artist_name?: unknown;
  artist_image_url?: unknown;
}

/**
 * Upserts artist name/image into the shared `spot_radar.artists` table.
 *
 * The `artists` table is shared across all users, so clients must NOT write it
 * directly — otherwise any authenticated user could overwrite another artist's
 * name/image (cache poisoning). RLS blocks client writes; this function does
 * them with the service role after verifying the caller is authenticated.
 *
 * It never touches `last_release_check` (owned by the sync jobs) and only sets
 * `artist_image_url` for rows that actually carry one, so a metadata-only sync
 * can't wipe an image that was backfilled earlier.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();
    if (userError || !user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const input: ArtistInput[] = Array.isArray(body?.artists) ? body.artists : [];
    if (input.length === 0) return json({ upserted: 0 });
    if (input.length > MAX_ARTISTS) {
      return json({ error: `Too many artists (max ${MAX_ARTISTS})` }, 400);
    }

    // Normalize + validate. Drop anything without a usable id/name.
    const withImage: {
      spotify_artist_id: string;
      artist_name: string;
      artist_image_url: string;
    }[] = [];
    const withoutImage: { spotify_artist_id: string; artist_name: string }[] = [];
    for (const a of input) {
      const id = typeof a.spotify_artist_id === 'string' ? a.spotify_artist_id : '';
      const name = typeof a.artist_name === 'string' ? a.artist_name : '';
      if (!id || !name) continue;
      const image = typeof a.artist_image_url === 'string' ? a.artist_image_url : '';
      if (image) {
        withImage.push({ spotify_artist_id: id, artist_name: name, artist_image_url: image });
      } else {
        withoutImage.push({ spotify_artist_id: id, artist_name: name });
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    let upserted = 0;
    for (let i = 0; i < withImage.length; i += CHUNK) {
      const chunk = withImage.slice(i, i + CHUNK);
      const { error } = await supabase
        .schema('spot_radar')
        .from('artists')
        .upsert(chunk, { onConflict: 'spotify_artist_id' });
      if (error) return json({ error: error.message }, 500);
      upserted += chunk.length;
    }
    for (let i = 0; i < withoutImage.length; i += CHUNK) {
      const chunk = withoutImage.slice(i, i + CHUNK);
      // artist_image_url intentionally omitted so existing images are preserved.
      const { error } = await supabase
        .schema('spot_radar')
        .from('artists')
        .upsert(chunk, { onConflict: 'spotify_artist_id' });
      if (error) return json({ error: error.message }, 500);
      upserted += chunk.length;
    }

    return json({ upserted });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
