import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim())

type PlanKey = 'business' | 'business_pro'

function getRequiredEnv(key: string) {
  const value = process.env[key]?.trim()

  if (!value) {
    throw new Error(`${key} manquant`)
  }

  return value
}

function getPriceId(plan: PlanKey) {
  if (plan === 'business') {
    return getRequiredEnv('NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS')
  }

  if (plan === 'business_pro') {
    return getRequiredEnv('NEXT_PUBLIC_STRIPE_PRICE_ID_PRO')
  }

  throw new Error('Plan invalide')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const customerId = body?.customerId as string | undefined
    const plan = body?.plan as PlanKey | undefined

    if (!customerId) {
      return NextResponse.json({ error: 'customerId manquant' }, { status: 400 })
    }

    if (plan !== 'business' && plan !== 'business_pro') {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
    }

    const targetPriceId = getPriceId(plan)

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })

    const subscription = subscriptions.data[0]

    if (!subscription) {
      return NextResponse.json({ error: 'Aucun abonnement actif trouvé' }, { status: 404 })
    }

    const subscriptionItem = subscription.items.data[0]

    if (!subscriptionItem) {
      return NextResponse.json({ error: 'Aucun élément d’abonnement trouvé' }, { status: 404 })
    }

    if (subscriptionItem.price.id === targetPriceId) {
      return NextResponse.json({ error: 'Tu as déjà ce plan' }, { status: 400 })
    }

    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      items: [
        {
          id: subscriptionItem.id,
          price: targetPriceId,
        },
      ],
      proration_behavior: 'none',
    })

    return NextResponse.json({
      ok: true,
      subscriptionId: updatedSubscription.id,
    })
  } catch (error) {
    console.error('[stripe/change-plan]', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erreur Stripe',
      },
      { status: 500 }
    )
  }
}