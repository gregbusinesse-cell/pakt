// app/api/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
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

  // 🎯 PAIEMENT RÉUSSI
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const userId = session.metadata?.user_id

    if (!userId) {
      console.error('❌ user_id manquant dans metadata')
      return NextResponse.json({ error: 'No user_id' }, { status: 400 })
    }

    // 🔥 UPDATE PLAN
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ plan: 'business' }) // ⚠️ mets "business" pas premium
      .eq('id', userId)

    if (updateError) {
      console.error('❌ update error:', updateError)
    }

    // 🔥 AJOUT CAGNOTTE
    const { error: fundingError } = await supabase.rpc('increment_funding', {
      amount: 5,
    })

    if (fundingError) {
      console.error('❌ funding error:', fundingError)
    }
  }

  return NextResponse.json({ received: true })
}