import Link from 'next/link'

export default function SettingsEventsPage() {
  return (
    <div className="min-h-screen bg-dark text-white px-5 py-8">
      <main className="max-w-3xl mx-auto space-y-6 pb-[120px]">
        <div className="flex items-center gap-2">
          <Link href="/settings" className="flex items-center gap-2 text-gold hover:text-gold-light">
            <span className="text-lg">←</span>
            <span className="text-sm">Retour</span>
          </Link>
        </div>

        <section className="bg-dark-200 border border-gold/20 rounded-[12px] p-5 space-y-5">
          <h1 className="text-2xl font-bold">Événements PAKT</h1>

          <div className="space-y-5 text-sm leading-relaxed text-white/70">
            <p>
              Les événements PAKT sont conçus pour transformer les connexions digitales en opportunités réelles.
              L’objectif n’est pas de créer des rencontres superficielles, mais des environnements où chaque échange
              peut réellement faire avancer un projet, un business ou une trajectoire.
            </p>

            <p>
              Chaque événement réunit des profils ambitieux : entrepreneurs, créateurs, freelances et porteurs de projets,
              dans des cadres soigneusement sélectionnés pour favoriser les échanges, la concentration et la montée en niveau.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}