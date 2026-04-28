// app/api/swipe/route.ts
// API endpoint to handle swipe actions (like/dislike)

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/supabase/types'

type SwipeProfile = {
  swipes_today: number | null
  last_swipe_date: string | null
  plan: 'free' | 'premium'
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const db = supabase as any

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { targetId, action } = await request.json()

  if (!targetId || !['like', 'dislike'].includes(action)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  const { data: profileData } = await db
    .from('profiles')
    .select('swipes_today, last_swipe_date, plan')
    .eq('id', session.user.id)
    .single()

  const profile = profileData as SwipeProfile | null

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const today = new Date().toISOString().split('T')[0]
  const isNewDay = profile.last_swipe_date !== today
  const currentSwipes = isNewDay ? 0 : profile.swipes_today || 0

  if (profile.plan === 'free' && currentSwipes >= 10) {
    return NextResponse.json({ error: 'Swipe limit reached', limitReached: true }, { status: 429 })
  }

  await db
    .from('profiles')
    .update({
      swipes_today: currentSwipes + 1,
      last_swipe_date: today,
    } as never)
    .eq('id', session.user.id)

  let isMatch = false

  if (action === 'like') {
    const { error } = await db.from('likes').insert({
      liker_id: session.user.id,
      liked_id: targetId,
    })

    if (!error) {
      const { data: existingLike } = await db
        .from('likes')
        .select('id')
        .eq('liker_id', targetId)
        .eq('liked_id', session.user.id)
        .single()

      isMatch = !!existingLike
    }
  }

  return NextResponse.json({
    success: true,
    isMatch,
    swipesUsed: currentSwipes + 1,
  })
}