import { Resend } from 'resend';
import ContactInquiry from '../models/ContactInquiry.js';

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL_1,
  process.env.ADMIN_EMAIL_2,
  process.env.ADMIN_EMAIL_3,
  process.env.ADMIN_EMAIL_4,
].filter(Boolean);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_TYPES = ['package', 'sponsorship', 'community', 'other'];

const TYPE_LABELS = {
  package: 'Package inquiry',
  sponsorship: 'Sponsorship interest',
  community: 'Community collaboration',
  other: 'Other',
};

export async function submitContact(req, res) {
  const { name, email, organization, inquiryType, message } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: 'Please tell us your name.' });
  if (!email?.trim() || !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (!VALID_TYPES.includes(inquiryType)) {
    return res.status(400).json({ error: 'Please select what this is about.' });
  }
  if (!message?.trim()) return res.status(400).json({ error: 'Please add a short message.' });

  let saved;
  try {
    saved = await ContactInquiry.create({
      name: name.trim(),
      email: email.trim(),
      organization: (organization || '').trim(),
      inquiryType,
      message: message.trim(),
    });
  } catch (err) {
    console.error('MongoDB error (submitContact):', err.message);
    return res.status(500).json({ error: 'Could not submit your message. Please try again.' });
  }

  try {
    await resend.emails.send({
      from: 'Powershift Contact <hello@powershift.ae>',
      to: ADMIN_EMAILS,
      subject: `New inquiry — ${TYPE_LABELS[inquiryType]} — ${name.trim()}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Type:</strong> ${TYPE_LABELS[inquiryType]}</p>
        <p><strong>Name:</strong> ${name.trim()}</p>
        <p><strong>Email:</strong> ${email.trim()}</p>
        ${organization ? `<p><strong>Organization / Community:</strong> ${organization.trim()}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${message.trim().replace(/\n/g, '<br>')}</p>
        <p><strong>Submitted:</strong> ${new Date().toISOString()}</p>
      `,
    });
  } catch (err) {
    // The inquiry is already saved — don't fail the request over an email hiccup.
    console.error('Contact notification email error:', err.message);
  }

  console.log(`📨 Contact inquiry — ${TYPE_LABELS[inquiryType]} — ${name.trim()} (${email.trim()})`);
  return res.status(201).json({ ok: true, id: saved._id });
}
