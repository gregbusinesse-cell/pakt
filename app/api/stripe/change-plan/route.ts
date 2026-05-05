import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

type PlanKey = 'business' | 'business_pro'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim())

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PLAN_BY_PRICE_ID: Record<string, PlanKey> = {
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS!.trim()]: 'business',
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO!.trim()]: 'business_pro',
}

const PLAN_RANK: Record<PlanKey, number> = {
  business: 1,
  business_pro: 2,
}

function getBearerToken(req: NextRequest) {
  const header = req.headers.get('authorization')

  if (!header?.startsWith('Bearer ')) {
    return null
  }

  return header.replace('Bearer ', '').trim()
}

function getPeriodEnd(subscription: Stripe.Subscription) {
  const sub = subscription as Stripe.Subscription & { current_period_end?: number }
  const item = subscription.items.data[0] as Stripe.SubscriptionItem & {
    current_period_end?: number
  }

  return sub.current_period_end ?? item.current_period_end
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
    const newPriceId = body?.priceId?.trim()

    if (!newPriceId || !PLAN_BY_PRICE_ID[newPriceId]) {
      return NextResponse.json({ error: 'Price invalide' }, { status: 400 })
    }

    const newPlan = PLAN_BY_PRICE_ID[newPriceId]

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

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    })

    const activeSubscriptions = subscriptions.data.filter((subscription) =>
      ['active', 'trialing', 'past_due', 'unpaid'].includes(subscription.status)
    )

    const subscription = activeSubscriptions[0]

    if (!subscription) {
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
        process.env.NEXT_PUBLIC_APP_URL?.trim() ||
        req.nextUrl.origin

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [
          {
            price: newPriceId,
            quantity: 1,
          },
        ],
        success_url: `${siteUrl}/settings?checkout=success`,
        cancel_url: `${siteUrl}/settings?checkout=cancel`,
        metadata: {
          user_id: user.id,
          plan: newPlan,
          price_id: newPriceId,
        },
        subscription_data: {
          metadata: {
            user_id: user.id,
            plan: newPlan,
            price_id: newPriceId,
          },
        },
        allow_promotion_codes: true,
      })

      return NextResponse.json({
        action: 'checkout',
        url: session.url,
      })
    }

    if (activeSubscriptions.length > 1) {
      const subscriptionsToCancel = activeSubscriptions.slice(1)

      await Promise.all(
        subscriptionsToCancel.map((sub) =>
          stripe.subscriptions.update(sub.id, {
            cancel_at_period_end: true,
          })
        )
      )
    }

    const currentItem = subscription.items.data[0]

    if (!currentItem) {
      return NextResponse.json(
        { error: 'Aucun élément d’abonnement trouvé' },
        { status: 400 }
      )
    }

    const currentPriceId = currentItem.price.id

    if (currentPriceId === newPriceId) {
      return NextResponse.json({ error: 'Tu as déjà ce plan' }, { status: 400 })
    }

    const currentPlan = PLAN_BY_PRICE_ID[currentPriceId]

    if (!currentPlan) {
      return NextResponse.json(
        { error: 'Plan Stripe actuel inconnu' },
        { status: 400 }
      )
    }

    const isUpgrade = PLAN_RANK[newPlan] > PLAN_RANK[currentPlan]
    const periodEnd = getPeriodEnd(subscription)

    if (isUpgrade) {
      const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: false,
        items: [
          {
            id: currentItem.id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'always_invoice',
        metadata: {
          user_id: user.id,
          plan: newPlan,
          price_id: newPriceId,
        },
      })

      await supabaseAdmin
        .from('profiles')
        .update({ plan: newPlan } as any)
        .eq('id', user.id)

      return NextResponse.json({
        action: 'upgraded',
        subscriptionId: updatedSubscription.id,
        plan: newPlan,
      })
    }

    if (!periodEnd) {
      return NextResponse.json(
        { error: 'Date de fin de période introuvable' },
        { status: 500 }
      )
    }

    const schedule = await stripe.subscriptionSchedules.create({
      from_subscription: subscription.id,
    })

    await stripe.subscriptionSchedules.update(schedule.id, {
      end_behavior: 'release',
      phases: [
        {
          start_date: subscription.start_date,
          end_date: periodEnd,
          items: [
            {
              price: currentPriceId,
              quantity: currentItem.quantity || 1,
            },
          ],
        },
        {
          start_date: periodEnd,
          items: [
            {
              price: newPriceId,
              quantity: 1,
            },
          ],
          metadata: {
            user_id: user.id,
            plan: newPlan,
            price_id: newPriceId,
          },
        },
      ],
      metadata: {
        user_id: user.id,
        plan: newPlan,
        price_id: newPriceId,
      },
    })

    return NextResponse.json({
      action: 'downgrade_scheduled',
      scheduleId: schedule.id,
      effectiveAt: periodEnd,
      plan: newPlan,
    })
  } catch (error) {
    console.error('[stripe/change-plan]', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erreur changement de plan',
      },
      { status: 500 }
    )
  }
}