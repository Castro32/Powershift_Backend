// import Stripe from 'stripe';
// import {
//   PACKAGE_CONFIG,
//   DISCOVERY_INTENSIVE_CONFIG,
//   PERSONAL_SESSION_CONFIG,
//   EBOOK_CONFIG,
//   EMPIRE_TIERS,
//   PACKAGE_LABELS,
//   applyPromo,
// } from '../config/products.js';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// export async function createCheckout(req, res) {
//   const { product, email, name, promoCode, weeks, areaOfFocus } = req.body;

//   const isDiscoveryIntensive = product === 'discovery-intensive';
//   const isAccelerator = product === 'accelerator' || product === 'empire-building';
//   const isDigitalAudit = product === 'digital-audit' || product === 'personal-session';
//   const isFireFounders = product === 'fire-founders';
//   const isEbook = product === 'ebook';

//   let config, productName, productDescription, cancelPath, metadataProduct;

//   if (isEbook) {
//     config = EBOOK_CONFIG;
//     productName = 'Becoming Her — The Six-Figure Founder Framework';
//     productDescription = 'Digital download · PDF · CB Media Group';
//     cancelPath = 'ebook';
//     metadataProduct = 'ebook';
//   } else if (isDiscoveryIntensive) {
//     config = DISCOVERY_INTENSIVE_CONFIG;
//     productName = '90-Minute Discovery Intensive';
//     productDescription = 'Discovery Intensive with Sonal & Sanjeev';
//     cancelPath = 'packages/discovery-intensive';
//     metadataProduct = 'discovery-intensive';

//     if (!areaOfFocus || !areaOfFocus.trim()) {
//       return res.status(400).json({ error: 'Please select an area of focus.' });
//     }
//   } else if (isAccelerator) {
//     const tierWeeks = parseInt(weeks, 10);
//     config = EMPIRE_TIERS[tierWeeks];
//     if (!config) return res.status(400).json({ error: 'Invalid empire tier. weeks must be 8, 12, or 16.' });
//     productName = `Empire Building — ${tierWeeks}-Week Mentorship`;
//     productDescription = `Fully personalised ${tierWeeks}-week mentorship programme · Grit & Grace · CB Media Group`;
//     cancelPath = '/packages/accelerator';
//     metadataProduct = 'accelerator';
//   } else if (isDigitalAudit) {
//     config = PERSONAL_SESSION_CONFIG;
//     productName = 'Digital Audit';
//     productDescription = 'Digital Audit Session';
//     cancelPath = 'packages/digital-audit';
//     metadataProduct = 'digital-audit';
//   } else if (isFireFounders) {
//     config = PACKAGE_CONFIG;
//     productName = 'Fire Founders Package';
//     productDescription = 'Creative Production + Personal Brand Strategy + Digital Advertising';
//     cancelPath = 'packages/fire-founders';
//     metadataProduct = 'fire-founders';
//   } else {
//     return res.status(400).json({ error: 'Invalid product.' });
//   }

//   const promoResult = applyPromo(promoCode, config.amount, config.currency, product);
//   const finalAmount = promoResult.amount;
//   const promoApplied = promoResult.valid;

//   if (promoCode && !promoApplied) {
//     return res.status(400).json({ error: 'Invalid or inapplicable promo code.' });
//   }

//   const discountNote = promoApplied
//     ? ` (${promoCode.trim().toUpperCase()} — ${
//         promoResult.discount.type === 'percent' ? `${promoResult.discount.value}% off` : 'discount applied'
//       })`
//     : '';

//   const sharedMetadata = {
//     customer_name: name || '',
//     product: metadataProduct,
//     promo_code: promoApplied ? promoCode.trim().toUpperCase() : '',
//     weeks: isAccelerator ? String(parseInt(weeks, 10)) : '',
//     area_of_focus: isDiscoveryIntensive ? (areaOfFocus || '').trim() : '',
//   };

//   try {
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       customer_email: email || undefined,
//       line_items: [
//         {
//           price_data: {
//             currency: config.currency,
//             product_data: { name: productName, description: productDescription + discountNote },
//             unit_amount: finalAmount,
//           },
//           quantity: 1,
//         },
//       ],
//       mode: 'payment',
//       metadata: sharedMetadata,
//       payment_intent_data: { metadata: sharedMetadata },
//       success_url: `${process.env.FRONTEND_URL}/${
//         isEbook ? 'ebook' : isFireFounders ? 'packages' : `packages/${metadataProduct}`
//       }/success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${process.env.FRONTEND_URL}/${cancelPath}`,
//     });

//     console.log(`✅ Checkout created — ${metadataProduct}${discountNote}`);
//     return res.status(200).json({ url: session.url });
//   } catch (err) {
//     console.error('Stripe error:', err.message);
//     return res.status(500).json({ error: err.message });
//   }
// }

// export async function getCheckoutSession(req, res) {
//   const { session_id } = req.query;
//   if (!session_id) return res.status(400).json({ error: 'Missing session_id.' });

//   try {
//     const session = await stripe.checkout.sessions.retrieve(session_id);

//     const product = session.metadata?.product || '';
//     const packageInfo = PACKAGE_LABELS[product] || { name: product || 'Your package' };

//     return res.status(200).json({
//       ok: true,
//       paid: session.payment_status === 'paid',
//       product,
//       packageName: packageInfo.name,
//       amount: session.amount_total,
//       currency: session.currency,
//       customerEmail: session.customer_email || session.customer_details?.email || '',
//       weeks: session.metadata?.weeks || '',
//       areaOfFocus: session.metadata?.area_of_focus || '',
//     });
//   } catch (err) {
//     console.error('Checkout session lookup error:', err.message);
//     return res.status(404).json({ error: 'Could not find that session.' });
//   }
// }
import Stripe from 'stripe';
import {
  PACKAGE_CONFIG,
  DISCOVERY_INTENSIVE_CONFIG,
  PERSONAL_SESSION_CONFIG,
  EBOOK_CONFIG,
  EMPIRE_TIERS,
  PACKAGE_LABELS,
} from '../config/products.js';
import PromoCode from '../models/PromoCode.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createCheckout(req, res) {
  const { product, email, name, promoCode, weeks, areaOfFocus } = req.body;

  const isDiscoveryIntensive = product === 'discovery-intensive';
  const isAccelerator = product === 'accelerator' || product === 'empire-building';
  const isDigitalAudit = product === 'digital-audit' || product === 'personal-session';
  const isFireFounders = product === 'fire-founders';
  const isEbook = product === 'ebook';

  let config, productName, productDescription, cancelPath, metadataProduct;

  if (isEbook) {
    config = EBOOK_CONFIG;
    productName = 'Becoming Her — The Six-Figure Founder Framework';
    productDescription = 'Digital download · PDF · CB Media Group';
    cancelPath = 'ebook';
    metadataProduct = 'ebook';
  } else if (isDiscoveryIntensive) {
    config = DISCOVERY_INTENSIVE_CONFIG;
    productName = '90-Minute Discovery Intensive';
    productDescription = 'Discovery Intensive with Sonal & Sanjeev';
    cancelPath = 'packages/discovery-intensive';
    metadataProduct = 'discovery-intensive';

    if (!areaOfFocus || !areaOfFocus.trim()) {
      return res.status(400).json({ error: 'Please select an area of focus.' });
    }
  } else if (isAccelerator) {
    const tierWeeks = parseInt(weeks, 10);
    config = EMPIRE_TIERS[tierWeeks];
    if (!config) return res.status(400).json({ error: 'Invalid empire tier. weeks must be 8, 12, or 16.' });
    productName = `Empire Building — ${tierWeeks}-Week Mentorship`;
    productDescription = `Fully personalised ${tierWeeks}-week mentorship programme · Grit & Grace · CB Media Group`;
    cancelPath = '/packages/accelerator';
    metadataProduct = 'accelerator';
  } else if (isDigitalAudit) {
    config = PERSONAL_SESSION_CONFIG;
    productName = 'Digital Audit';
    productDescription = 'Digital Audit Session';
    cancelPath = 'packages/digital-audit';
    metadataProduct = 'digital-audit';
  } else if (isFireFounders) {
    config = PACKAGE_CONFIG;
    productName = 'Fire Founders Package';
    productDescription = 'Creative Production + Personal Brand Strategy + Digital Advertising';
    cancelPath = 'packages/fire-founders';
    metadataProduct = 'fire-founders';
  } else {
    return res.status(400).json({ error: 'Invalid product.' });
  }

  let promoApplied = false;
  let finalAmount = config.amount;
  let discountInfo = null;

  if (promoCode) {
    let promo;
    try {
      promo = await PromoCode.findOne({ code: promoCode.trim().toUpperCase(), active: true }).lean();
    } catch (err) {
      console.error('MongoDB error (promo lookup in createCheckout):', err.message);
    }

    const applicable = promo && (!promo.products?.length || promo.products.includes(product));

    if (!applicable) {
      return res.status(400).json({ error: 'Invalid or inapplicable promo code.' });
    }

    promoApplied = true;
    discountInfo = promo;
    finalAmount =
      promo.type === 'percent'
        ? Math.round(config.amount * (1 - promo.value / 100))
        : Math.max(0, config.amount - promo.value);
  }

  const discountNote = promoApplied
    ? ` (${promoCode.trim().toUpperCase()} — ${
        discountInfo.type === 'percent' ? `${discountInfo.value}% off` : 'discount applied'
      })`
    : '';

  const sharedMetadata = {
    customer_name: name || '',
    product: metadataProduct,
    promo_code: promoApplied ? promoCode.trim().toUpperCase() : '',
    weeks: isAccelerator ? String(parseInt(weeks, 10)) : '',
    area_of_focus: isDiscoveryIntensive ? (areaOfFocus || '').trim() : '',
  };

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: config.currency,
            product_data: { name: productName, description: productDescription + discountNote },
            unit_amount: finalAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: sharedMetadata,
      payment_intent_data: { metadata: sharedMetadata },
      success_url: `${process.env.FRONTEND_URL}/${
        isEbook ? 'ebook' : isFireFounders ? 'packages' : `packages/${metadataProduct}`
      }/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/${cancelPath}`,
    });

    console.log(`✅ Checkout created — ${metadataProduct}${discountNote}`);
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

export async function getCheckoutSession(req, res) {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: 'Missing session_id.' });

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const product = session.metadata?.product || '';
    const packageInfo = PACKAGE_LABELS[product] || { name: product || 'Your package' };

    return res.status(200).json({
      ok: true,
      paid: session.payment_status === 'paid',
      product,
      packageName: packageInfo.name,
      amount: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_email || session.customer_details?.email || '',
      weeks: session.metadata?.weeks || '',
      areaOfFocus: session.metadata?.area_of_focus || '',
    });
  } catch (err) {
    console.error('Checkout session lookup error:', err.message);
    return res.status(404).json({ error: 'Could not find that session.' });
  }
}
