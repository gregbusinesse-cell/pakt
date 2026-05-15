// app/api/swipe/route.ts
// API endpoint to handle swipe actions (like/dislike)

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendEmail, getUnsubscribeUrl, shouldSendEmail, likeEmail, matchEmail } from '@/lib/emails'

type SwipeAction = 'like' | 'dislike'

function jsonError(message: string, status: number, details?: unknown) {
  console.error('[API_SWIPE]', message, details ?? '')
  return NextResponse.json({ error: message, details }, { status })
}

function sortPair(userA: string, userB: string) {
  return [userA, userB].sort() as [string, string]
}

async function persistMatch({
  userId,
  targetId,
  supabaseAdmin,
}: {
  userId: string
  targetId: string
  supabaseAdmin: any
}) {
  const [user1_id, user2_id] = sortPair(userId, targetId)

  const [
    { data: myLike, error: myLikeError },
    { data: reverseLike, error: reverseLikeError },
  ] = await Promise.all([
    supabaseAdmin
      .from('likes')
      .select('id')
      .eq('liker_id', userId)
      .eq('liked_id', targetId)
      .maybeSingle(),
    supabaseAdmin
      .from('likes')
      .select('id')
      .eq('liker_id', targetId)
      .eq('liked_id', userId)
      .maybeSingle(),
  ])

  if (myLikeError) {
    console.error('[API_SWIPE] myLike select error', myLikeError)
    throw myLikeError
  }

  if (reverseLikeError) {
    console.error('[API_SWIPE] reverseLike select error', reverseLikeError)
    throw reverseLikeError
  }

  if (!myLike || !reverseLike) {
    console.error('[API_SWIPE] mutual like absent', {
      userId,
      targetId,
      hasMyLike: Boolean(myLike),
      hasReverseLike: Boolean(reverseLike),
    })

    return null
  }

  const { data: existingMatch, error: existingMatchError } = await supabaseAdmin
    .from('matches')
    .select('id, user1_id, user2_id, created_at, is_viewed')
    .eq('user1_id', user1_id)
    .eq('user2_id', user2_id)
    .maybeSingle()

  if (existingMatchError) {
    console.error('[API_SWIPE] existing match select error', existingMatchError)
    throw existingMatchError
  }

  if (existingMatch) {
    return existingMatch
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
    console.error('[API_SWIPE] match insert error', {
      insertMatchError,
      attemptedMatch: {
        id: newMatchId,
        user1_id,
        user2_id,
        is_viewed: false,
      },
    })
    throw insertMatchError
  }

  console.error('[API_SWIPE] match persisted', {
    matchId: insertedMatch.id,
    user1_id,
    user2_id,
  })

  return insertedMatch
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '').trim()

  if (!token) {
    return jsonError('Token manquant', 401)
  }

  const body = await request.json().catch((error) => {
    console.error('[API_SWIPE] invalid JSON body', error)
    return null
  })

  const targetId = typeof body?.targetId === 'string' ? body.targetId : null
  const action = body?.action as SwipeAction | undefined

  if (!targetId || !action || !['like', 'dislike'].includes(action)) {
    return jsonError('Paramètres invalides', 400, body)
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

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
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

  if (user.id === targetId) {
    return jsonError('Swipe sur soi-même interdit', 400, { userId: user.id, targetId })
  }

  const today = new Date().toISOString().split('T')[0]

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, swipes_today, last_swipe_date, plan')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return jsonError('Erreur lecture profil', 500, profileError)
  }

  if (!profile) {
    return jsonError('Profil introuvable', 404, { userId: user.id })
  }

  const isNewDay = profile.last_swipe_date !== today
  const currentSwipes = isNewDay ? 0 : profile.swipes_today || 0

  const { error: profileUpdateError } = await supabaseAdmin
    .from('profiles')
    .update({
      swipes_today: currentSwipes + 1,
      last_swipe_date: today,
    })
    .eq('id', user.id)

  if (profileUpdateError) {
    console.error('[API_SWIPE] profile swipe counter update error', profileUpdateError)
  }

  const { error: swipeError } = await supabaseAdmin.from('swipes').upsert(
    {
      swiper_id: user.id,
      target_id: targetId,
      action,
    },
    {
      onConflict: 'swiper_id,target_id',
    }
  )

  if (swipeError) {
    return jsonError('Erreur enregistrement swipe', 500, swipeError)
  }

  let match = null

  if (action === 'like') {
    const { error: likeError } = await supabaseAdmin.from('likes').upsert(
      {
        liker_id: user.id,
        liked_id: targetId,
        is_viewed: false,
      },
      {
        onConflict: 'liker_id,liked_id',
      }
    )

    if (likeError) {
      return jsonError('Erreur enregistrement like', 500, likeError)
    }

    try {
      match = await persistMatch({
        userId: user.id,
        targetId,
        supabaseAdmin,
      })
    } catch (error) {
      return jsonError('Erreur persistance match', 500, error)
    }
  }

  // ── Fire-and-forget email notifications ────────────────────────
  // Non-blocking: don't delay the swipe response
  if (action === 'like') {
    const triggerEmails = async () => {
      try {
        if (match) {
          // Match email to BOTH users
          for (const recipientId of [user.id, targetId]) {
            const check = await shouldSendEmail(recipientId, 'match')
            if (!check.allowed) continue

            const { data: recipient } = await supabaseAdmin
              .from('profiles')
              .select('email, first_name')
              .eq('id', recipientId)
              .single()

            if (!recipient?.email) continue

            const tpl = matchEmail(recipient.first_name || 'Membre', getUnsubscribeUrl(recipientId))
            await sendEmail({
              userId: recipientId,
              to: recipient.email,
              subject: tpl.subject,
              htmlContent: tpl.html,
              type: 'match',
            })
          }
        } else {
          // Like email to the liked user
          const check = await shouldSendEmail(targetId, 'like')
          if (check.allowed) {
            const { data: liked } = await supabaseAdmin
              .from('profiles')
              .select('email, first_name')
              .eq('id', targetId)
              .single()

            if (liked?.email) {
              const tpl = likeEmail(liked.first_name || 'Membre', getUnsubscribeUrl(targetId))
              await sendEmail({
                userId: targetId,
                to: liked.email,
                subject: tpl.subject,
                htmlContent: tpl.html,
                type: 'like',
              })
            }
          }
        }
      } catch (emailErr) {
        console.error('[API_SWIPE] email notification error (non-blocking)', emailErr)
      }
    }

    // Fire and forget — don't await
    triggerEmails()
  }

  return NextResponse.json({
    success: true,
    isMatch: Boolean(match),
    match,
    swipesUsed: currentSwipes + 1,
  })
}