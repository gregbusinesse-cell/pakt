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

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('[CHAT_PAGE] getSession error', error)
      }

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
          console.error('[CHAT_PAGE] profile fetch error', {
            userId,
            error,
          })
          setInitError('Profil introuvable')
          return
        }

        setOtherUser(data)
      })
  }, [db, userId])

  useEffect(() => {
    if (!sessionUserId || !userId) return

    const initConversation = async () => {
      try {
        let nextConversationId: string | null = null

        if (params.id === 'new') {
          const { data, error } = await db.rpc('get_or_create_conversation', {
            other_user_id: userId,
          })

          if (error) {
            console.error('[CHAT_PAGE] get_or_create_conversation RPC error', {
              sessionUserId,
              otherUserId: userId,
              error,
            })
            setInitError(`Impossible de créer la conversation : ${error.message}`)
            return
          }

          if (!data) {
            console.error('[CHAT_PAGE] get_or_create_conversation returned null', {
              sessionUserId,
              otherUserId: userId,
            })
            setInitError('Impossible de créer la conversation')
            return
          }

          nextConversationId = data as string
          setConversationId(nextConversationId)
        } else {
          nextConversationId = params.id as string
          setConversationId(nextConversationId)
        }

        const [user1_id, user2_id] = [sessionUserId, userId].sort()

        const { data: matchData, error: matchError } = await db
          .from('matches')
          .select('id, is_viewed')
          .eq('user1_id', user1_id)
          .eq('user2_id', user2_id)
          .maybeSingle()

        if (matchError) {
          console.error('[CHAT_PAGE] match fetch error', {
            user1_id,
            user2_id,
            error: matchError,
          })
        }

        if (matchData?.id) {
          setConversationType('match')

          if (matchData.is_viewed === false) {
            const { error: matchViewedError } = await db
              .from('matches')
              .update({ is_viewed: true })
              .eq('id', matchData.id)

            if (matchViewedError) {
              console.error('[CHAT_PAGE] mark match viewed error', {
                matchId: matchData.id,
                error: matchViewedError,
              })
            } else {
              refreshNotifications()
            }
          }
        } else {
          setConversationType(requestedConversationType)
        }

        if (nextConversationId) {
          const { error: readError } = await db
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', nextConversationId)
            .neq('sender_id', sessionUserId)
            .eq('is_read', false)

          if (readError) {
            console.error('[CHAT_PAGE] mark messages read error', {
              conversationId: nextConversationId,
              sessionUserId,
              error: readError,
            })
          } else {
            refreshNotifications()
          }
        }
      } catch (err) {
        console.error('[CHAT_PAGE] initConversation catch', err)
        setInitError("Erreur lors de l'ouverture du chat")
      }
    }

    initConversation()
  }, [db, params.id, refreshNotifications, requestedConversationType, sessionUserId, userId])

  useEffect(() => {
    if (!conversationId || !sessionUserId) return

    const markAsRead = async () => {
      const { error } = await db
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', sessionUserId)
        .eq('is_read', false)

      if (error) {
        console.error('[CHAT_PAGE] markAsRead effect error', {
          conversationId,
          sessionUserId,
          error,
        })
        return
      }

      refreshNotifications()
    }

    markAsRead()
  }, [conversationId, db, sessionUserId, refreshNotifications])

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

  if (sessionLoading || !otherUser || !conversationId) {
    return (
      <ChatLoadingTimeout
        onTimeout={() => setInitError("Le chat n'a pas pu se charger. Réessayez.")}
      />
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

function ChatLoadingTimeout({ onTimeout }: { onTimeout: () => void }) {
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