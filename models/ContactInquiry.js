import mongoose from 'mongoose';

const contactInquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    organization: { type: String, default: '' }, // company or community name, if relevant
    inquiryType: {
      type: String,
      enum: ['package', 'sponsorship', 'community', 'other'],
      required: true,
    },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

contactInquirySchema.index({ createdAt: -1 });

export default mongoose.models.ContactInquiry || mongoose.model('ContactInquiry', contactInquirySchema);
