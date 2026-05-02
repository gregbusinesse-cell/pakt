import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export const runtime = 'nodejs'

type DeleteTokenPayload = {
  userId: string
  email: string
  expiresAt: number
  signature: string
}

function verifyDeleteToken(token: string): DeleteTokenPayload {
  const decoded = Buffer.from(token, 'base64url').toString('utf8')
  const payload = JSON.parse(decoded) as DeleteTokenPayload

  if (!payload.userId || !payload.email || !payload.expiresAt || !payload.signature) {
    throw new Error('Token invalide')
  }

  if (Date.now() > payload.expiresAt) {
    throw new Error('Lien expiré')
  }

  const rawPayload = `${payload.userId}.${payload.email}.${payload.expiresAt}`
  const expectedSignature = crypto
    .createHmac('sha256', process.env.DELETE_ACCOUNT_SECRET!)
    .update(rawPayload)
    .digest('hex')

  const validSignature = crypto.timingSafeEqual(
    Buffer.from(payload.signature),
    Buffer.from(expectedSignature)
  )

  if (!validSignature) {
    throw new Error('Signature invalide')
  }

  return payload
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 400 })
    }

    const payload = verifyDeleteToken(token)

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    await supabaseAdmin.from('profiles').delete().eq('id', payload.userId)
    await supabaseAdmin.from('swipes').delete().or(`swiper_id.eq.${payload.userId},target_id.eq.${payload.userId}`)
    await supabaseAdmin.from('likes').delete().or(`liker_id.eq.${payload.userId},liked_id.eq.${payload.userId}`)
    await supabaseAdmin.from('matches').delete().or(`user1_id.eq.${payload.userId},user2_id.eq.${payload.userId}`)
    await supabaseAdmin.from('messages').delete().eq('sender_id', payload.userId)

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(payload.userId)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Final delete user error:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}