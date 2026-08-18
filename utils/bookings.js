// import Booking from '../models/Booking.js';

// /**
//  * Records one payment attempt — successful or failed — for the admin panel.
//  */
// export async function recordBooking(record) {
//   const booking = {
//     status: record.status,
//     reason: record.reason || '',
//     product: record.product || '',
//     packageName: record.packageName || record.product || 'Unknown package',
//     customerName: record.customerName || '',
//     customerEmail: record.customerEmail || '',
//     amount: record.amount ?? null,
//     currency: record.currency || 'usd',
//     promoCode: record.promoCode || '',
//     weeks: record.weeks || '',
//     areaOfFocus: record.areaOfFocus || '',
//     sessionId: record.sessionId || '',
//   };

//   try {
//     const doc = await Booking.create(booking);
//     console.log(`📒 Booking recorded — ${booking.status.toUpperCase()} — ${booking.packageName} — ${booking.customerEmail || 'unknown'}`);
//     return doc;
//   } catch (err) {
//     console.error('MongoDB error (recordBooking) — booking was NOT saved:', err.message);
//     return null;
//   }
// }
import Booking from '../models/Booking.js';

/**
 * Upserts one booking record.
 *
 * Called three times across the life of a single checkout:
 *   1. At checkout creation      -> status: 'pending'   (matched/created by sessionId)
 *   2. When Stripe resolves it   -> status: 'success'    (matched by sessionId)
 *                                 or 'failed'/'abandoned' (matched by sessionId)
 *                                 or 'failed'/'declined'  (matched by paymentIntentId,
 *                                    since payment_intent.payment_failed doesn't carry
 *                                    the Checkout Session id)
 *
 * Matching preference: sessionId first, then paymentIntentId. This keeps a single
 * pending row from checkout-creation time from ever being duplicated once the
 * webhook fires, instead of inserting a second document per checkout attempt.
 */
export async function recordBooking(record) {
  const booking = {
    status: record.status,
    failureType: record.failureType || null,
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
    sessionId: record.sessionId || null,
    paymentIntentId: record.paymentIntentId || null,
  };

  const filter = booking.sessionId
    ? { sessionId: booking.sessionId }
    : booking.paymentIntentId
    ? { paymentIntentId: booking.paymentIntentId }
    : null;

  if (!filter) {
    console.error('recordBooking called without sessionId or paymentIntentId — cannot upsert safely.');
    return null;
  }

  // Don't overwrite an identifier we don't have with null (e.g. a 'declined'
  // update matched by paymentIntentId shouldn't blank out an existing sessionId).
  if (!booking.sessionId) delete booking.sessionId;
  if (!booking.paymentIntentId) delete booking.paymentIntentId;

  try {
    const doc = await Booking.findOneAndUpdate(
      filter,
      { $set: booking },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`📒 Booking recorded — ${booking.status.toUpperCase()} — ${booking.packageName} — ${booking.customerEmail || 'unknown'}`);
    return doc;
  } catch (err) {
    console.error('MongoDB error (recordBooking) — booking was NOT saved:', err.message);
    return null;
  }
}
