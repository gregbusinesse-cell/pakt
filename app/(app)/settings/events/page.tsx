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
          <h2 className="text-2xl font-bold text-white">Événements PAKT</h2>

<p className="mt-4 text-base leading-relaxed text-white/80">
  Les événements PAKT ne sont pas faits pour “networker”. Ils sont faits pour avancer.
</p>

<p className="mt-4 text-sm leading-relaxed text-white/60">
  Aujourd’hui, la plupart des événements business promettent des connexions.
  En réalité, tu repars souvent avec des discussions sans suite et peu d’impact réel.
</p>

<p className="mt-3 text-sm leading-relaxed text-white/60">
  Ici, l’objectif est différent : créer des connexions utiles, dans un cadre pensé pour que ça aboutisse.
  Chaque détail est structuré pour favoriser les échanges qui comptent vraiment.
</p>

<p className="mt-3 text-sm leading-relaxed text-white/60">
  Tu ne viens pas pour “rencontrer du monde”. Tu viens pour rencontrer les bonnes personnes :
  des profils qui construisent, qui cherchent à avancer, à s’associer, à résoudre des problèmes concrets.
</p>

<p className="mt-3 text-sm leading-relaxed text-white/60">
  Le format est simple mais optimisé : un lieu, un moment, un groupe sélectionné.
  Pas de masse inutile. Pas de perte de temps. Juste des personnes alignées sur les mêmes objectifs.
</p>

<p className="mt-4 text-sm leading-relaxed text-white/60">
  Les interventions sont là pour t’apporter un vrai avantage.
  Des entrepreneurs viennent expliquer ce qu’ils font réellement, comment ils gagnent leur vie,
  et surtout ce qui fonctionne aujourd’hui.
</p>

<p className="mt-3 text-sm leading-relaxed text-white/60">
  Pas de théorie vague. Pas de contenu générique.
  Du concret que tu peux appliquer directement ou adapter à ta situation.
</p>

<p className="mt-3 text-sm leading-relaxed text-white/60">
  Mais la vraie valeur se crée en dehors de ces moments.
  Les échanges, les discussions, les opportunités qui naissent naturellement entre les participants.
</p>

<p className="mt-3 text-sm leading-relaxed text-white/60">
  C’est là que des projets se lancent, que des associations se forment,
  et que certaines décisions importantes se prennent.
</p>

<p className="mt-3 text-sm leading-relaxed text-white/60">
  Le moment de partage en fin d’événement renforce encore cette dynamique.
  Un cadre plus détendu, mais toujours orienté business, où les connexions deviennent plus solides.
</p>

<p className="mt-4 text-sm leading-relaxed text-white/60">
  L’objectif est clair : que tu repartes avec quelque chose de tangible.
  Une opportunité. Un contact clé. Une idée exploitable. Ou une nouvelle direction.
</p>

<p className="mt-3 text-sm leading-relaxed text-white/60">
  Si tu viens sans rien faire, rien ne se passe.
  Si tu viens avec une vraie intention, les conditions sont réunies pour que ça accélère.
</p>

<p className="mt-3 text-sm leading-relaxed text-white/60">
  Chaque événement est construit avec exigence.
  On ne fait pas d’événement “pour faire un événement”.
  Tout est pensé pour maximiser la valeur, et ce niveau ne fera qu’augmenter avec le temps.
</p>

<p className="mt-4 text-sm leading-relaxed text-white/60">
  L’ambition est simple : créer des événements où les bonnes personnes se rencontrent au bon moment,
  et où ça change réellement quelque chose.
</p>

<p className="mt-4 text-sm leading-relaxed text-white/80">
  Si tu viens, c’est pour repartir avec un avantage.
</p>
          </div>
        </section>
      </main>
    </div>
  )
}