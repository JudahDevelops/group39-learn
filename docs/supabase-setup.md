# Supabase setup

Do these once. It takes about 20 minutes. Until you do, the app runs in dev mode: any email and password sign you in, and everything is saved in your own browser only.

Supabase renames menu items now and then. If a name below is not where it says, search the dashboard for the quoted setting.

## 1. Create the project

1. Go to supabase.com and sign in.
2. Choose **New project**. Name it `group39-learn`.
3. Pick the free plan. For the region, choose the one closest to Abuja (South Africa if it is listed, otherwise Europe).
4. Set a database password and save it in your password manager. The app never uses it.
5. Wait about two minutes until the project says it is ready.

## 2. Add the tables

1. In the left menu open **SQL Editor** and choose **New query**.
2. Open `supabase/migrations/0001_init.sql` from this repo. Copy the whole file and paste it into the editor.
3. Choose **Run**. You should see "Success. No rows returned".
4. Run it only once. A second run fails with "already exists", which is harmless.

Supabase's Security Advisor may flag the `leaderboard` view as a "security definer view". That is on purpose: the view is how members see each other's names and XP totals, and it exposes nothing else.

## 3. Switch off public signups

1. Open **Authentication**, then **Sign In / Providers**.
2. Turn off **Allow new users to sign up**.
3. Under the **Email** provider, set the minimum password length to 8. The app asks for 8 as well.

Now only people you invite can get in.

## 4. Set the site address

1. Open **Authentication**, then **URL Configuration**.
2. Set **Site URL** to your Vercel address, for example `https://group39-learn.vercel.app`. Invite and reset emails send people to this address.
3. Under **Redirect URLs** add both of these:
   - your Vercel address followed by `/**`
   - `http://localhost:5173/**`
4. Until the site is on Vercel, set Site URL to `http://localhost:5173` and change it after the first deploy.

The app sends anyone arriving from an invite or reset link to a "Set your password" page, wherever the link lands.

Invite links last one hour by default. In the same **Email** provider settings, raise the email link expiry to 86400 seconds (24 hours) so members have a day to use theirs.

## 5. Invite the members

1. Open **Authentication**, then **Users**.
2. Choose **Add user**, then **Send invitation**.
3. Enter an email address and send. Do this for yourself and for each member.
4. Each person opens the email, sets a password, then picks a display name, a daily XP goal and (optionally) a GitHub username.

If an invite does not arrive, see "If something goes wrong" at the end.

## 6. Make yourself admin

Everyone starts as a member. After your own invite exists, open **SQL Editor**, paste this with your email address in place of `you@example.com`, and run it:

```sql
update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
```

Check it with `select display_name, role from public.profiles;`. Your row should say `admin`. Members cannot change a role themselves, and an admin can read every member's rows but can still only write their own.

## 7. Put the keys in the app

1. Open **Project Settings**, then **API** (it may be called **API Keys** or **Data API**).
2. Copy the **Project URL**, and the **anon** key (newer projects call it the **publishable** key). Either one works.
3. Never copy the **service_role** key (or the **secret** key) into this app. It skips all the security rules.
4. In the project folder, copy `.env.example` to `.env.local` and paste the two values after the equals signs:

   ```
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   ```

   `.env.local` is ignored by git, so it never gets committed.

5. Restart `npm run dev`.
6. In Vercel open the project, then **Settings**, then **Environment Variables**. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the same two values, for Production and Preview. Then redeploy: Vite writes the values into the build, so changing them needs a new build.

## 8. Check it worked

1. Open the site. The sign-in page should say "Use the email address Judah invited you with." If it says "Dev mode", the two variables are missing from that build.
2. Sign in with your own email and password.
3. Finish onboarding. Your name appears in the top bar.
4. A wrong password should say "That email and password don't match."

## If something goes wrong

**A member never got the invite email.**

1. Ask them to check spam and junk, and to search for "Supabase".
2. In **Authentication**, **Users**, open the menu on their row and choose **Resend invitation**. If you do not see it, delete the user and invite them again.
3. Still nothing? The free built-in email sender is very limited. It allows only a few emails an hour and may only deliver to addresses on your Supabase team. Invite two or three people an hour, or set up your own sender under **Project Settings**, **Authentication**, **SMTP Settings** (Resend and Brevo both have free plans).
4. Another way is **Add user**, then **Create new user**, with **Auto Confirm User** ticked and a temporary password you send privately. That person signs in, then opens `/set-password` on the site to choose their own.

**A member forgot their password.** In **Authentication**, **Users**, open the menu on their row and choose **Send password recovery**. The link opens the "Set your password" page. The link works once, for 24 hours if you raised the expiry in step 4.

**The project is paused.** Free Supabase projects pause after 7 days with no activity. Members then see "We couldn't reach the server" when they sign in. Open the project in the dashboard and choose **Restore project**. It takes a few minutes and keeps all your data. Do it soon: the dashboard shows how long a paused project can still be restored. Using the site every day prevents the pause.

## Tests

`npm test` runs the migration against PGlite (real Postgres compiled to WebAssembly) and checks row-level security, the leaderboard and the streak function. It does not need a Supabase project.

`npm run test:e2e` expects the dev-mode build. Once `.env.local` exists, build without the two values first, or the tests will try to reach Supabase:

```
VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npm run build
```
