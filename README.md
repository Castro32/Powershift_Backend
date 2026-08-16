# Power Shift Backend (v2 — MongoDB)

Restructured from a single `server.js` + Redis (Upstash) into a proper
layered Express app on MongoDB (via Mongoose).

## Structure

```
powershift-backend/
├── server.js                 # entry point — wires CORS, webhook, JSON, routes
├── config/
│   ├── db.js                 # Mongo connection (cached for serverless cold starts)
│   └── products.js           # package configs, prices, promo codes, CORS allowlist
├── models/
│   ├── Booking.js            # replaces the Redis 'bookings' list
│   ├── PromoEvent.js         # replaces the Redis 'promo-events' list
│   └── UsedSession.js        # replaces the Redis 'used-sessions' set (unique index = atomic dedup)
├── controllers/
│   ├── checkoutController.js # create-checkout, checkout-session
│   ├── webhookController.js  # the three Stripe event handlers
│   ├── adminController.js    # admin login, bookings report, promo report
│   ├── promoController.js    # validate-promo, track-promo
│   ├── ebookController.js    # ebook-download (check + stream)
│   └── miscController.js     # subscribe, fire-strategy coupon, health
├── middleware/
│   └── requireAdmin.js       # Bearer token gate for admin-only routes
├── utils/
│   ├── adminToken.js         # HMAC token create/verify + timing-safe password check
│   ├── mailchimp.js          # upsert+tag, plain subscribe
│   └── bookings.js           # recordBooking() shared by all three webhook events
├── .env.example
└── vercel.json
```

## Why MongoDB instead of Redis

Redis (as used before, via Upstash) is fine for simple key/list storage but
you were treating it like a database — storing structured booking and event
records as JSON strings in a list and re-parsing the whole list on every
read (`LRANGE 0 -1`). MongoDB fits this shape naturally:

- Real schemas (`Booking`, `PromoEvent`, `UsedSession`) instead of hand-rolled JSON blobs
- Proper querying/sorting/filtering at the database level instead of loading everything into memory
- `createdAt`/`updatedAt` for free instead of manually setting a `timestamp` field
- A unique index on `UsedSession.sessionId` makes ebook-download dedup atomic — a duplicate insert throws, closing the small race-condition window the old `SADD`-based check had
- Easier to scale reporting later (e.g. `Booking.aggregate()`) once volume grows

## Setup

1. Create a MongoDB Atlas cluster (free tier is enough to start) and grab the
   connection string.
2. Copy `.env.example` to `.env` and fill in every value — most importantly
   `MONGODB_URI`.
3. `npm install`
4. `npm run dev` for local development, `npm start` for production.

## Deploying to Vercel

This repo's `vercel.json` builds `server.js` as a single `@vercel/node`
function and rewrites `/api/*` to it — the same pattern your original
monorepo `vercel.json` used for `Mailchimp_Backend/server.js`. If you're
merging this back into that monorepo rather than deploying it standalone:

- Drop this whole `powershift-backend/` folder in place of the old
  `Mailchimp_Backend/` folder (or update the `src` path in the root
  `vercel.json`'s `builds` array to point at the new `server.js` location)
- **Delete any leftover files under an `api/` folder** — as established
  earlier, an explicit `builds` array turns off Vercel's automatic
  `api/`-folder function detection, so stray files there won't run, but
  they're confusing to keep around
- Set every variable from `.env.example` in Vercel's Project Settings →
  Environment Variables (for the Production environment specifically —
  values in a local `.env` file are never read on Vercel)

## What changed vs. the old server.js

- **Storage:** Upstash Redis → MongoDB (Mongoose models)
- **Structure:** one 500-line file → routes/controllers/models/utils
- **Security:** admin token comparison and password check now use
  `crypto.timingSafeEqual` instead of `===`; `/api/admin/login` is now rate
  limited (10 attempts / 15 min per IP) via `express-rate-limit`
- **Server-side email validation** added to `/api/subscribe` (previously
  only validated on the frontend)
- **Ebook download dedup** is now atomic via a unique Mongo index, instead
  of a Redis `SISMEMBER` check that had a small race window
- Ebook file streaming now buffers via `arrayBuffer()` instead of piping a
  `node-fetch` stream, since native `fetch` (Node 18+) returns a Web Stream,
  not a Node stream — this also lets us drop the `node-fetch` dependency
  entirely

## Not changed

All business logic — prices, promo codes, product configs, Mailchimp
tagging rules, Stripe metadata, admin panel response shapes — is identical
to the original `server.js`. The existing frontend (checkout pages, admin
panel) should work against this without any changes on that side.
