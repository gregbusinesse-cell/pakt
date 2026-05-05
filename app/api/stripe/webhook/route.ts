import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return new NextResponse('Webhook error', { status: 400 })
  }

  // 🔥 PAYMENT OK
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const customerId = session.customer as string
    const email = session.customer_details?.email

    if (!email) return NextResponse.json({ ok: true })

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (!profile) return NextResponse.json({ ok: true })

    const priceId = session?.metadata?.price_id

    let plan = 'free'

    if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS) {
      plan = 'business'
    }

    if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO) {
      plan = 'business_pro'
    }

    await supabase
      .from('profiles')
      .update({
        plan,
        stripe_customer_id: customerId,
      })
      .eq('id', profile.id)
  }

  // 🔥 UPDATE (upgrade / downgrade)
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription

    const customerId = subscription.customer as string
    const priceId = subscription.items.data[0]?.price.id

    let plan = 'free'

    if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS) {
      plan = 'business'
    }

    if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO) {
      plan = 'business_pro'
    }

    await supabase
      .from('profiles')
      .update({ plan })
      .eq('stripe_customer_id', customerId)
  }

  // 🔥 ANNULATION
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription

    const customerId = subscription.customer as string

    await supabase
      .from('profiles')
      .update({
        plan: 'free',
      })
      .eq('stripe_customer_id', customerId)
  }

  return NextResponse.json({ received: true })
}