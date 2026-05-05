import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim()

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY manquant')
}

const stripe = new Stripe(stripeSecretKey)

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Utilisateur non connecté' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
    }

    const customerId = profile.stripe_customer_id

    if (!customerId) {
      return NextResponse.json({ error: 'Client Stripe introuvable' }, { status: 400 })
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    })

    const subscription = subscriptions.data.find((sub) =>
      ['active', 'trialing', 'past_due', 'unpaid'].includes(sub.status)
    )

    if (!subscription) {
      return NextResponse.json({ error: 'Aucun abonnement actif trouvé' }, { status: 404 })
    }

    if (subscription.cancel_at_period_end) {
      return NextResponse.json({
        ok: true,
        subscriptionId: subscription.id,
        cancelAtPeriodEnd: true,
      })
    }

    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    })

    return NextResponse.json({
      ok: true,
      subscriptionId: updatedSubscription.id,
      cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
    })
  } catch (error) {
    console.error('[stripe/cancel-subscription]', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erreur Stripe',
      },
      { status: 500 }
    )
  }
}