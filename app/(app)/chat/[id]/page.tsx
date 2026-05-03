'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ChatView from '@/components/chat/ChatView'
import type { Profile } from '@/lib/supabase/types'
import { useAppStore } from '@/lib/store'

function ChatPageContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { refreshNotifications } = useAppStore()

  const userId = searchParams.get('userId')
  const conversationType = (searchParams.get('type') || 'match') as 'match' | 'direct'

  const [session, setSession] = useState<any>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [otherUser, setOtherUser] = useState<Profile | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const sessionUserId = session?.user?.id

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

  useEffect(() => {
    if (!sessionUserId || !userId) return

    const initConversation = async () => {
      if (params.id === 'new') {
        const { data, error } = await supabase.rpc('get_or_create_conversation', {
          other_user_id: userId,
        })

        if (error || !data) return
        setConversationId(data as string)
        return
      }

      setConversationId(params.id as string)
    }

    initConversation()
  }, [params.id, sessionUserId, userId, supabase])

  useEffect(() => {
    if (!userId) return

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data }) => setOtherUser(data))
  }, [supabase, userId])

  useEffect(() => {
    if (!conversationId || !sessionUserId) return

    const markAsRead = async () => {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true } as never)
        .eq('conversation_id', conversationId)
        .neq('sender_id', sessionUserId)
        .eq('is_read', false)

      if (!error) refreshNotifications()
    }

    markAsRead()
  }, [conversationId, sessionUserId, supabase, refreshNotifications])

  if (sessionLoading || !otherUser || !conversationId) {
    return (
      <div className="h-full flex items-center justify-center bg-dark">
        <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <ChatView
      conversationId={conversationId}
      conversationType={conversationType}
      otherUser={otherUser}
    />
  )
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center bg-dark">
          <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  )
}