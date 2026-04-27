'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function CGUPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-dark text-white">
      
      <div className="px-5 pt-5">
        <button
          onClick={() => router.replace('/settings')}
          className="flex items-center gap-2 text-white/70 hover:text-white"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Retour</span>
        </button>
      </div>

      <div className="px-5 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          
          <h1 className="text-2xl font-bold">CGU</h1>

          <div className="bg-dark-200 border border-dark-500 rounded-[12px] p-6 space-y-3 text-white/70 text-sm">
            <p>PAKT est une application de mise en relation. En utilisant l’application, vous acceptez ces conditions.</p>
            <p>Vous vous engagez à fournir des informations exactes et à respecter les autres utilisateurs.</p>
            <p>Vous êtes responsable de vos contenus, messages et interactions.</p>
            <p>Un compte peut être supprimé à tout moment. La suppression du compte est possible sur demande.</p>
          </div>

        </div>
      </div>

    </div>
  )
}