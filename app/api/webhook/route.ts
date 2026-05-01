import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const FUNDING_INCREMENT_AMOUNT = 5

const handledEvents = new Set([
  'checkout.session.completed',
  'invoice.payment_succeeded',
])

async function claimStripeEvent(event: Stripe.Event) {
  const { error } = await supabase.from('stripe_webhook_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
    status: 'processing',
  })

  if (!error) {
    return true
  }

  if (error.code !== '23505') {
    throw error
  }

  const { data: existingEvent, error: selectError } = await supabase
    .from('stripe_webhook_events')
    .select('status')
    .eq('stripe_event_id', event.id)
    .single()

  if (selectError) {
    throw selectError
  }

  if (existingEvent?.status === 'failed') {
    const { error: updateError } = await supabase
      .from('stripe_webhook_events')
      .update({
        status: 'processing',
        error_message: null,
      })
      .eq('stripe_event_id', event.id)

    if (updateError) {
      throw updateError
    }

    return true
  }

  return false
}

async function markStripeEventProcessed(eventId: string) {
  const { error } = await supabase
    .from('stripe_webhook_events')
    .update({
      status: 'processed',
      processed_at: new Date().toISOString(),
      error_message: null,
    })
    .eq('stripe_event_id', eventId)

  if (error) {
    throw error
  }
}

async function markStripeEventFailed(eventId: string, errorMessage: string) {
  await supabase
    .from('stripe_webhook_events')
    .update({
      status: 'failed',
      error_message: errorMessage,
    })
    .eq('stripe_event_id', eventId)
}

async function updateUserPlan(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ plan: 'business' })
    .eq('id', userId)

  if (error) {
    throw error
  }
}

async function incrementFunding() {
  const { error } = await supabase.rpc('increment_funding', {
    amount: FUNDING_INCREMENT_AMOUNT,
  })

  if (error) {
    throw error
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id

  if (!userId) {
    throw new Error('Missing user_id in checkout.session.completed metadata')
  }

  if (session.mode !== 'subscription') {
    return
  }

  if (session.payment_status && session.payment_status !== 'paid') {
    return
  }

  await updateUserPlan(userId)
  await incrementFunding()
}

async function getUserIdFromInvoice(invoice: Stripe.Invoice) {
  const invoiceWithLegacyFields = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null
    subscription_details?: {
      metadata?: Stripe.Metadata | null
    } | null
    parent?: {
      subscription_details?: {
        metadata?: Stripe.Metadata | null
        subscription?: string | Stripe.Subscription | null
      } | null
    } | null
  }

  const directUserId =
    invoice.metadata?.user_id ||
    invoiceWithLegacyFields.subscription_details?.metadata?.user_id ||
    invoiceWithLegacyFields.parent?.subscription_details?.metadata?.user_id

  if (directUserId) {
    return directUserId
  }

  const subscription =
    invoiceWithLegacyFields.subscription ||
    invoiceWithLegacyFields.parent?.subscription_details?.subscription

  const subscriptionId =
    typeof subscription === 'string' ? subscription : subscription?.id

  if (!subscriptionId) {
    return null
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)

  return stripeSubscription.metadata?.user_id || null
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (invoice.billing_reason !== 'subscription_cycle') {
    return
  }

  const userId = await getUserIdFromInvoice(invoice)

  if (!userId) {
    throw new Error('Missing user_id for invoice.payment_succeeded')
  }

  await updateUserPlan(userId)
  await incrementFunding()
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing Stripe signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Stripe webhook signature error:', error)

    return NextResponse.json(
      { error: 'Invalid Stripe signature' },
      { status: 400 }
    )
  }

  if (!handledEvents.has(event.type)) {
    return NextResponse.json({ received: true })
  }

  try {
    const shouldProcessEvent = await claimStripeEvent(event)

    if (!shouldProcessEvent) {
      return NextResponse.json({
        received: true,
        duplicate: true,
      })
    }

    if (event.type === 'checkout.session.completed') {
      await handleCheckoutSessionCompleted(
        event.data.object as Stripe.Checkout.Session
      )
    }

    if (event.type === 'invoice.payment_succeeded') {
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
    }

    await markStripeEventProcessed(event.id)

    return NextResponse.json({ received: true })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown webhook error'

    console.error('Stripe webhook processing error:', error)
    await markStripeEventFailed(event.id, errorMessage)

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}