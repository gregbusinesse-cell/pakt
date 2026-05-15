// lib/emails/unsubscribeToken.ts
// Simple HMAC-based token to secure unsubscribe links
// Prevents random people from unsubscribing others

import { createHmac } from 'crypto'

const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret'

export function generateUnsubscribeToken(userId: string): string {
  const hmac = createHmac('sha256', SECRET).update(userId).digest('hex').slice(0, 16)
  // base64url encode: userId:hmac
  return Buffer.from(`${userId}:${hmac}`).toString('base64url')
}

export function verifyUnsubscribeToken(token: string): { valid: boolean; userId?: string } {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const [userId, hmac] = decoded.split(':')

    if (!userId || !hmac) return { valid: false }

    const expected = createHmac('sha256', SECRET).update(userId).digest('hex').slice(0, 16)

    if (hmac !== expected) return { valid: false }

    return { valid: true, userId }
  } catch {
    return { valid: false }
  }
}
