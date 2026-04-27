'use client'
// app/(app)/swipe/page.tsx
// Main swipe page - Tinder-style card swiping (with free limits + paywall)

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@supabase/auth-helpers-react'
import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'
import SwipeCard from '@/components/swipe/SwipeCard'
import MatchModal from '@/components/swipe/MatchModal'
import type { Profile } from '@/lib/supabase/types'
import { MAX_FREE_SWIPES } from '@/lib/utils'
import { Crown, RefreshCw, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'

const FREE_SWIPE_LIMIT = 10
const FREE_MESSAGE_LIMIT = 2
const STACK_RENDER_COUNT = 3

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
  const session = useSession()
  const supabase = createClient()
  const router = useRouter()
  const { profile, setProfile } = useAppStore()

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [likedMeIds, setLikedMeIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null)
  const [showMatch, setShowMatch] = useState(false)

  const [paywallOpen, setPaywallOpen] = useState(false)

  const [swipesCount, setSwipesCount] = useState(0)
  const [messagesCount, setMessagesCount] = useState(0)
  const [countsDate, setCountsDate] = useState(getTodayKey())

  const isFree = profile?.plan === 'free'
  const reachedFreeLimit =
    isFree && (swipesCount >= FREE_SWIPE_LIMIT || messagesCount >= FREE_MESSAGE_LIMIT)

  const isEmailVerified = !!session?.user?.email_confirmed_at || profile?.email_confirmed === true

  // Daily reset (front-only)
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

  // Mark Google users as verified in DB (so they appear for others)
  useEffect(() => {
    if (!session?.user) return
    const provider = (session.user.app_metadata as any)?.provider
    if (provider !== 'google') return

    supabase
      .from('profiles')
      .update({ email_confirmed: true })
      .eq('id', session.user.id)
      .then(({ error }) => {
        if (error) console.log('[Swipe] google verify update error:', error)
        if (profile) setProfile({ ...(profile as any), email_confirmed: true })
      })
      .catch((e) => console.log('[Swipe] google verify update exception:', e))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id])

  const loadProfiles = useCallback(async () => {
    if (!session?.user) return
    setLoading(true)

    try {
      const { data: swipedData, error: swipedErr } = await supabase
  .from('swipes')
  .select('target_id')
  .eq('swiper_id', session.user.id)
  
      if (swipedErr) console.log('[Swipe] load swiped likes error:', swipedErr)

      const swipedSet = new Set<string>([
        session.user.id,
        ...(swipedData?.map((s: any) => s.target_id) || []),
      ])

      const notIn = `(${[...swipedSet].map((id) => `"${id}"`).join(',')})`

      const { data: profilesData, error: profilesErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_onboarded', true)
        .eq('is_suspended', false)
        .eq('email_confirmed', true)
        .neq('id', session.user.id)
        .limit(20)
        
        const userLat = profile?.city_lat
const userLng = profile?.city_lng
const maxDistance = profile?.preferences?.distance_km || 50

const filteredProfiles = (profilesData || []).filter((p) => {
  if (swipedSet.has(p.id)) return false

  // ❌ skip si pas de coords
  if (!p.city_lat || !p.city_lng) return false
  if (!userLat || !userLng) return true // fallback si toi t’as pas encore

  const R = 6371
  const dLat = (p.city_lat - userLat) * Math.PI / 180
  const dLng = (p.city_lng - userLng) * Math.PI / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(userLat * Math.PI / 180) *
    Math.cos(p.city_lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance <= maxDistance
})

      if (profilesErr) console.log('[Swipe] load profiles error:', profilesErr)

      const { data: likesData, error: likesErr } = await supabase
        .from('likes')
        .select('liker_id')
        .eq('liked_id', session.user.id)

      if (likesErr) console.log('[Swipe] load likedMeIds error:', likesErr)

      setLikedMeIds(new Set(likesData?.map((l: any) => l.liker_id) || []))
      setProfiles(filteredProfiles)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  const canSwipe = useMemo(() => {
    if (!profile) return false
    if (!isFree) return true
    return !reachedFreeLimit
  }, [profile, isFree, reachedFreeLimit])

  const currentProfile = profiles[0]

  // Logs
  useEffect(() => {
    console.log('[Swipe] currentProfile.id:', currentProfile?.id)
    console.log('[Swipe] canSwipe:', canSwipe)
    console.log('[Swipe] disabledActions:', reachedFreeLimit)
    console.log('[Swipe] swipesCount:', swipesCount)
    console.log('[Swipe] messagesCount:', messagesCount)
    console.log('[Swipe] reachedFreeLimit:', reachedFreeLimit)
  }, [currentProfile?.id, canSwipe, reachedFreeLimit, swipesCount, messagesCount])

  const handleSwipe = async (dir: 'left' | 'right', swipedProfile: Profile) => {
    if (!session?.user || !profile) return

    console.log('[Swipe] handleSwipe dir/profile:', dir, swipedProfile?.id)
    await supabase.from('swipes').upsert({
  swiper_id: session.user.id,
  target_id: swipedProfile.id,
  action: dir === 'right' ? 'like' : 'dislike'
}, {
  onConflict: 'swiper_id,target_id'
})

    if (reachedFreeLimit) {
      console.log('[Swipe] blocked by reachedFreeLimit')
      openPaywall()
      return
    }

    if (profile.plan === 'free') {
      const next = swipesCount + 1
      setSwipesCount(next)
      persistCounts(next, messagesCount)
    }

    // Remove from stack immediately
    setProfiles((prev) => prev.filter((p) => p.id !== swipedProfile.id))

    // Best-effort backend swipe counter (do not block UX)
    try {
      const today = new Date().toISOString().split('T')[0]
      const newSwipesCount =
        (profile as any).last_swipe_date === today ? ((profile as any).swipes_today || 0) + 1 : 1

      const updatedProfile = { ...profile, swipes_today: newSwipesCount, last_swipe_date: today }
      setProfile(updatedProfile as any)

      const { error: swipeUpdateErr } = await supabase
        .from('profiles')
        .update({ swipes_today: newSwipesCount, last_swipe_date: today })
        .eq('id', session.user.id)

      if (swipeUpdateErr) console.log('[Swipe] profiles swipe update error:', swipeUpdateErr)
    } catch (e) {
      console.log('[Swipe] profiles swipe update exception:', e)
    }

    if (dir === 'right') {
      const likePayload = { liker_id: session.user.id, liked_id: swipedProfile.id }

      const { error: likeErr } = await supabase
        .from('likes')
        .upsert(likePayload, { onConflict: 'liker_id,liked_id', ignoreDuplicates: true })

      if (likeErr) console.log('[Swipe] likes.insert/upsert error:', likeErr)

      const { data: existingLike, error: matchErr } = await supabase
        .from('likes')
        .select('id')
        .eq('liker_id', swipedProfile.id)
        .eq('liked_id', session.user.id)
        .maybeSingle()

      if (matchErr) console.log('[Swipe] match check error:', matchErr)

      if (existingLike) {
        setMatchedProfile(swipedProfile)
        setShowMatch(true)
      }
    }
  }

  const handleMessageTap = () => {
    if (isFree && messagesCount >= FREE_MESSAGE_LIMIT) {
      openPaywall()
      return
    }
    if (reachedFreeLimit) {
      openPaywall()
      return
    }
    if (profile?.plan === 'free') {
      const next = messagesCount + 1
      setMessagesCount(next)
      persistCounts(swipesCount, next)
    }
  }

  // ✅ Proper stack: render up to 3 cards, only top is interactive.
  const stack = profiles.slice(0, STACK_RENDER_COUNT)
  const stackForRender = stack.slice().reverse() // bottom first, top last (so it sits above)

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
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-gold border-t-transparent animate-spin" />
              <p className="text-white/40">Chargement...</p>
            </div>
          </div>
        ) : !isEmailVerified ? (
          <EmailLocked />
        ) : reachedFreeLimit ? (
          <LimitReached onUpgrade={() => router.push('/checkout')} />
        ) : profiles.length === 0 ? (
          <EmptyState onRefresh={loadProfiles} />
        ) : (
          <div className="relative h-full">
            {stackForRender.map((p) => {
              const isTop = p.id === profiles[0]?.id
              const zIndex = isTop ? 20 : 10

              return (
                <div key={p.id} className="absolute inset-0">
                  <SwipeCard
                    profile={p}
                    onSwipe={(dir) => {
                      if (!isTop) return
                      handleSwipe(dir, p)
                    }}
                    hasLikedYou={likedMeIds.has(p.id)}
                    zIndex={zIndex}
                    isTop={isTop}
                    onMessage={() => {
                      if (!isTop) return
                      handleMessageTap()
                    }}
                    disabledActions={isTop ? reachedFreeLimit : true}
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