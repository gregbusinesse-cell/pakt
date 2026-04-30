'use client'

// app/(app)/swipe/page.tsx

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'
import SwipeCard from '@/components/swipe/SwipeCard'
import MatchModal from '@/components/swipe/MatchModal'
import type { Profile } from '@/lib/supabase/types'
import { MAX_FREE_SWIPES } from '@/lib/utils'
import { Crown, RefreshCw, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const FREE_SWIPE_LIMIT = 10
const FREE_MESSAGE_LIMIT = 1
const STACK_RENDER_COUNT = 3

type ProfileWithLocation = Profile & {
  city_lat?: number | null
  city_lng?: number | null
  messages_today?: number | null
  last_message_date?: string | null
  preferences?: {
    distance_km?: number
  } | null
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0]
}

function PaywallModal({
  open,
  onClose,
  onUpgrade,
}: {
  open: boolean
  onClose: () => void
  onUpgrade: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center px-5">
        <div className="w-full max-w-md bg-dark-200 border border-dark-500 rounded-[12px] p-5">
          <h3 className="text-white font-semibold text-lg">Continuer avec PAKT Business</h3>
          <p className="text-white/60 text-sm mt-2 leading-relaxed">
            Vous avez atteint la limite gratuite. Passez à PAKT Business pour continuer a swiper et
            envoyer des messages sans limite.
          </p>

          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={onUpgrade}
              className="h-[48px] w-full flex items-center justify-center rounded-[12px] bg-gold text-dark font-bold hover:bg-gold-light transition-colors"
            >
              Passer a PAKT Business
            </button>

            <button
              type="button"
              onClick={onClose}
              className="h-[48px] w-full flex items-center justify-center rounded-[12px] border border-dark-500 bg-[#1e1e1e] text-white/70 hover:text-white hover:border-dark-400 transition-colors"
            >
              Pas interesse
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SwipePage() {
  const supabase = createClient()
  const db = supabase as any
  const router = useRouter()
  const { profile, setProfile } = useAppStore()

  const [session, setSession] = useState<any>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [likedMeIds, setLikedMeIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null)
  const [showMatch, setShowMatch] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [swipesCount, setSwipesCount] = useState(0)
  const [messagesCount, setMessagesCount] = useState(0)
  const [countsDate, setCountsDate] = useState(getTodayKey())

  const profileWithLocation = profile as ProfileWithLocation | null
  const sessionUserId = session?.user?.id
  const sessionProvider = session?.user?.app_metadata?.provider
  const sessionEmailConfirmedAt = session?.user?.email_confirmed_at

  const userLat = profileWithLocation?.city_lat ?? null
  const userLng = profileWithLocation?.city_lng ?? null
  const maxDistance = profileWithLocation?.preferences?.distance_km ?? 50
  const todayKey = getTodayKey()

  const isFree = profile?.plan === 'free'
  const profileMessagesToday =
    profileWithLocation?.last_message_date === todayKey ? profileWithLocation?.messages_today || 0 : 0
  const reachedMessageLimit = isFree && profileMessagesToday >= FREE_MESSAGE_LIMIT
  const reachedSwipeLimit = isFree && swipesCount >= FREE_SWIPE_LIMIT

  const isEmailVerified = Boolean(sessionEmailConfirmedAt) || profile?.email_confirmed === true

  const persistCounts = useCallback(
    (nextSwipes: number, nextMessages: number) => {
      try {
        localStorage.setItem(
          'pakt:limits',
          JSON.stringify({ date: countsDate, swipesCount: nextSwipes, messagesCount: nextMessages })
        )
      } catch {}
    },
    [countsDate]
  )

  const openPaywall = useCallback(() => {
    setPaywallOpen(true)
  }, [])

  const getOrCreateConversation = useCallback(
    async (otherUserId: string) => {
      console.log('[SWIPE] RPC get_or_create_conversation', { sessionUserId, otherUserId })

      if (!sessionUserId || !otherUserId) {
        throw new Error('IDs conversation manquants')
      }

      const { data, error } = await db.rpc('get_or_create_conversation', {
        other_user_id: otherUserId,
      })

      if (error) {
        console.error('[SWIPE] RPC conversation error', error)
        throw error
      }

      if (!data) {
        throw new Error('Conversation ID vide')
      }

      console.log('[SWIPE] conversation ready', data)
      return data as string
    },
    [db, sessionUserId]
  )

  const createConversationForMatch = useCallback(
    async (otherUserId: string) => {
      console.log('[SWIPE] createConversationForMatch', { otherUserId })

      try {
        const conversationId = await getOrCreateConversation(otherUserId)
        console.log('[SWIPE] match conversation created/found', { conversationId })
        return conversationId
      } catch (error) {
        console.error('[SWIPE] createConversationForMatch error', error)
        toast.error('Erreur création conversation match')
        return null
      }
    },
    [getOrCreateConversation]
  )

  const createMatch = useCallback(
    async (otherUserId: string) => {
      if (!sessionUserId || !otherUserId) return null

      const [user1_id, user2_id] = [sessionUserId, otherUserId].sort()

      console.log('[SWIPE] upsert match', { user1_id, user2_id })

      const { data, error } = await db
        .from('matches')
        .upsert(
          {
            user1_id,
            user2_id,
          },
          {
            onConflict: 'user1_id,user2_id',
          }
        )
        .select('*')
        .single()

      if (error) {
        console.error('[SWIPE] match upsert error', error)
        toast.error(`Erreur match: ${error.message}`)
        return null
      }

      console.log('[SWIPE] match upserted', data)
      return data
    },
    [db, sessionUserId]
  )

  const openMessageConversation = useCallback(
    async (targetProfile: Profile) => {
      console.log('[SWIPE] openMessageConversation start', {
        sessionUserId,
        targetProfileId: targetProfile?.id,
      })

      if (!sessionUserId || !profile || !targetProfile?.id) {
        console.error('[SWIPE] openMessageConversation missing data', {
          sessionUserId,
          profile,
          targetProfile,
        })
        toast.error('Impossible ouvrir la conversation')
        return false
      }

      const currentProfile = profile as ProfileWithLocation
      const today = getTodayKey()
      const currentMessagesToday =
        currentProfile.last_message_date === today ? currentProfile.messages_today || 0 : 0

      if (profile.plan === 'free' && currentMessagesToday >= FREE_MESSAGE_LIMIT) {
        console.log('[SWIPE] message limit reached')
        openPaywall()
        return false
      }

      try {
        const conversationId = await getOrCreateConversation(targetProfile.id)

        if (profile.plan === 'free') {
          const nextMessagesToday = currentMessagesToday + 1
          const updatedProfile = {
            ...profile,
            messages_today: nextMessagesToday,
            last_message_date: today,
          } as Profile

          setMessagesCount(nextMessagesToday)
          persistCounts(swipesCount, nextMessagesToday)
          setProfile(updatedProfile)

          const { error: profileUpdateError } = await db
            .from('profiles')
            .update({
              messages_today: nextMessagesToday,
              last_message_date: today,
            })
            .eq('id', sessionUserId)

          if (profileUpdateError) {
            console.error('[SWIPE] profile message count update error', profileUpdateError)
          }
        }

        router.push(`/chat/${conversationId}?userId=${targetProfile.id}&type=direct`)
        return true
      } catch (error) {
        console.error('[SWIPE] openMessageConversation catch', error)
        toast.error('Erreur ouverture conversation')
        return false
      }
    },
    [
      db,
      getOrCreateConversation,
      openPaywall,
      persistCounts,
      profile,
      router,
      sessionUserId,
      setProfile,
      swipesCount,
    ]
  )

  const loadProfiles = useCallback(async () => {
    console.log('[SWIPE] loadProfiles start', { sessionUserId })

    if (!sessionUserId) {
      setLoading(false)
      return
    }

    setLoading((prev) => (profiles.length === 0 ? true : prev))

    try {
      const { data: swipedData, error: swipedError } = await db
        .from('swipes')
        .select('target_id')
        .eq('swiper_id', sessionUserId)

      if (swipedError) {
        console.error('[SWIPE] swipes select error', swipedError)
      }

      const swipedSet = new Set<string>([
        sessionUserId,
        ...((swipedData || []).map((swipe: { target_id: string }) => swipe.target_id) || []),
      ])

      const { data: profilesData, error: profilesError } = await db
        .from('profiles')
        .select('*')
        .eq('is_onboarded', true)
        .eq('is_suspended', false)
        .eq('email_confirmed', true)
        .neq('id', sessionUserId)
        .limit(20)

      if (profilesError) {
        console.error('[SWIPE] profiles select error', profilesError)
        toast.error(`Erreur profils: ${profilesError.message}`)
        return
      }

      const filteredProfiles = ((profilesData || []) as ProfileWithLocation[]).filter((candidate) => {
        if (swipedSet.has(candidate.id)) return false

        if (!candidate.city_lat || !candidate.city_lng) return false
        if (!userLat || !userLng) return true

        const radius = 6371
        const dLat = ((candidate.city_lat - userLat) * Math.PI) / 180
        const dLng = ((candidate.city_lng - userLng) * Math.PI) / 180

        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((userLat * Math.PI) / 180) *
            Math.cos((candidate.city_lat * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2)

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = radius * c

        return distance <= maxDistance
      })

      const { data: likesData, error: likesError } = await db
        .from('likes')
        .select('liker_id')
        .eq('liked_id', sessionUserId)

      if (likesError) {
        console.error('[SWIPE] received likes select error', likesError)
      }

      console.log('[SWIPE] profiles loaded', {
        profilesCount: filteredProfiles.length,
        likedMeIds: likesData,
      })

      setLikedMeIds(new Set((likesData || []).map((like: { liker_id: string }) => like.liker_id)))
      setProfiles(filteredProfiles as Profile[])
    } catch (error) {
      console.error('[SWIPE] loadProfiles catch', error)
      toast.error('Erreur chargement profils')
    } finally {
      setLoading(false)
    }
  }, [db, maxDistance, profiles.length, sessionUserId, userLat, userLng])

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
  }, [supabase, router])

  useEffect(() => {
    const today = getTodayKey()
    setCountsDate(today)

    try {
      const stored = localStorage.getItem('pakt:limits')

      if (stored) {
        const parsed = JSON.parse(stored)

        if (parsed?.date === today) {
          setSwipesCount(Number(parsed?.swipesCount) || 0)
          setMessagesCount(Number(parsed?.messagesCount) || 0)
          return
        }
      }
    } catch {}

    setSwipesCount(0)
    setMessagesCount(0)

    try {
      localStorage.setItem(
        'pakt:limits',
        JSON.stringify({ date: today, swipesCount: 0, messagesCount: 0 })
      )
    } catch {}
  }, [])

  useEffect(() => {
    if (!sessionUserId) return
    if (sessionProvider !== 'google') return
    if (profile?.email_confirmed === true) return

    void (async () => {
      try {
        const { error } = await db
          .from('profiles')
          .update({ email_confirmed: true })
          .eq('id', sessionUserId)

        if (error) {
          console.error('[SWIPE] google email_confirmed update error', error)
          return
        }

        if (profile) setProfile({ ...profile, email_confirmed: true })
      } catch (error) {
        console.error('[SWIPE] google email_confirmed catch', error)
      }
    })()
  }, [db, profile, sessionProvider, sessionUserId, setProfile])

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  if (sessionLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-gold border-t-transparent animate-spin" />
          <p className="text-white/40">Chargement...</p>
        </div>
      </div>
    )
  }

  const currentProfile = profiles[0]
  const stackForRender = profiles.slice(0, STACK_RENDER_COUNT).slice().reverse()
  const showInitialLoading = loading && profiles.length === 0

  const handleSwipe = async (dir: 'left' | 'right', swipedProfile: Profile) => {
    console.log('[SWIPE] handleSwipe start', {
      dir,
      sessionUserId,
      myProfileId: profile?.id,
      targetId: swipedProfile?.id,
    })

    if (!sessionUserId || !profile || !swipedProfile?.id) {
      console.error('[SWIPE] handleSwipe missing data', {
        sessionUserId,
        profile,
        swipedProfile,
      })
      toast.error('Swipe impossible')
      return
    }

    if (reachedSwipeLimit) {
      console.log('[SWIPE] swipe limit reached')
      openPaywall()
      return
    }

    try {
      const { data: swipeData, error: swipeError } = await db
        .from('swipes')
        .upsert(
          {
            swiper_id: sessionUserId,
            target_id: swipedProfile.id,
            action: dir === 'right' ? 'like' : 'dislike',
          },
          {
            onConflict: 'swiper_id,target_id',
          }
        )
        .select('*')

      if (swipeError) {
        console.error('[SWIPE] swipe upsert error', swipeError)
        toast.error(`Erreur swipe: ${swipeError.message}`)
        return
      }

      console.log('[SWIPE] swipe saved', swipeData)

      if (profile.plan === 'free') {
        const next = swipesCount + 1
        setSwipesCount(next)
        persistCounts(next, messagesCount)
      }

      setProfiles((prev) => prev.filter((item) => item.id !== swipedProfile.id))

      try {
        const today = new Date().toISOString().split('T')[0]
        const newSwipesCount =
          profile.last_swipe_date === today ? (profile.swipes_today || 0) + 1 : 1

        const updatedProfile = { ...profile, swipes_today: newSwipesCount, last_swipe_date: today }
        setProfile(updatedProfile)

        const { error: profileUpdateError } = await db
          .from('profiles')
          .update({ swipes_today: newSwipesCount, last_swipe_date: today })
          .eq('id', sessionUserId)

        if (profileUpdateError) {
          console.error('[SWIPE] profile swipe count update error', profileUpdateError)
        }
      } catch (error) {
        console.error('[SWIPE] profile swipe count catch', error)
      }

      if (dir !== 'right') return

      const likePayload = {
        liker_id: sessionUserId,
        liked_id: swipedProfile.id,
      }

      console.log('[SWIPE] upsert like', likePayload)

      const { data: likeData, error: likeError } = await db
        .from('likes')
        .upsert(likePayload, {
          onConflict: 'liker_id,liked_id',
          ignoreDuplicates: true,
        })
        .select('*')

      if (likeError) {
        console.error('[SWIPE] like upsert error', likeError)
        toast.error(`Erreur like: ${likeError.message}`)
        return
      }

      console.log('[SWIPE] like saved', likeData)

      const { data: mutualLike, error: matchCheckError } = await db
        .from('likes')
        .select('*')
        .eq('liker_id', swipedProfile.id)
        .eq('liked_id', sessionUserId)
        .maybeSingle()

      if (matchCheckError) {
        console.error('[SWIPE] mutual like check error', matchCheckError)
        toast.error(`Erreur match: ${matchCheckError.message}`)
        return
      }

      console.log('[SWIPE] mutual like result', mutualLike)

      if (mutualLike) {
        const match = await createMatch(swipedProfile.id)

        if (!match) return

        const conversationId = await createConversationForMatch(swipedProfile.id)

        console.log('[SWIPE] MATCH CREATED', {
          match,
          conversationId,
          me: sessionUserId,
          other: swipedProfile.id,
        })

        setMatchedProfile(swipedProfile)
        setShowMatch(true)
      }
    } catch (error) {
      console.error('[SWIPE] handleSwipe catch', error)
      toast.error('Erreur swipe')
    }
  }

  const handleMessageTap = async () => {
    if (!currentProfile) return

    if (reachedMessageLimit) {
      openPaywall()
      return
    }

    await openMessageConversation(currentProfile)
  }

  return (
    <div className="h-full flex flex-col bg-dark">
      <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
        <h1 className="text-2xl font-black tracking-wider text-gold-gradient">PAKT</h1>

        {profile?.plan !== 'premium' && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white/50">
              {Math.max(0, MAX_FREE_SWIPES - (profile?.swipes_today || 0))} swipes restants
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 relative px-4 pb-2">
        {showInitialLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-gold border-t-transparent animate-spin" />
              <p className="text-white/40">Chargement...</p>
            </div>
          </div>
        ) : !isEmailVerified ? (
          <EmailLocked />
        ) : reachedSwipeLimit ? (
          <LimitReached onUpgrade={() => router.push('/checkout')} />
        ) : profiles.length === 0 ? (
          <EmptyState onRefresh={loadProfiles} />
        ) : (
          <div className="relative h-full">
            {stackForRender.map((item, index) => {
              const isTop = item.id === currentProfile?.id
              const zIndex = isTop ? 20 : 10 + index

              return (
                <div key={item.id} className="absolute inset-0" style={{ zIndex }}>
                  <SwipeCard
                    profile={item}
                    onSwipe={(swipeDirection) => {
                      if (!isTop) return
                      handleSwipe(swipeDirection, item)
                    }}
                    hasLikedYou={likedMeIds.has(item.id)}
                    zIndex={zIndex}
                    isTop={isTop}
                    onMessage={() => {
                      if (!isTop) return
                      handleMessageTap()
                    }}
                    disabledActions={isTop ? reachedSwipeLimit : true}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        onUpgrade={() => router.push('/checkout')}
      />

      <MatchModal
        isOpen={showMatch}
        myProfile={profile}
        matchedProfile={matchedProfile}
        onClose={() => setShowMatch(false)}
      />
    </div>
  )
}

function LimitReached({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="w-20 h-20 rounded-full bg-gold/10 border-2 border-gold/30 flex items-center justify-center">
          <Crown size={32} className="text-gold" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Limite atteinte</h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Vous avez atteint la limite gratuite.
            <br />
            Passez a PAKT Business pour continuer.
          </p>
        </div>
        <button onClick={onUpgrade} className="btn-primary max-w-xs">
          <div className="flex items-center justify-center gap-2">
            <Crown size={16} />
            Passer a PAKT Business
          </div>
        </button>
      </motion.div>
    </div>
  )
}

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6"
      >
        <span className="text-6xl">🌍</span>
        <div>
          <h2 className="text-2xl font-bold mb-2">C'est calme par ici</h2>
          <p className="text-white/50 text-sm">Tu as vu tous les profils disponibles pour l'instant.</p>
        </div>
        <button onClick={onRefresh} className="flex items-center gap-2 btn-ghost">
          <RefreshCw size={16} />
          Actualiser
        </button>
      </motion.div>
    </div>
  )
}

function EmailLocked() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 text-center">
      <div className="w-20 h-20 rounded-full bg-gold/10 border-2 border-gold/30 flex items-center justify-center mb-6">
        <Lock size={32} className="text-gold" />
      </div>

      <h2 className="text-2xl font-bold mb-2">Swipe verrouille</h2>

      <p className="text-white/50 text-sm leading-relaxed">
        Veuillez confirmer votre adresse email pour commencer a faire des rencontres.
      </p>
    </div>
  )
}