# SaddleMatch

(codename: tx-connect) — A regional, western-lifestyle dating app MVP for **Houston, Austin, Dallas, and San Antonio** —
built to solve the "I swiped through everyone in my small/mid-size city in a
week" problem that big national apps have outside of major metros.

Stack: **Next.js 15 (App Router) + Supabase (auth/db/realtime) + Stripe
(subscriptions) + Claude (AI features)**, styled with Tailwind CSS.

## What's built

- Email/password auth (Supabase Auth) with a middleware-protected `/app` area
- Profile creation & editing (name, birthdate, gender, city, interests, bio, photos)
- City-scoped discovery/swipe feed (like / pass)
- Automatic mutual-match detection via a Postgres trigger
- Match list + realtime 1:1 messaging (Supabase Realtime)
- Claude-powered **Plus** features, gated behind an active Stripe subscription:
  - AI bio writer
  - "Why you matched" reasoning per match
  - AI-suggested opening messages
- Stripe Checkout ($9.99/mo intro pricing, then $9.99/mo — see the pricing
  copy for the exact intro terms) + Billing Portal + webhook that syncs
  subscription status
- Block, report, and self-serve account deletion, with `profiles` locked
  to owner-only reads at the database level (see "Safety & privacy" below)
- Clearly-labeled fictional demo profiles for testing (`npm run seed:demo`)

## Safety & privacy

Built into the schema from day one (`supabase/migration_003_privacy_safety.sql`),
not bolted on later:

- **Block** (Discover card + match thread) hides that person from each
  other everywhere, immediately — checked in both directions every time
  the daily queue is built.
- **Report** (Discover card + match thread) logs a reason to a `reports`
  table for manual review. It doesn't auto-hide anyone — blocking is the
  immediate self-serve action; reports are for the humans running the app
  to act on.
- **Delete my account** (Profile page) permanently removes the auth user;
  every other table cascades from there (`on delete cascade`), so
  profile, swipes, matches, messages, subscription, blocks, and reports
  all go with it.
- **Birthdate is never sent to other members.** `profiles` RLS now only
  allows reading your *own* full row. Everyone else is read through the
  `public_profiles` view, which exposes a computed `age` instead of the
  raw `birthdate`, plus never exposes `interested_in` (another member's
  private matching preference).
- **Location precision, by design:** the app has never collected GPS or
  any location finer than city — city is the coarsest useful signal for
  this product, so there's no granular location to leak in the first
  place.
- **Demo profiles are never presented as real members.** Seeded rows are
  flagged `is_demo = true`, which renders a visible "Demo profile" /
  "Demo" badge everywhere the app shows that profile (Discover card,
  Matches list, match thread). Run `npm run seed:demo` to create ~12 of
  them across all four cities; do not include them in a real public
  launch.

## What's *not* built (by design, for an MVP)

- Photo upload to storage (the schema has `photo_urls text[]`; wiring up
  Supabase Storage + an upload UI is the natural next step)
- Push/email notifications for new matches or messages
- Admin/moderation dashboard for acting on filed reports (they're in the
  `reports` table today; reviewing them is currently a SQL-editor task)
- Distance/radius filtering within a city (currently: same city = eligible)

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run these three files **in order**:
   - `supabase/schema.sql` — core tables, the mutual-match trigger, Row
     Level Security policies, and the four seeded cities.
   - `supabase/migration_002_prompts.sql` — Hinge-style prompts,
     comment-on-like, and the daily curated queue.
   - `supabase/migration_003_privacy_safety.sql` — blocks, reports, the
     `is_demo` flag, per-city `is_open` flag, and the `public_profiles`
     view (tightens `profiles` RLS to owner-only and stops other members'
     exact birthdates from ever reaching the client — see "Safety &
     privacy" below).
3. In **Project Settings → API**, copy the Project URL, `anon` key, and
   `service_role` key into `.env.local` (see below).
4. In **Authentication → URL Configuration**, add
   `http://localhost:3000/auth/callback` (and your production URL) as a
   redirect URL.
5. Optional, for local testing: once `.env.local` is filled in, run
   `npm run seed:demo` to create ~12 clearly-labeled fictional demo
   profiles across all four cities, so Discover and Matches feel populated
   while you test. They're never real members — each one is flagged
   `is_demo = true`, which renders a visible "Demo profile" badge
   everywhere the app shows a profile.

### 2. Stripe

1. Create a product with a recurring **$9.99/month** price. Copy the price ID.
2. Copy your secret key and publishable key from **Developers → API keys**.
3. Create a webhook endpoint pointing at `https://yourdomain.com/api/stripe/webhook`
   (use the [Stripe CLI](https://stripe.com/docs/stripe-cli) — `stripe listen
   --forward-to localhost:3000/api/stripe/webhook` — for local testing) subscribed to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the webhook signing secret.

### 3. Anthropic (Claude)

Grab an API key from [console.anthropic.com](https://console.anthropic.com).

### 4. Environment variables

```bash
cp .env.local.example .env.local
# then fill in every value
```

### 5. Run it

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## Project structure

```
src/
  app/
    page.tsx                 Landing page
    login/, signup/          Auth
    onboarding/               First-time profile creation
    app/
      discover/               Swipe feed
      matches/, matches/[id]/ Match list + message thread
      profile/                Edit profile
      upgrade/                Stripe checkout / billing portal
    api/
      ai/bio, ai/match-reason, ai/icebreaker   Claude routes (Plus-gated)
      stripe/checkout, stripe/portal, stripe/webhook
  lib/
    supabase/                 Browser, server, admin, and middleware clients
    anthropic.ts, stripe.ts, subscription.ts, constants.ts
supabase/
  schema.sql                  Full DB schema + RLS policies
```

## Notes on the architecture

- **Two Supabase clients matter**: the browser/server clients (RLS-scoped,
  used everywhere in the app) and the **admin client** (service-role key,
  bypasses RLS). The admin client is used *only* in the Stripe webhook — it's
  the sole writer of the `subscriptions` table, so a user can never grant
  themselves Plus by editing client-side state.
- **Matching is a DB trigger, not app logic.** When a `like` swipe is
  inserted, a Postgres trigger checks for the reciprocal like and creates the
  `matches` row itself. This means matching is correct even under concurrent
  swipes from both sides.
- **AI features fail closed.** Every `/api/ai/*` route re-checks the caller's
  subscription status server-side (never trust the client), independent of
  whatever the UI shows.
