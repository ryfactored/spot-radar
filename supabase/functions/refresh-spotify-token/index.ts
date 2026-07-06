import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Identify the caller from their JWT — never trust a userId from the body.
    // Returning another user's Spotify token would be an account takeover.
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
    const userId = user.id;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: tokenRow, error } = await supabase
      .schema('spot_radar')
      .from('user_spotify_tokens')
      .select('refresh_token')
      .eq('user_id', userId)
      .single();

    if (error || !tokenRow?.refresh_token) {
      return json({ error: 'No refresh token found for user' }, 404);
    }

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
      return json({ error: 'Spotify token refresh failed' }, 401);
    }

    const { access_token, refresh_token: new_refresh_token, expires_in } = await refreshResp.json();
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    await supabase
      .schema('spot_radar')
      .from('user_spotify_tokens')
      .update({
        access_token,
        // Spotify may rotate the refresh token — store it if provided
        ...(new_refresh_token ? { refresh_token: new_refresh_token } : {}),
        expires_at: expiresAt,
      })
      .eq('user_id', userId);

    return json({ access_token, expires_at: expiresAt });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
