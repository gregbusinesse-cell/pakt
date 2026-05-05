import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim())

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const customerId = body?.customerId as string | undefined

    if (!customerId) {
      return NextResponse.json({ error: 'customerId manquant' }, { status: 400 })
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })

    const subscription = subscriptions.data[0]

    if (!subscription) {
      return NextResponse.json({ error: 'Aucun abonnement actif trouvé' }, { status: 404 })
    }

    const canceledSubscription = await stripe.subscriptions.cancel(subscription.id)

    return NextResponse.json({
      ok: true,
      subscriptionId: canceledSubscription.id,
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