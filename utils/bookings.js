import Booking from '../models/Booking.js';

/**
 * Records one payment attempt — successful or failed — for the admin panel.
 */
export async function recordBooking(record) {
  const booking = {
    status: record.status,
    reason: record.reason || '',
    product: record.product || '',
    packageName: record.packageName || record.product || 'Unknown package',
    customerName: record.customerName || '',
    customerEmail: record.customerEmail || '',
    amount: record.amount ?? null,
    currency: record.currency || 'usd',
    promoCode: record.promoCode || '',
    weeks: record.weeks || '',
    areaOfFocus: record.areaOfFocus || '',
    sessionId: record.sessionId || '',
  };

  try {
    const doc = await Booking.create(booking);
    console.log(`📒 Booking recorded — ${booking.status.toUpperCase()} — ${booking.packageName} — ${booking.customerEmail || 'unknown'}`);
    return doc;
  } catch (err) {
    console.error('MongoDB error (recordBooking) — booking was NOT saved:', err.message);
    return null;
  }
}
