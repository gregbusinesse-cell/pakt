'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const STORAGE_KEY = 'pakt_cookie_notice_v1'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const accepted = localStorage.getItem(STORAGE_KEY)
      if (!accepted) {
        // Slight delay so the banner appears after the page loads, not in the way of auth
        const timer = setTimeout(() => setVisible(true), 800)
        return () => clearTimeout(timer)
      }
    } catch {
      // localStorage not available → don't block the UI
    }
  }, [])

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString())
    } catch {
      // ignore
    }
    setVisible(false)
  }

  if (!mounted) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="fixed inset-x-3 bottom-3 z-[9999] sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-md"
        >
          <div className="bg-dark-200/95 backdrop-blur-xl border border-dark-500 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-4 flex items-start gap-3">
            <div className="flex-1 text-white/80 text-xs leading-relaxed">
              <p className="font-semibold text-white text-sm mb-1">Cookies</p>
              <p>
                PAKT utilise uniquement des cookies techniques nécessaires au fonctionnement de l’application
                (authentification, sécurité). Aucun cookie publicitaire, aucun tracking.{' '}
                <Link href="/legal/cookies" className="text-gold underline">
                  En savoir plus
                </Link>
              </p>
              <button
                type="button"
                onClick={accept}
                className="mt-3 inline-flex items-center justify-center bg-gold text-dark text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-gold-light transition-colors"
              >
                J’ai compris
              </button>
            </div>
            <button
              type="button"
              onClick={accept}
              aria-label="Fermer"
              className="shrink-0 w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X size={14} className="text-white/50" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
