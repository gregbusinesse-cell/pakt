'use client'

// components/swipe/SwipeCard.tsx

import { useState } from 'react'
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion'
import { Heart, MessageCircle, X } from 'lucide-react'
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
  const [photoIndex, setPhotoIndex] = useState(0)

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-8, 0, 8])
  const controls = useAnimation()

  const photosArray = cleanPhotoUrls((profile as any).photos)
  const interestsArray = cleanStringArray((profile as any).interests)
  const safePhotoIndex = photosArray.length > 0 ? photoIndex % photosArray.length : 0

  const handleDragEnd = async (_: any, info: any) => {
    const threshold = 120
    const horizontal = Math.abs(info.offset.x)
    const vertical = Math.abs(info.offset.y)

    if (vertical > horizontal) {
      controls.start({
        x: 0,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      })
      return
    }

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
  }

  const actionButtonBase =
    'group relative w-[68px] h-[68px] rounded-full flex items-center justify-center overflow-hidden backdrop-blur-xl transition-colors disabled:opacity-35 disabled:pointer-events-none'

  return (
    <div
      className={`h-full overflow-y-auto overscroll-contain ${
        isTop ? 'pointer-events-auto opacity-100 relative' : 'pointer-events-none opacity-0 absolute inset-0'
      }`}
      style={{ touchAction: isTop ? 'pan-y' : 'none' }}
    >
      <motion.div
        style={{ x, rotate, zIndex, touchAction: isTop ? 'pan-y' : 'none' }}
        drag={isTop && !disabledActions ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.25}
        onDragEnd={handleDragEnd}
        animate={controls}
        initial={{ scale: isTop ? 1 : 0.98, y: isTop ? 0 : 10 }}
        className="w-full"
      >
        <div className="flex flex-col items-center pb-32">
          <div className="max-w-md mx-auto px-4 py-6 space-y-6 w-full">
            <div className="relative z-0">
              {hasLikedYou && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                  <span className="inline-flex items-center rounded-full bg-gold text-dark px-4 py-1.5 text-xs font-bold shadow-lg">
                    Cette personne vous a liké
                  </span>
                </div>
              )}

              {photosArray.length > 0 ? (
                <img
                  src={photosArray[safePhotoIndex]}
                  className="w-full aspect-[3/4] object-cover rounded-2xl cursor-pointer select-none"
                  style={{ touchAction: 'pan-y' }}
                  alt={profile.first_name || ''}
                  draggable={false}
                  onClick={() => {
                    if (photosArray.length <= 1) return
                    setPhotoIndex((prev) => (prev + 1) % photosArray.length)
                  }}
                />
              ) : (
                <div
                  className="w-full aspect-[3/4] rounded-2xl bg-dark-300 flex items-center justify-center"
                  style={{ touchAction: 'pan-y' }}
                >
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
                  <div className="flex items-center justify-center gap-5">
                    <motion.button
                      type="button"
                      onClick={() => swipeManual('left')}
                      disabled={disabledActions}
                      whileHover={{ scale: 1.06, y: -2 }}
                      whileTap={{ scale: 0.94 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                      className={`${actionButtonBase} bg-black/55 border border-red-500/20 shadow-[0_18px_45px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.10)] hover:border-red-400/35`}
                      aria-label="Dislike"
                    >
                      <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 to-transparent opacity-70" />
                      <X size={28} strokeWidth={2.1} className="relative text-red-300" />
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={handleMessage}
                      disabled={disabledActions}
                      whileHover={{ scale: 1.06, y: -2 }}
                      whileTap={{ scale: 0.94 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                      className={`${actionButtonBase} bg-[#121212]/72 border border-gold/25 shadow-[0_18px_45px_rgba(0,0,0,0.48),0_0_24px_rgba(212,168,83,0.12),inset_0_1px_0_rgba(255,255,255,0.10)] hover:border-gold/45`}
                      aria-label="Message"
                    >
                      <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/12 to-transparent opacity-70" />
                      <MessageCircle size={27} strokeWidth={2} className="relative text-gold" />
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={() => swipeManual('right')}
                      disabled={disabledActions}
                      whileHover={{ scale: 1.07, y: -2 }}
                      whileTap={{ scale: 0.94 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                      className={`${actionButtonBase} bg-gold border border-gold-light/50 shadow-[0_18px_45px_rgba(0,0,0,0.42),0_0_34px_rgba(212,168,83,0.28),inset_0_1px_0_rgba(255,255,255,0.35)] hover:bg-gold-light`}
                      aria-label="Like"
                    >
                      <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent opacity-80" />
                      <Heart size={28} strokeWidth={2.1} className="relative text-dark fill-dark/10" />
                    </motion.button>
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

            <div className="h-6" />
          </div>
        </div>
      </motion.div>
    </div>
  )
}