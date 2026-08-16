import crypto from 'crypto';

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID;
const MAILCHIMP_DC = process.env.MAILCHIMP_DC;

const mailchimpAuth = () => `Basic ${Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString('base64')}`;

const mailchimpMemberUrl = (email) => {
  const hash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
  return `https://${MAILCHIMP_DC}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members/${hash}`;
};

/**
 * Upserts a subscriber then applies a tag. Works for both new and existing
 * contacts — the tag-triggered automation fires either way.
 */
export async function mailchimpSubscribeAndTag({ email, firstName = '', tag = null }) {
  if (!email) return;

  const memberUrl = mailchimpMemberUrl(email);
  const auth = mailchimpAuth();

  const upsertRes = await fetch(memberUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify({
      email_address: email,
      status_if_new: 'subscribed',
      merge_fields: {
        FNAME: firstName,
        LOCATION: tag === 'ebook-buyers' ? 'London' : '',
      },
    }),
  });

  if (!upsertRes.ok) {
    const data = await upsertRes.json().catch(() => ({}));
    console.error('Mailchimp upsert error:', data.detail || data.title || upsertRes.status);
  } else {
    console.log(`✅ Mailchimp — upserted ${email}`);
  }

  if (tag) {
    const tagRes = await fetch(`${memberUrl}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ tags: [{ name: tag, status: 'active' }] }),
    });

    if (tagRes.status === 204) {
      console.log(`🏷️  Mailchimp — tagged "${tag}" → ${email}`);
    } else {
      const tagData = await tagRes.json().catch(() => ({}));
      console.error('Mailchimp tag error:', tagData.detail || tagData.title);
    }
  }
}

export async function mailchimpSubscribe({ email, firstName = '', lastName = '', phone = '', location = '' }) {
  const url = `https://${MAILCHIMP_DC}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: mailchimpAuth() },
    body: JSON.stringify({
      email_address: email,
      status: 'subscribed',
      merge_fields: { FNAME: firstName, LNAME: lastName, PHONE: phone, LOCATION: location },
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok && data.title !== 'Member Exists') {
    const err = new Error(data.detail || 'Mailchimp subscription failed');
    err.status = res.status;
    throw err;
  }

  return data;
}
