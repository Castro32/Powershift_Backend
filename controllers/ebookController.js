import Stripe from 'stripe';
import UsedSession from '../models/UsedSession.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const EBOOK_CLOUDINARY_URL = process.env.EBOOK_CLOUDINARY_URL;

export async function downloadEbook(req, res) {
  const { session_id, check } = req.query;

  if (!session_id) return res.status(400).json({ error: 'Missing session_id.' });
  if (!EBOOK_CLOUDINARY_URL) {
    console.error('EBOOK_CLOUDINARY_URL is not set');
    return res.status(500).json({ error: 'Ebook not configured.' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return res.status(403).json({ error: 'Payment not confirmed.' });
    }
    if (session.metadata?.product !== 'ebook') {
      return res.status(403).json({ error: 'Session is not for an ebook purchase.' });
    }

    // Check-only — verify without marking used or streaming the file.
    if (check === 'true') {
      const alreadyUsed = await UsedSession.exists({ sessionId: session_id });
      if (alreadyUsed) {
        return res.status(403).json({ error: 'This download link has already been used.' });
      }
      return res.status(200).json({ ok: true });
    }

    // Atomic claim: the unique index means a second concurrent request for
    // the same session_id gets a duplicate-key error instead of a race.
    try {
      await UsedSession.create({ sessionId: session_id });
    } catch (err) {
      if (err.code === 11000) {
        console.warn(`⛔ Reused session attempt — ${session_id}`);
        return res.status(403).json({ error: 'This download link has already been used.' });
      }
      throw err;
    }

    console.log(`📥 Ebook download — ${session.customer_email}`);

    const cloudinaryRes = await fetch(EBOOK_CLOUDINARY_URL);
    if (!cloudinaryRes.ok) {
      return res.status(500).json({ error: 'Could not retrieve ebook file.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Becoming-Her.pdf"');
    const buffer = Buffer.from(await cloudinaryRes.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    console.error('Ebook download error:', err.message);
    return res.status(500).json({ error: 'Could not verify payment.' });
  }
}
