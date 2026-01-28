import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Compare two strings in constant time to prevent timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  if (bufA.length !== bufB.length) {
    // Compare with itself to maintain constant time
    timingSafeEqual(bufA, bufA);
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}

/**
 * Verify cron secret from Authorization header
 */
export function verifyCronSecret(authHeader: string | null): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !authHeader) {
    return false;
  }

  const expected = `Bearer ${cronSecret}`;
  return secureCompare(authHeader, expected);
}

/**
 * Sign data with HMAC-SHA256
 */
export function signData(data: string, secret?: string): string {
  const key = secret || process.env.STRIPE_SECRET_KEY || process.env.CRON_SECRET;
  if (!key) {
    throw new Error('No secret key available for signing');
  }
  return createHmac('sha256', key).update(data).digest('hex');
}

/**
 * Verify HMAC signature
 */
export function verifySignature(data: string, signature: string, secret?: string): boolean {
  const expectedSignature = signData(data, secret);
  return secureCompare(signature, expectedSignature);
}

/**
 * Create signed state for OAuth flows
 */
export function createSignedState(payload: Record<string, unknown>): string {
  const data = JSON.stringify(payload);
  const signature = signData(data);
  const combined = {
    data: Buffer.from(data).toString('base64'),
    sig: signature,
  };
  return Buffer.from(JSON.stringify(combined)).toString('base64url');
}

/**
 * Verify and decode signed state from OAuth flows
 */
export function verifySignedState<T = Record<string, unknown>>(state: string): T | null {
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
    const { data, sig } = decoded;

    if (!data || !sig) {
      return null;
    }

    const payload = Buffer.from(data, 'base64').toString('utf8');

    if (!verifySignature(payload, sig)) {
      return null;
    }

    return JSON.parse(payload) as T;
  } catch {
    return null;
  }
}
