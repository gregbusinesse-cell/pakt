'use client'
// components/swipe/SwipeCard.tsx
// Swipe card with scrollable profile layout + simple photo carousel

import { useState } from 'react'
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion'
import type { Profile } from '@/lib/supabase/types'

interface Props {
  profile: Profile
  onSwipe: (dir: 'left' | 'right') => void
  onMessage?: () => void
  disabledActions?: boolean
  hasLikedYou?: boolean
  zIndex?: number
  isTop?: boolean
  isOwnProfile?: boolean
}

function parseJsonArray(value: unknown): unknown[] {
  try {
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
      const parsed = JSON.parse(value || '[]')
      return Array.isArray(parsed) ? parsed : []
    }
    return []
  } catch {
    return []
  }
}

function cleanPhotoUrls(value: unknown): string[] {
  return parseJsonArray(value)
    .filter((p) => typeof p === 'string' && p.trim().length > 0)
    .map((p) => (p as string).trim())
}

function cleanStringArray(value: unknown): string[] {
  return parseJsonArray(value)
    .filter((v) => typeof v === 'string' && v.trim().length > 0)
    .map((v) => (v as string).trim())
}

export default function SwipeCard({
  profile,
  onSwipe,
  onMessage,
  disabledActions = false,
  hasLikedYou,
  zIndex = 0,
  isTop = false,
  isOwnProfile = false,
}: Props) {

  const [messageCount, setMessageCount] = useState(0)
  const [photoIndex, setPhotoIndex] = useState(0)

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-8, 0, 8])
  const controls = useAnimation()

  const photosArray = cleanPhotoUrls((profile as any).photos)
  const interestsArray = cleanStringArray((profile as any).interests)
  const safePhotoIndex = photosArray.length > 0 ? photoIndex % photosArray.length : 0

  const isPremium = (profile as any).plan === 'premium'
  const canMessage = isPremium || messageCount < 1

  const handleDragEnd = async (_: any, info: any) => {
    const threshold = 120

    if (disabledActions) {
      controls.start({
        x: 0,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      })
      return
    }

    if (info.offset.x > threshold) {
      await controls.start({ x: 600, opacity: 0, transition: { duration: 0.3 } })
      onSwipe('right')
    } else if (info.offset.x < -threshold) {
      await controls.start({ x: -600, opacity: 0, transition: { duration: 0.3 } })
      onSwipe('left')
    } else {
      controls.start({
        x: 0,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      })
    }
  }

  const swipeManual = async (dir: 'left' | 'right') => {
    if (disabledActions) return
    await controls.start({
      x: dir === 'right' ? 600 : -600,
      opacity: 0,
      rotate: dir === 'right' ? 12 : -12,
      transition: { duration: 0.3 },
    })
    onSwipe(dir)
  }

  const handleMessage = () => {
    if (disabledActions) return
    onMessage?.()
    if (canMessage) setMessageCount((prev) => prev + 1)
  }

  return (
    // ✅ scroll restored + cards behind don't capture anything
    <div
      className={`h-full overflow-y-auto ${
  isTop
    ? 'pointer-events-auto opacity-100 relative'
    : 'pointer-events-none opacity-0 absolute inset-0'
}`}
      style={{
        // ✅ allows vertical scroll while still letting framer drag horizontally
        touchAction: isTop ? 'pan-y' : 'none',
      }}
    >
      <motion.div
        style={{ x, rotate, zIndex }}
        drag={isTop && !disabledActions ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.35}
        dragDirectionLock
        onDragEnd={handleDragEnd}
        animate={controls}
        initial={{ scale: isTop ? 1 : 0.98, y: isTop ? 0 : 10 }}
        className="w-full"
      >
        <div className="flex flex-col items-center pb-32">
          <div className="max-w-md mx-auto px-4 py-6 space-y-6 w-full">
            <div className="relative z-0">
              {photosArray.length > 0 ? (
                <img
                  src={photosArray[safePhotoIndex]}
                  className="w-full aspect-[3/4] object-cover rounded-2xl cursor-pointer select-none"
                  alt={profile.first_name || ''}
                  draggable={false}
                  onClick={() => {
                    if (photosArray.length <= 1) return
                    setPhotoIndex((prev) => (prev + 1) % photosArray.length)
                  }}
                />
              ) : (
                <div className="w-full aspect-[3/4] rounded-2xl bg-dark-300 flex items-center justify-center">
                  <span className="text-8xl">👤</span>
                </div>
              )}

              {photosArray.length > 0 && (
                <div className="absolute top-2 left-0 right-0 flex justify-center gap-1 z-20 pointer-events-none">
                  {photosArray.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 w-6 rounded-full transition ${
                        i === safePhotoIndex ? 'bg-white' : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              )}

              {isTop && !isOwnProfile && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
                  <div className="flex items-center justify-center gap-6">
                    <button
                      type="button"
                      onClick={() => swipeManual('left')}
                      disabled={disabledActions}
                      className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center
                        transition-transform duration-200 hover:scale-110 disabled:opacity-40 disabled:hover:scale-100"
                      aria-label="Dislike"
                    >
                      <span className="text-[#ff4d4f] text-3xl font-bold leading-none">✕</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleMessage}
                      disabled={disabledActions || !canMessage}
                      className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg
                        transition-transform duration-200 hover:scale-110 disabled:opacity-40 disabled:hover:scale-100"
                      aria-label="Message"
                    >
                      <span className="text-white text-2xl leading-none">💬</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => swipeManual('right')}
                      disabled={disabledActions}
                      className="w-16 h-16 rounded-full bg-gold/80 backdrop-blur-md flex items-center justify-center
                        transition-transform duration-200 hover:scale-110 disabled:opacity-40 disabled:hover:scale-100"
                      aria-label="Like"
                    >
                      <span className="text-red-500 text-2xl leading-none">❤</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-white font-medium text-xl">
                {profile.first_name || 'Utilisateur'},{' '}
                <span className="text-white/80 font-normal text-lg">{profile.age ?? ''}</span>
              </h2>
              {profile.city ? <p className="text-white/60">{profile.city}</p> : null}
            </div>

            <div className="bg-dark-200 border border-dark-500 rounded-[12px] p-4">
              <p className="text-white/70 text-sm leading-relaxed">{profile.bio || 'Aucune bio'}</p>
            </div>

            {interestsArray.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {interestsArray.map((i) => (
                  <span key={i} className="bg-dark-300 text-white/70 text-xs px-3 py-1 rounded-full">
                    {i}
                  </span>
                ))}
              </div>
            )}

            {hasLikedYou && (
              <div className="pt-1">
                <span className="inline-flex items-center rounded-full bg-gold/15 border border-gold/30 px-3 py-1 text-xs font-bold text-gold">
                  Cette personne vous a like
                </span>
              </div>
            )}

            <div className="h-6" />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
