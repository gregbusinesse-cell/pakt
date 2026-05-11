'use client'

// components/settings/ReferralTab.tsx

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, Gift, Lock, Crown } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

const TIERS = [
  { count: 3, label: '3 parrainages', reward: '7 jours BUSINESS', plan: 'business' },
  { count: 5, label: '5 parrainages', reward: '1 mois BUSINESS', plan: 'business' },
  { count: 10, label: '10 parrainages', reward: '1 mois BUSINESS PRO', plan: 'business_pro' },
  { count: 25, label: '25 parrainages', reward: '3 mois BUSINESS PRO', plan: 'business_pro' },
  { count: 50, label: '50 parrainages', reward: '6 mois BUSINESS PRO', plan: 'business_pro' },
]

export default function ReferralTab() {
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [validatedCount, setValidatedCount] = useState(0)
  const [claimedTiers, setClaimedTiers] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [claimingTier, setClaimingTier] = useState<number | null>(null)

  const getToken = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token) return

      const res = await fetch('/api/referrals', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) return

      const data = await res.json()
      setReferralCode(data.referralCode)
      setValidatedCount(data.validatedCount)
      setClaimedTiers(data.claimedTiers || [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const handleCopy = async () => {
    if (!referralCode) return

    const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const link = `${siteUrl}/?ref=${referralCode}`

    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success('Lien copié !')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Impossible de copier')
    }
  }

  const handleClaim = async (tier: number) => {
    try {
      setClaimingTier(tier)
      const token = await getToken()
      if (!token) return

      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Erreur')
        return
      }

      toast.success(`Récompense débloquée : ${data.plan} pendant ${data.days} jours !`)
      setClaimedTiers((prev) => [...prev, tier])
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setClaimingTier(null)
    }
  }

  const nextTier = TIERS.find((t) => validatedCount < t.count && !claimedTiers.includes(t.count))
  const progressPercent = nextTier
    ? Math.min(100, (validatedCount / nextTier.count) * 100)
    : 100

  if (loading) {
    return (
      <motion.div
        key="referral"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
        className="py-16 flex items-center justify-center"
      >
        <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
      </motion.div>
    )
  }

  return (
    <motion.div
      key="referral"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="space-y-4 pb-32"
    >
      {/* Referral link */}
      <div className="bg-dark-200 border border-gold/20 rounded-[12px] p-5">
        <h2 className="text-lg font-bold text-white">Invite tes amis</h2>
        <p className="mt-2 text-sm text-white/50 leading-relaxed">
          Partage ton lien personnel. Quand tes amis s&apos;inscrivent et terminent leur profil,
          tu gagnes des récompenses.
        </p>

        {referralCode && (
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 bg-[#1a1a1a] border border-dark-500 rounded-[10px] px-4 py-3 text-sm text-white/70 truncate font-mono">
              {typeof window !== 'undefined' ? window.location.origin : ''}/?ref={referralCode}
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 h-[46px] w-[46px] flex items-center justify-center rounded-[10px] bg-gold text-dark hover:bg-gold-light transition-colors"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="bg-dark-200 border border-dark-500 rounded-[12px] p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Parrainages validés</span>
          <span className="text-2xl font-black text-gold">{validatedCount}</span>
        </div>

        {nextTier && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-white/40 mb-2">
              <span>Prochain palier : {nextTier.count}</span>
              <span>{validatedCount}/{nextTier.count}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#1e1e1e] border border-dark-500">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="h-full rounded-full bg-gold"
              />
            </div>
          </div>
        )}
      </div>

      {/* Reward tiers */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white/60 px-1">Récompenses</h3>

        {TIERS.map((tier) => {
          const unlocked = validatedCount >= tier.count
          const claimed = claimedTiers.includes(tier.count)
          const canClaim = unlocked && !claimed
          const isClaiming = claimingTier === tier.count
          const isPro = tier.plan === 'business_pro'

          return (
            <motion.div
              key={tier.count}
              whileHover={canClaim ? { scale: 1.01, y: -1 } : undefined}
              transition={{ duration: 0.2 }}
              className={`flex items-center justify-between p-4 rounded-[12px] bg-dark-200 border transition-colors ${
                claimed
                  ? 'border-gold/40 bg-gold/5'
                  : canClaim
                    ? 'border-gold/30 hover:border-gold/50'
                    : 'border-dark-500'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    claimed
                      ? 'bg-gold/20'
                      : unlocked
                        ? 'bg-gold/10'
                        : 'bg-white/5'
                  }`}
                >
                  {claimed ? (
                    <Check size={16} className="text-gold" />
                  ) : unlocked ? (
                    <Gift size={16} className="text-gold" />
                  ) : (
                    <Lock size={14} className="text-white/30" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${unlocked ? 'text-white' : 'text-white/40'}`}>
                    {tier.label}
                  </p>
                  <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                    {isPro && <Crown size={10} className="text-gold" />}
                    {tier.reward}
                  </p>
                </div>
              </div>

              {canClaim && (
                <button
                  type="button"
                  onClick={() => handleClaim(tier.count)}
                  disabled={isClaiming}
                  className="shrink-0 px-4 py-2 bg-gold text-dark text-xs font-bold rounded-[10px] hover:bg-gold-light transition-colors disabled:opacity-60"
                >
                  {isClaiming ? '...' : 'Réclamer'}
                </button>
              )}

              {claimed && (
                <span className="shrink-0 text-xs font-semibold text-gold/70">Obtenu</span>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Rules */}
      <div className="bg-dark-200 border border-dark-500 rounded-[12px] p-4">
        <p className="text-xs text-white/30 leading-relaxed">
          Un parrainage est validé quand ton ami termine son inscription, complète son profil
          et confirme son email. Les récompenses sont appliquées immédiatement.
        </p>
      </div>
    </motion.div>
  )
}
