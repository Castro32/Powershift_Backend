import mongoose from 'mongoose';

// One document per Stripe checkout session that has already been used to
// download the ebook. The unique index does the dedup work for us — a
// duplicate insert throws (code 11000) instead of silently succeeding,
// which closes a tiny race-condition window the old Redis SADD had.
const usedSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export default mongoose.models.UsedSession || mongoose.model('UsedSession', usedSessionSchema);
