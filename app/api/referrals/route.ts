import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

  if (error || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Get user referral code
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('referral_code')
    .eq('id', user.id)
    .single()

  if (!profile?.referral_code) {
    return NextResponse.json({ referralCode: null, validatedCount: 0, claimedTiers: [] })
  }

  // Count validated referrals (onboarded + email confirmed)
  const { count } = await supabaseAdmin
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referral_code', profile.referral_code)
    .eq('status', 'validated')

  // Get claimed reward tiers
  const { data: rewards } = await supabaseAdmin
    .from('referral_rewards')
    .select('tier')
    .eq('user_id', user.id)

  return NextResponse.json({
    referralCode: profile.referral_code,
    validatedCount: count || 0,
    claimedTiers: (rewards || []).map((r: any) => r.tier),
  })
}

// Claim a reward tier
export async function POST(req: NextRequest) {
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

  if (error || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const tier = body?.tier as number

  const TIERS: Record<number, { plan: string; days: number }> = {
    3: { plan: 'business', days: 7 },
    5: { plan: 'business', days: 30 },
    10: { plan: 'business_pro', days: 30 },
    25: { plan: 'business_pro', days: 90 },
    50: { plan: 'business_pro', days: 180 },
  }

  if (!TIERS[tier]) {
    return NextResponse.json({ error: 'Palier invalide' }, { status: 400 })
  }

  // Check if already claimed
  const { data: existing } = await supabaseAdmin
    .from('referral_rewards')
    .select('id')
    .eq('user_id', user.id)
    .eq('tier', tier)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Déjà réclamé' }, { status: 409 })
  }

  // Verify user has enough referrals
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('referral_code')
    .eq('id', user.id)
    .single()

  if (!profile?.referral_code) {
    return NextResponse.json({ error: 'Code parrainage introuvable' }, { status: 400 })
  }

  const { count } = await supabaseAdmin
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referral_code', profile.referral_code)
    .eq('status', 'validated')

  if ((count || 0) < tier) {
    return NextResponse.json({ error: 'Pas assez de parrainages' }, { status: 403 })
  }

  // Record reward claim
  const reward = TIERS[tier]
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + reward.days)

  await supabaseAdmin.from('referral_rewards').insert({
    user_id: user.id,
    tier,
    reward_plan: reward.plan,
    reward_days: reward.days,
    expires_at: expiresAt.toISOString(),
  })

  // Apply plan upgrade
  await supabaseAdmin
    .from('profiles')
    .update({ plan: reward.plan })
    .eq('id', user.id)

  return NextResponse.json({ success: true, plan: reward.plan, days: reward.days })
}
