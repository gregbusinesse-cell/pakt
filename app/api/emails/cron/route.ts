// app/api/emails/cron/route.ts
// Vercel Cron job — runs daily to send inactive & incomplete profile emails
// Configure in vercel.json: { "crons": [{ "path": "/api/emails/cron", "schedule": "0 10 * * *" }] }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  sendEmail,
  shouldSendEmail,
  isProfileIncomplete,
  inactiveDay1Email,
  inactiveDay2Email,
  inactiveDay3Email,
  incompleteProfileEmail,
} from '@/lib/emails'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const now = Date.now()

  const stats = { checked: 0, sent: 0, skipped: 0, errors: 0 }

  try {
    // ── 1. Reset daily counters for everyone ─────────────────────
    // Find profiles whose last_email_sent_at is before today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    await supabase
      .from('profiles')
      .update({ emails_sent_today: 0 })
      .lt('last_email_sent_at', todayStart.toISOString())
      .gt('emails_sent_today', 0)

    // ── 2. Fetch all active (non-suspended) profiles ────────────
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_active_at, photos, bio, skills, is_suspended, emails_sent_today')
      .eq('is_onboarded', true)
      .eq('is_suspended', false)
      .not('email', 'is', null)

    if (error) {
      console.error('[CRON] profiles fetch error', error)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    if (!profiles) {
      return NextResponse.json({ stats })
    }

    for (const profile of profiles) {
      stats.checked++

      if (!profile.email) continue

      const firstName = profile.first_name || 'Membre'
      const lastActive = profile.last_active_at ? new Date(profile.last_active_at) : null
      const hoursSinceActive = lastActive ? (now - lastActive.getTime()) / (1000 * 60 * 60) : null

      // ── Inactive emails (mutually exclusive, pick the right tier) ──
      if (hoursSinceActive !== null) {
        let inactiveType: 'inactive_day_1' | 'inactive_day_2' | 'inactive_day_3' | null = null
        let template: { subject: string; html: string } | null = null

        if (hoursSinceActive >= 60 && hoursSinceActive < 84) {
          inactiveType = 'inactive_day_3'
          template = inactiveDay3Email(firstName)
        } else if (hoursSinceActive >= 36 && hoursSinceActive < 60) {
          inactiveType = 'inactive_day_2'
          template = inactiveDay2Email(firstName)
        } else if (hoursSinceActive >= 20 && hoursSinceActive < 36) {
          inactiveType = 'inactive_day_1'
          template = inactiveDay1Email(firstName)
        }

        if (inactiveType && template) {
          const check = await shouldSendEmail(profile.id, inactiveType)
          if (check.allowed) {
            const result = await sendEmail({
              userId: profile.id,
              to: profile.email,
              subject: template.subject,
              htmlContent: template.html,
              type: inactiveType,
            })
            if (result.sent) stats.sent++
            else stats.skipped++
            continue // Max 1 email per user per cron run
          } else {
            stats.skipped++
          }
        }
      }

      // ── Incomplete profile (only if active in last 7 days) ─────
      if (hoursSinceActive !== null && hoursSinceActive < 168) {
        const { incomplete, reasons } = isProfileIncomplete(profile)

        if (incomplete) {
          const check = await shouldSendEmail(profile.id, 'incomplete_profile')
          if (check.allowed) {
            const template = incompleteProfileEmail(firstName, reasons)
            const result = await sendEmail({
              userId: profile.id,
              to: profile.email,
              subject: template.subject,
              htmlContent: template.html,
              type: 'incomplete_profile',
            })
            if (result.sent) stats.sent++
            else stats.skipped++
          } else {
            stats.skipped++
          }
        }
      }
    }

    console.log('[CRON] email job complete', stats)
    return NextResponse.json({ stats })
  } catch (err) {
    console.error('[CRON] fatal error', err)
    return NextResponse.json({ error: 'Internal error', stats }, { status: 500 })
  }
}
