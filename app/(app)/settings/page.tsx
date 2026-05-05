'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Check, ChevronRight, Crown } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'

type TabKey = 'plans' | 'events' | 'news' | 'legal'
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

  const getPriceId = (plan: Exclude<PlanKey, 'free'>) => {
    if (plan === 'business') {
      return process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS
    }

    return process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO
  }

  const handleChangePlan = async (plan: Exclude<PlanKey, 'free'>) => {
    try {
      setLoadingPlan(plan)

      const token = await getAccessToken()

      if (!token) {
        toast.error('Utilisateur non connecté')
        return
      }

      const priceId = getPriceId(plan)

      if (!priceId) {
        toast.error('Price Stripe manquant')
        return
      }

      const res = await fetch('/api/stripe/change-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ priceId }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || 'Impossible de changer de plan')
      }

      if (data?.url) {
        window.location.href = data.url
        return
      }

      if (data?.action === 'upgraded') {
        setLocalPlan(plan)
        toast.success('Plan mis à jour')
        return
      }

      if (data?.action === 'downgrade_scheduled') {
        toast.success('Changement programmé à la fin de la période')
        return
      }

      toast.success('Demande prise en compte')
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

      toast.success('Résiliation programmée à la fin de la période')
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
      features: ['10 swipes / jour', 'Accès aux matchs', 'Messages uniquement avec les matchs'],
    },
    {
      key: 'business' as const,
      name: 'BUSINESS',
      price: '5€',
      suffix: '/mois',
      badge: 'BUSINESS',
      features: [
        '20 swipes / jour',
        'Messages illimités',
        'Accès anticipé aux futures fonctionnalités',
      ],
    },
    {
      key: 'business_pro' as const,
      name: 'BUSINESS PRO',
      price: '10€',
      suffix: '/mois',
      badge: 'PRO',
      features: [
        'Swipes illimités',
        'Messages illimités',
        'Filtres avancés (âge + distance personnalisée)',
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
                              onClick={() => handleChangePlan(plan.key as Exclude<PlanKey, 'free'>)}
                              disabled={loadingPlan !== null || cancelLoading}
                              className="h-[48px] w-full flex items-center justify-center rounded-[12px] font-bold text-sm transition-all active:scale-[0.99] bg-gold text-dark hover:bg-gold-light disabled:opacity-60"
                            >
                              {isLoading ? 'Traitement...' : planButton}
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
                className="space-y-2 pb-32"
              >
                {[
                  { label: 'Mentions légales', href: '/legal/legal-notice' },
                  { label: "Conditions générales d’utilisation", href: '/legal/cgu' },
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="text-center text-white/30 text-xs pb-10 pt-6">PAKT v1.0.0</div>
    </div>
  )
}