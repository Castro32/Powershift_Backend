import Stripe from 'stripe';
import { Resend } from 'resend';
import { PACKAGE_LABELS } from '../config/products.js';
import { recordBooking } from '../utils/bookings.js';
import { mailchimpSubscribeAndTag } from '../utils/mailchimp.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL_1,
  process.env.ADMIN_EMAIL_2,
  process.env.ADMIN_EMAIL_3,
  process.env.ADMIN_EMAIL_4,
].filter(Boolean);

export async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    await onCheckoutCompleted(event.data.object);
  }

  if (event.type === 'checkout.session.expired') {
    await onCheckoutExpired(event.data.object);
  }

  if (event.type === 'payment_intent.payment_failed') {
    await onPaymentFailed(event.data.object);
  }

  return res.status(200).json({ received: true });
}

async function onCheckoutCompleted(session) {
  const customerEmail = session.customer_email;
  const customerName = session.metadata?.customer_name || '';
  const product = session.metadata?.product || '';
  const weeks = session.metadata?.weeks || '';
  const areaOfFocus = session.metadata?.area_of_focus || '';
  const firstName = customerName.split(' ')[0] || '';

  const packageInfo = PACKAGE_LABELS[product] || { name: product || 'Unknown package', tag: null };
  const packageName = packageInfo.name;

  console.log(`✅ Payment complete — ${customerName || customerEmail} — ${packageName}`);

  await recordBooking({
    status: 'success',
    product,
    packageName,
    customerName,
    customerEmail,
    amount: session.amount_total,
    currency: session.currency,
    promoCode: session.metadata?.promo_code || '',
    weeks,
    areaOfFocus,
    sessionId: session.id,
  });

  try {
    await mailchimpSubscribeAndTag({ email: customerEmail, firstName, tag: packageInfo.tag });

    if (product === 'accelerator' && weeks) {
      await mailchimpSubscribeAndTag({ email: customerEmail, firstName, tag: `accelerator-${weeks}wk` });
    }

    if (product === 'discovery-intensive' && areaOfFocus) {
      const focusTag = `discovery-intensive-focus-${areaOfFocus
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')}`;
      await mailchimpSubscribeAndTag({ email: customerEmail, firstName, tag: focusTag });
    }
  } catch (err) {
    console.error('Mailchimp tagging error:', err.message);
  }

  try {
    await resend.emails.send({
      from: 'Powershift Payments <booking@powershift.ae>',
      to: ADMIN_EMAILS,
      subject: `New payment — ${packageName} — ${customerName || customerEmail}`,
      html: `
        <h2>New Payment Received</h2>
        <p><strong>Name:</strong> ${customerName || 'N/A'}</p>
        <p><strong>Email:</strong> ${customerEmail}</p>
        <p><strong>Package:</strong> ${packageName}</p>
        ${weeks ? `<p><strong>Tier:</strong> ${weeks}-week</p>` : ''}
        ${areaOfFocus ? `<p><strong>Area of focus:</strong> ${areaOfFocus}</p>` : ''}
        <p><strong>Amount:</strong> ${(session.amount_total / 100).toFixed(2)} ${session.currency?.toUpperCase()}</p>
        <p><strong>Promo code:</strong> ${session.metadata?.promo_code || 'None'}</p>
        <p><strong>Session ID:</strong> ${session.id}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      `,
    });
    console.log(`📧 Admin notified (${ADMIN_EMAILS.length}) — ${packageName} — ${customerEmail}`);
  } catch (err) {
    console.error('Admin notification error:', err.message);
  }
}

async function onCheckoutExpired(session) {
  const product = session.metadata?.product || '';
  const packageInfo = PACKAGE_LABELS[product] || { name: product || 'Unknown package' };

  console.log(`⌛ Checkout expired — ${packageInfo.name} — ${session.customer_email || 'unknown'}`);

  await recordBooking({
    status: 'failed',
    reason: 'Checkout expired (abandoned before payment)',
    product,
    packageName: packageInfo.name,
    customerName: session.metadata?.customer_name || '',
    customerEmail: session.customer_email || session.customer_details?.email || '',
    amount: session.amount_total,
    currency: session.currency,
    promoCode: session.metadata?.promo_code || '',
    weeks: session.metadata?.weeks || '',
    areaOfFocus: session.metadata?.area_of_focus || '',
    sessionId: session.id,
  });
}

async function onPaymentFailed(intent) {
  const product = intent.metadata?.product || '';
  const packageInfo = PACKAGE_LABELS[product] || { name: product || 'Unknown package' };
  const failureReason = intent.last_payment_error?.message || 'Payment failed';

  console.log(`❌ Payment failed — ${packageInfo.name} — ${intent.receipt_email || 'unknown'} — ${failureReason}`);

  await recordBooking({
    status: 'failed',
    reason: failureReason,
    product,
    packageName: packageInfo.name,
    customerName: intent.metadata?.customer_name || '',
    customerEmail: intent.receipt_email || '',
    amount: intent.amount,
    currency: intent.currency,
    promoCode: intent.metadata?.promo_code || '',
    weeks: intent.metadata?.weeks || '',
    areaOfFocus: intent.metadata?.area_of_focus || '',
    sessionId: intent.id,
  });
}
