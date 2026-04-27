'use client'
// components/swipe/MatchModal.tsx
// Shown when a mutual match is detected

import { motion, AnimatePresence } from 'framer-motion'
import type { Profile } from '@/lib/supabase/types'
import { useRouter } from 'next/navigation'
import { MessageCircle, X } from 'lucide-react'

interface Props {
  isOpen: boolean
  myProfile: Profile | null
  matchedProfile: Profile | null
  onClose: () => void
}

export default function MatchModal({ isOpen, myProfile, matchedProfile, onClose }: Props) {
  const router = useRouter()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark/95 backdrop-blur-xl px-8"
        >
          {/* Particles */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-gold"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100 - Math.random() * 200],
                x: [(Math.random() - 0.5) * 100],
                opacity: [1, 0],
                scale: [1, 0],
              }}
              transition={{ duration: 1.5 + Math.random(), delay: Math.random() * 0.5 }}
            />
          ))}

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="text-center"
          >
            {/* Title */}
            <motion.h1
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-5xl font-black text-gold-gradient mb-2"
            >
              C'est un PAKT !
            </motion.h1>
            <p className="text-white/60 mb-10">Vous vous êtes likés mutuellement 🎉</p>

            {/* Avatars */}
            <div className="flex items-center justify-center gap-4 mb-10">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-28 h-28 rounded-full overflow-hidden border-2 border-gold shadow-2xl"
              >
                {myProfile?.photos?.[0] ? (
                  <img src={myProfile.photos[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-dark-300 flex items-center justify-center text-4xl">👤</div>
                )}
              </motion.div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="text-4xl"
              >
                💘
              </motion.div>

              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-28 h-28 rounded-full overflow-hidden border-2 border-gold shadow-2xl"
              >
                {matchedProfile?.photos?.[0] ? (
                  <img src={matchedProfile.photos[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-dark-300 flex items-center justify-center text-4xl">👤</div>
                )}
              </motion.div>
            </div>

            <p className="text-white font-semibold text-lg mb-8">
              {myProfile?.first_name} & {matchedProfile?.first_name}
            </p>

            {/* Actions */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col gap-3 w-full max-w-xs"
            >
              <button
                onClick={() => { router.push('/matches'); onClose() }}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} />
                Envoyer un message
              </button>
              <button
                onClick={onClose}
                className="btn-ghost flex items-center justify-center gap-2"
              >
                Continuer le swipe
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
