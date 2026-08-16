// ── Product config ────────────────────────────────────────────────────────

export const PACKAGE_CONFIG = { amount: 350000, currency: 'usd' };

export const DISCOVERY_INTENSIVE_CONFIG = { amount: 20000, currency: 'usd' };
export const PERSONAL_SESSION_CONFIG = { amount: 50000, currency: 'usd' };
export const EBOOK_CONFIG = { amount: 2000, currency: 'usd' }; // $20

export const EMPIRE_TIERS = {
  8: { amount: 400000, currency: 'usd' },
  12: { amount: 550000, currency: 'usd' },
  16: { amount: 700000, currency: 'usd' },
};

export const PACKAGE_LABELS = {
  'fire-founders': { name: 'Fire Founders Package', tag: 'fire-founders-buyers' },
  'discovery-intensive': { name: 'Discovery Intensive', tag: 'discovery-intensive-buyers' },
  'digital-audit': { name: 'Digital Audit', tag: 'digital-audit-buyers' },
  accelerator: { name: 'Accelerator', tag: 'accelerator-buyers' },
  ebook: { name: 'Becoming Her — Six-Figure Founder Framework', tag: 'ebook-buyers' },
  'fire-strategy-session': { name: 'Fire Strategy Session', tag: 'fire-strategy-session' },
};

// ── Promo codes ───────────────────────────────────────────────────────────

export const PROMO_CODES = {
  PWRSHIFT10: { type: 'percent', value: 10 },
  BECOMINGHER: { type: 'percent', value: 10, products: ['ebook'] },
};

export const FIRE_STRATEGY_CODES = {
  'PS-SARAH-001': { name: 'Sarah' },
  'PS-AMINA-002': { name: 'Amina' },
  'PS-GRACE-003': { name: 'Grace' },
  'PS-MARY-004': { name: 'Mary' },
  'PS-JANE-005': { name: 'Jane' },
};

export function applyPromo(code, amount, currency, product) {
  const promo = PROMO_CODES[code?.trim().toUpperCase()];
  if (!promo) return { valid: false, amount };
  if (promo.currencies && !promo.currencies.includes(currency)) return { valid: false, amount };
  if (promo.products && !promo.products.includes(product)) return { valid: false, amount };

  const discounted =
    promo.type === 'percent'
      ? Math.round(amount * (1 - promo.value / 100))
      : Math.max(0, amount - promo.value);

  return { valid: true, amount: discounted, discount: promo };
}

// ── CORS ──────────────────────────────────────────────────────────────────

export const ALLOWED_ORIGINS = [
  'https://powershift.ae',
  'https://www.powershift.ae',
  'https://cbmediagroup.ae',
  'https://www.cbmediagroup.ae',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8000',
  'http://localhost:8080',
];
