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

            <div className="border-t border-dark-500 pt-4">
              <h2 className="font-semibold text-white">Ce que tu vas vivre</h2>
              <p className="mt-2">
                Des rencontres directes avec des profils complémentaires, des discussions concrètes autour de projets réels,
                et des échanges qui peuvent déboucher sur des collaborations, des opportunités ou des partenariats.
              </p>
            </div>

            <div className="border-t border-dark-500 pt-4">
              <h2 className="font-semibold text-white">Intervenants & valeur réelle</h2>
              <p className="mt-2">
                Des intervenants expérimentés viennent partager des stratégies concrètes, des retours d’expérience
                et des méthodes applicables immédiatement pour accélérer ton développement.
              </p>
            </div>

            <div className="border-t border-dark-500 pt-4">
              <h2 className="font-semibold text-white">Format des événements</h2>
              <p className="mt-2">
                Networking structuré, échanges ciblés, moments informels, repas partagés et, selon les éditions,
                des activités permettant de créer des liens plus forts entre participants.
              </p>
            </div>

            <div className="border-t border-dark-500 pt-4">
              <h2 className="font-semibold text-white">Pourquoi c’est différent</h2>
              <p className="mt-2">
                Ici, tu ne viens pas “faire du réseau”. Tu viens rencontrer des personnes qui construisent vraiment,
                avec une logique d’entraide, de progression et de résultats.
              </p>
            </div>

            <div className="border-t border-dark-500 pt-4">
              <h2 className="font-semibold text-white">Une expérience en évolution</h2>
              <p className="mt-2">
                Chaque événement est conçu pour monter en qualité : meilleurs lieux, intervenants plus pointus,
                expériences plus riches. L’objectif est simple : créer des événements de plus en plus impactants
                à mesure que la communauté grandit.
              </p>
            </div>

          </div>
        </section>

      </main>
    </div>
  )
}