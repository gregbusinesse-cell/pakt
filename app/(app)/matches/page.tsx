'use client'

// app/(app)/matches/page.tsx

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@supabase/auth-helpers-react'
import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { formatTime } from '@/lib/utils'
import type { Profile } from '@/lib/supabase/types'
import { MessageCircle, Users, Crown } from 'lucide-react'
import toast from 'react-hot-toast'

type Tab = 'matches' | 'conversations'

interface ConversationRow {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
}

interface MatchRow {
  id: string
  user1_id: string
  user2_id: string
  created_at?: string | null
  is_viewed?: boolean | null
}

interface LastMessageRow {
  content: string | null
  created_at: string | null
  message_type: 'audio' | 'image' | 'file' | 'text' | string | null
  sender_id: string | null
}

interface ConversationItem {
  id: string
  type: 'conversation'
  otherUser: Profile
  lastMessage: string | null
  lastMessageAt: string | null
}

interface MatchItem {
  id: string
  type: 'match'
  otherUser: Profile
  conversationId: string | null
  createdAt: string | null
  isViewed: boolean
}

function getPairKey(a: string, b: string) {
  return [a, b].sort().join(':')
}

function formatLastMessage(
  lastMessage: LastMessageRow | null,
  currentUserId: string,
  otherUser: Profile
) {
  if (!lastMessage) return null

  const isMine = lastMessage.sender_id === currentUserId
  const otherUserName = otherUser.first_name || 'Cette personne'
  const prefix = isMine ? 'Vous avez envoyé' : `${otherUserName} vous a envoyé`

  if (lastMessage.message_type === 'audio') {
    return `${prefix} un vocal`
  }

  if (lastMessage.message_type === 'image') {
    return `${prefix} une photo`
  }

  if (lastMessage.message_type === 'file') {
    return `${prefix} un document`
  }

  if (lastMessage.message_type === 'text' || !lastMessage.message_type) {
    return lastMessage.content || null
  }

  return null
}

function BusinessBanner({ type }: { type: Tab }) {
  const content =
    type === 'matches'
      ? {
          title: 'Pssst... Trouve ton partenaire plus vite',
          text: 'Les membres PAKT Business trouvent leur partenaire jusqu’à 4x plus rapidement.',
        }
      : {
          title: 'Pssst... Passe à la vitesse supérieure',
          text: 'Envoie des messages sans limite et maximise tes opportunités avec PAKT Business.',
        }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gold/10 border border-gold/30 rounded-[12px] p-4 mb-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Crown size={16} className="text-gold" />
            <p className="font-semibold text-white text-sm">{content.title}</p>
          </div>
          <p className="text-white/60 text-sm leading-relaxed">{content.text}</p>
        </div>

        <button
          type="button"
          onClick={() => {
            window.location.href =
              'https://checkout.stripe.com/c/pay/cs_test_a1EOyhQb3zvA2y8kvEY2t5qaAFMEtLVxEExzPNpRIyx3EkYYmoqCtWQrwi'
          }}
          className="shrink-0 bg-gold text-dark px-4 py-2 rounded-[10px] text-sm font-bold transition-transform hover:scale-[1.03] active:scale-[0.99]"
        >
          Découvrir PAKT Business
        </button>
      </div>
    </motion.div>
  )
}

export default function MatchesPage() {
  const session = useSession()
  const supabase = useMemo(() => createClient(), [])
  const db = supabase as any
  const router = useRouter()
  const { profile } = useAppStore()

  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [openingConversation, setOpeningConversation] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('matches')

  const currentUserId = session?.user?.id

  const loadConversations = useCallback(async () => {
    if (!currentUserId) return

    setLoading(true)

    try {
      const { data: conversationsData, error: conversationsError } = await db
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false })

      if (conversationsError) {
        toast.error(`Erreur conversations: ${conversationsError.message}`)
        return
      }

      const { data: matchesData, error: matchesError } = await db
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)

      if (matchesError) {
        toast.error(`Erreur matchs: ${matchesError.message}`)
        return
      }

      const conversationRows = (conversationsData || []) as ConversationRow[]
      const matchRows = (matchesData || []) as MatchRow[]

      const conversationOtherIds = conversationRows.map((conversation) =>
        conversation.user1_id === currentUserId ? conversation.user2_id : conversation.user1_id
      )

      const matchOtherIds = matchRows.map((match) =>
        match.user1_id === currentUserId ? match.user2_id : match.user1_id
      )

      const allUserIds = Array.from(new Set([...conversationOtherIds, ...matchOtherIds]))

      if (allUserIds.length === 0) {
        setConversations([])
        setMatches([])
        return
      }

      const { data: profilesData, error: profilesError } = await db
        .from('profiles')
        .select('*')
        .in('id', allUserIds)

      if (profilesError) {
        toast.error(`Erreur profils: ${profilesError.message}`)
        return
      }

      const profiles = (profilesData || []) as Profile[]
      const profileMap = new Map<string, Profile>(
        profiles.map((userProfile) => [userProfile.id, userProfile])
      )

      const conversationByPair = new Map<string, ConversationRow>()

      conversationRows.forEach((conversation) => {
        conversationByPair.set(getPairKey(conversation.user1_id, conversation.user2_id), conversation)
      })

      const conversationItemsRaw = await Promise.all(
        conversationRows.map(async (conversation) => {
          const otherUserId =
            conversation.user1_id === currentUserId ? conversation.user2_id : conversation.user1_id

          const otherUser = profileMap.get(otherUserId)
          if (!otherUser) return null

          const { data: lastMessageData } = await db
            .from('messages')
            .select('content, created_at, message_type, sender_id')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          const lastMessage = (lastMessageData || null) as LastMessageRow | null

          return {
            id: conversation.id,
            type: 'conversation' as const,
            otherUser,
            lastMessage: formatLastMessage(lastMessage, currentUserId, otherUser),
            lastMessageAt: lastMessage?.created_at || null,
          }
        })
      )

      const conversationItems = conversationItemsRaw.filter(Boolean) as ConversationItem[]

      const matchItemsRaw = matchRows.map((match) => {
        const otherUserId = match.user1_id === currentUserId ? match.user2_id : match.user1_id
        const otherUser = profileMap.get(otherUserId)

        if (!otherUser) return null

        const linkedConversation = conversationByPair.get(getPairKey(currentUserId, otherUserId))
        const conversationId = linkedConversation?.id || null

        return {
          id: match.id,
          type: 'match' as const,
          otherUser,
          conversationId,
          createdAt: match.created_at || null,
          isViewed: Boolean(match.is_viewed),
        }
      })

      const cleanMatchItems = matchItemsRaw.filter(Boolean) as MatchItem[]

      conversationItems.sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
        return bTime - aTime
      })

      cleanMatchItems.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return bTime - aTime
      })

      setConversations(conversationItems)
      setMatches(cleanMatchItems)
    } catch {
      toast.error('Erreur chargement messages')
    } finally {
      setLoading(false)
    }
  }, [currentUserId, db])

  useEffect(() => {
    if (!currentUserId) return
    loadConversations()
  }, [currentUserId, loadConversations])

  const openConversation = async (
    otherUserId: string,
    existingConversationId?: string | null,
    matchId?: string | null
  ) => {
    if (!currentUserId || !otherUserId) return

    setOpeningConversation(otherUserId)

    try {
      if (matchId) {
        await db.from('matches').update({ is_viewed: true }).eq('id', matchId)
        setMatches((prev) =>
          prev.map((item) => (item.id === matchId ? { ...item, isViewed: true } : item))
        )
      }

      if (existingConversationId) {
        await db
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', existingConversationId)
          .neq('sender_id', currentUserId)
          .eq('is_read', false)

        router.push(`/chat/${existingConversationId}?type=direct&userId=${otherUserId}`)
        return
      }

      const { data: conversationId, error } = await db.rpc('get_or_create_conversation', {
        other_user_id: otherUserId,
      })

      if (error) {
        toast.error(`Erreur conversation: ${error.message}`)
        return
      }

      if (!conversationId) {
        toast.error('Conversation introuvable')
        return
      }

      router.push(`/chat/${conversationId}?type=match&userId=${otherUserId}`)
    } catch {
      toast.error('Erreur ouverture conversation')
    } finally {
      setOpeningConversation(null)
    }
  }

  const currentItems = tab === 'matches' ? (matches.length > 0 ? matches : conversations) : conversations

  return (
    <div className="h-full flex flex-col bg-dark">
      <div className="px-5 pt-5 pb-3 shrink-0">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>

        <div className="flex bg-dark-200 rounded-2xl p-1">
          <button
            type="button"
            onClick={() => setTab('matches')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              tab === 'matches' ? 'bg-gold text-dark' : 'text-white/50'
            }`}
          >
            <Users size={15} />
            Matchs
          </button>

          <button
            type="button"
            onClick={() => setTab('conversations')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              tab === 'conversations' ? 'bg-gold text-dark' : 'text-white/50'
            }`}
          >
            <MessageCircle size={15} />
            Conversations
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {profile?.plan === 'free' && <BusinessBanner type={tab} />}

        {loading ? (
          <div className="flex flex-col gap-3 pt-2">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center gap-3 p-3">
                <div className="w-14 h-14 rounded-full shimmer shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded shimmer" />
                  <div className="h-3 w-40 rounded shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : currentItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-2/3 text-center gap-4">
            <span className="text-5xl">{tab === 'matches' ? '⚔️' : '✉️'}</span>
            <div>
              <h3 className="font-semibold text-lg mb-1">
                {tab === 'matches' ? 'Pas encore de matchs' : 'Aucune conversation pour le moment'}
              </h3>
              <p className="text-white/40 text-sm">
                {tab === 'matches'
                  ? 'Continue à swiper pour trouver tes matchs !'
                  : "Tu peux envoyer un message depuis le profil de quelqu'un"}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1 pt-2">
            {currentItems.map((item, index) => {
              const isConversation = item.type === 'conversation'
              const lastMessage = isConversation
                ? item.lastMessage || 'Nouveau message'
                : '🎉 Nouveau match ! Dis bonjour'

              const lastMessageAt = isConversation ? item.lastMessageAt : item.createdAt
              const conversationId = isConversation ? item.id : item.conversationId
              const isOpening = openingConversation === item.otherUser.id
              const showUnreadMatch = item.type === 'match' && !item.isViewed

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button
                    type="button"
                    disabled={isOpening}
                    onClick={() => {
  if (isFree) {
    toast.error('Passe à PAKT Business pour voir ce match')
    return
  }

  openConversation(
    item.otherUser.id,
    conversationId,
    item.type === 'match' ? item.id : null
  )
}}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-dark-200 active:bg-dark-300 transition-colors text-left disabled:opacity-60"
                  >
                    <div className="relative shrink-0">
                      {item.otherUser.photos?.[0] ? (
  <div className="relative w-full h-full">
    <img
      src={(item.otherUser.photos as string[])[0]}
      alt=""
      className={`w-full h-full object-cover ${isFree ? 'blur-md scale-110' : ''}`}
    />

    {isFree && (
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <Crown size={16} className="text-gold" />
      </div>
    )}
  </div>
) : (
  <div className="w-full h-full flex items-center justify-center text-2xl">
    👤
  </div>
)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-semibold truncate">
                          {isFree ? 'Quelqu’un t’a liké' : item.otherUser.first_name || item.otherUser.email || 'Profil'}
                        </p>

                        {lastMessageAt && (
                          <span className="text-white/30 text-xs shrink-0 ml-2">
                            {formatTime(lastMessageAt)}
                          </span>
                        )}
                      </div>

                      <p className="text-white/40 text-sm truncate">
                        {isFree
  ? '🔒 Débloque avec PAKT Business'
  : isOpening
  ? 'Ouverture...'
  : lastMessage}
                      </p>
                    </div>
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}