'use client'

// app/(app)/matches/page.tsx

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { formatTime, normalizePlan, isPaidPlan as isPaidPlanUtil, canChat } from '@/lib/utils'
import type { Profile } from '@/lib/supabase/types'
import { MessageCircle, Users, Crown, Lock, Heart } from 'lucide-react'
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
  id: string
  liker_id: string
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
  isLocked: boolean
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
  likeId: string
  otherUser: Profile
  createdAt: string | null
  isViewed: boolean
  isMatched: boolean
  conversationId: string | null
}

function getPairKey(a: string, b: string) {
  return [a, b].sort().join(':')
}

function isPaidPlan(plan: unknown) {
  return isPaidPlanUtil(plan)
}

function formatLastMessage(
  lastMessage: LastMessageRow | null,
  currentUserId: string,
  otherUser: Profile
) {
  if (!lastMessage) return null

  const isMine = lastMessage.sender_id === currentUserId
  const otherUserName = otherUser.first_name || 'Cette personne'
  const prefix = isMine ? 'Vous avez envoye' : `${otherUserName} vous a envoye`

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

function FreeUpgradeCTA({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative my-3"
    >
      <div className="relative overflow-hidden rounded-[18px] border border-gold/20 bg-[#0d0d0d]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-gold/[0.05] via-transparent to-transparent pointer-events-none" />

        <div className="relative px-6 pt-7 pb-6 text-center">
          <div className="mx-auto mb-4 w-[52px] h-[52px] rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/25 flex items-center justify-center">
            <Crown size={22} className="text-gold" />
          </div>

          <h2 className="text-[17px] font-bold text-white leading-snug">
            Tes opportunites t&apos;attendent
          </h2>

          <p className="mt-2.5 text-[12.5px] leading-[1.65] text-white/45 max-w-[280px] mx-auto">
            Passe Business pour voir les profils, debloquer tes conversations et developper ton reseau.
          </p>

          <button
            type="button"
            onClick={onUpgrade}
            className="mt-5 h-[46px] w-full rounded-[13px] bg-gradient-to-r from-gold to-[#e2c06d] text-dark text-[13.5px] font-bold shadow-[0_4px_20px_rgba(212,168,83,0.25)] active:scale-[0.98] transition-all"
          >
            Passer a PAKT Business
          </button>

          <p className="mt-3 text-[11px] text-white/20">Annulable a tout moment</p>
        </div>
      </div>
    </motion.div>
  )
}

function LockedMatchOverlay({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="mt-3 rounded-[14px] border border-gold/20 bg-black/35 p-4 text-center backdrop-blur-md">
      <div className="mx-auto mb-3 w-11 h-11 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
        <Lock size={18} className="text-gold" />
      </div>

      <p className="text-sm font-semibold text-white">Match verrouille</p>
      <p className="mt-1 text-xs leading-relaxed text-white/50">
        Les deux membres doivent avoir au minimum PAKT Business pour echanger.
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

function FreeMatchesView({
  matches,
  onUpgrade,
  onMarkViewed,
}: {
  matches: MatchItem[]
  onUpgrade: () => void
  onMarkViewed: (matchId: string) => void
}) {
  return (
    <div className="pt-4">
      {/* Match count card — same style as likes */}
      <div className="rounded-[16px] border border-gold/20 bg-dark-200 p-5 text-center">
        <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center">
          <Users size={20} className="text-gold" />
        </div>

        <p className="text-3xl font-black text-gold">{matches.length}</p>
        <p className="mt-1 text-sm text-white/50">
          {matches.length === 0
            ? 'Aucun match pour le moment'
            : matches.length === 1
              ? 'match'
              : 'matchs'}
        </p>

        <button
          type="button"
          onClick={onUpgrade}
          className="mt-4 h-11 w-full rounded-[12px] bg-gold text-dark text-sm font-bold hover:bg-gold-light transition-colors"
        >
          Passer a PAKT Business
        </button>
      </div>

      {/* Blurred match list */}
      {matches.length > 0 && (
        <div className="mt-4 space-y-1 select-none">
          {matches.map((item, index) => (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => onMarkViewed(item.id)}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl text-left cursor-default"
            >
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-dark-300 ring-2 ring-offset-2 ring-offset-dark ring-white/[0.06]">
                  {item.otherUser.photos?.[0] ? (
                    <img
                      src={(item.otherUser.photos as string[])[0]}
                      alt=""
                      className="w-full h-full object-cover blur-[16px] scale-[1.35] brightness-[0.55] saturate-[0.7]"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-dark-300 to-dark-400" />
                  )}
                </div>

                {!item.isViewed && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-dark" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="h-[14px] w-24 rounded-full bg-white/[0.08]" />
                  {item.createdAt && (
                    <span className="text-[10px] text-white/30 shrink-0 ml-2">
                      Match {formatTime(item.createdAt)}
                    </span>
                  )}
                </div>

                <p className="text-xs text-white/35 truncate">
                  Nouveau match. Passe Business pour voir le profil.
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}

function FreeLikesView({
  likes,
  onUpgrade,
}: {
  likes: LikeItem[]
  onUpgrade: () => void
}) {
  return (
    <div className="pt-4">
      <div className="rounded-[16px] border border-gold/20 bg-dark-200 p-5 text-center">
        <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center">
          <Heart size={20} className="text-gold" />
        </div>

        <p className="text-3xl font-black text-gold">{likes.length}</p>
        <p className="mt-1 text-sm text-white/50">
          {likes.length > 1 ? "personnes t'ont like" : "personne t'a like"}
        </p>

        <button
          type="button"
          onClick={onUpgrade}
          className="mt-4 h-11 w-full rounded-[12px] bg-gold text-dark text-sm font-bold hover:bg-gold-light transition-colors"
        >
          Passer Business Pro
        </button>
      </div>

      <div className="mt-4 space-y-1 select-none">
        {likes.map((item, index) => (
          <motion.div
            key={item.likeId}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
            className="flex items-center gap-3 p-3 rounded-2xl"
          >
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-dark-300 ring-2 ring-offset-2 ring-offset-dark ring-gold/20">
                {item.otherUser.photos?.[0] ? (
                  <img
                    src={(item.otherUser.photos as string[])[0]}
                    alt=""
                    className="w-full h-full object-cover blur-[16px] scale-[1.35] brightness-[0.55] saturate-[0.7]"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-dark-300 to-dark-400" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="h-[14px] w-24 rounded-full bg-white/[0.08]" />
                {item.createdAt && (
                  <span className="text-[10px] text-white/30 shrink-0 ml-2">
                    {formatTime(item.createdAt)}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/35 truncate">
                Profil masque reserve aux membres Business Pro
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function FreeConversationsView({
  conversations,
  onUpgrade,
}: {
  conversations: ConversationItem[]
  onUpgrade: () => void
}) {
  if (conversations.length === 0) {
    return (
      <div className="pt-6">
        <FreeUpgradeCTA onUpgrade={onUpgrade} />
      </div>
    )
  }

  return (
    <div className="space-y-0 pt-2 select-none">
      {conversations.map((item, index) => (
        <div key={item.id}>
          {index === 3 && <FreeUpgradeCTA onUpgrade={onUpgrade} />}

          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
            className="flex items-center gap-3 p-3 rounded-2xl cursor-default"
          >
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-dark-300 ring-2 ring-offset-2 ring-offset-dark ring-white/[0.06]">
                {item.otherUser.photos?.[0] ? (
                  <img
                    src={(item.otherUser.photos as string[])[0]}
                    alt=""
                    className="w-full h-full object-cover blur-[16px] scale-[1.35] brightness-[0.55] saturate-[0.7]"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-dark-300 to-dark-400" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="h-[14px] w-24 rounded-full bg-white/[0.07]" />
                {item.lastMessageAt && (
                  <span className="text-[10px] text-white/25 shrink-0 ml-2">
                    {formatTime(item.lastMessageAt)}
                  </span>
                )}
              </div>
              <div className="h-[11px] w-40 rounded-full bg-white/[0.04]" />
            </div>
          </motion.div>
        </div>
      ))}

      {conversations.length < 4 && conversations.length > 0 && (
        <FreeUpgradeCTA onUpgrade={onUpgrade} />
      )}
    </div>
  )
}

export default function MatchesPage() {
  const supabase = useMemo(() => createClient(), [])
  const db = supabase as any
  const router = useRouter()
  const { profile, refreshNotifications } = useAppStore()

  const currentPlan = normalizePlan(profile?.plan)
  const isBusinessPro = currentPlan === 'business_pro'
  const isFree = currentPlan === 'free'

  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [likes, setLikes] = useState<LikeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [openingConversation, setOpeningConversation] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('matches')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Resolve auth — don't rely on useSession() which can have timing issues
  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      if (data.session?.user?.id) {
        setCurrentUserId(data.session.user.id)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setCurrentUserId(session?.user?.id ?? null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleCheckout = async (plan: 'business' | 'business_pro') => {
    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      const token = currentSession?.access_token

      if (!token) {
        toast.error('Utilisateur non connecte')
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
      console.error('[MATCHES] checkout error', error)
      toast.error(error instanceof Error ? error.message : 'Erreur Stripe')
    }
  }

  const markMatchViewed = useCallback(
    async (matchId: string) => {
      if (!matchId || matchId.startsWith('conversation-match-')) return

      const { error } = await db.from('matches').update({ is_viewed: true }).eq('id', matchId)

      if (error) {
        console.error('[MATCHES] mark match viewed error', { matchId, error })
        return
      }

      setMatches((prev) =>
        prev.map((item) => (item.id === matchId ? { ...item, isViewed: true } : item))
      )
      refreshNotifications()
    },
    [db, refreshNotifications]
  )

  const markReceivedLikesViewed = useCallback(async () => {
    if (!currentUserId) return

    const hasUnreadLikes = likes.some((like) => !like.isViewed)
    if (!hasUnreadLikes) return

    const { error } = await db
      .from('likes')
      .update({ is_viewed: true })
      .eq('liked_id', currentUserId)
      .eq('is_viewed', false)

    if (error) {
      console.error('[MATCHES] mark received likes viewed error', {
        currentUserId,
        error,
      })
      return
    }

    setLikes((prev) => prev.map((like) => ({ ...like, isViewed: true })))
    refreshNotifications()
  }, [currentUserId, db, likes, refreshNotifications])

  const loadData = useCallback(async () => {
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
        db
          .from('likes')
          .select('id, liker_id, created_at, is_viewed')
          .eq('liked_id', currentUserId)
          .order('created_at', { ascending: false }),
      ])

      if (conversationsError) {
        console.error('[MATCHES] conversations select error', conversationsError)
      }

      if (matchesError) {
        console.error('[MATCHES] matches select error', matchesError)
      }

      if (likesError) {
        console.error('[MATCHES] likes select error', likesError)
      }

      const conversationRows = conversationsError ? [] : ((conversationsData || []) as ConversationRow[])
      const matchRows = matchesError ? [] : ((matchesData || []) as MatchRow[])
      const likeRows = likesError ? [] : ((likesData || []) as LikeRow[])

      console.log('[MATCHES] fetched data', {
        conversations: conversationRows.length,
        matches: matchRows.length,
        likes: likeRows.length,
        currentUserId,
      })

      const conversationOtherIds = conversationRows.map((conversation) =>
        conversation.user1_id === currentUserId ? conversation.user2_id : conversation.user1_id
      )

      const matchOtherIds = matchRows.map((match) =>
        match.user1_id === currentUserId ? match.user2_id : match.user1_id
      )

      const likeOtherIds = likeRows.map((like) => like.liker_id)

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
          console.error('[MATCHES] profiles select error', profilesError)
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

          const { data: lastMessageData, error: lastMessageError } = await db
            .from('messages')
            .select('content, created_at, message_type, sender_id')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (lastMessageError) {
            console.error('[MATCHES] last message select error', {
              conversationId: conversation.id,
              error: lastMessageError,
            })
          }

          const lastMessage = (lastMessageData || null) as LastMessageRow | null

          return {
            id: conversation.id,
            type: 'conversation' as const,
            otherUser,
            lastMessage: formatLastMessage(lastMessage, currentUserId, otherUser),
            lastMessageAt: lastMessage?.created_at || conversation.created_at || null,
            isLocked: !canChat(profile?.plan, otherUser.plan),
          }
        })
      )

      const matchItemsByPair = new Map<string, MatchItem>()

      matchRows.forEach((match) => {
        const otherUserId = match.user1_id === currentUserId ? match.user2_id : match.user1_id
        const pairKey = getPairKey(currentUserId, otherUserId)
        const otherUser = profileMap.get(otherUserId) || createFallbackProfile(otherUserId)
        const linkedConversation = conversationByPair.get(pairKey)
        const locked = !canChat(profile?.plan, otherUser.plan)

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

      const cleanMatchItems = Array.from(matchItemsByPair.values())

      const likeItems = likeRows.map((like) => {
        const pairKey = getPairKey(currentUserId, like.liker_id)
        const linkedMatch = matchItemsByPair.get(pairKey)
        const linkedConversation = conversationByPair.get(pairKey)
        const otherUser = profileMap.get(like.liker_id) || createFallbackProfile(like.liker_id)

        return {
          id: like.liker_id,
          likeId: like.id,
          otherUser,
          createdAt: like.created_at || null,
          isViewed: Boolean(like.is_viewed),
          isMatched: Boolean(linkedMatch),
          conversationId: linkedConversation?.id || linkedMatch?.conversationId || null,
        }
      })

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
    } catch (error) {
      console.error('[MATCHES] loadData catch', error)
      toast.error('Erreur chargement messages')
      setConversations([])
      setMatches([])
      setLikes([])
    } finally {
      setLoading(false)
    }
  }, [currentUserId, db, profile?.plan])

  // Load data when userId is resolved
  useEffect(() => {
    loadData()
  }, [loadData])

  // Realtime subscription — refresh on changes to matches, likes, messages
  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel(`matches-page-realtime-${currentUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => {
          console.log('[MATCHES] realtime matches change detected')
          loadData()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'likes' },
        () => {
          console.log('[MATCHES] realtime likes change detected')
          loadData()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => loadData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => loadData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, loadData, supabase])

  useEffect(() => {
    if (tab === 'likes') {
      void markReceivedLikesViewed()
    }
  }, [markReceivedLikesViewed, tab])

  const openConversation = async (
    otherUserId: string,
    existingConversationId?: string | null,
    matchId?: string | null,
    locked?: boolean
  ) => {
    if (!currentUserId || !otherUserId) return

    if (matchId) {
      await markMatchViewed(matchId)
    }

    if (locked) {
      toast.error('Conversation verrouillée. Passe Business pour discuter.')
      return
    }

    setOpeningConversation(otherUserId)

    try {
      if (existingConversationId) {
        const { error: readError } = await db
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', existingConversationId)
          .neq('sender_id', currentUserId)
          .eq('is_read', false)

        if (readError) {
          console.error('[MATCHES] mark messages read error', {
            conversationId: existingConversationId,
            error: readError,
          })
        }

        refreshNotifications()
        router.push(`/chat/${existingConversationId}?type=match&userId=${otherUserId}`)
        return
      }

      const { data: conversationId, error } = await db.rpc('get_or_create_conversation', {
        other_user_id: otherUserId,
      })

      if (error) {
        console.error('[MATCHES] get_or_create_conversation error', error)
        toast.error(`Erreur conversation: ${error.message}`)
        return
      }

      if (!conversationId) {
        console.error('[MATCHES] get_or_create_conversation returned null', {
          currentUserId,
          otherUserId,
        })
        toast.error('Conversation introuvable')
        return
      }

      refreshNotifications()
      router.push(`/chat/${conversationId}?type=match&userId=${otherUserId}`)
    } catch (error) {
      console.error('[MATCHES] openConversation catch', error)
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
            {matches.length > 0 && (
              <span className="ml-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {matches.length > 9 ? '9+' : matches.length}
              </span>
            )}
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
            {likes.length > 0 && (
              <span className="ml-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {likes.length > 9 ? '9+' : likes.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab('conversations')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              tab === 'conversations' ? 'bg-gold text-dark' : 'text-white/50'
            }`}
          >
            <MessageCircle size={15} />
            Conv.
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
          isFree ? (
            <FreeMatchesView
              matches={matches}
              onUpgrade={() => handleCheckout('business')}
              onMarkViewed={markMatchViewed}
            />
          ) : matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-2/3 text-center gap-4">
              <span className="text-5xl">⚔️</span>
              <div>
                <h3 className="font-semibold text-lg mb-1">Pas encore de matchs</h3>
                <p className="text-white/40 text-sm">Continue a swiper pour trouver tes matchs !</p>
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
                    className={`rounded-2xl ${
                      item.isLocked ? 'bg-dark-200/50 border border-gold/10 p-1' : ''
                    }`}
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
                                item.isLocked ? 'blur-[14px] scale-[1.3] brightness-[0.5] saturate-[0.65]' : ''
                              }`}
                            />
                          ) : (
                            <div
                              className={`w-full h-full flex items-center justify-center text-2xl ${
                                item.isLocked ? 'blur-[10px] brightness-[0.5]' : ''
                              }`}
                            >
                              👤
                            </div>
                          )}
                        </div>

                        <div className="absolute -bottom-0.5 -right-0.5 bg-gold text-dark text-[9px] font-black px-1 py-0.5 rounded-full">
                          {item.isLocked ? <Lock size={10} /> : '✓'}
                        </div>

                        {!item.isViewed && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-dark" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="font-semibold truncate">
                            {item.isLocked
                              ? 'Match verrouille'
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
                            ? 'Les deux membres doivent etre Business'
                            : isOpening
                              ? 'Ouverture...'
                              : 'Nouveau match ! Dis bonjour'}
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
            <FreeLikesView likes={likes} onUpgrade={() => handleCheckout('business_pro')} />
          ) : likes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-2/3 text-center gap-4">
              <span className="text-5xl">👑</span>
              <div>
                <h3 className="font-semibold text-lg mb-1">Aucun like pour le moment</h3>
                <p className="text-white/40 text-sm">Les personnes qui te likent apparaitront ici.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1 pt-2">
              {likes.map((item, index) => {
                const isOpening = openingConversation === item.otherUser.id
                const canOpen = item.conversationId

                return (
                  <motion.div
                    key={item.likeId}
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
                              ? "Cette personne t'a like"
                              : 'Like recu'}
                        </p>
                      </div>
                    </button>
                  </motion.div>
                )
              })}
            </div>
          )
        ) : isFree ? (
          <FreeConversationsView
            conversations={conversations}
            onUpgrade={() => handleCheckout('business')}
          />
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-2/3 text-center gap-4">
            <span className="text-5xl">✉️</span>
            <div>
              <h3 className="font-semibold text-lg mb-1">Aucune conversation pour le moment</h3>
              <p className="text-white/40 text-sm">
                Tes conversations apparaitront ici quand les deux membres pourront discuter.
              </p>
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
                  className={item.isLocked ? 'rounded-2xl bg-dark-200/50 border border-gold/10 p-1' : ''}
                >
                  <button
                    type="button"
                    disabled={isOpening}
                    onClick={() => openConversation(item.otherUser.id, item.id, null, item.isLocked)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-dark-200 active:bg-dark-300 transition-colors text-left disabled:opacity-60"
                  >
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-dark-300 ring-2 ring-offset-2 ring-offset-dark ring-gold/30">
                        {item.otherUser.photos?.[0] ? (
                          <img
                            src={(item.otherUser.photos as string[])[0]}
                            alt=""
                            className={`w-full h-full object-cover ${
                              item.isLocked ? 'blur-[14px] scale-[1.3] brightness-[0.5] saturate-[0.65]' : ''
                            }`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-semibold truncate">
                          {item.isLocked
                            ? 'Conversation verrouillée'
                            : item.otherUser.first_name || item.otherUser.email || 'Profil'}
                        </p>

                        {item.lastMessageAt && (
                          <span className="text-white/30 text-xs shrink-0 ml-2">
                            {formatTime(item.lastMessageAt)}
                          </span>
                        )}
                      </div>

                      <p className="text-white/40 text-sm truncate">
                        {item.isLocked
                          ? 'Les deux membres doivent etre Business'
                          : isOpening
                            ? 'Ouverture...'
                            : lastMessage}
                      </p>
                    </div>
                  </button>

                  {item.isLocked && <LockedMatchOverlay onUpgrade={() => handleCheckout('business')} />}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
