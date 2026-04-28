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
        <Link href="/settings" className="text-sm text-gold hover:text-gold-light">
          Retour aux événements
        </Link>

        <section className="bg-dark-200 border border-gold/20 rounded-[12px] p-5 space-y-5">
          <h1 className="text-2xl font-bold">Cagnotte du premier événement</h1>

          <p className="text-sm leading-relaxed text-white/65">
            Pour organiser le premier événement PAKT dans de bonnes conditions, nous avons fixé un
            objectif de 3000€. Cette cagnotte sert à financer les éléments nécessaires pour créer un
            événement sérieux, propre et utile pour les membres : réservation du lieu, organisation,
            matériel, communication, accueil, logistique et expérience sur place.
          </p>

          <Section title="À quoi servira l’argent ?">
            réservation du lieu, logistique, communication, matériel, organisation et amélioration
            de l’expérience membre.
          </Section>

          <div className="border-t border-dark-500 pt-4">
            <h2 className="font-semibold text-white">Objectif : 3000€</h2>
            <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-[#1e1e1e] border border-dark-500">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completed ? 100 : progress}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className={`h-full rounded-full bg-gold ${
                  completed ? 'animate-pulse shadow-[0_0_18px_rgba(212,168,83,0.55)]' : ''
                }`}
              />
            </div>
            <p className="mt-2 text-sm text-white/60">
              {completed ? 'Objectif atteint' : `${currentAmount}€ / ${goal}€ collectés`}
            </p>
          </div>

          <Section title="Que se passe-t-il si l’objectif est atteint ?">
            Lorsque l’objectif de 3000€ sera atteint, la cagnotte sera marquée comme complétée et
            l’organisation du premier événement pourra être lancée.
          </Section>

          <Section title="Avantages contributeurs">
            Les membres qui contribuent pourront bénéficier d’avantages lors des premiers événements
            PAKT : accès prioritaire, visibilité renforcée, badge contributeur ou invitations
            privilégiées selon l’organisation finale.
          </Section>

          <button
            type="button"
            onClick={contribute}
            disabled={completed}
            className="h-[48px] w-full rounded-[12px] bg-gold text-dark font-bold text-sm hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {completed ? 'Objectif atteint' : 'Contribuer à la cagnotte'}
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