'use client'

// app/(app)/chat/[id]/page.tsx

import { Suspense, useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ChatView from '@/components/chat/ChatView'
import type { Profile } from '@/lib/supabase/types'
import { useAppStore } from '@/lib/store'

function ChatPageContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const db = supabase as any
  const { refreshNotifications } = useAppStore()

  const userId = searchParams.get('userId')
  const requestedConversationType = (searchParams.get('type') || 'match') as 'match' | 'direct'

  const [session, setSession] = useState<any>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [otherUser, setOtherUser] = useState<Profile | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversationType, setConversationType] = useState<'match' | 'direct'>(
    requestedConversationType
  )
  const [initError, setInitError] = useState<string | null>(null)

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

  // Load other user profile
  useEffect(() => {
    if (!userId) {
      setInitError('Utilisateur introuvable')
      return
    }

    db
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data, error }: { data: Profile | null; error: any }) => {
        if (error || !data) {
          console.error('[CHAT] profile fetch error', error)
          setInitError('Profil introuvable')
          return
        }
        setOtherUser(data)
      })
  }, [db, userId])

  // Init or load conversation
  useEffect(() => {
    if (!sessionUserId || !userId) return

    const initConversation = async () => {
      try {
        if (params.id === 'new') {
          const { data, error } = await db.rpc('get_or_create_conversation', {
            other_user_id: userId,
          })

          if (error) {
            console.error('[CHAT] get_or_create_conversation RPC error', error)
            setInitError(`Impossible de créer la conversation : ${error.message}`)
            return
          }

          if (!data) {
            console.error('[CHAT] get_or_create_conversation returned null')
            setInitError('Impossible de créer la conversation')
            return
          }

          setConversationId(data as string)
        } else {
          setConversationId(params.id as string)
        }

        const [user1_id, user2_id] = [sessionUserId, userId].sort()

        const { data: matchData } = await db
          .from('matches')
          .select('id')
          .eq('user1_id', user1_id)
          .eq('user2_id', user2_id)
          .maybeSingle()

        setConversationType(matchData ? 'match' : requestedConversationType)
      } catch (err) {
        console.error('[CHAT] initConversation catch', err)
        setInitError('Erreur lors de l\'ouverture du chat')
      }
    }

    initConversation()
  }, [db, params.id, requestedConversationType, sessionUserId, userId])

  // Mark messages as read
  useEffect(() => {
    if (!conversationId || !sessionUserId) return

    const markAsRead = async () => {
      const { error } = await db
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', sessionUserId)
        .eq('is_read', false)

      if (!error) refreshNotifications()
    }

    markAsRead()
  }, [conversationId, db, sessionUserId, refreshNotifications])

  // Error state
  if (initError) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-dark px-6 text-center gap-4">
        <p className="text-white/60 text-sm">{initError}</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-[12px] bg-dark-200 border border-dark-500 text-white/70 text-sm hover:text-white hover:border-dark-400 transition-colors"
        >
          Retour
        </button>
      </div>
    )
  }

  // Loading state with safety timeout
  if (sessionLoading || !otherUser || !conversationId) {
    return <ChatLoadingTimeout onTimeout={() => setInitError('Le chat n\'a pas pu se charger. Réessayez.')} />
  }

  return (
    <ChatView
      conversationId={conversationId}
      conversationType={conversationType}
      otherUser={otherUser}
    />
  )
}

function ChatLoadingTimeout({
  onTimeout,
}: {
  onTimeout: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onTimeout, 10000)
    return () => clearTimeout(timer)
  }, [onTimeout])

  return (
    <div className="h-full flex items-center justify-center bg-dark">
      <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
    </div>
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