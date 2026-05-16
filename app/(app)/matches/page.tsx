'use client'

// app/(app)/matches/page.tsx

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { formatTime, normalizePlan, isPaidPlan as isPaidPlanUtil, canChat } from '@/lib/utils'
import type { Profile } from '@/lib/supabase/types'
import { MessageCircle, Users, Crown, Lock, Heart, Zap, X, ChevronLeft } from 'lucide-react'
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

interface EncouragementRow {
  id: string
  sender_id: string
  target_id: string
  created_at?: string | null
}

interface MatchItem {
  id: string
  type: 'match'
  otherUser: Profile
  conversationId: string | null
  createdAt: string | null
  isViewed: boolean
  hasEncouragement: boolean
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
  const prefix = isMine ? 'Vous' : otherUserName

  if (lastMessage.message_type === 'audio') return `${prefix} a envoye un vocal`
  if (lastMessage.message_type === 'image') return `${prefix} a envoye une photo`
  if (lastMessage.message_type === 'file') return `${prefix} a envoye un document`
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
    skills: null,
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
            Passe Business pour debloquer tes conversations et developper ton reseau.
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

      {likes.length > 0 && (
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
      )}
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
  const userCanChat = isPaidPlan(currentPlan)

  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [likes, setLikes] = useState<LikeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [openingConversation, setOpeningConversation] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('matches')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showChatPaywall, setShowChatPaywall] = useState(false)
  const [selectedLike, setSelectedLike] = useState<LikeItem | null>(null)
  const [likeActionLoading, setLikeActionLoading] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)

  // Resolve auth
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
      if (!matchId) return

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
      console.error('[MATCHES] mark received likes viewed error', { currentUserId, error })
      return
    }

    setLikes((prev) => prev.map((like) => ({ ...like, isViewed: true })))
    refreshNotifications()
  }, [currentUserId, db, likes, refreshNotifications])

  const handleAcceptLike = useCallback(async (likeItem: LikeItem) => {
    if (!currentUserId || likeActionLoading) return
    setLikeActionLoading(true)

    try {
      const otherUserId = likeItem.otherUser.id

      // 1. Record our like back
      const { error: likeError } = await db.from('likes').upsert(
        { liker_id: currentUserId, liked_id: otherUserId },
        { onConflict: 'liker_id,liked_id' }
      )
      if (likeError) {
        console.error('[MATCHES] accept like - like insert error', likeError)
        toast.error('Erreur lors du like')
        return
      }

      // 2. Record swipe
      await db.from('swipes').upsert(
        { swiper_id: currentUserId, target_id: otherUserId, action: 'like' },
        { onConflict: 'swiper_id,target_id' }
      )

      // 3. Create match via API (service role, bypasses RLS)
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      const token = currentSession?.access_token

      if (token) {
        const res = await fetch('/api/matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ otherUserId }),
        })
        const payload = await res.json().catch(() => null)
        if (!res.ok) {
          console.error('[MATCHES] accept like - match API error', payload)
        }
      }

      // 4. Remove from local likes state
      setLikes((prev) => prev.filter((l) => l.likeId !== likeItem.likeId))
      setSelectedLike(null)
      setSelectedPhotoIndex(0)

      toast.success('Match cree !')
      refreshNotifications()
      // Realtime subscription will auto-reload the data
    } catch (error) {
      console.error('[MATCHES] accept like catch', error)
      toast.error('Erreur')
    } finally {
      setLikeActionLoading(false)
    }
  }, [currentUserId, db, likeActionLoading, refreshNotifications, supabase])

  const handleRejectLike = useCallback(async (likeItem: LikeItem) => {
    if (!currentUserId || likeActionLoading) return
    setLikeActionLoading(true)

    try {
      // Record a dislike swipe so they don't reappear
      await db.from('swipes').upsert(
        { swiper_id: currentUserId, target_id: likeItem.otherUser.id, action: 'dislike' },
        { onConflict: 'swiper_id,target_id' }
      )

      // Remove from local state
      setLikes((prev) => prev.filter((l) => l.likeId !== likeItem.likeId))
      setSelectedLike(null)
      setSelectedPhotoIndex(0)

      refreshNotifications()
    } catch (error) {
      console.error('[MATCHES] reject like catch', error)
      toast.error('Erreur')
    } finally {
      setLikeActionLoading(false)
    }
  }, [currentUserId, db, likeActionLoading, refreshNotifications])

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
        { data: encouragementsData, error: encouragementsError },
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
        db
          .from('encouragements')
          .select('id, sender_id, target_id, created_at')
          .eq('target_id', currentUserId)
          .order('created_at', { ascending: false }),
      ])

      if (conversationsError) console.error('[MATCHES] conversations select error', conversationsError)
      if (matchesError) console.error('[MATCHES] matches select error', matchesError)
      if (likesError) console.error('[MATCHES] likes select error', likesError)
      if (encouragementsError) console.error('[MATCHES] encouragements select error', encouragementsError)

      const conversationRows = conversationsError ? [] : ((conversationsData || []) as ConversationRow[])
      const matchRows = matchesError ? [] : ((matchesData || []) as MatchRow[])
      const likeRows = likesError ? [] : ((likesData || []) as LikeRow[])
      const encouragementRows = encouragementsError ? [] : ((encouragementsData || []) as EncouragementRow[])

      // Build a set of sender IDs who encouraged the current user
      const encouragedBySet = new Set(encouragementRows.map((e) => e.sender_id))

      console.log('[MATCHES] fetched', { conversations: conversationRows.length, matches: matchRows.length, likes: likeRows.length })

      const conversationOtherIds = conversationRows.map((c) =>
        c.user1_id === currentUserId ? c.user2_id : c.user1_id
      )
      const matchOtherIds = matchRows.map((m) =>
        m.user1_id === currentUserId ? m.user2_id : m.user1_id
      )
      const likeOtherIds = likeRows.map((l) => l.liker_id)

      const allUserIds = Array.from(new Set([...conversationOtherIds, ...matchOtherIds, ...likeOtherIds]))

      let profileMap = new Map<string, Profile>()

      if (allUserIds.length > 0) {
        const { data: profilesData, error: profilesError } = await db
          .from('profiles')
          .select('*')
          .in('id', allUserIds)

        if (profilesError) {
          console.error('[MATCHES] profiles select error', profilesError)
        } else {
          profileMap = new Map((profilesData as Profile[]).map((p) => [p.id, p]))
        }
      }

      const conversationByPair = new Map<string, ConversationRow>()
      conversationRows.forEach((c) => {
        conversationByPair.set(getPairKey(c.user1_id, c.user2_id), c)
      })

      // Build conversations
      const conversationItems = await Promise.all(
        conversationRows.map(async (conversation) => {
          const otherUserId = conversation.user1_id === currentUserId ? conversation.user2_id : conversation.user1_id
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
            isLocked: !canChat(profile?.plan, otherUser.plan),
          }
        })
      )

      // Build matches — NO isLocked, matches are always visible
      const matchItemsByPair = new Map<string, MatchItem>()
      matchRows.forEach((match) => {
        const otherUserId = match.user1_id === currentUserId ? match.user2_id : match.user1_id
        const pairKey = getPairKey(currentUserId, otherUserId)
        const otherUser = profileMap.get(otherUserId) || createFallbackProfile(otherUserId)
        const linkedConversation = conversationByPair.get(pairKey)

        matchItemsByPair.set(pairKey, {
          id: match.id,
          type: 'match',
          otherUser,
          conversationId: linkedConversation?.id || null,
          createdAt: match.created_at || null,
          isViewed: Boolean(match.is_viewed),
          hasEncouragement: encouragedBySet.has(otherUserId),
        })
      })

      const cleanMatchItems = Array.from(matchItemsByPair.values())

      // Build likes — exclude already-matched users
      const likeItems = likeRows.filter((like) => {
        const pairKey = getPairKey(currentUserId, like.liker_id)
        return !matchItemsByPair.has(pairKey)
      }).map((like) => {
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

      // Sort
      conversationItems.sort((a, b) => {
        const aT = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
        const bT = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
        return bT - aT
      })
      cleanMatchItems.sort((a, b) => {
        const aT = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bT = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return bT - aT
      })
      likeItems.sort((a, b) => {
        const aT = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bT = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return bT - aT
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

  useEffect(() => {
    loadData()
  }, [loadData])

  // Realtime
  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel(`matches-page-rt-${currentUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'encouragements' }, () => loadData())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, loadData, supabase])

  useEffect(() => {
    if (tab === 'likes') void markReceivedLikesViewed()
    if (tab === 'matches') {
      // Mark all unviewed matches as viewed when switching to matches tab
      const unviewedMatches = matches.filter((m) => !m.isViewed)
      if (unviewedMatches.length > 0) {
        for (const m of unviewedMatches) {
          void markMatchViewed(m.id)
        }
      }
    }
  }, [markReceivedLikesViewed, markMatchViewed, matches, tab])

  // Open conversation — paywall check happens HERE
  const openConversation = async (
    otherUserId: string,
    existingConversationId?: string | null,
    matchId?: string | null
  ) => {
    if (!currentUserId || !otherUserId) return

    // Mark match as viewed regardless of plan
    if (matchId) await markMatchViewed(matchId)

    setOpeningConversation(otherUserId)

    try {
      if (existingConversationId) {
        await db
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', existingConversationId)
          .neq('sender_id', currentUserId)
          .eq('is_read', false)

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

  // ─── RENDER ─────────────────────────────────────────────

  const unviewedMatchCount = matches.filter((m) => !m.isViewed).length

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
            {(() => {
              const unreadMatchCount = matches.filter((m) => !m.isViewed).length
              if (unreadMatchCount > 0) {
                return (
                  <span className="ml-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadMatchCount > 9 ? '9+' : unreadMatchCount}
                  </span>
                )
              }
              if (matches.length > 0) {
                return (
                  <span className="ml-1 min-w-5 h-5 px-1 rounded-full bg-gold/15 text-gold/70 text-[10px] font-semibold flex items-center justify-center">
                    {matches.length}
                  </span>
                )
              }
              return null
            })()}
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
            {(() => {
              const unreadLikeCount = likes.filter((l) => !l.isViewed).length
              if (unreadLikeCount > 0) {
                return (
                  <span className="ml-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadLikeCount > 9 ? '9+' : unreadLikeCount}
                  </span>
                )
              }
              if (likes.length > 0) {
                return (
                  <span className="ml-1 min-w-5 h-5 px-1 rounded-full bg-gold/15 text-gold/70 text-[10px] font-semibold flex items-center justify-center">
                    {likes.length}
                  </span>
                )
              }
              return null
            })()}
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
          /* ── MATCHES TAB — visible for ALL plans, no blur ── */
          matches.length === 0 ? (
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
                const showEncourageBanner = !userCanChat && item.hasEncouragement
                const otherName = item.otherUser.first_name || 'Cette personne'

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={showEncourageBanner ? 'rounded-2xl border border-gold/15 bg-dark-200/40 overflow-hidden' : ''}
                  >
                    <button
                      type="button"
                      disabled={isOpening}
                      onClick={() => openConversation(item.otherUser.id, item.conversationId, item.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-dark-200 active:bg-dark-300 transition-colors text-left disabled:opacity-60"
                    >
                      {/* Avatar — always clear, never blurred */}
                      <div className="relative shrink-0">
                        <div className={`w-14 h-14 rounded-full overflow-hidden bg-dark-300 ring-2 ring-offset-2 ring-offset-dark ${showEncourageBanner ? 'ring-gold/50' : 'ring-gold/30'}`}>
                          {item.otherUser.photos?.[0] ? (
                            <img
                              src={(item.otherUser.photos as string[])[0]}
                              alt={item.otherUser.first_name || ''}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">
                              👤
                            </div>
                          )}
                        </div>

                        <div className="absolute -bottom-0.5 -right-0.5 bg-gold text-dark text-[9px] font-black px-1 py-0.5 rounded-full">
                          {showEncourageBanner ? <Zap size={10} /> : '✓'}
                        </div>

                        {!item.isViewed && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-dark" />
                        )}
                      </div>

                      {/* Info — real name, real time, always visible */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="font-semibold truncate">
                            {otherName}
                            {item.otherUser.age ? `, ${item.otherUser.age}` : ''}
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
                            : userCanChat
                              ? isPaidPlanUtil(item.otherUser.plan)
                                ? 'Nouveau match ! Dis bonjour'
                                : 'En attente du plan Business de ce membre'
                              : showEncourageBanner
                                ? 'Souhaite echanger avec vous'
                                : 'Passe Business pour discuter'}
                        </p>
                      </div>

                      {/* Lock icon hint for free users */}
                      {!userCanChat && !showEncourageBanner && (
                        <div className="shrink-0 w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                          <Lock size={14} className="text-gold/60" />
                        </div>
                      )}
                    </button>

                    {/* Encouragement banner — only for free users who received one */}
                    {showEncourageBanner && (
                      <div className="px-3 pb-3">
                        <div className="rounded-[12px] border border-gold/15 bg-gradient-to-r from-gold/[0.06] to-transparent p-3">
                          <div className="flex items-start gap-2.5">
                            <div className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-gold/15 border border-gold/25 flex items-center justify-center">
                              <Zap size={13} className="text-gold" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] leading-[1.55] text-white/60">
                                <span className="font-semibold text-white/80">{otherName}</span>
                                {' '}utilise deja PAKT Business et vous encourage a faire de meme pour echanger ensemble.
                              </p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCheckout('business')
                                }}
                                className="mt-2 h-[30px] px-4 rounded-[8px] bg-gold text-dark text-[11px] font-bold hover:bg-gold-light active:scale-[0.97] transition-all"
                              >
                                Passer Business
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )
        ) : tab === 'likes' ? (
          /* ── LIKES TAB — blurred for non-Pro ── */
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

                return (
                  <motion.div
                    key={item.likeId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <button
                      type="button"
                      disabled={likeActionLoading}
                      onClick={() => {
                        setSelectedLike(item)
                        setSelectedPhotoIndex(0)
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
                            <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="font-semibold truncate">
                            {item.otherUser.first_name || 'Profil'}
                            {item.otherUser.age ? `, ${item.otherUser.age}` : ''}
                          </p>
                          {item.createdAt && (
                            <span className="text-white/30 text-xs shrink-0 ml-2">
                              {formatTime(item.createdAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-white/40 text-sm truncate">
                          {likeActionLoading ? 'Chargement...' : "Cette personne t'a like"}
                        </p>
                      </div>

                      <div className="shrink-0 w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                        <ChevronLeft size={14} className="text-gold/60 rotate-180" />
                      </div>
                    </button>
                  </motion.div>
                )
              })}
            </div>
          )
        ) : (
          /* ── CONVERSATIONS TAB ── */
          isFree ? (
            <FreeConversationsView
              conversations={conversations}
              onUpgrade={() => handleCheckout('business')}
            />
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-2/3 text-center gap-4">
              <span className="text-5xl">✉️</span>
              <div>
                <h3 className="font-semibold text-lg mb-1">Aucune conversation</h3>
                <p className="text-white/40 text-sm">
                  Tes conversations apparaitront ici apres un match.
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
                      onClick={() => openConversation(item.otherUser.id, item.id, null)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-dark-200 active:bg-dark-300 transition-colors text-left disabled:opacity-60"
                    >
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-dark-300 ring-2 ring-offset-2 ring-offset-dark ring-gold/30">
                          {item.otherUser.photos?.[0] ? (
                            <img
                              src={(item.otherUser.photos as string[])[0]}
                              alt=""
                              className={`w-full h-full object-cover ${
                                item.isLocked && !userCanChat ? 'blur-[14px] scale-[1.3] brightness-[0.5] saturate-[0.65]' : ''
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
                            {item.isLocked && !userCanChat
                              ? 'Conversation verrouillée'
                              : item.otherUser.first_name || 'Profil'}
                          </p>
                          {item.lastMessageAt && (
                            <span className="text-white/30 text-xs shrink-0 ml-2">
                              {formatTime(item.lastMessageAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-white/40 text-sm truncate">
                          {item.isLocked
                            ? userCanChat
                              ? 'Ce membre doit passer Business pour répondre'
                              : 'Passe Business pour discuter'
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
          )
        )}
      </div>

      {/* ── Chat Paywall Modal ── */}
      <AnimatePresence>
        {showChatPaywall && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowChatPaywall(false)}
              className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[91] max-w-sm mx-auto"
            >
              <div className="relative overflow-hidden rounded-[20px] border border-gold/20 bg-[#111111] shadow-[0_25px_70px_rgba(0,0,0,0.6),0_0_40px_rgba(212,168,83,0.08)]">
                <div className="absolute inset-0 bg-gradient-to-b from-gold/[0.04] to-transparent pointer-events-none" />

                <div className="relative px-6 pt-7 pb-6 text-center">
                  <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center">
                    <MessageCircle size={22} className="text-gold" />
                  </div>

                  <h3 className="text-[17px] font-bold text-white leading-snug">
                    Messagerie reservee aux membres Business
                  </h3>

                  <p className="mt-2.5 text-[13px] leading-relaxed text-white/45 max-w-[260px] mx-auto">
                    Passe a PAKT Business pour envoyer des messages a tes matchs et developper ton reseau.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setShowChatPaywall(false)
                      handleCheckout('business')
                    }}
                    className="mt-5 h-[46px] w-full rounded-[13px] bg-gradient-to-r from-gold to-[#e2c06d] text-dark text-[13.5px] font-bold shadow-[0_4px_20px_rgba(212,168,83,0.25)] hover:shadow-[0_6px_30px_rgba(212,168,83,0.4)] active:scale-[0.98] transition-all"
                  >
                    Passer a PAKT Business
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowChatPaywall(false)}
                    className="mt-2.5 h-[42px] w-full rounded-[12px] border border-white/10 bg-white/[0.04] text-white/50 text-[13px] font-medium hover:bg-white/[0.08] hover:text-white/70 transition-all"
                  >
                    Annuler
                  </button>

                  <p className="mt-3 text-[11px] text-white/20">Annulable a tout moment</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Business Pro: Like Profile Viewer ── */}
      <AnimatePresence>
        {selectedLike && (
          <motion.div
            key="like-profile-viewer"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="fixed inset-0 z-[100] bg-dark overflow-y-auto"
          >
            {(() => {
              const p = selectedLike.otherUser
              const photos = Array.isArray(p.photos)
                ? (p.photos as string[]).filter((s) => typeof s === 'string' && s.trim().length > 0)
                : []
              const interests = Array.isArray(p.interests)
                ? (p.interests as string[]).filter((s) => typeof s === 'string' && s.trim().length > 0)
                : []
              const safeIdx = photos.length > 0 ? selectedPhotoIndex % photos.length : 0

              return (
                <>
                  {/* Back button */}
                  <button
                    type="button"
                    onClick={() => setSelectedLike(null)}
                    className="absolute top-4 left-4 z-[110] w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft size={20} className="text-white" />
                  </button>

                  <div className="flex flex-col items-center pb-36">
                    <div className="max-w-md mx-auto px-4 py-6 space-y-6 w-full">
                      {/* Photo */}
                      <div className="relative">
                        {photos.length > 0 ? (
                          <img
                            src={photos[safeIdx]}
                            className="w-full aspect-[3/4] object-cover rounded-2xl cursor-pointer select-none"
                            alt={p.first_name || ''}
                            draggable={false}
                            onClick={() => {
                              if (photos.length <= 1) return
                              setSelectedPhotoIndex((prev) => (prev + 1) % photos.length)
                            }}
                          />
                        ) : (
                          <div className="w-full aspect-[3/4] rounded-2xl bg-dark-300 flex items-center justify-center">
                            <span className="text-8xl">👤</span>
                          </div>
                        )}

                        {/* Photo dots */}
                        {photos.length > 1 && (
                          <div className="absolute top-2 left-0 right-0 flex justify-center gap-1 z-20 pointer-events-none">
                            {photos.map((_, i) => (
                              <div
                                key={i}
                                className={`h-1 w-6 rounded-full transition ${
                                  i === safeIdx ? 'bg-white' : 'bg-white/30'
                                }`}
                              />
                            ))}
                          </div>
                        )}

                        {/* "Liked you" badge */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                          <span className="inline-flex items-center rounded-full bg-gold text-dark px-4 py-1.5 text-xs font-bold shadow-lg">
                            Cette personne vous a like
                          </span>
                        </div>
                      </div>

                      {/* Name / Age / City */}
                      <div>
                        <h2 className="text-white font-medium text-xl">
                          {p.first_name || 'Utilisateur'},{' '}
                          <span className="text-white/80 font-normal text-lg">{p.age ?? ''}</span>
                        </h2>
                        {p.city ? <p className="text-white/60">{p.city}</p> : null}
                      </div>

                      {/* Bio */}
                      <div className="bg-dark-200 border border-dark-500 rounded-[12px] p-4">
                        <p className="text-white/70 text-sm leading-relaxed">{p.bio || 'Aucune bio'}</p>
                      </div>

                      {/* Interests */}
                      {interests.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {interests.map((interest) => (
                            <span key={interest} className="bg-dark-300 text-white/70 text-xs px-3 py-1 rounded-full">
                              {interest}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Accept / Reject buttons — fixed at bottom */}
                  <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110]">
                    <div className="flex items-center justify-center gap-6">
                      {/* Reject */}
                      <motion.button
                        type="button"
                        disabled={likeActionLoading}
                        onClick={() => handleRejectLike(selectedLike)}
                        whileHover={{ scale: 1.06, y: -2 }}
                        whileTap={{ scale: 0.94 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                        className="w-[68px] h-[68px] rounded-full flex items-center justify-center bg-black/55 border border-red-500/20 shadow-[0_18px_45px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.10)] hover:border-red-400/35 backdrop-blur-xl disabled:opacity-35 disabled:pointer-events-none"
                        aria-label="Refuser"
                      >
                        <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 to-transparent opacity-70" />
                        <X size={28} strokeWidth={2.1} className="relative text-red-300" />
                      </motion.button>

                      {/* Accept */}
                      <motion.button
                        type="button"
                        disabled={likeActionLoading}
                        onClick={() => handleAcceptLike(selectedLike)}
                        whileHover={{ scale: 1.07, y: -2 }}
                        whileTap={{ scale: 0.94 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                        className="w-[68px] h-[68px] rounded-full flex items-center justify-center bg-gold border border-gold-light/50 shadow-[0_18px_45px_rgba(0,0,0,0.42),0_0_34px_rgba(212,168,83,0.28),inset_0_1px_0_rgba(255,255,255,0.35)] hover:bg-gold-light backdrop-blur-xl disabled:opacity-35 disabled:pointer-events-none"
                        aria-label="Accepter"
                      >
                        <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent opacity-80" />
                        <Heart size={28} strokeWidth={2.1} className="relative text-dark fill-dark/10" />
                      </motion.button>
                    </div>
                  </div>
                </>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
