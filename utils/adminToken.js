import crypto from 'crypto';

const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET;
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export function createAdminToken(email) {
  const payload = { email, exp: Date.now() + TOKEN_TTL_MS };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyAdminToken(token) {
  if (!token || !ADMIN_TOKEN_SECRET) return null;

  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  const expected = crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(encoded).digest('base64url');

  // Timing-safe comparison — the old implementation used `!==`, which leaks
  // timing information an attacker could theoretically use to forge a token.
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// Constant-time-ish credential check for the plain-text admin password.
// Doesn't eliminate the need for rate limiting, but avoids the cheapest
// timing leak from a naive `===` comparison.
export function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    // Still run timingSafeEqual against a same-length dummy so this branch
    // doesn't short-circuit obviously faster on a length mismatch.
    crypto.timingSafeEqual(aBuf, aBuf);
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}
