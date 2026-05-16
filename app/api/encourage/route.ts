import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getBearerToken(req: NextRequest) {
  const header = req.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  return header.replace('Bearer ', '').trim()
}

const COOLDOWN_HOURS = 24

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

    if (userError || !user?.id) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const conversationId = body?.conversationId?.trim()
    const otherUserId = body?.otherUserId?.trim()

    if (!conversationId || !otherUserId) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    // Verify sender is participant of this conversation
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, user1_id, user2_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 })
    }

    const isParticipant = conversation.user1_id === user.id || conversation.user2_id === user.id
    if (!isParticipant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Verify sender is paid
    const { data: senderProfile } = await supabaseAdmin
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    const senderPlan = senderProfile?.plan
    if (!senderPlan || senderPlan === 'free') {
      return NextResponse.json(
        { error: 'Réservé aux membres Business' },
        { status: 403 }
      )
    }

    // Verify target is free
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('plan, first_name')
      .eq('id', otherUserId)
      .single()

    if (!targetProfile || targetProfile.plan !== 'free') {
      return NextResponse.json(
        { error: 'Cette personne a déjà un abonnement' },
        { status: 400 }
      )
    }

    // Check 24h cooldown per conversation
    const cooldownTime = new Date(
      Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000
    ).toISOString()

    const { data: recentEncouragement } = await supabaseAdmin
      .from('encouragements')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('sender_id', user.id)
      .gte('created_at', cooldownTime)
      .limit(1)
      .maybeSingle()

    if (recentEncouragement) {
      return NextResponse.json(
        { error: 'Encouragement déjà envoyé dans les dernières 24h' },
        { status: 429 }
      )
    }

    // Record encouragement
    await supabaseAdmin.from('encouragements').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      target_id: otherUserId,
    } as never)

    // Send premium encourage message with random variant
    const { data: senderData } = await supabaseAdmin
      .from('profiles')
      .select('first_name')
      .eq('id', user.id)
      .single()

    const senderName = senderData?.first_name || 'Un membre Business'

    const encourageVariants = [
      `${senderName} aimerait échanger avec toi sur un projet. Passe Business pour débloquer cette conversation.`,
      `${senderName} pense que vos profils sont complémentaires et souhaite te contacter. Débloque tes messages avec PAKT Business.`,
      `${senderName} a repéré ton profil et veut construire quelque chose avec toi. Passe Business pour commencer à discuter.`,
      `${senderName} attend de pouvoir collaborer avec toi. Rejoins PAKT Business pour débloquer cette opportunité.`,
      `${senderName} souhaite te proposer une opportunité. Passe Business pour accéder à cette conversation.`,
      `${senderName} a vu ton potentiel et veut en discuter. Débloque tes conversations avec PAKT Business.`,
    ]

    const message = encourageVariants[Math.floor(Math.random() * encourageVariants.length)]

    await supabaseAdmin.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: message,
      message_type: 'text',
      is_read: false,
    } as never)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[encourage]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}
