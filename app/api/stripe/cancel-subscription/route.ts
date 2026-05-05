import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim())

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getBearerToken(req: NextRequest) {
  const header = req.headers.get('authorization')

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
      return NextResponse.json({ error: 'Client Stripe introuvable' }, { status: 400 })
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    })

    const activeSubscriptions = subscriptions.data.filter((subscription) =>
      ['active', 'trialing', 'past_due', 'unpaid'].includes(subscription.status)
    )

    if (activeSubscriptions.length === 0) {
      return NextResponse.json({ error: 'Aucun abonnement actif trouvé' }, { status: 404 })
    }

    await Promise.all(
      activeSubscriptions.map((subscription) =>
        stripe.subscriptions.update(subscription.id, {
          cancel_at_period_end: true,
        })
      )
    )

    return NextResponse.json({
      ok: true,
      canceledAtPeriodEnd: true,
      count: activeSubscriptions.length,
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