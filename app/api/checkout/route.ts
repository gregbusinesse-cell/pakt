import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export async function POST() {
  try {
    // 🔐 récupérer user connecté
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies,
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'User non connecté' }, { status: 401 })
    }

    // ⚠️ vérifs env
    if (!process.env.STRIPE_PRICE_ID) {
      return NextResponse.json({ error: 'PRICE_ID manquant' }, { status: 500 })
    }

    if (!process.env.NEXT_PUBLIC_URL) {
      return NextResponse.json({ error: 'URL manquante' }, { status: 500 })
    }

    // 🚀 création session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],

      // 🔥 LE POINT CRUCIAL
      metadata: {
        user_id: user.id,
      },

      success_url: `${process.env.NEXT_PUBLIC_URL}/settings?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/settings?canceled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur Stripe' },
      { status: 500 }
    )
  }
}