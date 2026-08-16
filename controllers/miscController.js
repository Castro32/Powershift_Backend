import { FIRE_STRATEGY_CODES } from '../config/products.js';
import { mailchimpSubscribe } from '../utils/mailchimp.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function subscribe(req, res) {
  const { email_address, FNAME, LNAME, PHONE, LOCATION } = req.body;

  if (!email_address || !EMAIL_RE.test(email_address.trim())) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  try {
    await mailchimpSubscribe({
      email: email_address.trim(),
      firstName: FNAME || '',
      lastName: LNAME || '',
      phone: PHONE || '',
      location: LOCATION || '',
    });
    return res.status(200).json({ message: 'Subscribed.' });
  } catch (err) {
    console.error('Subscribe error:', err.message);
    return res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
  }
}

export function validateFireStrategyCoupon(req, res) {
  const { code } = req.body;

  if (!code?.trim()) {
    return res.status(200).json({ valid: false, error: 'Please enter your access code.' });
  }

  const submittedCode = code.trim().toUpperCase();
  const access = FIRE_STRATEGY_CODES[submittedCode];

  if (!access) {
    return res.status(200).json({ valid: false, error: 'This access code is not valid.' });
  }

  console.log(`🔥 Fire Strategy access unlocked — ${access.name} — ${submittedCode}`);

  return res.status(200).json({
    valid: true,
    name: access.name,
    product: 'fire-strategy-session',
    packageName: 'Fire Strategy Session',
    duration: 40,
    calendlyUrl: 'https://calendly.com/concierge-cbmediagroup/discovery-intensive-call',
  });
}

export function health(req, res) {
  res.status(200).json({ ok: true });
}
