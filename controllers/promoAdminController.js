import PromoCode from '../models/PromoCode.js';

export async function listPromoCodes(req, res) {
  try {
    const codes = await PromoCode.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ codes });
  } catch (err) {
    console.error('MongoDB error (listPromoCodes):', err.message);
    return res.status(500).json({ error: 'Could not load promo codes.' });
  }
}

export async function createPromoCode(req, res) {
  const { code, type, value, products, note } = req.body;

  if (!code?.trim()) return res.status(400).json({ error: 'Code is required.' });
  if (!['percent', 'fixed'].includes(type)) {
    return res.status(400).json({ error: "Type must be 'percent' or 'fixed'." });
  }
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return res.status(400).json({ error: 'Value must be a positive number.' });
  }
  if (type === 'percent' && numericValue > 100) {
    return res.status(400).json({ error: 'Percent value cannot exceed 100.' });
  }

  try {
    const doc = await PromoCode.create({
      code: code.trim().toUpperCase(),
      type,
      value: numericValue,
      products: Array.isArray(products) ? products : [],
      note: note || '',
    });
    console.log(`🏷️  Promo code created — ${doc.code} (${doc.type} ${doc.value})`);
    return res.status(201).json({ code: doc });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A promo code with that name already exists.' });
    }
    console.error('MongoDB error (createPromoCode):', err.message);
    return res.status(500).json({ error: 'Could not create promo code.' });
  }
}

export async function updatePromoCode(req, res) {
  const { id } = req.params;
  const { type, value, products, active, note } = req.body;

  const update = {};
  if (type !== undefined) {
    if (!['percent', 'fixed'].includes(type)) {
      return res.status(400).json({ error: "Type must be 'percent' or 'fixed'." });
    }
    update.type = type;
  }
  if (value !== undefined) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return res.status(400).json({ error: 'Value must be a positive number.' });
    }
    update.value = numericValue;
  }
  if (products !== undefined) update.products = Array.isArray(products) ? products : [];
  if (active !== undefined) update.active = Boolean(active);
  if (note !== undefined) update.note = note;

  try {
    const doc = await PromoCode.findByIdAndUpdate(id, update, { new: true });
    if (!doc) return res.status(404).json({ error: 'Promo code not found.' });
    console.log(`🏷️  Promo code updated — ${doc.code} (active: ${doc.active})`);
    return res.status(200).json({ code: doc });
  } catch (err) {
    console.error('MongoDB error (updatePromoCode):', err.message);
    return res.status(500).json({ error: 'Could not update promo code.' });
  }
}

export async function deletePromoCode(req, res) {
  const { id } = req.params;

  try {
    const doc = await PromoCode.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ error: 'Promo code not found.' });
    console.log(`🗑️  Promo code deleted — ${doc.code}`);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('MongoDB error (deletePromoCode):', err.message);
    return res.status(500).json({ error: 'Could not delete promo code.' });
  }
}
