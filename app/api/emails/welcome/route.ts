// app/api/emails/welcome/route.ts
// Called after onboarding to send welcome email

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, welcomeEmail } from '@/lib/emails'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '').trim()

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the user
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: { user }, error: userError } = await authClient.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, first_name')
      .eq('id', user.id)
      .single()

    if (!profile?.email) {
      return NextResponse.json({ sent: false, reason: 'no_email' })
    }

    const tpl = welcomeEmail(profile.first_name || 'Membre')

    const result = await sendEmail({
      userId: user.id,
      to: profile.email,
      subject: tpl.subject,
      htmlContent: tpl.html,
      type: 'welcome',
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('[WELCOME_EMAIL] error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
