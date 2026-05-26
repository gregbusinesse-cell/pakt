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
      `Salut ! J'ai pris le plan Business sur PAKT et j'aimerais vraiment discuter avec toi. C'est incroyable, tu devrais le prendre aussi ! On va pouvoir faire de grandes choses ensemble. 🚀`,
      `Hey ! J'ai activé le plan Business et je pense sincèrement qu'on pourrait collaborer sur quelque chose de folie. Prends Business toi aussi, tu ne regretteras pas !`,
      `${senderName} ici ! J'ai investi dans le plan Business parce que j'ai vu du potentiel chez toi. Fais le même pas, on va créer quelque chose d'exceptionnel ensemble !`,
      `Yo ! Le plan Business, c'est un game changer. Je l'ai pris et maintenant je veux te le partager. Rejoins-moi, on va se lancer dans un projet incroyable 💪`,
      `Salut ! J'ai activé Business pour vraiment progresser sur PAKT. Tu as un profil intéressant, on devrait discuter. Prends Business et on y va !`,
      `${senderName} t'écrit ! Business, c'est THE choice pour les gens sérieux. J'y suis passé et ça change tout. Toi aussi, fais ce mouvement, nos idées ensemble ça va être dingue ! 🔥`,
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
