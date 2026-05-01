// app/api/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

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
    console.error('❌ Webhook signature error:', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }

  // ✅ PAIEMENT INITIAL
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const userId = session.metadata?.user_id

    if (!userId) {
      console.error('❌ user_id manquant')
      return NextResponse.json({ error: 'No user_id' }, { status: 400 })
    }

    console.log('🔥 paiement initial détecté')

    await supabase
      .from('profiles')
      .update({ plan: 'business' })
      .eq('id', userId)

    await supabase.rpc('increment_funding', { amount: 5 })
  }

  // ✅ RENOUVELLEMENT (mensuel)
  if (event.type === 'invoice.payment_succeeded') {
    console.log('🔥 renouvellement abonnement')

    const { data, error } = await supabase.rpc('increment_funding', {
  amount: 5,
})

console.log('RPC RESULT:', data)
console.log('RPC ERROR:', error)
  }

  return NextResponse.json({ received: true })
}