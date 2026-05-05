import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim()
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

if (!stripeSecretKey) throw new Error('STRIPE_SECRET_KEY manquant')
if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL manquant')
if (!supabaseAnonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY manquant')
if (!supabaseServiceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY manquant')

const stripe = new Stripe(stripeSecretKey)

const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

function getBearerToken(req: NextRequest) {
  const header = req.headers.get('authorization') || req.headers.get('Authorization')

  if (!header?.startsWith('Bearer ')) {
    return null
  }

  return header.replace('Bearer ', '').trim()
}

export async function POST(req: NextRequest) {
  try {
    const token = getBearerToken(req)

    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 })
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser(token)

    if (userError || !user?.id) {
      return NextResponse.json({ error: 'Utilisateur non connecté' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
    }

    const customerId = profile.stripe_customer_id as string | null

    if (!customerId) {
      await supabaseAdmin.from('profiles').update({ plan: 'free' } as any).eq('id', user.id)

      return NextResponse.json({
        ok: true,
        message: 'Aucun client Stripe, profil repassé en free',
      })
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    })

    const activeSubscriptions = subscriptions.data.filter((subscription) =>
      ['active', 'trialing', 'past_due', 'unpaid'].includes(subscription.status)
    )

    await Promise.all(
      activeSubscriptions.map((subscription) => stripe.subscriptions.cancel(subscription.id))
    )

    await supabaseAdmin.from('profiles').update({ plan: 'free' } as any).eq('id', user.id)

    return NextResponse.json({
      ok: true,
      canceledCount: activeSubscriptions.length,
    })
  } catch (error) {
    console.error('[stripe/cancel-subscription]', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erreur résiliation',
      },
      { status: 500 }
    )
  }
}