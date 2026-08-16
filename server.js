import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { ensureDB } from './config/db.js';
import { ALLOWED_ORIGINS } from './config/products.js';
import { health } from './controllers/miscController.js';

import webhookRoutes from './routes/webhook.js';
import checkoutRoutes from './routes/checkout.js';
import adminRoutes from './routes/admin.js';
import promoRoutes from './routes/promo.js';
import miscRoutes from './routes/misc.js';

const app = express();
const port = process.env.PORT || 3001;

// ── CORS ─────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) callback(null, true);
      else callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Health check — deliberately does NOT depend on MongoDB, so Render's
//    health probe reflects "is the process up", not "is the DB reachable".
//    A transient Mongo blip shouldn't trigger a restart loop. ─────────────
app.get('/api/health', health);


// ── Ensure MongoDB is connected before ANY route runs, including the
//    webhook — recordBooking() needs a live connection and the webhook
//    handler sends its own response, so it never reaches a later middleware ──
app.use(ensureDB);

// ── Stripe webhook — MUST be mounted before express.json(), since it needs
//    the raw request body to verify the Stripe signature ──────────────────
app.use('/api', webhookRoutes);

// ── JSON body parser for everything else ────────────────────────────────
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────────────
app.use('/api', checkoutRoutes);
app.use('/api', adminRoutes);
app.use('/api', promoRoutes);
app.use('/api', miscRoutes);

// ── Error handler — catches CORS rejections and anything else that falls
//    through, so callers always get clean JSON instead of an HTML stack
//    trace (Express's default error page). Must be defined last. ──────────
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'This origin is not allowed to access the API.' });
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'Internal server error.' });
});

// ── Start (local/dev only — on Vercel, this file is invoked directly as a
//    serverless function and app.listen() is neither needed nor wanted) ──
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`\n🚀 Server running at http://localhost:${port}\n`);
    console.log(`   GET  /api/health`);
    console.log(`   POST /api/admin/login`);
    console.log(`   GET  /api/checkout-session?session_id=...`);
    console.log(`   POST /api/validate-promo`);
    console.log(`   POST /api/track-promo`);
    console.log(`   GET  /api/track-promo (admin, Bearer token)`);
    console.log(`   GET  /api/bookings (admin, Bearer token)`);
    console.log(`   POST /api/subscribe`);
    console.log(`   POST /api/create-checkout`);
    console.log(`   POST /api/validate-fire-strategy-coupon`);
    console.log(`   GET  /api/ebook-download?session_id=...`);
    console.log(`   POST /api/webhook\n`);
  });
}

export default app;
