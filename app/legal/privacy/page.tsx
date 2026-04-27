'use client'

// app/legal/privacy/page.tsx

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-dark text-white">

      {/* Bouton retour */}
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

          <h1 className="text-2xl font-bold">Politique de confidentialité</h1>

          <div className="bg-dark-200 border border-dark-500 rounded-[12px] p-6 space-y-3 text-white/70 text-sm leading-relaxed">

            <p>
              PAKT collecte certaines données nécessaires au bon fonctionnement de l’application,
              notamment votre email et vos informations de profil.
            </p>

            <p>
              Ces données sont utilisées uniquement pour fournir les services de PAKT :
              mise en relation, messagerie, et événements.
            </p>

            <p>
              Aucune donnée personnelle n’est vendue ou partagée avec des tiers.
            </p>

            <p>
              Vous pouvez demander la suppression de vos données à tout moment en supprimant votre compte.
            </p>

          </div>

        </div>
      </div>

    </div>
  )
}