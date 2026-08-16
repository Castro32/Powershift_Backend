import Booking from '../models/Booking.js';
import PromoEvent from '../models/PromoEvent.js';
import { createAdminToken, safeCompare } from '../utils/adminToken.js';

const ADMIN_LOGIN_EMAIL = process.env.ADMIN_LOGIN_EMAIL;
const ADMIN_LOGIN_PASSWORD = process.env.ADMIN_LOGIN_PASSWORD;
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET;

export async function adminLogin(req, res) {
  const { email, password } = req.body;

  if (!ADMIN_LOGIN_EMAIL || !ADMIN_LOGIN_PASSWORD || !ADMIN_TOKEN_SECRET) {
    return res.status(500).json({ error: 'Admin login is not configured.' });
  }

  const validEmail = email?.trim().toLowerCase() === ADMIN_LOGIN_EMAIL.trim().toLowerCase();
  const validPassword = safeCompare(password, ADMIN_LOGIN_PASSWORD);

  if (!validEmail || !validPassword) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  const token = createAdminToken(email.trim().toLowerCase());
  return res.status(200).json({ token, user: { email: email.trim().toLowerCase() } });
}

export async function getBookings(req, res) {
  try {
    const records = await Booking.find({}).sort({ createdAt: -1 }).lean();

    const successful = records.filter((r) => r.status === 'success');
    const failed = records.filter((r) => r.status === 'failed');
    const totalRevenue = successful.reduce((sum, r) => sum + (r.amount || 0), 0);

    const byPackage = successful.reduce((acc, r) => {
      const key = r.packageName || 'Unknown package';
      if (!acc[key]) acc[key] = { package: key, count: 0, revenue: 0 };
      acc[key].count++;
      acc[key].revenue += r.amount || 0;
      return acc;
    }, {});

    // Normalize _id/createdAt into the id/timestamp shape the admin panel expects.
    const bookings = records.map((r) => ({
      ...r,
      id: r.sessionId || String(r._id),
      timestamp: r.createdAt,
    }));

    return res.status(200).json({
      total: records.length,
      successCount: successful.length,
      failedCount: failed.length,
      totalRevenue,
      currency: successful[0]?.currency || 'usd',
      byPackage: Object.values(byPackage).sort((a, b) => b.revenue - a.revenue),
      bookings,
    });
  } catch (err) {
    console.error('MongoDB error (getBookings):', err.message);
    return res.status(500).json({ error: 'Could not load bookings.' });
  }
}

export async function getPromoReport(req, res) {
  try {
    const events = await PromoEvent.find({}).sort({ createdAt: -1 }).lean();

    const byCode = {};
    for (const e of events) {
      const key = e.code || 'NONE';
      if (!byCode[key]) byCode[key] = { code: key, uses: 0, emails: new Set(), actions: {} };
      byCode[key].uses++;
      byCode[key].emails.add(e.email);
      byCode[key].actions[e.action] = (byCode[key].actions[e.action] || 0) + 1;
    }

    const summary = Object.values(byCode).map((s) => ({
      ...s,
      uniqueEmails: s.emails.size,
      emails: [...s.emails],
    }));

    return res.status(200).json({ total: events.length, summary, events });
  } catch (err) {
    console.error('MongoDB error (getPromoReport):', err.message);
    return res.status(500).json({ error: 'Could not load promo events.' });
  }
}
