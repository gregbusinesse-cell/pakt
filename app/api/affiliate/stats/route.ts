import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase())

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(token)

  if (error || !user?.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  // Fetch all affiliates
  const { data: affiliates } = await supabase
    .from('affiliates')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch referral counts grouped by code
  const { data: referralStats } = await supabase
    .from('referrals')
    .select('referral_code, status, converted_plan')

  const statsByCode: Record<string, { signups: number; business: number; business_pro: number }> = {}

  for (const r of referralStats || []) {
    if (!statsByCode[r.referral_code]) {
      statsByCode[r.referral_code] = { signups: 0, business: 0, business_pro: 0 }
    }
    statsByCode[r.referral_code].signups++
    if (r.status === 'converted') {
      if (r.converted_plan === 'business') statsByCode[r.referral_code].business++
      if (r.converted_plan === 'business_pro') statsByCode[r.referral_code].business_pro++
    }
  }

  const result = (affiliates || []).map((a) => ({
    ...a,
    stats: statsByCode[a.code] || { signups: 0, business: 0, business_pro: 0 },
  }))

  return NextResponse.json({ affiliates: result })
}
