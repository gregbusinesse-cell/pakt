// app/api/emails/event/route.ts
// Triggered by app events: like, match, message
// Call internally from other API routes or webhooks

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, shouldSendEmail, likeEmail, matchEmail } from '@/lib/emails'
import type { EmailType } from '@/lib/emails'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Accept either service-to-service calls with CRON_SECRET or internal calls
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Also accept calls from same origin (internal API calls)
      const origin = req.headers.get('origin') || req.headers.get('referer') || ''
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
      if (!origin.includes(appUrl) && appUrl) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await req.json()
    const { userId, type } = body as { userId: string; type: EmailType }

    if (!userId || !type) {
      return NextResponse.json({ error: 'Missing userId or type' }, { status: 400 })
    }

    // Only handle event-based emails
    if (!['like', 'match', 'message'].includes(type)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    const check = await shouldSendEmail(userId, type)
    if (!check.allowed) {
      return NextResponse.json({ sent: false, reason: check.reason })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, email')
      .eq('id', userId)
      .single()

    if (!profile?.email) {
      return NextResponse.json({ sent: false, reason: 'no_email' })
    }

    const firstName = profile.first_name || 'Membre'

    let template: { subject: string; html: string }

    switch (type) {
      case 'like':
        template = likeEmail(firstName)
        break
      case 'match':
        template = matchEmail(firstName)
        break
      default:
        return NextResponse.json({ sent: false, reason: 'unsupported_type' })
    }

    const result = await sendEmail({
      userId,
      to: profile.email,
      subject: template.subject,
      htmlContent: template.html,
      type,
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('[EMAIL_EVENT] error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
