# Next steps: bring the site back

On November 15, 2026 this repo was deleted and recreated to scrub an old username from its git history. The code and history are intact, but the GitHub Pages site at <https://ryfactored.github.io/spot-radar/> is **down (404)** until the steps below are done.

## To do

1. **Add the two Actions secrets** at <https://github.com/ryfactored/spot-radar/settings/secrets/actions> (**New repository secret**). Get both values from the Supabase dashboard → your project → Project Settings → API:
   - `SUPABASE_URL`: the project URL (`https://<project-ref>.supabase.co`)
   - `SUPABASE_ANON_KEY`: the **anon / publishable** key. Never use the `service_role` or secret key here: it ends up in the public site.
2. **Run the deploy.** Go to Actions → **Deploy to GitHub Pages** → **Run workflow** on `main`. Deploys that ran before the secrets were added failed. That's expected.
3. **Check the site.** Open <https://ryfactored.github.io/spot-radar/> and sign in once to confirm that Supabase auth still works. The address didn't change, so the redirect URLs in Supabase should still match.
4. **Clean up.**
   - Delete the backup of the old history, `C:\code\spot-radar-before-rewrite-2026-11-15.bundle`, once you're sure nothing in the old history is needed.
   - Delete this file.

## What was lost in the recreate

- The 17 merged pull requests and their discussion. Their commits are all still on the branches.
- The Actions run history.
