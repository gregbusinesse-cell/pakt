'use client'

// app/(app)/matches/page.tsx

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@supabase/auth-helpers-react'
import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { formatTime, normalizePlan } from '@/lib/utils'
import type { Profile } from '@/lib/supabase/types'
import { MessageCircle, Users, Crown, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

type Tab = 'matches' | 'likes' | 'conversations'

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

interface LikeRow {
  liker_id: string
  created_at?: string | null
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
  isLocked: boolean
}

interface LikeItem {
  id: string
  otherUser: Profile
  createdAt: string | null
  isMatched: boolean
  conversationId: string | null
}

function getPairKey(a: string, b: string) {
  return [a, b].sort().join(':')
}

function isPaidPlan(plan: unknown) {
  const normalized = normalizePlan(plan)
  return normalized === 'business' || normalized === 'business_pro'
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

  if (lastMessage.message_type === 'audio') return `${prefix} un vocal`
  if (lastMessage.message_type === 'image') return `${prefix} une photo`
  if (lastMessage.message_type === 'file') return `${prefix} un document`
  if (lastMessage.message_type === 'text' || !lastMessage.message_type) return lastMessage.content || null

  return null
}

function createFallbackProfile(userId: string): Profile {
  return {
    id: userId,
    email: '',
    first_name: null,
    age: null,
    bio: null,
    city: null,
    city_lat: null,
    city_lng: null,
    interests: [],
    photos: [],
    preferences: {},
    plan: 'free',
    stripe_customer_id: null,
    stripe_subscription_id: null,
    subscription_status: null,
    swipes_today: 0,
    messages_today: 0,
    likes_today: 0,
    last_swipe_date: null,
    last_message_date: null,
    last_like_date: null,
    is_onboarded: true,
    is_suspended: false,
    suspension_reason: null,
    email_confirmed: true,
    created_at: '',
    updated_at: '',
  } as Profile
}

function LockedMatchOverlay({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="mt-3 rounded-[14px] border border-gold/20 bg-black/35 p-4 text-center backdrop-blur-md">
      <div className="mx-auto mb-3 w-11 h-11 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
        <Lock size={18} className="text-gold" />
      </div>

      <p className="text-sm font-semibold text-white">Match verrouillé</p>
      <p className="mt-1 text-xs leading-relaxed text-white/50">
        Deux comptes Free ont matché. Passe Business pour débloquer ce match et discuter.
      </p>

      <button
        type="button"
        onClick={onUpgrade}
        className="mt-3 h-10 w-full rounded-[12px] bg-gold text-dark text-sm font-bold hover:bg-gold-light transition-colors"
      >
        Passer Business
      </button>
    </div>
  )
}

function BusinessProLikesOverlay({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[16px] border border-gold/25 bg-[#111111]/85 p-6 text-center shadow-[0_18px_55px_rgba(0,0,0,0.45),0_0_34px_rgba(212,168,83,0.12)] backdrop-blur-xl"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none" />

      <div className="relative">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
          <Lock size={24} className="text-gold" />
        </div>

        <h2 className="text-lg font-bold text-white">
          Likes reçus réservés aux membres Business Pro
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-white/55">
          Découvrez qui vous a liké et débloquez vos connexions potentielles.
        </p>

        <button
          type="button"
          onClick={onUpgrade}
          className="mt-5 h-12 w-full rounded-[12px] bg-gold text-dark text-sm font-bold hover:bg-gold-light transition-colors"
        >
          Passer Business Pro
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

  const currentPlan = normalizePlan(profile?.plan)
  const isBusinessPro = currentPlan === 'business_pro'
  const currentUserIsPaid = isPaidPlan(profile?.plan)

  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [likes, setLikes] = useState<LikeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [openingConversation, setOpeningConversation] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('matches')

  const currentUserId = session?.user?.id

  const handleCheckout = async (plan: 'business' | 'business_pro') => {
    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      const token = currentSession?.access_token

      if (!token) {
        toast.error('Utilisateur non connecté')
        return
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'Erreur checkout')
      }

      window.location.href = data.url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur Stripe')
    }
  }

  const loadConversations = useCallback(async () => {
    if (!currentUserId) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const [
        { data: conversationsData, error: conversationsError },
        { data: matchesData, error: matchesError },
        { data: likesData, error: likesError },
      ] = await Promise.all([
        db
          .from('conversations')
          .select('*')
          .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
          .order('created_at', { ascending: false }),
        db
          .from('matches')
          .select('*')
          .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
          .order('created_at', { ascending: false }),
        isBusinessPro
          ? db
              .from('likes')
              .select('liker_id, created_at')
              .eq('liked_id', currentUserId)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
      ])

      if (conversationsError) toast.error(`Erreur conversations: ${conversationsError.message}`)
      if (matchesError) toast.error(`Erreur matchs: ${matchesError.message}`)
      if (likesError) toast.error(`Erreur likes: ${likesError.message}`)

      const conversationRows = conversationsError ? [] : ((conversationsData || []) as ConversationRow[])
      const matchRows = matchesError ? [] : ((matchesData || []) as MatchRow[])
      const likeRows = likesError ? [] : ((likesData || []) as LikeRow[])

      const conversationOtherIds = conversationRows.map((conversation) =>
        conversation.user1_id === currentUserId ? conversation.user2_id : conversation.user1_id
      )

      const matchOtherIds = matchRows.map((match) =>
        match.user1_id === currentUserId ? match.user2_id : match.user1_id
      )

      const likeOtherIds = isBusinessPro ? likeRows.map((like) => like.liker_id) : []

      const allUserIds = Array.from(
        new Set([...conversationOtherIds, ...matchOtherIds, ...likeOtherIds])
      )

      let profileMap = new Map<string, Profile>()

      if (allUserIds.length > 0) {
        const { data: profilesData, error: profilesError } = await db
          .from('profiles')
          .select('*')
          .in('id', allUserIds)

        if (profilesError) {
          toast.error(`Erreur profils: ${profilesError.message}`)
        } else {
          const profiles = (profilesData || []) as Profile[]
          profileMap = new Map<string, Profile>(
            profiles.map((userProfile) => [userProfile.id, userProfile])
          )
        }
      }

      const conversationByPair = new Map<string, ConversationRow>()

      conversationRows.forEach((conversation) => {
        conversationByPair.set(getPairKey(conversation.user1_id, conversation.user2_id), conversation)
      })

      const conversationItems = await Promise.all(
        conversationRows.map(async (conversation) => {
          const otherUserId =
            conversation.user1_id === currentUserId ? conversation.user2_id : conversation.user1_id

          const otherUser = profileMap.get(otherUserId) || createFallbackProfile(otherUserId)

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
            lastMessageAt: lastMessage?.created_at || conversation.created_at || null,
          }
        })
      )

      const matchItemsByPair = new Map<string, MatchItem>()

      matchRows.forEach((match) => {
        const otherUserId = match.user1_id === currentUserId ? match.user2_id : match.user1_id
        const pairKey = getPairKey(currentUserId, otherUserId)
        const otherUser = profileMap.get(otherUserId) || createFallbackProfile(otherUserId)
        const linkedConversation = conversationByPair.get(pairKey)
        const locked = !currentUserIsPaid && !isPaidPlan(otherUser.plan)

        matchItemsByPair.set(pairKey, {
          id: match.id,
          type: 'match',
          otherUser,
          conversationId: linkedConversation?.id || null,
          createdAt: match.created_at || null,
          isViewed: Boolean(match.is_viewed),
          isLocked: locked,
        })
      })

      conversationRows.forEach((conversation) => {
        const otherUserId =
          conversation.user1_id === currentUserId ? conversation.user2_id : conversation.user1_id
        const pairKey = getPairKey(currentUserId, otherUserId)

        if (matchItemsByPair.has(pairKey)) return

        const otherUser = profileMap.get(otherUserId) || createFallbackProfile(otherUserId)

        matchItemsByPair.set(pairKey, {
          id: `conversation-match-${conversation.id}`,
          type: 'match',
          otherUser,
          conversationId: conversation.id,
          createdAt: conversation.created_at || null,
          isViewed: true,
          isLocked: false,
        })
      })

      const cleanMatchItems = Array.from(matchItemsByPair.values())

      const likeItems = isBusinessPro
        ? likeRows.map((like) => {
            const pairKey = getPairKey(currentUserId, like.liker_id)
            const linkedMatch = matchItemsByPair.get(pairKey)
            const linkedConversation = conversationByPair.get(pairKey)
            const otherUser = profileMap.get(like.liker_id) || createFallbackProfile(like.liker_id)

            return {
              id: like.liker_id,
              otherUser,
              createdAt: like.created_at || null,
              isMatched: Boolean(linkedMatch),
              conversationId: linkedConversation?.id || linkedMatch?.conversationId || null,
            }
          })
        : []

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

      likeItems.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return bTime - aTime
      })

      setConversations(conversationItems)
      setMatches(cleanMatchItems)
      setLikes(likeItems)
    } catch {
      toast.error('Erreur chargement messages')
      setConversations([])
      setMatches([])
      setLikes([])
    } finally {
      setLoading(false)
    }
  }, [currentUserId, currentUserIsPaid, db, isBusinessPro])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const openConversation = async (
    otherUserId: string,
    existingConversationId?: string | null,
    matchId?: string | null,
    locked?: boolean
  ) => {
    if (!currentUserId || !otherUserId) return

    if (locked) {
      toast.error('Match verrouillé. Passe Business pour discuter.')
      return
    }

    setOpeningConversation(otherUserId)

    try {
      if (matchId && !matchId.startsWith('conversation-match-')) {
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

        router.push(`/chat/${existingConversationId}?type=match&userId=${otherUserId}`)
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
            onClick={() => setTab('likes')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              tab === 'likes' ? 'bg-gold text-dark' : 'text-white/50'
            }`}
          >
            <Crown size={15} />
            Likes
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
        ) : tab === 'matches' ? (
          matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-2/3 text-center gap-4">
              <span className="text-5xl">⚔️</span>
              <div>
                <h3 className="font-semibold text-lg mb-1">Pas encore de matchs</h3>
                <p className="text-white/40 text-sm">Continue à swiper pour trouver tes matchs !</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              {matches.map((item, index) => {
                const isOpening = openingConversation === item.otherUser.id

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`rounded-2xl ${item.isLocked ? 'bg-dark-200/50 border border-gold/10 p-1' : ''}`}
                  >
                    <button
                      type="button"
                      disabled={isOpening}
                      onClick={() =>
                        openConversation(item.otherUser.id, item.conversationId, item.id, item.isLocked)
                      }
                      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-dark-200 active:bg-dark-300 transition-colors text-left disabled:opacity-60"
                    >
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-dark-300 ring-2 ring-offset-2 ring-offset-dark ring-gold/30">
                          {item.otherUser.photos?.[0] ? (
                            <img
                              src={(item.otherUser.photos as string[])[0]}
                              alt=""
                              className={`w-full h-full object-cover ${
                                item.isLocked ? 'blur-md scale-110 brightness-75' : ''
                              }`}
                            />
                          ) : (
                            <div
                              className={`w-full h-full flex items-center justify-center text-2xl ${
                                item.isLocked ? 'blur-sm brightness-75' : ''
                              }`}
                            >
                              👤
                            </div>
                          )}
                        </div>

                        <div className="absolute -bottom-0.5 -right-0.5 bg-gold text-dark text-[9px] font-black px-1 py-0.5 rounded-full">
                          {item.isLocked ? <Lock size={10} /> : '✓'}
                        </div>

                        {!item.isViewed && !item.isLocked && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-dark" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="font-semibold truncate">
                            {item.isLocked
                              ? 'Match verrouillé'
                              : item.otherUser.first_name || item.otherUser.email || 'Profil'}
                          </p>

                          {item.createdAt && (
                            <span className="text-white/30 text-xs shrink-0 ml-2">
                              {formatTime(item.createdAt)}
                            </span>
                          )}
                        </div>

                        <p className="text-white/40 text-sm truncate">
                          {item.isLocked
                            ? 'Passe Business pour débloquer ce match'
                            : isOpening
                            ? 'Ouverture...'
                            : '🎉 Nouveau match ! Dis bonjour'}
                        </p>
                      </div>
                    </button>

                    {item.isLocked && <LockedMatchOverlay onUpgrade={() => handleCheckout('business')} />}
                  </motion.div>
                )
              })}
            </div>
          )
        ) : tab === 'likes' ? (
          !isBusinessPro ? (
            <div className="pt-8">
              <BusinessProLikesOverlay onUpgrade={() => handleCheckout('business_pro')} />
            </div>
          ) : likes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-2/3 text-center gap-4">
              <span className="text-5xl">👑</span>
              <div>
                <h3 className="font-semibold text-lg mb-1">Aucun like pour le moment</h3>
                <p className="text-white/40 text-sm">Les personnes qui te likent apparaîtront ici.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1 pt-2">
              {likes.map((item, index) => {
                const isOpening = openingConversation === item.otherUser.id
                const canOpen = item.conversationId

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
                        if (item.conversationId) {
                          openConversation(item.otherUser.id, item.conversationId, null, false)
                        }
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-dark-200 active:bg-dark-300 transition-colors text-left disabled:opacity-60"
                    >
                      <div className="relative shrink-0">
                        <div className="relative w-14 h-14 rounded-full overflow-hidden bg-dark-300 ring-2 ring-offset-2 ring-offset-dark ring-gold/30">
                          {item.otherUser.photos?.[0] ? (
                            <img
                              src={(item.otherUser.photos as string[])[0]}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">
                              👤
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="font-semibold truncate">
                            {item.otherUser.first_name || item.otherUser.email || 'Profil'}
                          </p>

                          {item.createdAt && (
                            <span className="text-white/30 text-xs shrink-0 ml-2">
                              {formatTime(item.createdAt)}
                            </span>
                          )}
                        </div>

                        <p className="text-white/40 text-sm truncate">
                          {isOpening
                            ? 'Ouverture...'
                            : canOpen
                            ? 'Cette personne t’a liké'
                            : 'Like reçu'}
                        </p>
                      </div>
                    </button>
                  </motion.div>
                )
              })}
            </div>
          )
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-2/3 text-center gap-4">
            <span className="text-5xl">✉️</span>
            <div>
              <h3 className="font-semibold text-lg mb-1">Aucune conversation pour le moment</h3>
              <p className="text-white/40 text-sm">Tu peux envoyer un message depuis le profil de quelqu'un</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1 pt-2">
            {conversations.map((item, index) => {
              const lastMessage = item.lastMessage || 'Nouveau message'
              const isOpening = openingConversation === item.otherUser.id

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
                    onClick={() => openConversation(item.otherUser.id, item.id, null, false)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-dark-200 active:bg-dark-300 transition-colors text-left disabled:opacity-60"
                  >
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-dark-300 ring-2 ring-offset-2 ring-offset-dark ring-gold/30">
                        {item.otherUser.photos?.[0] ? (
                          <img
                            src={(item.otherUser.photos as string[])[0]}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-semibold truncate">
                          {item.otherUser.first_name || item.otherUser.email || 'Profil'}
                        </p>

                        {item.lastMessageAt && (
                          <span className="text-white/30 text-xs shrink-0 ml-2">
                            {formatTime(item.lastMessageAt)}
                          </span>
                        )}
                      </div>

                      <p className="text-white/40 text-sm truncate">
                        {isOpening ? 'Ouverture...' : lastMessage}
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