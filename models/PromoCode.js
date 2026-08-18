import mongoose from 'mongoose';

const promoCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true }, // percent: 0-100, fixed: smallest currency unit
    // Empty array = applies to every product. Non-empty = restricted to these product slugs.
    products: { type: [String], default: [] },
    active: { type: Boolean, default: true },
    note: { type: String, default: '' }, // optional admin-facing label, e.g. "Instagram launch promo"
  },
  { timestamps: true }
);

export default mongoose.models.PromoCode || mongoose.model('PromoCode', promoCodeSchema);
