'use client'

// app/(app)/settings/page.tsx

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Check, ChevronRight, Crown } from 'lucide-react'
import { useAppStore } from '@/lib/store'

type TabKey = 'plans' | 'events' | 'news' | 'legal'

export default function SettingsPage() {
  const { profile } = useAppStore()
  const [upgrading, setUpgrading] = useState(false)
  const [tab, setTab] = useState<TabKey>('plans')

  const isBusiness = profile?.plan === 'premium'

  const handleUpgrade = async () => {
    setUpgrading(true)

    try {
      const response = await fetch('/api/checkout', { method: 'POST' })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Erreur lors de la création du paiement')
      if (!data.url) throw new Error('URL de paiement introuvable')

      window.location.href = data.url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise Ã  niveau')
      setUpgrading(false)
    }
  }

  const tabs = useMemo(
    () =>
      [
        { key: 'plans' as const, label: 'Plans' },
        { key: 'events' as const, label: 'Événements' },
        { key: 'news' as const, label: 'Actus' },
        { key: 'legal' as const, label: 'Mentions légales' },
      ] satisfies Array<{ key: TabKey; label: string }>,
    []
  )

  return (
<div className="min-h-screen flex flex-col bg-dark">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 shrink-0">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-white">PAKT</h1>

          {/* Tabs */}
          <div className="mt-4 flex gap-5 border-b border-dark-500">
            {tabs.map((t) => {
              const active = tab === t.key
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`relative pb-3 text-sm font-semibold transition-colors ${
                    active ? 'text-gold' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {t.label}
                  <span
                    className={`absolute left-0 right-0 -bottom-[1px] h-[2px] transition-opacity ${
                      active ? 'opacity-100 bg-gold' : 'opacity-0 bg-gold'
                    }`}
                  />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="px-5 pb-24">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait" initial={false}>
            {/* PLANS */}
            {tab === 'plans' && (
              <motion.div
                key="plans"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >
                {/* Plan actuel (compact) */}
                <div className="bg-dark-200 border border-dark-500 rounded-[12px] px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/60">Plan actuel :</span>
                    <span className="text-sm font-semibold text-white">
                      {isBusiness ? 'PAKT Business' : 'PAKT'}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isBusiness
                        ? 'bg-gold text-dark'
                        : 'bg-white/10 text-white/60 border border-dark-500'
                    }`}
                  >
                    {isBusiness ? 'BUSINESS' : 'PAKT'}
                  </span>
                </div>

                {/* Cartes plans */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* PAKT */}
                  <div
                    className={`bg-dark-200 border rounded-[12px] p-5 transition-colors flex flex-col ${
                      !isBusiness ? 'border-gold/40' : 'border-dark-500 hover:border-gold/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-white">PAKT</p>
                        <span className="inline-flex mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/60 border border-dark-500">
                          PAKT
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-white">Gratuit</div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Check size={14} className="text-white/40" />
                        <span className="text-sm text-white/60">10 swipes / jour</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check size={14} className="text-white/40" />
                        <span className="text-sm text-white/60">1 message avant match</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-5">
                      <button
                        type="button"
                        disabled
                        className="h-[48px] w-full flex items-center justify-center rounded-[12px] font-bold text-sm border border-dark-500 bg-white/10 text-white/70 disabled:opacity-100"
                      >
                        Plan actuel
                      </button>
                    </div>
                  </div>

                  {/* BUSINESS */}
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    className={`bg-dark-200 border rounded-[12px] p-5 transition-colors flex flex-col ${
                      isBusiness
                        ? 'border-gold/60 shadow-[0_0_0_1px_rgba(212,168,83,0.25),0_0_40px_rgba(212,168,83,0.10)]'
                        : 'border-dark-500 hover:border-gold/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                          <Crown size={18} className="text-gold" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-white">PAKT Business</p>
                          <span className="inline-flex mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold text-dark">
                            BUSINESS
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-baseline justify-end gap-2">
                          <span className="text-2xl font-black text-gold">5.00€</span>
                          <span className="text-white/40 text-sm">/mois</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {[
                        'Swipes illimités',
                        'Messages illimités',
                        'Accès prioritaire aux Événements',
                        'Réduction sur les Événements',
                        'Accès anticipé aux futures fonctionnalités',
                      ].map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <Check size={14} className="text-gold" />
                          <span className="text-sm text-white/60">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto pt-5">
                      <button
                        type="button"
                        onClick={isBusiness ? undefined : handleUpgrade}
                        disabled={isBusiness || upgrading}
                        className={`h-[48px] w-full flex items-center justify-center rounded-[12px] font-bold text-sm transition-all active:scale-[0.99] disabled:opacity-50 ${
                          isBusiness
                            ? 'border border-dark-500 bg-white/10 text-white/70'
                            : 'bg-gold text-dark hover:bg-gold-light'
                        }`}
                      >
                        {isBusiness ? 'Plan actuel' : upgrading ? 'Redirection...' : 'Passer Business'}
                      </button>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* EVENTS */}
            {tab === 'events' && (
              <motion.div
                key="events"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="py-16 flex items-center justify-center"
              >
                <p className="text-white/50 text-sm">Très prochainement</p>
              </motion.div>
            )}

            {/* NEWS */}
            {tab === 'news' && (
              <motion.div
                key="news"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="py-16 flex items-center justify-center"
              >
                <p className="text-white/50 text-sm">Très prochainement</p>
              </motion.div>
            )}

            {/* LEGAL */}
            {tab === 'legal' && (
              <motion.div
                key="legal"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-2"
              >
                {[
                  { label: 'CGU', href: '/legal/cgu' },
                  { label: 'Politique de confidentialité', href: '/legal/privacy' },
                  { label: 'Paiement & abonnements', href: '/legal/billing' },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="w-full flex items-center justify-between p-4 rounded-[12px] bg-dark-200 border border-dark-500 hover:border-gold/50 transition-colors"
                  >
                    <span className="text-sm font-semibold text-white">{item.label}</span>
                    <ChevronRight size={16} className="text-white/30" />
                  </a>
                ))}

                
              </motion.div>
            )}
         </AnimatePresence>
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-center text-white/30 text-xs pb-28 pt-10">
  PAKT v1.0.0
</div>
    </div>
  )
}