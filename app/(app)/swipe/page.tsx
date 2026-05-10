'use client'

// app/(app)/swipe/page.tsx

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'
import SwipeCard from '@/components/swipe/SwipeCard'
import MatchModal from '@/components/swipe/MatchModal'
import type { Profile } from '@/lib/supabase/types'
import { limits, normalizePlan, getTodayKey } from '@/lib/utils'
import { Crown, RefreshCw, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const STACK_RENDER_COUNT = 3
const VIEW_COOLDOWN_DAYS = 14

function deterministicShuffle(items: Profile[], seed: string): Profile[] {
  const hashed = items.map((p) => {
    let h = 0
    const key = seed + p.id
    for (let i = 0; i < key.length; i++) {
      h = ((h << 5) - h + key.charCodeAt(i)) | 0
    }
    return { profile: p, hash: h }
  })
  hashed.sort((a, b) => a.hash - b.hash)
  return hashed.map((h) => h.profile)
}

type ProfileWithLocation = Profile & {
  city_lat?: number | null
  city_lng?: number | null
  messages_today?: number | null
  likes_today?: number | null
  last_message_date?: string | null
  last_like_date?: string | null
  preferences?: {
    distance_km?: number
    age_min?: number
    age_max?: number
  } | null
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
          <h3 className="text-white font-semibold text-lg">Débloquer plus de possibilités</h3>

          <p className="text-white/60 text-sm mt-2 leading-relaxed">
            Votre plan actuel ne permet pas cette action. Passez à un plan supérieur pour continuer.
          </p>

          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={onUpgrade}
              className="h-[48px] w-full flex items-center justify-center rounded-[12px] bg-gold text-dark font-bold hover:bg-gold-light transition-colors"
            >
              Voir les plans
            </button>

            <button
              type="button"
              onClick={onClose}
              className="h-[48px] w-full flex items-center justify-center rounded-[12px] border border-dark-500 bg-[#1e1e1e] text-white/70 hover:text-white hover:border-dark-400 transition-colors"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SwipePage() {
  const [supabase] = useState(() => createClient())
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

  const profileWithLocation = profile as ProfileWithLocation | null
  const sessionUserId = session?.user?.id
  const sessionProvider = session?.user?.app_metadata?.provider
  const sessionEmailConfirmedAt = session?.user?.email_confirmed_at

  const todayKey = getTodayKey()
  const plan = normalizePlan(profile?.plan)
  const planLimits = limits[plan]
  const isFree = plan === 'free'
  const isPro = plan === 'business_pro'

  const userLat = profileWithLocation?.city_lat ?? null
  const userLng = profileWithLocation?.city_lng ?? null
  const maxDistance = isPro ? profileWithLocation?.preferences?.distance_km ?? 50 : 50
  const ageMin = isPro ? profileWithLocation?.preferences?.age_min ?? 18 : 18
  const ageMax = isPro ? profileWithLocation?.preferences?.age_max ?? 99 : 99

  const profileSwipesToday =
    profile?.last_swipe_date === todayKey ? profile?.swipes_today || 0 : 0

  const reachedSwipeLimit =
    planLimits.swipes !== Infinity && profileSwipesToday >= planLimits.swipes

  const isEmailVerified = Boolean(sessionEmailConfirmedAt) || profile?.email_confirmed === true

  const openPaywall = useCallback(() => {
    setPaywallOpen(true)
  }, [])

  const syncDailyCounters = useCallback(async () => {
    if (!sessionUserId || !profile) return

    const updates: Record<string, number | string> = {}

    if (profile.last_swipe_date !== todayKey) {
      updates.swipes_today = 0
      updates.last_swipe_date = todayKey
    }

    if (profileWithLocation?.last_message_date !== todayKey) {
      updates.messages_today = 0
      updates.last_message_date = todayKey
    }

    if (profileWithLocation?.last_like_date !== todayKey) {
      updates.likes_today = 0
      updates.last_like_date = todayKey
    }

    if (Object.keys(updates).length === 0) return

    setProfile({
      ...profile,
      ...updates,
    })

    const { error } = await db.from('profiles').update(updates).eq('id', sessionUserId)

    if (error) {
      console.error('[SWIPE] daily counters reset error', error)
    }
  }, [
    db,
    profile,
    profileWithLocation?.last_message_date,
    profileWithLocation?.last_like_date,
    sessionUserId,
    setProfile,
    todayKey,
  ])

  const getOrCreateConversation = useCallback(
    async (otherUserId: string) => {
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

      return data as string
    },
    [db, sessionUserId]
  )

  const createConversationForMatch = useCallback(
    async (otherUserId: string) => {
      try {
        return await getOrCreateConversation(otherUserId)
      } catch (error) {
        console.error('[SWIPE] createConversationForMatch error', error)
        toast.error('Erreur création conversation match')
        return null
      }
    },
    [getOrCreateConversation]
  )

  const recordProfileView = useCallback(
    async (viewedId: string) => {
      if (!sessionUserId) return
      await db.from('profile_views').upsert(
        {
          viewer_id: sessionUserId,
          viewed_id: viewedId,
          last_viewed_at: new Date().toISOString(),
          view_count: 1,
        },
        { onConflict: 'viewer_id,viewed_id' }
      )
    },
    [db, sessionUserId]
  )

  const loadProfiles = useCallback(async () => {
    if (!sessionUserId) {
      setLoading(false)
      return
    }

    setLoading((prev) => (profiles.length === 0 ? true : prev))

    try {
      const cooldownDate = new Date()
      cooldownDate.setDate(cooldownDate.getDate() - VIEW_COOLDOWN_DAYS)
      const cooldownISO = cooldownDate.toISOString()

      const [swipedResult, viewsResult] = await Promise.all([
        db.from('swipes').select('target_id').eq('swiper_id', sessionUserId),
        db
          .from('profile_views')
          .select('viewed_id')
          .eq('viewer_id', sessionUserId)
          .gte('last_viewed_at', cooldownISO),
      ])

      if (swipedResult.error) {
        console.error('[SWIPE] swipes select error', swipedResult.error)
      }
      if (viewsResult.error) {
        console.error('[SWIPE] views select error', viewsResult.error)
      }

      const swipedSet = new Set<string>([
        sessionUserId,
        ...((swipedResult.data || []).map((s: { target_id: string }) => s.target_id)),
      ])

      const recentlyViewedSet = new Set<string>(
        (viewsResult.data || []).map((v: { viewed_id: string }) => v.viewed_id)
      )

      const { data: profilesData, error: profilesError } = await db
        .from('profiles')
        .select('*')
        .eq('is_onboarded', true)
        .eq('is_suspended', false)
        .eq('email_confirmed', true)
        .neq('id', sessionUserId)
        .limit(80)

      if (profilesError) {
        console.error('[SWIPE] profiles select error', profilesError)
        toast.error(`Erreur profils: ${profilesError.message}`)
        return
      }

      const applyGeoAgeFilter = (candidate: ProfileWithLocation) => {
        if (swipedSet.has(candidate.id)) return false
        if (typeof candidate.age === 'number') {
          if (candidate.age < ageMin || candidate.age > ageMax) return false
        }
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
        return radius * c <= maxDistance
      }

      const eligible = ((profilesData || []) as ProfileWithLocation[]).filter(applyGeoAgeFilter)

      const fresh = eligible.filter((p) => !recentlyViewedSet.has(p.id))
      const recycled = eligible.filter((p) => recentlyViewedSet.has(p.id))

      const shuffleSeed = sessionUserId + todayKey
      const shuffledFresh = deterministicShuffle(fresh as Profile[], shuffleSeed)
      const shuffledRecycled = deterministicShuffle(recycled as Profile[], shuffleSeed)

      const finalProfiles = [...shuffledFresh, ...shuffledRecycled].slice(0, 20)

      const { data: likesData, error: likesError } = await db
        .from('likes')
        .select('liker_id')
        .eq('liked_id', sessionUserId)

      if (likesError) {
        console.error('[SWIPE] received likes select error', likesError)
      }

      setLikedMeIds(new Set((likesData || []).map((like: { liker_id: string }) => like.liker_id)))
      setProfiles(finalProfiles)
      if (finalProfiles[0]) void recordProfileView(finalProfiles[0].id)
    } catch (error) {
      console.error('[SWIPE] loadProfiles catch', error)
      toast.error('Erreur chargement profils')
    } finally {
      setLoading(false)
    }
  }, [
    ageMax,
    ageMin,
    db,
    maxDistance,
    profiles.length,
    recordProfileView,
    sessionUserId,
    todayKey,
    userLat,
    userLng,
  ])

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
    if (!sessionUserId) return
    void syncDailyCounters()
  }, [sessionUserId, syncDailyCounters])

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
      <div className="min-h-[calc(100dvh-100px)] flex items-center justify-center bg-dark">
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
    if (!sessionUserId || !profile || !swipedProfile?.id) {
      toast.error('Swipe impossible')
      return
    }

    const latestPlan = normalizePlan(profile.plan)
    const otherPlan = normalizePlan(swipedProfile.plan)
    const latestLimits = limits[latestPlan]
    const latestSwipesToday =
      profile.last_swipe_date === todayKey ? profile.swipes_today || 0 : 0
    const latestLikesToday =
      (profile as ProfileWithLocation).last_like_date === todayKey
        ? (profile as ProfileWithLocation).likes_today || 0
        : 0

    if (latestLimits.swipes !== Infinity && latestSwipesToday >= latestLimits.swipes) {
      openPaywall()
      return
    }

    if (dir === 'right' && latestLimits.likes !== Infinity && latestLikesToday >= latestLimits.likes) {
      toast.error(
        latestPlan === 'free'
          ? 'Limite quotidienne atteinte. Passez Business pour envoyer plus de likes.'
          : 'Passez Business Pro pour des likes illimités.'
      )
      openPaywall()
      return
    }

    try {
      const { error: swipeError } = await db.from('swipes').upsert(
        {
          swiper_id: sessionUserId,
          target_id: swipedProfile.id,
          action: dir === 'right' ? 'like' : 'dislike',
        },
        {
          onConflict: 'swiper_id,target_id',
        }
      )

      if (swipeError) {
        console.error('[SWIPE] swipe upsert error', swipeError)
        toast.error(`Erreur swipe: ${swipeError.message}`)
        return
      }

      const newSwipesCount = latestSwipesToday + 1
      if (latestLimits.swipes !== Infinity && newSwipesCount >= latestLimits.swipes) {
  setTimeout(() => {
    loadProfiles()
  }, 50)
}
      const updatedProfile = {
        ...profile,
        swipes_today: newSwipesCount,
        last_swipe_date: todayKey,
      }

      setProfile(updatedProfile)

      const { error: profileUpdateError } = await db
        .from('profiles')
        .update({
          swipes_today: newSwipesCount,
          last_swipe_date: todayKey,
        })
        .eq('id', sessionUserId)

      if (profileUpdateError) {
        console.error('[SWIPE] profile swipe count update error', profileUpdateError)
      }

      setProfiles((prev) => {
  if (newSwipesCount >= latestLimits.swipes) {
    return []
  }

  const next = prev.filter((item) => item.id !== swipedProfile.id)
        if (next[0]) void recordProfileView(next[0].id)
        return next
      })

      if (dir !== 'right') return

      const { error: likeError } = await db.from('likes').upsert(
        {
          liker_id: sessionUserId,
          liked_id: swipedProfile.id,
        },
        {
          onConflict: 'liker_id,liked_id',
          ignoreDuplicates: true,
        }
      )

      if (likeError) {
        console.error('[SWIPE] like upsert error', likeError)
        toast.error(`Erreur like: ${likeError.message}`)
        return
      }

      if (latestLimits.likes !== Infinity) {
        const newLikesCount = latestLikesToday + 1

        setProfile({
          ...updatedProfile,
          likes_today: newLikesCount,
          last_like_date: todayKey,
        } as any)

        const { error: likeCountUpdateError } = await db
          .from('profiles')
          .update({
            likes_today: newLikesCount,
            last_like_date: todayKey,
          })
          .eq('id', sessionUserId)

        if (likeCountUpdateError) {
          console.error('[SWIPE] profile like count update error', likeCountUpdateError)
        }
      }

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

      if (mutualLike) {
        const [user1_id, user2_id] = [sessionUserId, swipedProfile.id].sort()

        const { error: matchInsertError } = await db.from('matches').upsert(
          {
            user1_id,
            user2_id,
          },
          {
            onConflict: 'user1_id,user2_id',
          }
        )

        if (matchInsertError) {
          console.error('[SWIPE] match insert error', matchInsertError)
          toast.error(`Erreur match: ${matchInsertError.message}`)
          return
        }

        const freeFreeMatch = latestPlan === 'free' && otherPlan === 'free'

        if (freeFreeMatch) {
          toast.success('Match créé. Passe Business pour le débloquer.')
          return
        }

        await createConversationForMatch(swipedProfile.id)

        setMatchedProfile(swipedProfile)
        setShowMatch(true)
      }
    } catch (error) {
      console.error('[SWIPE] handleSwipe catch', error)
      toast.error('Erreur swipe')
    }
  }

  const handleMessageTap = async () => {
    if (!currentProfile || !profile) return

    if (isFree) {
      toast.error('Les messages depuis le swipe sont réservés au plan Business.')
      openPaywall()
      return
    }

    const latestPlan = normalizePlan(profile.plan)
    const latestLimits = limits[latestPlan]
    const latestMessagesToday =
      (profile as ProfileWithLocation).last_message_date === todayKey
        ? (profile as ProfileWithLocation).messages_today || 0
        : 0

    if (latestLimits.messages === 0) {
      toast.error('Les messages depuis le swipe sont réservés au plan Business.')
      openPaywall()
      return
    }

    if (latestLimits.messages !== Infinity && latestMessagesToday >= latestLimits.messages) {
      toast.error('Limite de message swipe atteinte pour aujourd’hui.')
      openPaywall()
      return
    }

    router.push(`/chat/new?userId=${currentProfile.id}&type=direct`)
  }

  return (
    <div className="min-h-[calc(100dvh-100px)] flex flex-col bg-dark">
      <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
        <h1 className="text-2xl font-black tracking-wider text-gold-gradient">PAKT</h1>

        {planLimits.swipes !== Infinity && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white/50">
              {Math.max(0, planLimits.swipes - profileSwipesToday)} swipes restants
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 relative px-4 pb-2 min-h-[calc(100dvh-185px)]">
        {showInitialLoading ? (
          <div className="min-h-[calc(100dvh-185px)] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-gold border-t-transparent animate-spin" />
              <p className="text-white/40">Chargement...</p>
            </div>
          </div>
        ) : !isEmailVerified ? (
          <EmailLocked />
        ) : profiles.length === 0 ? (
          <EmptyState onRefresh={loadProfiles} />
        ) : (
          <div className="relative h-full min-h-[calc(100dvh-185px)]">
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

            {reachedSwipeLimit && (
              <SwipeLimitOverlay onUpgrade={() => router.push('/settings')} />
            )}
          </div>
        )}
      </div>

      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        onUpgrade={() => router.push('/settings')}
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

function SwipeLimitOverlay({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-30 flex items-center justify-center"
    >
      <div className="absolute inset-0 backdrop-blur-[12px] bg-black/50 rounded-2xl" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm mx-6 bg-dark-200/95 border border-gold/20 rounded-[16px] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(212,168,83,0.08)]"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-gold/10 border-2 border-gold/30 flex items-center justify-center mb-5">
            <Crown size={28} className="text-gold" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">
            Limite quotidienne atteinte
          </h2>

          <p className="text-white/50 text-sm leading-relaxed mb-6">
            Votre abonnement actuel ne permet pas d&apos;accéder à plus de profils aujourd&apos;hui.
            <br />
            Revenez demain ou passez à PAKT Business pour continuer immédiatement.
          </p>

          <button
            type="button"
            onClick={onUpgrade}
            className="w-full h-[50px] flex items-center justify-center gap-2 rounded-[12px] bg-gold text-dark font-bold text-[15px] hover:bg-gold-light transition-colors shadow-[0_8px_24px_rgba(212,168,83,0.25)]"
          >
            <Crown size={16} />
            Passer à PAKT Business
          </button>

          <button
            type="button"
            onClick={() => {}}
            className="mt-2 w-full h-[44px] flex items-center justify-center rounded-[12px] text-white/50 text-sm hover:text-white/70 transition-colors"
          >
            Revenir demain
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="min-h-[calc(100dvh-185px)] flex flex-col items-center justify-center px-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6"
      >
        <span className="text-6xl">🌍</span>

        <div>
          <h2 className="text-2xl font-bold mb-2">C’est calme par ici</h2>
          <p className="text-white/50 text-sm">
            Tu as vu tous les profils disponibles pour l’instant.
          </p>
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
    <div className="min-h-[calc(100dvh-185px)] flex flex-col items-center justify-center px-8 text-center">
      <div className="w-20 h-20 rounded-full bg-gold/10 border-2 border-gold/30 flex items-center justify-center mb-6">
        <Lock size={32} className="text-gold" />
      </div>

      <h2 className="text-2xl font-bold mb-2">Swipe verrouillé</h2>

      <p className="text-white/50 text-sm leading-relaxed">
        Veuillez confirmer votre adresse email pour commencer à faire des rencontres.
      </p>
    </div>
  )
}