// app/api/emails/unsubscribe/route.ts
// Handles unsubscribe link clicks — marks user as unsubscribed
// No auth required — uses signed token for security

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyUnsubscribeToken } from '@/lib/emails/unsubscribeToken'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const APP_URL = 'https://paktapp.fr'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(`${APP_URL}/unsubscribe?status=error`)
  }

  const { valid, userId } = verifyUnsubscribeToken(token)

  if (!valid || !userId) {
    return NextResponse.redirect(`${APP_URL}/unsubscribe?status=error`)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { error } = await supabase
    .from('profiles')
    .update({ email_unsubscribed: true })
    .eq('id', userId)

  if (error) {
    console.error('[UNSUBSCRIBE] update error', error)
    return NextResponse.redirect(`${APP_URL}/unsubscribe?status=error`)
  }

  console.log(`[UNSUBSCRIBE] user ${userId} unsubscribed`)
  return NextResponse.redirect(`${APP_URL}/unsubscribe?status=success`)
}
