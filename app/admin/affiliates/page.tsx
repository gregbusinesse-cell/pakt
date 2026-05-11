'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Crown } from 'lucide-react'

type AffiliateRow = {
  id: string
  name: string
  code: string
  created_at: string
  stats: { signups: number; business: number; business_pro: number }
}

export default function AffiliatesAdminPage() {
  const [affiliates, setAffiliates] = useState<AffiliateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const loadData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('Non connecté')
        return
      }

      const res = await fetch('/api/affiliate/stats', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error || `Erreur ${res.status}`)
        return
      }

      const data = await res.json()
      setAffiliates(data.affiliates || [])
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-white">
        <div className="w-10 h-10 rounded-full border-2 border-gold border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-white">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark text-white px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Crown size={24} className="text-gold" />
          <h1 className="text-2xl font-bold">Affiliates Dashboard</h1>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-dark-200 border border-dark-500 rounded-[12px] p-4 text-center">
            <p className="text-2xl font-black text-gold">{affiliates.length}</p>
            <p className="text-xs text-white/50 mt-1">Influenceurs</p>
          </div>
          <div className="bg-dark-200 border border-dark-500 rounded-[12px] p-4 text-center">
            <p className="text-2xl font-black text-gold">
              {affiliates.reduce((s, a) => s + a.stats.signups, 0)}
            </p>
            <p className="text-xs text-white/50 mt-1">Inscriptions</p>
          </div>
          <div className="bg-dark-200 border border-dark-500 rounded-[12px] p-4 text-center">
            <p className="text-2xl font-black text-gold">
              {affiliates.reduce((s, a) => s + a.stats.business + a.stats.business_pro, 0)}
            </p>
            <p className="text-xs text-white/50 mt-1">Conversions</p>
          </div>
        </div>

        {affiliates.length === 0 ? (
          <p className="text-white/40 text-center py-12">Aucun influenceur enregistré</p>
        ) : (
          <div className="space-y-2">
            {affiliates.map((a) => {
              const totalConversions = a.stats.business + a.stats.business_pro
              const convRate = a.stats.signups > 0
                ? ((totalConversions / a.stats.signups) * 100).toFixed(1)
                : '0'

              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-4 rounded-[12px] bg-dark-200 border border-dark-500"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{a.name}</p>
                    <p className="text-xs text-white/40 font-mono mt-0.5">?ref={a.code}</p>
                  </div>

                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-sm font-bold text-white">{a.stats.signups}</p>
                      <p className="text-[10px] text-white/40">Signups</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{a.stats.business}</p>
                      <p className="text-[10px] text-white/40">Business</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gold">{a.stats.business_pro}</p>
                      <p className="text-[10px] text-white/40">Pro</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white/70">{convRate}%</p>
                      <p className="text-[10px] text-white/40">Conv.</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
