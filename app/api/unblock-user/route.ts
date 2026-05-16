// app/api/unblock-user/route.ts
// Unblocks a user temporarily: restores messaging ability

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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Verify target user exists
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id, first_name')
      .eq('id', targetUserId)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    // 1. Remove block record
    const { error: unblockError } = await supabase
      .from('blocked_users')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', targetUserId)

    if (unblockError) {
      console.error('[UNBLOCK] delete error', unblockError)
      return NextResponse.json({ error: 'Unblock failed' }, { status: 500 })
    }

    // 2. Add system message to conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${user.id})`)
      .maybeSingle()

    if (conversation) {
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        content: `${targetUser.first_name || 'Cette personne'} vous a débloqué.`,
        message_type: 'system',
        is_read: true,
      })
    }

    console.log(`[UNBLOCK] user ${user.id} unblocked ${targetUserId}`)
    return NextResponse.json({ unblocked: true })
  } catch (err) {
    console.error('[UNBLOCK] error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
