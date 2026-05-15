// app/api/emails/preview/route.ts
// READ-ONLY preview — returns raw HTML of a template with fake data
// Zero side effects: no Brevo, no Supabase, no counters

import { NextRequest, NextResponse } from 'next/server'
import { welcomeEmail } from '@/lib/emails/templates/welcomeEmail'
import { likeEmail } from '@/lib/emails/templates/likeEmail'
import { matchEmail } from '@/lib/emails/templates/matchEmail'
import { inactiveDay1Email } from '@/lib/emails/templates/inactiveDay1Email'
import { inactiveDay2Email } from '@/lib/emails/templates/inactiveDay2Email'
import { inactiveDay3Email } from '@/lib/emails/templates/inactiveDay3Email'
import { incompleteProfileEmail } from '@/lib/emails/templates/incompleteProfileEmail'

const TEMPLATES: Record<string, () => { subject: string; html: string }> = {
  welcome: () => welcomeEmail('Lucas'),
  like: () => likeEmail('Lucas'),
  match: () => matchEmail('Lucas'),
  'inactive-day-1': () => inactiveDay1Email('Lucas'),
  'inactive-day-2': () => inactiveDay2Email('Lucas'),
  'inactive-day-3': () => inactiveDay3Email('Lucas'),
  'incomplete-profile': () => incompleteProfileEmail('Lucas', ['photos', 'bio', 'skills']),
}

export async function GET(req: NextRequest) {
  const template = req.nextUrl.searchParams.get('template')

  if (!template || !TEMPLATES[template]) {
    const available = Object.keys(TEMPLATES)
    return NextResponse.json({ error: 'Missing or invalid template', available }, { status: 400 })
  }

  const { html } = TEMPLATES[template]()

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
