// // import mongoose from 'mongoose';

// // const bookingSchema = new mongoose.Schema(
// //   {
// //     status: { type: String, enum: ['success', 'failed'], required: true, index: true },
// //     reason: { type: String, default: '' },
// //     product: { type: String, default: '', index: true },
// //     packageName: { type: String, default: '' },
// //     customerName: { type: String, default: '' },
// //     customerEmail: { type: String, default: '', index: true },
// //     amount: { type: Number, default: null }, // smallest currency unit (cents)
// //     currency: { type: String, default: 'usd' },
// //     promoCode: { type: String, default: '' },
// //     weeks: { type: String, default: '' },
// //     areaOfFocus: { type: String, default: '' },
// //     sessionId: { type: String, default: '', index: true },
// //   },
// //   { timestamps: true } // createdAt doubles as the old "timestamp" field
// // );

// // // Fast "most recent first" listing for the admin panel.
// // bookingSchema.index({ createdAt: -1 });

// // export default mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
// import mongoose from 'mongoose';

// const bookingSchema = new mongoose.Schema(
//   {
//     status: { type: String, enum: ['success', 'failed'], required: true, index: true },
//     // Only set when status is 'failed'. Lets the admin panel filter
//     // "customer never finished checkout" apart from "card was declined".
//     failureType: { type: String, enum: ['abandoned', 'declined', null], default: null, index: true },
//     reason: { type: String, default: '' },
//     product: { type: String, default: '', index: true },
//     packageName: { type: String, default: '' },
//     customerName: { type: String, default: '' },
//     customerEmail: { type: String, default: '', index: true },
//     amount: { type: Number, default: null }, // smallest currency unit (cents)
//     currency: { type: String, default: 'usd' },
//     promoCode: { type: String, default: '' },
//     weeks: { type: String, default: '' },
//     areaOfFocus: { type: String, default: '' },
//     sessionId: { type: String, default: '', index: true },
//   },
//   { timestamps: true } // createdAt doubles as the old "timestamp" field
// );

// // Fast "most recent first" listing for the admin panel.
// bookingSchema.index({ createdAt: -1 });

// export default mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    // 'pending' is written at checkout-creation time, before Stripe resolves
    // the payment. The webhook later flips it to 'success' or 'failed'.
    status: { type: String, enum: ['pending', 'success', 'failed'], required: true, index: true },
    // Only set when status is 'failed'. Lets the admin panel filter
    // "customer never finished checkout" apart from "card was declined".
    failureType: { type: String, enum: ['abandoned', 'declined', null], default: null, index: true },
    reason: { type: String, default: '' },
    product: { type: String, default: '', index: true },
    packageName: { type: String, default: '' },
    customerName: { type: String, default: '' },
    customerEmail: { type: String, default: '', index: true },
    amount: { type: Number, default: null }, // smallest currency unit (cents)
    currency: { type: String, default: 'usd' },
    promoCode: { type: String, default: '' },
    weeks: { type: String, default: '' },
    areaOfFocus: { type: String, default: '' },
    // Checkout Session id (cs_...). Set at checkout creation and used to
    // upsert the same row through 'completed' / 'expired' webhook events.
    sessionId: { type: String, default: null, index: true, unique: true, sparse: true },
    // PaymentIntent id (pi_...). Stripe creates this alongside the Session
    // for `mode: 'payment'` checkouts. payment_intent.payment_failed events
    // only carry the intent, not the session, so we need this to match the
    // failure back to the same pending row instead of creating a duplicate.
    paymentIntentId: { type: String, default: null, index: true, unique: true, sparse: true },
  },
  { timestamps: true } // createdAt doubles as the old "timestamp" field
);

// Fast "most recent first" listing for the admin panel.
bookingSchema.index({ createdAt: -1 });

export default mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
