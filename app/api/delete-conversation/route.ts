// app/api/delete-conversation/route.ts
// Deletes a conversation, match, and adds mutual block to prevent re-matching

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

    const { conversationId, otherUserId } = await req.json()
    if (!conversationId || !otherUserId) {
      return NextResponse.json({ error: 'Missing conversationId or otherUserId' }, { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const [user1_id, user2_id] = [user.id, otherUserId].sort()

    // Verify user is authorized to delete this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, user1_id, user2_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Check if current user is a participant in this conversation
    const isParticipant = (conversation.user1_id === user.id || conversation.user2_id === user.id)
    if (!isParticipant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 1. Silent mutual block — prevents re-matching in swipes
    await supabase
      .from('blocked_users')
      .upsert(
        { blocker_id: user.id, blocked_id: otherUserId },
        { onConflict: 'blocker_id,blocked_id' }
      )

    // 2. Delete messages, conversation, match, likes, swipes
    await Promise.all([
      supabase.from('messages').delete().eq('conversation_id', conversationId),
      supabase.from('matches').delete().eq('user1_id', user1_id).eq('user2_id', user2_id),
      supabase.from('likes').delete().or(`and(liker_id.eq.${user.id},liked_id.eq.${otherUserId}),and(liker_id.eq.${otherUserId},liked_id.eq.${user.id})`),
      supabase.from('swipes').delete().or(`and(swiper_id.eq.${user.id},target_id.eq.${otherUserId}),and(swiper_id.eq.${otherUserId},target_id.eq.${user.id})`),
    ])

    // 3. Delete conversation last (after messages)
    await supabase.from('conversations').delete().eq('id', conversationId)

    console.log(`[DELETE_CONV] user ${user.id} deleted conversation with ${otherUserId}`)
    return NextResponse.json({ deleted: true })
  } catch (err) {
    console.error('[DELETE_CONV] error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
