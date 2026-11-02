# TTRPG Hearth

Single-user campaign tracker for a Dungeon Master: campaigns, sessions, players, characters and a payment ledger.
Astro (server-rendered, almost no client JS) on a Cloudflare Worker, with D1 (SQLite). No other services.

**Why Astro:** every screen is a server-rendered page plus plain HTML forms, so it is fast on a phone and ships essentially zero JavaScript.

## Local dev

```bash
npm install
export CLOUDFLARE_API_TOKEN=dummy   # only needed so wrangler doesn't prompt; local mode never calls Cloudflare
npm run db:reset:local              # wipes local D1, applies migrations, loads seed data
npm run dev                         # http://localhost:4321  (no auth locally)
npm test                            # charge / balance / money / CSV tests
npm run check                       # strict TypeScript
```

Local D1 state lives in `.wrangler/state` (git-ignored).

## Money rules

- Money is integer cents; payments carry an ISO currency (default EUR). Dates are ISO 8601 strings; session times are local wall-clock (`APP_TZ` in `wrangler.jsonc`, default `Europe/Dublin`).
- A **charge** is stored per attendee in `session_attendees.charge_cents`. It is the session price only when the session is **played**, the player **attended**, and the campaign is **paid**. It is recomputed whenever a session is saved.
- **Balance = total charges − total payments.** Positive = owes, negative = credit (prepayment/overpayment). Shown per player and per campaign.
- A payment may have a campaign (set automatically when tied to a session). Payments with no campaign count toward the player's overall balance only.
- Players/campaigns/sessions with money history can't be hard-deleted; archive or cancel instead.
- Balances sum across currencies as if they were one currency (v1 assumes EUR).

## Migrations

SQL files in `migrations/`, managed by `wrangler d1 migrations`.

```bash
npm run db:migrate:local
npm run db:migrate:remote
```

## Deploy

```bash
npm run deploy     # build, apply remote migrations, wrangler deploy
```

The D1 database `ttrpg-hearth` is already bound in `wrangler.jsonc`. The seed data is for local use only; don't load it in production.

### Put Cloudflare Access in front (required before using for real)

The Worker has **no auth code**. Protection is Cloudflare Access, and `wrangler.jsonc` ships with `workers_dev: false` so the app is not reachable until you do this:

1. Cloudflare dashboard → **Zero Trust** → enable it (free plan, up to 50 users).
2. **Workers & Pages → ttrpg-hearth → Settings → Domains & Routes**: enable the `workers.dev` route and **Enable Cloudflare Access** (or add a custom domain and create an Access application for it).
3. Policy: **Allow → Emails → your email**.
4. Set `"workers_dev": true` in `wrangler.jsonc` so later deploys keep it enabled, then `npm run deploy`.

## Backup

```bash
npm run backup     # writes backup-YYYY-MM-DD.sql (full D1 export) — keep it somewhere safe
```

CSV exports (payments and sessions, date-range filterable) are under **Export** in the app and **Payments → Download CSV**.

## Layout

```
migrations/   D1 schema
db/seed.sql   example data (local only)
src/lib/      ledger (money rules), money, csv, markdown, db helpers
src/pages/    one folder per screen; forms POST back to the same page
tests/        vitest for the money logic
```

## Possible later additions (deliberately not built)

Calendar grid view, per-player statements, multi-currency balances, recurring session generator, D&D Beyond links are plain URLs only.
