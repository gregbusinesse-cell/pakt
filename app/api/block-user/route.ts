// app/api/block-user/route.ts
// Blocks a user: inserts into blocked_users, removes match/conversation/likes

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '').trim()
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: { user }, error: userError } = await authClient.auth.getUser(token)
    if (userError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { targetUserId } = await req.json()
    if (!targetUserId) return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 })
    if (targetUserId === user.id) return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 })

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // 1. Insert block record (upsert to avoid duplicates)
    const { error: blockError } = await supabase
      .from('blocked_users')
      .upsert(
        { blocker_id: user.id, blocked_id: targetUserId },
        { onConflict: 'blocker_id,blocked_id' }
      )

    if (blockError) {
      console.error('[BLOCK] insert error', blockError)
      return NextResponse.json({ error: 'Block failed' }, { status: 500 })
    }

    // 2. Clean up: remove match, likes, swipes, conversation, messages
    const [user1_id, user2_id] = [user.id, targetUserId].sort()

    // Find conversation to delete messages
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(user1_id.eq.${user1_id},user2_id.eq.${user2_id}),and(user1_id.eq.${user2_id},user2_id.eq.${user1_id})`)
      .maybeSingle()

    await Promise.all([
      // Delete match
      supabase.from('matches').delete().eq('user1_id', user1_id).eq('user2_id', user2_id),
      // Delete mutual likes
      supabase.from('likes').delete().or(`and(liker_id.eq.${user.id},liked_id.eq.${targetUserId}),and(liker_id.eq.${targetUserId},liked_id.eq.${user.id})`),
      // Delete mutual swipes
      supabase.from('swipes').delete().or(`and(swiper_id.eq.${user.id},target_id.eq.${targetUserId}),and(swiper_id.eq.${targetUserId},target_id.eq.${user.id})`),
      // Delete messages if conversation exists
      ...(conversation ? [
        supabase.from('messages').delete().eq('conversation_id', conversation.id),
        supabase.from('conversations').delete().eq('id', conversation.id),
      ] : []),
    ])

    console.log(`[BLOCK] user ${user.id} blocked ${targetUserId}`)
    return NextResponse.json({ blocked: true })
  } catch (err) {
    console.error('[BLOCK] error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
