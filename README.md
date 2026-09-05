# Rolling GA

**The show ends. The connection doesn't.**

Rolling GA is a live-event experience and commerce platform that turns attendance at a concert
into a verified digital credential and an ongoing, *permissioned* relationship between an artist
and the fans who were actually there.

Three ideas drive the whole product:

1. **Digital credential** — Rolling GA owns the persistent fan identity and verified show history.
2. **Artist takeover** — each artist controls the visual world of their own concert experience.
3. **Premium editorial commerce** — merch is presented as limited cultural product, not a catalogue.

## Getting started

```bash
npm install
npm run db:setup   # runs migrations, then seeds the demo dataset
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). You will be sent to `/sign-in`, which lists
every seeded demo account (fan, artist team, admin, fulfillment operator) so you can move between roles.

### The demo walkthrough

The seed builds a complete narrative you can click straight through:

1. **Scan** — open `/studio/tour`, pick tonight's show, and display its QR. Scanning it (or opening
   the `/e/<token>` link directly) lands on the show.
2. **Verify** — confirm your location to earn a `verified_attendance` record.
3. **You're in** — the credential is stamped and the artist takeover replaces Rolling GA's neutral chrome.
4. **Unlock** — products that read `UNLOCK AT THE SHOW` before verification become purchasable.
5. **Purchase** — a flash drop with a server-clocked countdown, a bundle, and a mobile checkout.
6. **I was there** — the order attaches to the show in `My Shows`, your permanent concert passport.
7. **Post-show / anniversary** — one seeded show ended hours ago and another happened a year ago
   tonight, so the post-show store and the anniversary drop are both live on first run.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest suite against in-process PostgreSQL (PGlite) |
| `npm run db:generate` | Generate a migration from the Drizzle schema |
| `npm run db:migrate` | Apply migrations to local PostgreSQL (PGlite at `data/pg` unless `DATABASE_URL` is set) |
| `npm run db:seed` | Seed the demo dataset |
| `npm run db:reset` | Drop the local database, re-migrate, re-seed |

## Architecture

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 App Router, React 19, TypeScript strict |
| Styling | Tailwind CSS v4 (CSS-first `@theme`), shadcn/ui (`radix-nova`) |
| Database | PostgreSQL via `postgres-js` + Drizzle ORM; local/dev falls back to in-process PGlite |
| Mutations | Server Functions (`"use server"`), with route handlers only for real HTTP surfaces |
| Auth | Signed, `httpOnly` cookie sessions; server-side role and tenant guards |
| Money | Always integer cents |

### Directory map

```
src/
  app/
    (auth)/      sign-in
    (fan)/       mobile-first fan app: home, drops, my shows, profile, event takeover, cart, checkout
    (studio)/    Artist Studio (desktop/tablet first)
    (ops)/       Fulfillment operations console
    e/[token]/   QR scan entry point
    api/         server clock, QR images
  db/            Drizzle schema, migrations, seed
  server/        auth, authorization guards, domain services, integration interfaces
  components/    ui primitives, shared presentational components, per-surface components
  lib/           shared types, fonts, formatting, utilities
```

### Authorization

Authorization is enforced on the server, never by hiding UI. Every server function and every
page-level data read starts with a guard from [`src/server/auth/guards.ts`](src/server/auth/guards.ts):

- Fans can only reach their own records plus public or eligible event content.
- Artist team members are scoped to artists they have an `artist_members` row for. One artist can
  never see another's fans, orders, drops, products, analytics, or campaigns.
- Fulfillment operators see order and shipment operations without fan marketing data.
- Rolling GA admins have global access.

### Privacy

A Rolling GA account is not a shared customer database. An artist can only see a fan when that fan
has granted that specific artist a consent of the relevant type, recorded in `artist_consents` with
its source and timestamp. Shipping addresses are never treated as marketing data. Consent can be
withdrawn from the fan-facing permission center at `/profile/connections`.

Attendance verification asks for location explicitly, explains why, uses the coordinates once for a
radius check, and never stores them — only the outcome, the method, and the timestamp persist.

## Integrations that are deliberately not implemented

These exist as typed interfaces with an `unavailable` implementation, so they report a clear
"not configured" state instead of pretending to work:

- Ticketmaster, AXS, ticket barcode, NFC, and wallet attendance verification
  ([`src/server/verification`](src/server/verification))
- Apple Wallet / Google Wallet passes ([`src/server/wallet`](src/server/wallet))
- Carrier rating and label purchase, including FedEx ([`src/server/shipping/carriers.ts`](src/server/shipping/carriers.ts))
- Email and SMS campaign delivery ([`src/server/campaigns/channels.ts`](src/server/campaigns/channels.ts))

Payments run through [`src/server/payments/provider.ts`](src/server/payments/provider.ts). No payment
provider is configured, so a clearly-labelled development provider is used. It never touches card
data. Search for `REAL PAYMENT INTEGRATION REQUIRED` to find the single place a real provider plugs in.

## Demo data

Seeded rows are tagged `is_demo = true` and the seed refuses to run when `NODE_ENV=production` unless
`ROLLING_GA_ALLOW_DEMO_SEED=1` is set explicitly. Artists, artwork, and venues are fictional.
