'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function CGVPage() {
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
          <h1 className="text-2xl font-bold">CGV</h1>

          <div className="bg-dark-200 border border-dark-500 rounded-[12px] p-6 space-y-4 text-white/70 text-sm leading-relaxed">
            <p>Dernière mise à jour : 2 mai 2026</p>

            <h2 className="text-white font-semibold">1. Vendeur</h2>
            <p>
              Les services payants de PAKT sont vendus par Velura, micro-entreprise exploitant la marque PAKT.
            </p>
            <p>
              Siège : 229 rue Saint-Honoré, 75001 Paris, France<br />
              SIRET : 925 272 957 00018<br />
              TVA non applicable, article 293 B du Code général des impôts<br />
              Email : supportpaktsupport@gmail.com
            </p>

            <h2 className="text-white font-semibold">2. Services proposés</h2>
            <p>
              PAKT peut proposer un abonnement facultatif appelé PAKT Business. Cet abonnement donne accès à davantage de
              fonctionnalités, notamment un usage illimité ou quasi illimité de certaines fonctionnalités, dans la limite du
              fonctionnement technique normal et des mécanismes anti-abus.
            </p>

            <h2 className="text-white font-semibold">3. Prix</h2>
            <p>
              L’abonnement PAKT Business est proposé au prix de 5 € par mois. Un plan annuel pourra être proposé ultérieurement.
              Son prix, sa périodicité et ses conditions seront affichés dans l’application avant souscription.
            </p>
            <p>Les prix sont indiqués en euros. TVA non applicable, article 293 B du CGI.</p>

            <h2 className="text-white font-semibold">4. Paiement</h2>
            <p>
              Les paiements sont traités uniquement via Stripe. PAKT ne stocke pas directement les numéros complets de carte
              bancaire. L’utilisateur garantit qu’il est autorisé à utiliser le moyen de paiement choisi.
            </p>

            <h2 className="text-white font-semibold">5. Renouvellement automatique</h2>
            <p>
              L’abonnement PAKT Business est renouvelé automatiquement à chaque période, sauf résiliation avant la date de
              renouvellement. Pour l’abonnement mensuel, le renouvellement intervient chaque mois.
            </p>

            <h2 className="text-white font-semibold">6. Résiliation</h2>
            <p>
              L’utilisateur peut résilier son abonnement à tout moment depuis l’application, depuis le portail Stripe lorsqu’il
              est disponible, ou en contactant : supportpaktsupport@gmail.com
            </p>
            <p>
              Après résiliation, l’utilisateur conserve l’accès aux avantages payés jusqu’à la fin de la période d’abonnement
              en cours.
            </p>

            <h2 className="text-white font-semibold">7. Remboursements</h2>
            <p>
              Sauf obligation légale contraire, les paiements réalisés pour PAKT Business sont en principe non remboursables.
              PAKT peut toutefois accorder un remboursement total ou partiel au cas par cas, notamment en cas de problème
              technique important, d’erreur manifeste ou de situation exceptionnelle.
            </p>

            <h2 className="text-white font-semibold">8. Droit de rétractation</h2>
            <p>
              Le consommateur peut bénéficier d’un délai légal de rétractation de 14 jours pour certains achats à distance.
              Lorsque l’utilisateur demande l’accès immédiat à un service numérique avant la fin de ce délai, il peut être
              amené à renoncer expressément à son droit de rétractation pour la période commencée.
            </p>

            <h2 className="text-white font-semibold">9. Cagnotte</h2>
            <p>
              La cagnotte PAKT est volontaire, facultative et distincte de l’abonnement PAKT Business. Elle peut ouvrir droit
              à certains avantages, réductions ou paliers selon les règles affichées dans l’application.
            </p>
            <p>
              Aucune contribution à la cagnotte ne garantit un résultat business, financier, commercial, relationnel ou
              entrepreneurial. Sauf mention contraire ou obligation légale, les participations ne sont pas automatiquement
              remboursables.
            </p>

            <h2 className="text-white font-semibold">10. Événements</h2>
            <p>
              PAKT peut proposer des événements gratuits ou payants. Certains événements peuvent être inclus partiellement,
              proposés avec réduction ou soumis à des conditions spécifiques selon l’abonnement, la cagnotte ou les règles
              affichées dans l’application.
            </p>

            <h2 className="text-white font-semibold">11. Défaut de paiement</h2>
            <p>
              En cas d’échec de paiement, de moyen de paiement expiré, d’opposition ou de rejet, l’accès aux fonctionnalités
              payantes peut être suspendu ou résilié.
            </p>

            <h2 className="text-white font-semibold">12. Absence de garantie de résultat</h2>
            <p>
              PAKT est une plateforme de mise en relation, de ressources, d’inspiration et d’événements. PAKT ne garantit aucun
              résultat business, financier, commercial, entrepreneurial ou relationnel.
            </p>

            <h2 className="text-white font-semibold">13. Litiges</h2>
            <p>
              En cas de litige, l’utilisateur est invité à contacter PAKT en priorité à l’adresse :
              supportpaktsupport@gmail.com. Les présentes CGV sont soumises au droit français.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}