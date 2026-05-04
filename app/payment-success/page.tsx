'use client'

// app/payment-success/page.tsx

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'

type PlanKey = 'business' | 'business_pro'

function isValidPlan(plan: string | null): plan is PlanKey {
  return plan === 'business' || plan === 'business_pro'
}

export default function PaymentSuccessPage() {
  const router = useRouter()
  const { profile, setProfile } = useAppStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const plan = new URLSearchParams(window.location.search).get('plan')

    if (!isValidPlan(plan)) {
      toast.error('Plan invalide')
      setLoading(false)
      return
    }

    const updatePlan = async () => {
      try {
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user?.id) {
          toast.error('Session introuvable')
          setLoading(false)
          return
        }

        const { error } = await supabase
          .from('profiles')
          .update({ plan } as never)
          .eq('id', session.user.id)

        if (error) throw error

        if (profile) {
          setProfile({ ...profile, plan } as any)
        }

        toast.success('Paiement réussi, ton plan a été activé')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erreur activation du plan')
      } finally {
        setLoading(false)
      }
    }

    updatePlan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-dark text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-dark-200 border border-dark-500 rounded-[12px] p-6 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
          <Check size={26} className="text-gold" />
        </div>

        <h1 className="mt-5 text-xl font-bold">
          {loading ? 'Activation du plan...' : 'Paiement réussi'}
        </h1>

        <p className="mt-2 text-sm text-white/60">
          {loading
            ? 'Nous activons ton abonnement.'
            : 'Paiement réussi, ton plan a été activé.'}
        </p>

        <button
          type="button"
          onClick={() => router.replace('/settings')}
          disabled={loading}
          className="mt-6 h-[48px] w-full rounded-[12px] bg-gold text-dark font-bold disabled:opacity-60"
        >
          Retour aux paramètres
        </button>
      </div>
    </div>
  )
}