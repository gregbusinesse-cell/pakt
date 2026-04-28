'use client'

// app/(app)/settings/page.tsx

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Check, ChevronRight, Crown, X } from 'lucide-react'
import { useAppStore } from '@/lib/store'

type TabKey = 'plans' | 'events' | 'news' | 'legal'

const FUNDING_GOAL = 3000

function getFundingProgress(currentAmount: number) {
  return Math.min(100, Math.max(0, (currentAmount / FUNDING_GOAL) * 100))
}

function getContributionUrl() {
  return process.env.NEXT_PUBLIC_STRIPE_EVENT_PAYMENT_LINK || '/api/checkout'
}

function EventsSection() {
  const [currentAmount, setCurrentAmount] = useState(0)
  const [loadingFunding, setLoadingFunding] = useState(true)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const progress = getFundingProgress(currentAmount)
  const completed = currentAmount >= FUNDING_GOAL

  useEffect(() => {
    const loadFunding = async () => {
      try {
        const response = await fetch('/api/funding', { cache: 'no-store' })

        if (!response.ok) {
          setCurrentAmount(0)
          return
        }

        const data = await response.json()
        setCurrentAmount(Number(data.total || 0))
      } catch {
        setCurrentAmount(0)
      } finally {
        setLoadingFunding(false)
      }
    }

    loadFunding()
  }, [])

  const handleContribute = () => {
    if (completed) return
    window.location.href = getContributionUrl()
  }

  return (
    <>
      <motion.div
        key="events"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
        className="space-y-5"
      >
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="overflow-hidden bg-dark-200 border border-gold/20 rounded-[12px]"
        >
          <div className="h-44 w-full bg-[#1e1e1e]">
            <img
              src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80"
              alt="Événement networking premium"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="p-5 space-y-3">
            <h2 className="text-xl font-bold text-white">Événements PAKT</h2>

            <p className="text-sm leading-relaxed text-white/65">
              PAKT organise des événements exclusifs pour connecter les membres dans la vraie vie.
              Networking, business, rencontres ambitieuses et opportunités concrètes.
            </p>

            <p className="text-sm leading-relaxed text-white/45">
              Ces événements permettront de rencontrer des profils sérieux, créer des partenariats
              et accélérer vos projets.
            </p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          onClick={() => setDetailsOpen(true)}
          className="bg-dark-200 border border-gold/20 rounded-[12px] p-5 space-y-5 cursor-pointer"
        >
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white">Cagnotte Événement</h2>

            <p className="text-sm leading-relaxed text-white/65">
              Pour organiser notre premier événement, nous avons besoin de 3000€. Chaque
              contribution permet d'accélérer le lancement et de créer une expérience de qualité.
            </p>
          </div>

          {loadingFunding ? (
            <div className="h-3 w-full rounded-full bg-[#1e1e1e] border border-dark-500 overflow-hidden">
              <div className="h-full w-1/3 rounded-full bg-gold/40 animate-pulse" />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="h-3 w-full overflow-hidden rounded-full bg-[#1e1e1e] border border-dark-500">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completed ? 100 : progress}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className={`h-full rounded-full bg-gold ${
                    completed ? 'animate-pulse shadow-[0_0_18px_rgba(212,168,83,0.55)]' : ''
                  }`}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">
                  {completed ? 'Objectif atteint 🎉' : `${currentAmount}€ / ${FUNDING_GOAL}€`}
                </span>
                <span className="text-gold font-semibold">{Math.round(progress)}%</span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              handleContribute()
            }}
            disabled={completed}
            className="h-[48px] w-full flex items-center justify-center rounded-[12px] font-bold text-sm bg-gold text-dark hover:bg-gold-light transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {completed ? 'Objectif atteint' : 'Contribuer'}
          </button>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {detailsOpen && (
          <div className="fixed inset-0 z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/65"
              onClick={() => setDetailsOpen(false)}
            />

            <div className="absolute inset-0 flex items-center justify-center px-5">
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="w-full max-w-md rounded-[12px] border border-gold/20 bg-dark-200 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-xl font-bold text-white">Pourquoi cette cagnotte ?</h3>

                  <button
                    type="button"
                    onClick={() => setDetailsOpen(false)}
                    className="p-2 rounded-full bg-[#1e1e1e] text-white/60 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-white/65">
                  Cette cagnotte permet de financer le premier événement PAKT. L’objectif est de
                  créer une expérience premium : lieu, organisation, sélection des profils, ambiance
                  et opportunités.
                </p>

                <div className="mt-5">
                  <p className="text-sm font-semibold text-white">Avantages contributeurs :</p>

                  <div className="mt-3 space-y-2">
                    {[
                      'accès prioritaire aux événements',
                      'badge premium',
                      'visibilité accrue',
                      'opportunités exclusives',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <Check size={14} className="text-gold" />
                        <span className="text-sm text-white/60">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleContribute}
                  disabled={completed}
                  className="mt-6 h-[48px] w-full flex items-center justify-center rounded-[12px] font-bold text-sm bg-gold text-dark hover:bg-gold-light transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {completed ? 'Objectif atteint' : 'Contribuer maintenant'}
                </button>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

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
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à niveau')
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
      <div className="px-5 pt-6 pb-4 shrink-0">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-white">PAKT</h1>

          <div className="mt-4 flex gap-5 border-b border-dark-500 overflow-x-auto">
            {tabs.map((t) => {
              const active = tab === t.key

              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`relative pb-3 text-sm font-semibold transition-colors whitespace-nowrap ${
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
            {tab === 'plans' && (
              <motion.div
                key="plans"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      {['10 swipes / jour', '1 message avant match'].map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <Check size={14} className="text-white/40" />
                          <span className="text-sm text-white/60">{feature}</span>
                        </div>
                      ))}
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

            {tab === 'events' && <EventsSection key="events-section" />}

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

      <div className="text-center text-white/30 text-xs pb-28 pt-10">PAKT v1.0.0</div>
    </div>
  )
}