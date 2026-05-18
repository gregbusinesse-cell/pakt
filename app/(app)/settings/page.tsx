'use client'

// app/(app)/settings/page.tsx

import { useMemo, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Check, ChevronDown, ChevronRight, Crown, X as XIcon } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import ReferralTab from '@/components/settings/ReferralTab'

type TabKey = 'plans' | 'events' | 'news' | 'referral' | 'legal'
type PlanKey = 'free' | 'business' | 'business_pro'

const FUNDING_GOAL = 3000
const currentAmount = 0

function normalizePlan(plan: unknown): PlanKey {
  if (plan === 'business_pro' || plan === 'pro') return 'business_pro'
  if (plan === 'business' || plan === 'premium') return 'business'
  return 'free'
}

function EventsTab() {
  const progress = Math.min(100, Math.max(0, (currentAmount / FUNDING_GOAL) * 100))
  const stripeLink = process.env.NEXT_PUBLIC_STRIPE_EVENT_PAYMENT_LINK

  return (
    <motion.div
      key="events"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="space-y-4 pb-32"
    >
      <motion.div
        whileHover={{ scale: 1.01, y: -1 }}
        transition={{ duration: 0.2 }}
        className="bg-dark-200 border border-gold/20 rounded-[12px] p-5 hover:scale-[1.01] transition-all duration-200"
      >
        <h2 className="text-xl font-bold text-white">Événements PAKT</h2>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          Des rencontres réelles entre membres ambitieux pour créer des connexions utiles, lancer des
          projets et développer son réseau.
        </p>

        <Link href="/settings/events">
          <button className="mt-4 px-4 py-2 bg-gold text-black rounded-xl font-semibold">
            En savoir plus
          </button>
        </Link>
      </motion.div>

      {false && (
        <motion.div
          whileHover={{ scale: 1.01, y: -1 }}
          transition={{ duration: 0.2 }}
          className="bg-dark-200 border border-gold/20 rounded-[12px] p-5 hover:scale-[1.01] transition-all duration-200"
        >
          <h2 className="text-xl font-bold text-white">Cagnotte événement</h2>

          <p className="mt-3 text-sm leading-relaxed text-white/60">
            Aidez-nous à financer le premier événement PAKT. Objectif : 3000€.
          </p>

          <div className="mt-4">
            <div className="h-3 w-full overflow-hidden rounded-full bg-[#1e1e1e] border border-dark-500">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="h-full rounded-full bg-gold"
              />
            </div>

            <p className="mt-2 text-sm text-white/60">
              {currentAmount}€ / {FUNDING_GOAL}€ collectés
            </p>
          </div>

          <div className="flex gap-3 mt-4 flex-wrap">
            <Link href="/settings/funding">
              <button className="px-4 py-2 border border-gold text-gold rounded-xl">
                En savoir plus
              </button>
            </Link>

            {stripeLink ? (
              <a href={stripeLink} target="_blank" rel="noreferrer">
                <button className="px-4 py-2 bg-gold text-black rounded-xl font-semibold">
                  Contribuer
                </button>
              </a>
            ) : (
              <button
                type="button"
                onClick={() =>
                  toast.error('Lien Stripe manquant (NEXT_PUBLIC_STRIPE_EVENT_PAYMENT_LINK)')
                }
                className="px-4 py-2 bg-gold text-black rounded-xl font-semibold"
              >
                Contribuer
              </button>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

const CHANGELOG = [
  {
    version: 'v1.1.3',
    date: '18 mai 2025',
    summary: 'Critères affinés et carte de swipe retravaillée',
    changes: [
      'Critères de recherche correctement appliqués sur les profils',
      'Prénom et âge affichés directement sur la photo de profil',
      'Badge des likes reçus repositionné pour plus de clarté',
      'Navigation plus stable entre les onglets',
      'Corrections de bugs et optimisation des performances',
    ],
  },
  {
    version: 'v1.1.2',
    date: '15 mai 2025',
    summary: 'Notifications, sauvegarde auto, swipe plus fluide',
    changes: [
      'Notifications par email : like, match, relance et bienvenue',
      'Sauvegarde automatique du profil (plus besoin de valider)',
      'Swipe plus fluide et sans coupures',
      'Nouveau lien rapide pour modifier ses critères',
      'Possibilite de se desinscrire des notifications',
      'Meilleure detection des profils deja vus',
      'Corrections de bugs et optimisation des performances',
    ],
  },
  {
    version: 'v1.1.1',
    date: '13 mai 2025',
    summary: 'Plans Business, messagerie et undo',
    changes: [
      'Nouveaux plans : Free, Business et Business Pro',
      'Messagerie entre membres Business',
      'Retour en arriere sur un swipe (Business Pro)',
      'Voir qui vous a like (Business Pro)',
      'Nouveau design des boutons de swipe',
      'Meilleure qualite des photos de profil',
      'Swipes et likes illimites pour tous',
    ],
  },
  {
    version: 'v1.0',
    date: '10 mai 2025',
    summary: 'Lancement de PAKT',
    changes: [
      'Decouverte de profils par swipe',
      'Systeme de matchs et conversations',
      'Profils avec photos, bio et centres d\'interet',
    ],
  },
]

function ChangelogTab() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  return (
    <>
      <motion.div
        key="news"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
        className="space-y-3 pb-32"
      >
        <div className="text-center py-2">
          <span className="text-[11px] font-bold text-gold/50 tracking-widest uppercase">Changelog</span>
        </div>

        {CHANGELOG.map((release, idx) => (
          <motion.div
            key={release.version ?? 'launch'}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06, duration: 0.25 }}
            className="bg-dark-200 border border-dark-500 rounded-[14px] px-4 py-3.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {release.version && (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    idx === 0
                      ? 'text-dark bg-gold'
                      : 'bg-white/10 text-white/50 border border-white/10'
                  }`}>
                    {release.version}
                  </span>
                )}
                <span className="text-xs text-white/30">{release.date}</span>
              </div>
            </div>
            <p className="mt-2 text-sm text-white/60">{release.summary}</p>
          </motion.div>
        ))}

        <motion.button
          type="button"
          onClick={() => setDrawerOpen(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="w-full mt-2 h-11 flex items-center justify-center gap-2 rounded-[12px] border border-gold/20 bg-gold/[0.04] text-gold text-sm font-semibold hover:bg-gold/[0.08] active:scale-[0.98] transition-all"
        >
          Voir tous les changements
          <ChevronDown size={15} />
        </motion.button>
      </motion.div>

      {/* Drawer / Full-screen panel */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              ref={drawerRef}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className="fixed inset-x-0 bottom-0 z-[101] max-h-[88dvh] bg-dark-200 border-t border-gold/15 rounded-t-[20px] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] flex flex-col"
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/15" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-dark-500 shrink-0">
                <h2 className="text-lg font-bold text-white">Changelog</h2>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <XIcon size={16} className="text-white/50" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-5">
                {CHANGELOG.map((release, idx) => (
                  <motion.div
                    key={release.version ?? 'launch'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08, duration: 0.3 }}
                  >
                    {/* Release header */}
                    <div className="flex items-center gap-3 mb-3">
                      {release.version && (
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          idx === 0
                            ? 'text-dark bg-gold'
                            : 'bg-white/10 text-white/50 border border-white/10'
                        }`}>
                          {release.version}
                        </span>
                      )}
                      <span className="text-xs text-white/30">{release.date}</span>
                    </div>

                    {/* Changes list */}
                    <div className="bg-dark-300/50 border border-dark-500 rounded-[12px] px-4 py-3 space-y-2">
                      {release.changes.map((change, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.08 + i * 0.03, duration: 0.2 }}
                          className="flex items-start gap-2.5 text-[13px] text-white/55 leading-relaxed"
                        >
                          <span className="text-gold/50 mt-[3px] shrink-0 text-[8px]">&#x25CF;</span>
                          {change}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}

                <div className="text-center pt-4 pb-8">
                  <span className="text-[11px] text-white/15">PAKT v1.1.3</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default function SettingsPage() {
  const { profile } = useAppStore()
  const [tab, setTab] = useState<TabKey>('plans')
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [localPlan, setLocalPlan] = useState<PlanKey | null>(null)

  const currentPlan = localPlan ?? normalizePlan((profile as any)?.plan)

  const isPlanActive = (plan: PlanKey) => currentPlan === plan

  const getPlanLabel = (plan: PlanKey = currentPlan) => {
    if (plan === 'business_pro') return 'PRO'
    if (plan === 'business') return 'BUSINESS'
    return 'FREE'
  }

  const getAccessToken = async () => {
    const supabase = createClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    return session?.access_token ?? null
  }

  const handleCheckout = async (plan: Exclude<PlanKey, 'free'>) => {
    try {
      setLoadingPlan(plan)

      const token = await getAccessToken()

      if (!token) {
        toast.error('Utilisateur non connecté')
        return
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'Erreur checkout')
      }

      window.location.href = data.url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur Stripe')
    } finally {
      setLoadingPlan(null)
    }
  }

  const handleCancelSubscription = async () => {
    try {
      setCancelLoading(true)

      const token = await getAccessToken()

      if (!token) {
        toast.error('Utilisateur non connecté')
        return
      }

      const res = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || 'Impossible de résilier')
      }

      setLocalPlan('free')
      toast.success('Abonnement résilié')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de résilier')
    } finally {
      setCancelLoading(false)
    }
  }

  const tabs = useMemo(
    () =>
      [
        { key: 'plans' as const, label: 'Plans' },
        { key: 'events' as const, label: 'Événements' },
        { key: 'news' as const, label: 'Actus' },
        { key: 'referral' as const, label: 'Parrainage' },
        { key: 'legal' as const, label: 'Mentions légales' },
      ] satisfies Array<{ key: TabKey; label: string }>,
    []
  )

    const plans = [
      {
        key: 'free' as const,
        name: 'FREE',
        price: 'Gratuit',
        badge: 'FREE',
        features: [
          'Swipes illimités',
          'Likes illimités',
          'Pas de messagerie',
        ],
      },
      {
        key: 'business' as const,
        name: 'BUSINESS',
        price: '5€',
        suffix: '/mois',
        badge: 'BUSINESS',
        features: [
          'Swipes illimités',
          'Likes illimités',
          'Messagerie entre membres Business',
          'Encourager les membres Free',
        ],
      },
      {
        key: 'business_pro' as const,
        name: 'BUSINESS PRO',
        price: '10€',
        suffix: '/mois',
        badge: 'PRO',
        features: [
          'Tout Business inclus',
          'Voir qui vous a liké',
          'Retour en arrière (annuler un swipe)',
          'Filtres avancés (âge + distance)',
          'Accès prioritaire aux événements',
        ],
      },
    ]
  const getPlanButton = (plan: PlanKey) => {
    if (plan === 'free') return null

    if (currentPlan === 'free') {
      return plan === 'business' ? 'Passer Business' : 'Passer Business Pro'
    }

    if (currentPlan === 'business' && plan === 'business_pro') {
      return 'Passer Business Pro'
    }

    if (currentPlan === 'business_pro' && plan === 'business') {
      return 'Passer Business'
    }

    return null
  }

  return (
    <div className="min-h-screen overflow-y-auto pb-32 px-4 bg-dark">
      <div className="px-1 pt-6 pb-4 shrink-0">
        <div className="max-w-6xl mx-auto">
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

      <div className="px-1 pb-10">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait" initial={false}>
            {tab === 'plans' && (
              <motion.div
                key="plans"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-6 pb-32"
              >
                <div className="bg-dark-200 border border-dark-500 rounded-[12px] px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/60">Plan actuel :</span>
                    <span className="text-sm font-semibold text-white">{getPlanLabel()}</span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      currentPlan === 'free'
                        ? 'bg-white/10 text-white/60 border border-dark-500'
                        : 'bg-gold text-dark'
                    }`}
                  >
                    {getPlanLabel()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                  {plans.map((plan) => {
                    const active = isPlanActive(plan.key)
                    const isFreePlan = plan.key === 'free'
                    const planButton = getPlanButton(plan.key)
                    const showCancelButton = active && plan.key !== 'free'
                    const isLoading = loadingPlan === plan.key

                    return (
                      <motion.div
                        key={plan.key}
                        whileHover={{ y: isFreePlan ? 0 : -2 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                        className={`min-h-[390px] bg-dark-200 border rounded-[12px] p-5 transition-colors flex flex-col ${
                          active
                            ? 'border-gold/60 shadow-[0_0_0_1px_rgba(212,168,83,0.25),0_0_40px_rgba(212,168,83,0.10)]'
                            : 'border-dark-500 hover:border-gold/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2">
                            {!isFreePlan && (
                              <div className="mt-0.5">
                                <Crown size={18} className="text-gold" />
                              </div>
                            )}

                            <div>
                              <p className="text-base font-semibold text-white">{plan.name}</p>
                              <span
                                className={`inline-flex mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isFreePlan
                                    ? 'bg-white/10 text-white/60 border border-dark-500'
                                    : 'bg-gold text-dark'
                                }`}
                              >
                                {plan.badge}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            {plan.suffix ? (
                              <div className="flex items-baseline justify-end gap-2">
                                <span className="text-2xl font-black text-gold">{plan.price}</span>
                                <span className="text-white/40 text-sm">{plan.suffix}</span>
                              </div>
                            ) : (
                              <div className="text-2xl font-black text-white">{plan.price}</div>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          {plan.features.map((feature) => (
                            <div key={feature} className="flex items-center gap-2">
                              <Check
                                size={14}
                                className={isFreePlan ? 'text-white/40' : 'text-gold'}
                              />
                              <span className="text-sm text-white/60">{feature}</span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-auto pt-5 space-y-3">
                          {active && (
                            <button
                              type="button"
                              disabled
                              className="h-[48px] w-full flex items-center justify-center rounded-[12px] font-bold text-sm border border-dark-500 bg-white/10 text-white/70 disabled:opacity-60"
                            >
                              Plan actuel
                            </button>
                          )}

                          {planButton && (
                            <button
                              type="button"
                              onClick={() => handleCheckout(plan.key as Exclude<PlanKey, 'free'>)}
                              disabled={loadingPlan !== null || cancelLoading}
                              className="h-[48px] w-full flex items-center justify-center rounded-[12px] font-bold text-sm transition-all active:scale-[0.99] bg-gold text-dark hover:bg-gold-light disabled:opacity-60"
                            >
                              {isLoading ? 'Redirection...' : planButton}
                            </button>
                          )}

                          {showCancelButton && (
                            <button
                              type="button"
                              onClick={handleCancelSubscription}
                              disabled={cancelLoading || loadingPlan !== null}
                              className="h-[48px] w-full flex items-center justify-center rounded-[12px] font-bold text-sm transition-colors border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/15 disabled:opacity-60"
                            >
                              {cancelLoading ? 'Résiliation...' : 'Résilier'}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {tab === 'events' && <EventsTab />}

            {tab === 'news' && <ChangelogTab />}

            {tab === 'referral' && <ReferralTab />}

            {tab === 'legal' && (
              <motion.div
                key="legal"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-2 pb-32"
              >
                {[
                  { label: 'Mentions légales', href: '/legal/legal-notice' },
                  { label: "Conditions générales d'utilisation", href: '/legal/cgu' },
                  { label: 'Politique de confidentialité', href: '/legal/privacy' },
                  { label: 'Conditions générales de vente', href: '/legal/billing' },
                  { label: 'Remboursement et résiliation', href: '/legal/remboursement-resiliation' },
                  { label: 'Politique cookies', href: '/legal/cookies' },
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

                {/* Support section */}
                <div className="mt-6 bg-dark-200 border border-dark-500 rounded-[12px] p-5">
                  <h3 className="text-sm font-bold text-white mb-2">Besoin d&apos;aide ?</h3>
                  <p className="text-xs leading-relaxed text-white/50 mb-4">
                    Une question, un problème technique, une demande de remboursement, un signalement ou besoin d&apos;assistance ? Notre équipe est là pour vous aider.
                  </p>
                  <a
                    href="mailto:paktsupport@gmail.com"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-gold/10 border border-gold/20 text-gold text-sm font-semibold hover:bg-gold/15 transition-colors"
                  >
                    paktsupport@gmail.com
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="text-center text-white/30 text-xs pb-10 pt-6">PAKT v1.1.3</div>
    </div>
  )
}