'use client'
// app/loading/page.tsx
// Animated loading screen after onboarding

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const MESSAGES = [
  'Analyse de ton profil...',
  'Recherche de profils compatibles...',
  'Calcul des affinités...',
  'Préparation de tes matchs...',
  'Presque prêt...',
]

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0)
  const [messageIdx, setMessageIdx] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.random() * 8 + 3
        if (next >= 100) {
          clearInterval(interval)
          setTimeout(() => router.push('/swipe'), 600)
          return 100
        }
        return next
      })
    }, 150)

    const msgInterval = setInterval(() => {
      setMessageIdx(prev => (prev + 1) % MESSAGES.length)
    }, 1000)

    return () => {
      clearInterval(interval)
      clearInterval(msgInterval)
    }
  }, [])

  return (
    <div className="app-height flex flex-col items-center justify-center bg-dark px-8">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gold/5 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm text-center relative z-10"
      >
        {/* Logo */}
        <h1 className="text-5xl font-black tracking-widest text-gold-gradient mb-16">
          PAKT
        </h1>

        {/* Animated rings */}
        <div className="relative w-32 h-32 mx-auto mb-10">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border border-gold/30"
              animate={{ scale: [1, 1.5 + i * 0.3], opacity: [0.5, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5,
                ease: 'easeOut',
              }}
            />
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gold/20 border-2 border-gold flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="w-full bg-dark-300 rounded-full h-1.5 mb-4 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-gold-dark to-gold-light rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>

        <div className="flex justify-between text-xs text-white/30 mb-8">
          <span>{Math.round(progress)}%</span>
          <motion.span
            key={messageIdx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {MESSAGES[messageIdx]}
          </motion.span>
        </div>

        <p className="text-white/20 text-sm">
          Ton profil est en cours de configuration
        </p>
      </motion.div>
    </div>
  )
}
