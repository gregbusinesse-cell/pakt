'use client'

// components/swipe/SwipeCard.tsx

import { useState } from 'react'
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion'
import { Heart, Undo2, X, UserCircle2 } from 'lucide-react'
import type { Profile } from '@/lib/supabase/types'
import SkillDisplay from '@/components/skills/SkillDisplay'

interface Props {
  profile: Profile
  onSwipe: (dir: 'left' | 'right') => void
  onUndo?: () => void
  canUndo?: boolean
  disabledActions?: boolean
  hasLikedYou?: boolean
  zIndex?: number
  isTop?: boolean
  isOwnProfile?: boolean
  readonlyMatchView?: boolean
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
  onUndo,
  canUndo = false,
  disabledActions = false,
  hasLikedYou,
  zIndex = 0,
  isTop = false,
  isOwnProfile = false,
  readonlyMatchView = false,
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

  const handleUndo = () => {
    if (disabledActions) return
    onUndo?.()
  }

  const actionButtonBase =
    'group relative w-[68px] h-[68px] rounded-full flex items-center justify-center overflow-hidden backdrop-blur-xl transition-colors disabled:opacity-35 disabled:pointer-events-none'

  return (
    <div
      className={`${
        isOwnProfile
          ? 'relative'
          : readonlyMatchView
            ? 'w-full relative'
            : `h-full overflow-y-auto overscroll-contain ${
                isTop ? 'pointer-events-auto opacity-100 relative' : 'pointer-events-none opacity-0 absolute inset-0'
              }`
      }`}
      style={{ touchAction: isOwnProfile || readonlyMatchView ? 'auto' : isTop ? 'pan-y' : 'none' }}
    >
      <motion.div
        style={{
          x: isOwnProfile || readonlyMatchView ? undefined : x,
          rotate: isOwnProfile || readonlyMatchView ? undefined : rotate,
          zIndex: isOwnProfile || readonlyMatchView ? undefined : zIndex,
          touchAction: isOwnProfile || readonlyMatchView ? 'auto' : isTop ? 'pan-y' : 'none',
          pointerEvents: readonlyMatchView ? 'auto' : undefined,
        }}
        drag={isTop && !disabledActions && !isOwnProfile && !readonlyMatchView ? 'x' : false}
        dragConstraints={readonlyMatchView ? undefined : { left: 0, right: 0 }}
        dragElastic={readonlyMatchView ? undefined : 0.25}
        onDragEnd={readonlyMatchView ? undefined : handleDragEnd}
        animate={isOwnProfile || readonlyMatchView ? undefined : controls}
        initial={isOwnProfile || readonlyMatchView ? undefined : { scale: isTop ? 1 : 0.98, y: isTop ? 0 : 10 }}
        className="w-full"
      >
        <div className={`flex flex-col items-center ${isOwnProfile ? 'pb-8' : 'pb-32'}`}>
          <div className="max-w-md mx-auto px-4 py-6 space-y-6 w-full">
            {/* "Liked you" badge OUTSIDE the card, above it - no overlap with name/age */}
            {hasLikedYou && !isOwnProfile && !readonlyMatchView && (
              <div className="flex justify-center mb-2">
                <span className="inline-flex items-center rounded-full bg-gold text-dark px-4 py-1.5 text-xs font-bold shadow-lg">
                  Cette personne vous a liké
                </span>
              </div>
            )}

            <div className="relative z-0">

              {photosArray.length > 0 ? (
                <img
                  src={photosArray[safePhotoIndex]}
                  className={`w-full aspect-[3/4] object-cover rounded-2xl select-none cursor-pointer`}
                  style={{ touchAction: 'auto' }}
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
                  style={{ touchAction: readonlyMatchView ? 'auto' : 'pan-y' }}
                >
                  <UserCircle2 size={80} className="text-white/20" />
                </div>
              )}

              {/* Photo indicators */}
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

              {/* Name and age overlay at top */}
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent z-30 pointer-events-none p-4">
                <h2 className="text-white font-bold text-2xl">
                  {profile.first_name || 'Utilisateur'}, <span className="text-gold font-semibold">{profile.age ?? '?'}</span>
                </h2>
              </div>

              {isTop && !isOwnProfile && !readonlyMatchView && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
                  <div className="flex items-center justify-center gap-5">
                    {/* Undo (left) — always clickable, paywall handled in onClick */}
                    <motion.button
                      type="button"
                      onClick={handleUndo}
                      disabled={disabledActions}
                      whileHover={{ scale: 1.06, y: -2 }}
                      whileTap={{ scale: 0.94 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                      className={`${actionButtonBase} bg-black/55 border border-white/15 shadow-[0_18px_45px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.10)] hover:border-white/25`}
                      aria-label="Retour"
                    >
                      <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 to-transparent opacity-70" />
                      <Undo2 size={24} strokeWidth={2.1} className="relative text-white/70" />
                    </motion.button>

                    {/* Dislike (middle) */}
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

                    {/* Like (right) */}
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

            {/* Name and age shown only for profile/readonly views (not in swipe card) */}
            {(isOwnProfile || readonlyMatchView) && (
              <div>
                <h2 className="text-white font-medium text-xl">
                  {profile.first_name || 'Utilisateur'},{' '}
                  <span className="text-white/80 font-normal text-lg">{profile.age ?? ''}</span>
                </h2>
                {profile.city ? <p className="text-white/60">{profile.city}</p> : null}
              </div>
            )}

            {/* Show city in swipe card (name/age in overlay at top) */}
            {!isOwnProfile && !readonlyMatchView && profile.city && (
              <p className="text-white/60 text-sm">{profile.city}</p>
            )}

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

            {(profile as any).skills && (
              <div className="bg-dark-200 border border-dark-500 rounded-[12px] p-4">
                <p className="text-xs uppercase tracking-widest text-white/40 mb-3">Competences</p>
                <SkillDisplay skills={(profile as any).skills} />
              </div>
            )}

            <div className="h-6" />
          </div>
        </div>
      </motion.div>
    </div>
  )
}