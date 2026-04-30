'use client'

// app/(app)/chat/[id]/page.tsx

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ChatView from '@/components/chat/ChatView'
import type { Profile } from '@/lib/supabase/types'

export default function ChatPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  // ✅ METTRE AVANT LES useEffect
  const userId = searchParams.get('userId')
  const conversationType = (searchParams.get('type') || 'match') as 'match' | 'direct'

  const [session, setSession] = useState<any>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [otherUser, setOtherUser] = useState<Profile | null>(null)

  const sessionUserId = session?.user?.id

  // ✅ conversationId en state
  const [conversationId, setConversationId] = useState<string | null>(null)

  // ✅ INIT CONVERSATION (FIX PRINCIPAL)
  useEffect(() => {
    if (!sessionUserId || !userId) return

    const initConversation = async () => {
      if (params.id === 'new' && userId) {
        const { data, error } = await supabase.rpc('get_or_create_conversation', {
          other_user_id: userId,
        })

        if (error) {
          console.error('[CHAT] create conversation error', error)
          return
        }

        setConversationId(data)
      } else {
        setConversationId(params.id as string)
      }
    }

    initConversation()
  }, [params.id, sessionUserId, userId, supabase])

  // SESSION
  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return

      if (!data.session) {
        router.replace('/auth')
        return
      }

      setSession(data.session)
      setSessionLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!nextSession) {
        router.replace('/auth')
        return
      }

      setSession(nextSession)
      setSessionLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router, supabase])

  // LOAD OTHER USER
  useEffect(() => {
    if (!userId) {
      console.error('[CHAT] userId manquant')
      return
    }

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data }) => setOtherUser(data))
  }, [supabase, userId])

  // MARK MESSAGES AS READ
  useEffect(() => {
    if (!conversationId || !sessionUserId) return

    void supabase
      .from('messages')
      .update({ is_read: true } as never)
      .eq('conversation_id', conversationId)
      .neq('sender_id', sessionUserId)
      .eq('is_read', false)
  }, [conversationId, sessionUserId, supabase])

  // LOADING
  if (sessionLoading || !otherUser || !conversationId) {
    return (
      <div className="h-full flex items-center justify-center bg-dark">
        <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
      </div>
    )
  }

  // UI
  return (
    <ChatView
      conversationId={conversationId}
      conversationType={conversationType}
      otherUser={otherUser}
    />
  )
}