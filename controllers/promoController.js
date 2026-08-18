// import { PROMO_CODES } from '../config/products.js';
// import PromoEvent from '../models/PromoEvent.js';

// export function validatePromo(req, res) {
//   const { code, currency, product } = req.body;
//   if (!code?.trim()) return res.status(200).json({ valid: false });

//   const promo = PROMO_CODES[code.trim().toUpperCase()];
//   if (!promo) return res.status(200).json({ valid: false });
//   if (promo.currencies && !promo.currencies.includes(currency || 'usd')) {
//     return res.status(200).json({ valid: false, reason: 'not_applicable' });
//   }
//   if (promo.products && !promo.products.includes(product || '')) {
//     return res.status(200).json({ valid: false, reason: 'not_applicable' });
//   }

//   return res.status(200).json({ valid: true, type: promo.type, value: promo.value });
// }

// export async function trackPromo(req, res) {
//   const { code = 'NONE', email = 'unknown', areaOfFocus = '', action = 'unknown', ...extra } = req.body;

//   const upperCode = code.trim().toUpperCase();

//   try {
//     await PromoEvent.create({
//       code: upperCode,
//       email: email.trim(),
//       areaOfFocus: areaOfFocus.trim(),
//       action,
//       codeValid: upperCode !== 'NONE' && Boolean(PROMO_CODES[upperCode]),
//       extra,
//     });
//     console.log(`📊 Promo event — ${action} | code: ${upperCode} | email: ${email} | focus: ${areaOfFocus || 'n/a'}`);
//   } catch (err) {
//     // Never block the frontend on an analytics-write failure.
//     console.error('MongoDB error (trackPromo):', err.message);
//   }

//   return res.status(200).json({ ok: true });
// }
import PromoCode from '../models/PromoCode.js';
import PromoEvent from '../models/PromoEvent.js';

export async function validatePromo(req, res) {
  const { code, currency, product } = req.body;
  if (!code?.trim()) return res.status(200).json({ valid: false });

  try {
    const promo = await PromoCode.findOne({ code: code.trim().toUpperCase(), active: true }).lean();
    if (!promo) return res.status(200).json({ valid: false });
    if (promo.products?.length && !promo.products.includes(product || '')) {
      return res.status(200).json({ valid: false, reason: 'not_applicable' });
    }
    return res.status(200).json({ valid: true, type: promo.type, value: promo.value });
  } catch (err) {
    console.error('MongoDB error (validatePromo):', err.message);
    return res.status(200).json({ valid: false });
  }
}

export async function trackPromo(req, res) {
  const { code = 'NONE', email = 'unknown', areaOfFocus = '', action = 'unknown', ...extra } = req.body;

  const upperCode = code.trim().toUpperCase();

  try {
    const codeValid =
      upperCode !== 'NONE' && Boolean(await PromoCode.exists({ code: upperCode, active: true }));

    await PromoEvent.create({
      code: upperCode,
      email: email.trim(),
      areaOfFocus: areaOfFocus.trim(),
      action,
      codeValid,
      extra,
    });
    console.log(`📊 Promo event — ${action} | code: ${upperCode} | email: ${email} | focus: ${areaOfFocus || 'n/a'}`);
  } catch (err) {
    // Never block the frontend on an analytics-write failure.
    console.error('MongoDB error (trackPromo):', err.message);
  }

  return res.status(200).json({ ok: true });
}
