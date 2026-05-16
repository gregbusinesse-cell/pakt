import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function jsonError(message: string, status: number, details?: unknown) {
  console.error('[API_MATCHES]', message, details ?? '')
  return NextResponse.json({ error: message, details }, { status })
}

function sortPair(userA: string, userB: string) {
  return [userA, userB].sort() as [string, string]
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '').trim()

  if (!token) {
    return jsonError('Token manquant', 401)
  }

  const body = await req.json().catch((error) => {
    console.error('[API_MATCHES] invalid JSON body', error)
    return null
  })

  const otherUserId = typeof body?.otherUserId === 'string' ? body.otherUserId : null

  if (!otherUserId) {
    return jsonError('otherUserId manquant', 400, body)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonError('Variables Supabase manquantes', 500, {
      hasSupabaseUrl: Boolean(supabaseUrl),
      hasAnonKey: Boolean(anonKey),
      hasServiceRoleKey: Boolean(serviceRoleKey),
    })
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(token)

  if (userError || !user) {
    return jsonError('Utilisateur non autorisé', 401, userError)
  }

  if (user.id === otherUserId) {
    return jsonError('Match avec soi-même interdit', 400, { userId: user.id, otherUserId })
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const [user1_id, user2_id] = sortPair(user.id, otherUserId)

  const [
    { data: myLike, error: myLikeError },
    { data: reverseLike, error: reverseLikeError },
  ] = await Promise.all([
    supabaseAdmin
      .from('likes')
      .select('id')
      .eq('liker_id', user.id)
      .eq('liked_id', otherUserId)
      .maybeSingle(),
    supabaseAdmin
      .from('likes')
      .select('id')
      .eq('liker_id', otherUserId)
      .eq('liked_id', user.id)
      .maybeSingle(),
  ])

  if (myLikeError) {
    return jsonError('Erreur lecture like courant', 500, myLikeError)
  }

  if (reverseLikeError) {
    return jsonError('Erreur lecture like inverse', 500, reverseLikeError)
  }

  if (!myLike || !reverseLike) {
    console.error('[API_MATCHES] mutual like absent', {
      userId: user.id,
      otherUserId,
      hasMyLike: Boolean(myLike),
      hasReverseLike: Boolean(reverseLike),
    })

    return NextResponse.json({
      matched: false,
      reason: 'mutual_like_absent',
      hasMyLike: Boolean(myLike),
      hasReverseLike: Boolean(reverseLike),
    })
  }

  const { data: existingMatch, error: existingMatchError } = await supabaseAdmin
    .from('matches')
    .select('id, user1_id, user2_id, created_at, is_viewed')
    .eq('user1_id', user1_id)
    .eq('user2_id', user2_id)
    .maybeSingle()

  if (existingMatchError) {
    return jsonError('Erreur lecture match existant', 500, existingMatchError)
  }

  if (existingMatch) {
    return NextResponse.json({
      matched: true,
      match: existingMatch,
      created: false,
    })
  }

  const newMatchId = crypto.randomUUID()

  const { data: insertedMatch, error: insertMatchError } = await supabaseAdmin
    .from('matches')
    .insert({
      id: newMatchId,
      user1_id,
      user2_id,
      is_viewed: false,
    })
    .select('id, user1_id, user2_id, created_at, is_viewed')
    .single()

  if (insertMatchError) {
    return jsonError('Erreur insert match', 500, {
      insertMatchError,
      attemptedMatch: { id: newMatchId, user1_id, user2_id, is_viewed: false },
    })
  }

  console.log('[API_MATCHES] match persisted', {
    matchId: insertedMatch.id,
    user1_id,
    user2_id,
  })

  // ── Fire-and-forget: send match emails to both users ──────
  // Completely isolated — never blocks or affects the match response
  try {
    const { sendEmail, getUnsubscribeUrl, shouldSendEmail, matchEmail } = await import('@/lib/emails')

    const sendMatchEmail = async (recipientId: string) => {
      try {
        const check = await shouldSendEmail(recipientId, 'match')
        if (!check.allowed) return

        const { data: recipient } = await supabaseAdmin
          .from('profiles')
          .select('email, first_name')
          .eq('id', recipientId)
          .single()

        if (!recipient?.email) return

        const tpl = matchEmail(recipient.first_name || 'Membre', getUnsubscribeUrl(recipientId))
        await sendEmail({
          userId: recipientId,
          to: recipient.email,
          subject: tpl.subject,
          htmlContent: tpl.html,
          type: 'match',
        })
        console.log(`[API_MATCHES] match email sent to ${recipientId}`)
      } catch (e) {
        console.error(`[API_MATCHES] match email failed for ${recipientId}`, e)
      }
    }

    // Don't await — fire and forget
    Promise.all([sendMatchEmail(user.id), sendMatchEmail(otherUserId)]).catch(() => {})
  } catch (emailImportErr) {
    console.error('[API_MATCHES] email import failed (non-blocking)', emailImportErr)
  }

  return NextResponse.json({
    matched: true,
    match: insertedMatch,
    created: true,
  })
}