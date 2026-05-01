'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const currentAmount = 0
const goal = 3000
const progress = Math.min(100, (currentAmount / goal) * 100)
const completed = currentAmount >= goal

export default function SettingsFundingPage() {
  const contribute = () => {
    const link = process.env.NEXT_PUBLIC_STRIPE_EVENT_PAYMENT_LINK
    if (!link) {
      toast.error('Lien de contribution indisponible')
      return
    }

    window.location.href = link
  }

  return (
    <div className="min-h-screen bg-dark text-white px-5 py-8">
      <main className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
  <Link href="/settings" className="flex items-center gap-2 text-gold hover:text-gold-light">
    <span className="text-lg">←</span>
    <span className="text-sm">Retour</span>
  </Link>
</div>

        <section className="bg-dark-200 border border-gold/20 rounded-[12px] p-5 space-y-6">

  <h1 className="text-2xl font-bold">Cagnotte du premier événement</h1>

  <p className="text-sm leading-relaxed text-white/70">
    Cette cagnotte permet de lancer le tout premier événement PAKT dans des conditions
    à la hauteur de l’ambition du projet.
  </p>

  <p className="text-sm leading-relaxed text-white/70">
    L’objectif est simple : créer un environnement réel où les membres peuvent se rencontrer,
    échanger, construire et accélérer leurs projets avec des personnes au même niveau d’exigence.
  </p>

  <div className="border-t border-dark-500 pt-4">
    <h2 className="font-semibold text-white">À quoi sert concrètement la cagnotte ?</h2>
    <p className="mt-2 text-sm text-white/60">
      Accéder à de meilleurs lieux, proposer des intervenants plus expérimentés,
      structurer les rencontres et offrir une expérience réellement utile pour chaque participant.
    </p>
  </div>

  <div className="border-t border-dark-500 pt-4">
    <h2 className="font-semibold text-white">Pourquoi contribuer ?</h2>
    <p className="mt-2 text-sm text-white/60">
      Contribuer, c’est participer directement à la qualité des premiers événements
      et faire partie des personnes qui posent les bases de l’écosystème PAKT.
    </p>
  </div>

  <div className="border-t border-dark-500 pt-4">
    <h2 className="font-semibold text-white">Avantages contributeurs</h2>
    <p className="mt-2 text-sm text-white/60">
      Accès prioritaire, meilleures conditions tarifaires, visibilité dans l’écosystème
      et opportunités renforcées lors des premiers événements.
    </p>
  </div>

  <div className="border-t border-dark-500 pt-4">
    <h2 className="font-semibold text-white">Objectif : 3000€</h2>

    <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-[#1e1e1e] border border-dark-500">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${completed ? 100 : progress}%` }}
        transition={{ duration: 0.7 }}
        className="h-full rounded-full bg-gold"
      />
    </div>

    <p className="mt-2 text-sm text-white/60">
      {completed ? 'Objectif atteint' : `${currentAmount}€ / ${goal}€ collectés`}
    </p>
  </div>

  <button
    type="button"
    onClick={contribute}
    disabled={completed}
    className="h-[52px] w-full rounded-[12px] bg-gold text-dark font-bold text-sm hover:bg-gold-light transition-all active:scale-[0.98] disabled:opacity-50"
  >
    {completed ? 'Objectif atteint' : 'Participer au lancement des événements'}
  </button>

</section>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-dark-500 pt-4">
      <h2 className="font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-white/60">{children}</p>
    </div>
  )
}