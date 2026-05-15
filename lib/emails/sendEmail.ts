// lib/emails/sendEmail.ts
// Core email service — Brevo API + anti-spam + logging

import { createClient } from '@supabase/supabase-js'

const BREVO_API_KEY = process.env.BREVO_API_KEY!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const MAX_EMAILS_PER_DAY = 2

export type EmailType =
  | 'welcome'
  | 'like'
  | 'match'
  | 'message'
  | 'inactive_day_1'
  | 'inactive_day_2'
  | 'inactive_day_3'
  | 'incomplete_profile'

interface SendEmailParams {
  userId: string
  to: string
  subject: string
  htmlContent: string
  type: EmailType
}

interface SendEmailResult {
  sent: boolean
  reason?: string
}

/**
 * Send an email via Brevo with built-in anti-spam:
 * 1. Check daily limit (max 2/day)
 * 2. Check duplicate (same type within 23h)
 * 3. Send via Brevo API
 * 4. Log to email_events
 * 5. Increment emails_sent_today + update last_email_sent_at
 *
 * Uses service role key — call from API routes / cron only.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { userId, to, subject, htmlContent, type } = params

  if (!BREVO_API_KEY) {
    console.error('[EMAIL] BREVO_API_KEY missing')
    return { sent: false, reason: 'brevo_key_missing' }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // ── 1. Check daily limit ─────────────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('emails_sent_today, last_email_sent_at')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    console.error('[EMAIL] profile lookup failed', profileError)
    return { sent: false, reason: 'profile_not_found' }
  }

  // Reset counter if last email was yesterday or earlier
  let currentCount = profile.emails_sent_today ?? 0
  if (profile.last_email_sent_at) {
    const lastSent = new Date(profile.last_email_sent_at)
    const now = new Date()
    if (lastSent.toDateString() !== now.toDateString()) {
      currentCount = 0
    }
  }

  if (currentCount >= MAX_EMAILS_PER_DAY) {
    console.log(`[EMAIL] daily limit reached for ${userId} (${currentCount}/${MAX_EMAILS_PER_DAY})`)
    return { sent: false, reason: 'daily_limit' }
  }

  // ── 2. Check duplicate (same type within 23h) ────────────────
  const twentyThreeHoursAgo = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()

  const { data: recentEvents } = await supabase
    .from('email_events')
    .select('id')
    .eq('user_id', userId)
    .eq('type', type)
    .gte('sent_at', twentyThreeHoursAgo)
    .limit(1)

  if (recentEvents && recentEvents.length > 0) {
    console.log(`[EMAIL] duplicate blocked: ${type} already sent to ${userId} within 23h`)
    return { sent: false, reason: 'duplicate' }
  }

  // ── 3. Send via Brevo ────────────────────────────────────────
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: 'PAKT', email: 'noreply@paktapp.fr' },
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[EMAIL] Brevo API error', res.status, body)
      return { sent: false, reason: 'brevo_error' }
    }
  } catch (err) {
    console.error('[EMAIL] Brevo fetch failed', err)
    return { sent: false, reason: 'network_error' }
  }

  // ── 4. Log event ─────────────────────────────────────────────
  await supabase.from('email_events').insert({
    user_id: userId,
    type,
  })

  // ── 5. Update counter ────────────────────────────────────────
  const newCount = currentCount + 1

  await supabase
    .from('profiles')
    .update({
      emails_sent_today: newCount,
      last_email_sent_at: new Date().toISOString(),
    })
    .eq('id', userId)

  console.log(`[EMAIL] sent ${type} to ${to} (${newCount}/${MAX_EMAILS_PER_DAY})`)
  return { sent: true }
}
