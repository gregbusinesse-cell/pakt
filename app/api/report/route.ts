// app/api/report/route.ts
// Sends a report email to paktsupport@gmail.com via Brevo

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const BREVO_API_KEY = process.env.BREVO_API_KEY!

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '').trim()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: { user }, error: userError } = await authClient.auth.getUser(token)
    if (userError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await req.json()
    const { targetUserId, conversationId, reason } = body as {
      targetUserId: string
      conversationId?: string
      reason: string
    }

    if (!targetUserId || !reason?.trim()) {
      return NextResponse.json({ error: 'Missing targetUserId or reason' }, { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const [{ data: reporter }, { data: target }] = await Promise.all([
      supabase.from('profiles').select('first_name, email').eq('id', user.id).single(),
      supabase.from('profiles').select('first_name, email').eq('id', targetUserId).single(),
    ])

    const reporterName = reporter?.first_name || 'Inconnu'
    const targetName = target?.first_name || 'Inconnu'
    const now = new Date().toISOString()

    const htmlContent = `
      <h2>Signalement utilisateur - PAKT</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Reporter</td><td style="padding:8px;border:1px solid #ddd">${reporterName} (${user.id})</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Utilisateur signalé</td><td style="padding:8px;border:1px solid #ddd">${targetName} (${targetUserId})</td></tr>
        ${conversationId ? `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Conversation</td><td style="padding:8px;border:1px solid #ddd">${conversationId}</td></tr>` : ''}
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Date</td><td style="padding:8px;border:1px solid #ddd">${now}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Motif</td><td style="padding:8px;border:1px solid #ddd">${reason.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>
      </table>
    `

    if (!BREVO_API_KEY) {
      console.error('[REPORT] BREVO_API_KEY missing')
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: 'PAKT Support', email: 'noreply@paktapp.fr' },
        to: [{ email: 'paktsupport@gmail.com' }],
        subject: `Signalement utilisateur - ${targetName}`,
        htmlContent,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      console.error('[REPORT] Brevo error', res.status, errBody)
      return NextResponse.json({ error: 'Email send failed' }, { status: 500 })
    }

    console.log(`[REPORT] user ${user.id} reported ${targetUserId}`)
    return NextResponse.json({ sent: true })
  } catch (err) {
    console.error('[REPORT] error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
