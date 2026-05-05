import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

type PlanKey = 'business' | 'business_pro'

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

function getPriceId(plan: PlanKey) {
  if (plan === 'business') {
    return process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS?.trim()
  }

  if (plan === 'business_pro') {
    return process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO?.trim()
  }

  return null
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

    if (userError || !user?.id || !user.email) {
      return NextResponse.json({ error: 'Utilisateur non connecté' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const plan = body?.plan as PlanKey | undefined

    if (plan !== 'business' && plan !== 'business_pro') {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
    }

    const priceId = getPriceId(plan)

    if (!priceId) {
      return NextResponse.json({ error: 'Price Stripe manquant' }, { status: 500 })
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, plan, stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
    }

    let customerId = profile.stripe_customer_id as string | null

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email || user.email,
        metadata: {
          user_id: user.id,
        },
      })

      customerId = customer.id

      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId } as any)
        .eq('id', user.id)
    }

    const activeSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    })

    const currentSubscription = activeSubscriptions.data.find((subscription) =>
      ['active', 'trialing', 'past_due', 'unpaid'].includes(subscription.status)
    )

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      req.nextUrl.origin

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/settings?checkout=success`,
      cancel_url: `${siteUrl}/settings?checkout=cancel`,
      metadata: {
        user_id: user.id,
        plan,
        price_id: priceId,
        previous_subscription_id: currentSubscription?.id || '',
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan,
          price_id: priceId,
          previous_subscription_id: currentSubscription?.id || '',
        },
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[checkout]', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erreur checkout',
      },
      { status: 500 }
    )
  }
}