// import mongoose from 'mongoose';

// const bookingSchema = new mongoose.Schema(
//   {
//     status: { type: String, enum: ['success', 'failed'], required: true, index: true },
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
    status: { type: String, enum: ['success', 'failed'], required: true, index: true },
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
    sessionId: { type: String, default: '', index: true },
  },
  { timestamps: true } // createdAt doubles as the old "timestamp" field
);

// Fast "most recent first" listing for the admin panel.
bookingSchema.index({ createdAt: -1 });

export default mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
