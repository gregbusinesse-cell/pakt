import Link from 'next/link'

export default function SettingsEventsPage() {
  return (
    <div className="min-h-screen bg-dark text-white px-5 py-8">
      <main className="max-w-3xl mx-auto space-y-6 pb-[120px]">
        <Link href="/settings" className="text-sm text-gold hover:text-gold-light">
          Retour aux événements
        </Link>

        <section className="bg-dark-200 border border-gold/20 rounded-[12px] p-5 space-y-5">
          <h1 className="text-2xl font-bold">Événements PAKT</h1>

          <div className="space-y-4 text-sm leading-relaxed text-white/65">
            <p>
              Les événements PAKT ont pour objectif de transformer les connexions créées dans
              l’application en vraies rencontres. L’idée n’est pas d’organiser de simples soirées
              classiques, mais de créer des moments utiles, sérieux et orientés action.
            </p>
            <p>
              Chaque événement sera pensé pour réunir des personnes ambitieuses : entrepreneurs,
              créateurs, freelances, étudiants motivés, porteurs de projets ou personnes qui veulent
              accélérer leur progression.
            </p>
            <p>
              L’objectif est simple : permettre aux membres de rencontrer les bonnes personnes plus
              vite, créer des partenariats, trouver des associés, découvrir des opportunités,
              échanger sur leurs projets et construire un réseau concret.
            </p>
          </div>

          <Section title="Pourquoi organiser ces événements ?">
            Créer des rencontres utiles, concrètes et orientées action entre membres ambitieux.
          </Section>

          <Section title="À qui ça s’adresse ?">
            Entrepreneurs, créateurs, freelances, étudiants motivés, porteurs de projets et profils
            ambitieux.
          </Section>

          <Section title="Comment ça va fonctionner ?">
            Networking structuré, présentations de projets, rencontres entre profils compatibles,
            discussions business, ateliers courts et moments informels.
          </Section>

          <Section title="Ce que les membres pourront y gagner">
            Contacts, idées, collaborations, apprentissages, partenariats et opportunités concrètes.
          </Section>
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