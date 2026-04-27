// app/api/swipe/route.ts
// API endpoint to handle swipe actions (like/dislike)

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/supabase/types'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { targetId, action } = await request.json()

  if (!targetId || !['like', 'dislike'].includes(action)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  // Get current profile & check swipe limit
  const { data: profile } = await supabase
    .from('profiles')
    .select('swipes_today, last_swipe_date, plan')
    .eq('id', session.user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const today = new Date().toISOString().split('T')[0]
  const isNewDay = profile.last_swipe_date !== today
  const currentSwipes = isNewDay ? 0 : (profile.swipes_today || 0)

  if (profile.plan === 'free' && currentSwipes >= 10) {
    return NextResponse.json({ error: 'Swipe limit reached', limitReached: true }, { status: 429 })
  }

  // Update swipe count
  await supabase
    .from('profiles')
    .update({
      swipes_today: currentSwipes + 1,
      last_swipe_date: today,
    })
    .eq('id', session.user.id)

  let isMatch = false

  if (action === 'like') {
    // Record like
    const { error } = await supabase.from('likes').insert({
      liker_id: session.user.id,
      liked_id: targetId,
    })

    if (!error) {
      // Check for mutual like (match detection handled by DB trigger)
      const { data: existingLike } = await supabase
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
