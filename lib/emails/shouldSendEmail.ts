// lib/emails/shouldSendEmail.ts
// Smart rules engine: should we send this email?

import { createClient } from '@supabase/supabase-js'
import type { EmailType } from './sendEmail'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const MAX_EMAILS_PER_DAY = 2

interface ShouldSendResult {
  allowed: boolean
  reason?: string
}

/**
 * Check all rules before sending an email.
 * Call this BEFORE sendEmail() in cron jobs to skip unnecessary work.
 */
export async function shouldSendEmail(
  userId: string,
  type: EmailType
): Promise<ShouldSendResult> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data: profile } = await supabase
    .from('profiles')
    .select('emails_sent_today, last_email_sent_at, last_active_at, is_suspended, email_unsubscribed')
    .eq('id', userId)
    .single()

  if (!profile) return { allowed: false, reason: 'profile_not_found' }

  // Unsubscribed users get no emails
  if (profile.email_unsubscribed) return { allowed: false, reason: 'unsubscribed' }

  // Suspended users get no emails
  if (profile.is_suspended) return { allowed: false, reason: 'suspended' }

  // ── Daily limit ──────────────────────────────────────────────
  let currentCount = profile.emails_sent_today ?? 0
  if (profile.last_email_sent_at) {
    const lastSent = new Date(profile.last_email_sent_at)
    if (lastSent.toDateString() !== new Date().toDateString()) {
      currentCount = 0
    }
  }

  if (currentCount >= MAX_EMAILS_PER_DAY) {
    return { allowed: false, reason: 'daily_limit' }
  }

  // ── Duplicate check (same type within 23h) ───────────────────
  const twentyThreeHoursAgo = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()

  const { data: recentEvents } = await supabase
    .from('email_events')
    .select('id')
    .eq('user_id', userId)
    .eq('type', type)
    .gte('sent_at', twentyThreeHoursAgo)
    .limit(1)

  if (recentEvents && recentEvents.length > 0) {
    return { allowed: false, reason: 'duplicate' }
  }

  // ── Inactive emails: stop if user came back ──────────────────
  if (type.startsWith('inactive_day_')) {
    const lastActive = profile.last_active_at ? new Date(profile.last_active_at) : null

    if (lastActive) {
      const hoursSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60)

      // If user was active in the last 12h, skip inactive reminders
      if (hoursSinceActive < 12) {
        return { allowed: false, reason: 'user_recently_active' }
      }

      // Day 2 email requires at least 36h inactive
      if (type === 'inactive_day_2' && hoursSinceActive < 36) {
        return { allowed: false, reason: 'not_inactive_enough' }
      }

      // Day 3 email requires at least 60h inactive
      if (type === 'inactive_day_3' && hoursSinceActive < 60) {
        return { allowed: false, reason: 'not_inactive_enough' }
      }
    }
  }

  return { allowed: true }
}

/**
 * Check if a profile is incomplete (for incomplete_profile email).
 */
export function isProfileIncomplete(profile: {
  photos?: unknown
  bio?: string | null
  skills?: unknown
}): { incomplete: boolean; reasons: string[] } {
  const reasons: string[] = []

  // Photos
  const photos = Array.isArray(profile.photos) ? profile.photos.filter(Boolean) : []
  if (photos.length < 4) reasons.push('photos')

  // Bio
  const bio = (profile.bio || '').trim()
  if (bio.length < 30) reasons.push('bio')

  // Skills
  const skills = Array.isArray(profile.skills) ? profile.skills.filter((s: any) => s?.level >= 1) : []
  if (skills.length === 0) reasons.push('skills')

  return { incomplete: reasons.length > 0, reasons }
}
