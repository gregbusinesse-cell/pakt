'use client'

// app/(app)/swipe/page.tsx

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'
import SwipeCard from '@/components/swipe/SwipeCard'
import MatchModal from '@/components/swipe/MatchModal'
import type { Profile } from '@/lib/supabase/types'
import { normalizePlan, isPaidPlan } from '@/lib/utils'
import { RefreshCw, Lock } from 'lucide-react'
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
  preferences?: {
    distance_km?: number
    age_min?: number
    age_max?: number
  } | null
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
  const [lastSwipedProfile, setLastSwipedProfile] = useState<Profile | null>(null)
  const [lastSwipeDir, setLastSwipeDir] = useState<'left' | 'right' | null>(null)

  const profileWithLocation = profile as ProfileWithLocation | null
  const sessionUserId = session?.user?.id
  const sessionProvider = session?.user?.app_metadata?.provider
  const sessionEmailConfirmedAt = session?.user?.email_confirmed_at

  const todayKey = new Date().toISOString().split('T')[0]
  const plan = normalizePlan(profile?.plan)
  const isPro = plan === 'business_pro'

  const userLat = profileWithLocation?.city_lat ?? null
  const userLng = profileWithLocation?.city_lng ?? null
  const maxDistance = isPro ? profileWithLocation?.preferences?.distance_km ?? 50 : 50
  const ageMin = isPro ? profileWithLocation?.preferences?.age_min ?? 18 : 18
  const ageMax = isPro ? profileWithLocation?.preferences?.age_max ?? 99 : 99

  const isEmailVerified = Boolean(sessionEmailConfirmedAt) || profile?.email_confirmed === true

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

  // Auto-confirm email for Google users
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

  const currentProfile = profiles[0] ?? null
  const stackForRender = profiles.slice(0, STACK_RENDER_COUNT).slice().reverse()
  const showInitialLoading = loading && profiles.length === 0

  const handleSwipe = async (dir: 'left' | 'right', swipedProfile: Profile) => {
    if (!sessionUserId || !profile || !swipedProfile?.id) {
      toast.error('Swipe impossible')
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

      // Save for undo
      setLastSwipedProfile(swipedProfile)
      setLastSwipeDir(dir)

      // Remove from stack
      setProfiles((prev) => {
        const next = prev.filter((item) => item.id !== swipedProfile.id)
        if (next[0]) void recordProfileView(next[0].id)
        return next
      })

      if (dir !== 'right') return

      // Record like
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

      // Check for mutual like (match)
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

        const myPlan = normalizePlan(profile.plan)
        const otherPlan = normalizePlan(swipedProfile.plan)
        const bothCanChat = isPaidPlan(myPlan) && isPaidPlan(otherPlan)

        if (!bothCanChat) {
          toast.success('Nouveau match ! Passe Business pour discuter.')
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

  const handleUndo = async () => {
    if (!sessionUserId || !lastSwipedProfile) return

    if (!isPro) {
      toast.error('Le retour en arrière est réservé aux membres Business Pro.')
      router.push('/settings')
      return
    }

    try {
      // Delete the swipe record
      await db
        .from('swipes')
        .delete()
        .eq('swiper_id', sessionUserId)
        .eq('target_id', lastSwipedProfile.id)

      // If it was a like, also remove the like
      if (lastSwipeDir === 'right') {
        await db
          .from('likes')
          .delete()
          .eq('liker_id', sessionUserId)
          .eq('liked_id', lastSwipedProfile.id)

        // Remove match if one was created
        const [user1_id, user2_id] = [sessionUserId, lastSwipedProfile.id].sort()
        await db
          .from('matches')
          .delete()
          .eq('user1_id', user1_id)
          .eq('user2_id', user2_id)
      }

      // Re-insert the profile at the front of the stack
      setProfiles((prev) => [lastSwipedProfile, ...prev])
      setLastSwipedProfile(null)
      setLastSwipeDir(null)
      toast.success('Swipe annulé !')
    } catch (error) {
      console.error('[SWIPE] undo error', error)
      toast.error('Erreur lors de l\'annulation')
    }
  }

  return (
    <div className="min-h-[calc(100dvh-100px)] flex flex-col bg-dark">
      <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
        <h1 className="text-2xl font-black tracking-wider text-gold-gradient">PAKT</h1>
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
                    onUndo={() => {
                      if (!isTop) return
                      handleUndo()
                    }}
                    canUndo={Boolean(lastSwipedProfile) && isPro}
                    hasLikedYou={likedMeIds.has(item.id)}
                    zIndex={zIndex}
                    isTop={isTop}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      <MatchModal
        isOpen={showMatch}
        myProfile={profile}
        matchedProfile={matchedProfile}
        onClose={() => setShowMatch(false)}
      />
    </div>
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
          <h2 className="text-2xl font-bold mb-2">C&apos;est calme par ici</h2>
          <p className="text-white/50 text-sm">
            Tu as vu tous les profils disponibles pour l&apos;instant.
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
