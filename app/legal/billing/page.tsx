'use client'

// app/legal/billing/page.tsx

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function BillingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-dark text-white">

      {/* Retour */}
      <div className="px-5 pt-5">
        <button
          onClick={() => router.replace('/settings')}
          className="flex items-center gap-2 text-white/70 hover:text-white"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Retour</span>
        </button>
      </div>

      {/* Contenu */}
      <div className="px-5 py-6">
        <div className="max-w-2xl mx-auto space-y-6">

          <h1 className="text-2xl font-bold">Paiement & abonnements</h1>

          <div className="bg-dark-200 border border-dark-500 rounded-[12px] p-6 space-y-3 text-white/70 text-sm leading-relaxed">
            <p>PAKT Business est un abonnement mensuel donnant accès à des fonctionnalités premium.</p>
            <p>Le paiement est effectué de manière sécurisée via notre prestataire de paiement.</p>
            <p>L’abonnement est renouvelé automatiquement chaque mois sauf résiliation.</p>
            <p>Vous pouvez résilier à tout moment.</p>
            <p>L’accès reste actif jusqu’à la fin de la période en cours.</p>
          </div>

        </div>
      </div>

    </div>
  )
}