import mongoose from 'mongoose';

const promoEventSchema = new mongoose.Schema(
  {
    code: { type: String, default: 'NONE', index: true },
    email: { type: String, default: 'unknown' },
    areaOfFocus: { type: String, default: '' },
    action: { type: String, default: 'unknown' },
    codeValid: { type: Boolean, default: false },
    extra: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

promoEventSchema.index({ createdAt: -1 });

export default mongoose.models.PromoEvent || mongoose.model('PromoEvent', promoEventSchema);
