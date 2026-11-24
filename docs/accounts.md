# IRB accounts and My Boat

One Institute of Relational Being account opens both the Relational River (My Boat) and ReBe.
Neither ever requires the other.

## Where accounts live

- Supabase project **IRB** (`xejsnwvqzijexnungonw`), region `eu-west-1` (Ireland, EU), created 24 November 2026.
- ReBe's schema was recreated here from the ReBe repo's migrations, with its Beings and relations copied over.
  ReBe's app points here since PR #32. The old Oregon project (`qbkjyahueqlkhvluspwg`) is kept untouched as a
  fallback until Jyo decides to pause it.
- The River's table: `public.river_boats` (see `supabase/migrations/20261124180000_river_boats.sql`).
  Row level security: each collaborator reaches only their own Boat; not-signed-in visitors have no access.
- Account deletion: `public.delete_own_account()` (from ReBe) deletes the account; Boats cascade.

## How the River signs in

`js/boat-sync.js`, loaded on every page by `build.py`, written by hand with no outside libraries:

- `POST /auth/v1/otp` sends a 6-digit code; `POST /auth/v1/verify` (type `email`) exchanges it for a session.
- The session (access and refresh tokens, email) is kept in the browser under `rr.irb.session`.
- The Boat stays in `rr.boat.v1` on the device too. Pages mark it `dirty` and call `RiverBoat.touched()`;
  `RiverBoat.sync()` pushes, pulls, or merges (lists joined by id, notes by time and text).
- The publishable key in `boat-sync.js` is designed to be public; it can only do what row level security allows.

## Dashboard settings Jyo sets (Supabase → project IRB → Authentication)

1. **Emails → Templates:** in both **Magic link** and **Confirm signup**, show the code `{{ .Token }}` (no link).
2. **Emails → SMTP settings:** turn on custom SMTP with Resend, sending from a verified address
   (for example `hello@relationalriver.org`). The Resend key goes straight into Supabase, never into chat.
   Verify the domain in Resend by adding its DNS records in Cloudflare.
3. **Sign in / Providers → Email:** Email OTP expiration 600 seconds (10 minutes); OTP length 6.
4. **URL configuration:** Site URL `https://relationalriver.org`.

Until custom SMTP is on, Supabase's built-in email only reaches the organisation's own team addresses,
a few times an hour: enough for Jyo to test, not for collaborators.
