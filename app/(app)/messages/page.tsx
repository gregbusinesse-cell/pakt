'use client'

// app/(app)/messages/page.tsx

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/supabase/types'
import toast from 'react-hot-toast'

type Conversation = {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
}

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  is_read: boolean
  message_type?: string
  file_url?: string | null
  file_name?: string | null
  file_size?: number | null
}

type ConversationRow = {
  conversation: Conversation
  otherUser: Profile | null
  lastMessage: Message | null
  unreadCount: number
}

export default function MessagesPage() {
  const supabase = createClient()
  const db = supabase as any
  const router = useRouter()

  const [session, setSession] = useState<any>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [rows, setRows] = useState<ConversationRow[]>([])
  const [loading, setLoading] = useState(true)

  const sessionUserId = session?.user?.id

  const loadConversations = useCallback(async () => {
    console.log('[MESSAGES] loadConversations start', { sessionUserId })

    if (!sessionUserId) {
      console.error('[MESSAGES] missing sessionUserId')
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const { data: conversationsData, error: conversationsError } = await db
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${sessionUserId},user2_id.eq.${sessionUserId}`)
        .order('created_at', { ascending: false })

      if (conversationsError) {
        console.error('[MESSAGES] conversations select error', conversationsError)
        toast.error(`Erreur conversations: ${conversationsError.message}`)
        return
      }

      console.log('[MESSAGES] conversations loaded', conversationsData)

      const conversations = (conversationsData || []) as Conversation[]
      const otherUserIds = conversations.map((item) =>
        item.user1_id === sessionUserId ? item.user2_id : item.user1_id
      )

      const { data: profilesData, error: profilesError } = otherUserIds.length
        ? await db.from('profiles').select('*').in('id', otherUserIds)
        : { data: [], error: null }

      if (profilesError) {
        console.error('[MESSAGES] profiles select error', profilesError)
        toast.error(`Erreur profils: ${profilesError.message}`)
      }

      console.log('[MESSAGES] profiles loaded', profilesData)

      const profileMap = new Map<string, Profile>(
        ((profilesData || []) as Profile[]).map((item) => [item.id, item])
      )

      const result = await Promise.all(
        conversations.map(async (conversation) => {
          const otherUserId =
            conversation.user1_id === sessionUserId ? conversation.user2_id : conversation.user1_id

          const { data: lastMessagesData, error: lastMessageError } = await db
            .from('messages')
            .select('*')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)

          if (lastMessageError) {
            console.error('[MESSAGES] last message error', {
              conversationId: conversation.id,
              error: lastMessageError,
            })
          }

          const { count, error: unreadError } = await db
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', conversation.id)
            .neq('sender_id', sessionUserId)
            .eq('is_read', false)

          if (unreadError) {
            console.error('[MESSAGES] unread count error', {
              conversationId: conversation.id,
              error: unreadError,
            })
          }

          return {
            conversation,
            otherUser: profileMap.get(otherUserId) || null,
            lastMessage: ((lastMessagesData || [])[0] as Message) || null,
            unreadCount: count || 0,
          }
        })
      )

      result.sort((a, b) => {
        const aDate = a.lastMessage?.created_at || a.conversation.created_at
        const bDate = b.lastMessage?.created_at || b.conversation.created_at
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      })

      console.log('[MESSAGES] rows ready', result)
      setRows(result)
    } catch (error) {
      console.error('[MESSAGES] loadConversations catch', error)
      toast.error('Erreur chargement conversations')
    } finally {
      setLoading(false)
    }
  }, [db, sessionUserId])

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
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (!sessionUserId) return

    const channel = supabase
      .channel(`messages-page-${sessionUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('[MESSAGES] realtime messages change', payload)
          loadConversations()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          console.log('[MESSAGES] realtime conversations change', payload)
          loadConversations()
        }
      )
      .subscribe((status) => {
        console.log('[MESSAGES] realtime status', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadConversations, sessionUserId, supabase])

  if (sessionLoading || loading) {
    return (
      <div className="h-full flex items-center justify-center bg-dark">
        <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-full bg-dark text-white overflow-y-auto">
      <div className="px-5 pt-5 pb-4">
        <h1 className="text-2xl font-black tracking-wider text-gold-gradient">Messages</h1>
      </div>

      {rows.length === 0 ? (
        <div className="h-[70vh] flex items-center justify-center px-8 text-center">
          <p className="text-white/50 text-sm">Aucune conversation pour le moment.</p>
        </div>
      ) : (
        <div className="px-3 pb-6">
          {rows.map((row) => {
            const name = row.otherUser?.first_name || row.otherUser?.email || 'Profil'
            const avatar = row.otherUser?.photos?.[0] || null
            const lastText =
              row.lastMessage?.content ||
              (row.lastMessage?.message_type ? `[${row.lastMessage.message_type}]` : 'Nouvelle conversation')

            return (
              <button
                key={row.conversation.id}
                type="button"
                onClick={() =>
                  router.push(
                    `/chat/${row.conversation.id}?userId=${row.otherUser?.id || ''}&type=direct`
                  )
                }
                className="w-full flex items-center gap-3 px-2 py-3 rounded-[8px] hover:bg-white/5 transition-colors text-left"
              >
                <div className="relative w-14 h-14 rounded-full bg-dark-200 overflow-hidden shrink-0">
                  {avatar ? (
                    <img src={avatar} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gold font-bold">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {row.unreadCount > 0 && (
                    <span className="absolute right-0 top-0 w-3 h-3 rounded-full bg-gold border-2 border-dark" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold truncate">{name}</p>
                    {row.unreadCount > 0 && (
                      <span className="min-w-5 h-5 px-1 rounded-full bg-gold text-dark text-xs font-bold flex items-center justify-center">
                        {row.unreadCount}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-white/50 truncate mt-1">
                    {lastText}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}