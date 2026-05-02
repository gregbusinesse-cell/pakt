'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function RemboursementResiliationPage() {
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
          <h1 className="text-2xl font-bold">Remboursement et résiliation</h1>

          <div className="bg-dark-200 border border-dark-500 rounded-[12px] p-6 space-y-4 text-white/70 text-sm leading-relaxed">
            <p>Dernière mise à jour : 2 mai 2026</p>

            <h2 className="text-white font-semibold">1. Abonnement PAKT Business</h2>
            <p>
              PAKT Business est un abonnement facultatif permettant d’accéder à davantage de fonctionnalités dans
              l’application. L’abonnement mensuel est proposé au prix de 5 € par mois.
            </p>
            <p>
              Un abonnement annuel pourra être proposé ultérieurement. Ses conditions seront indiquées dans l’application avant
              souscription.
            </p>

            <h2 className="text-white font-semibold">2. Renouvellement automatique</h2>
            <p>
              L’abonnement est renouvelé automatiquement à chaque période, sauf résiliation avant la date de renouvellement.
              Le paiement est traité par Stripe.
            </p>

            <h2 className="text-white font-semibold">3. Résiliation</h2>
            <p>
              L’utilisateur peut résilier son abonnement à tout moment depuis l’application, depuis le portail Stripe lorsqu’il
              est disponible, ou en contactant : supportpaktsupport@gmail.com
            </p>
            <p>
              Après résiliation, l’utilisateur conserve l’accès à PAKT Business jusqu’à la fin de la période déjà payée. Aucun
              nouveau prélèvement n’est effectué après la prise en compte effective de la résiliation.
            </p>

            <h2 className="text-white font-semibold">4. Effet sur le compte</h2>
            <p>
              La résiliation met fin au renouvellement automatique mais ne supprime pas nécessairement le compte utilisateur.
              L’utilisateur peut continuer à utiliser les fonctionnalités gratuites ou accessibles sans abonnement.
            </p>

            <h2 className="text-white font-semibold">5. Remboursement de l’abonnement</h2>
            <p>
              Les paiements déjà effectués sont en principe non remboursables. Un mois commencé ou une période d’abonnement
              déjà payée reste due, même si l’utilisateur résilie avant la fin de la période.
            </p>
            <p>
              PAKT peut toutefois accorder un remboursement total ou partiel au cas par cas, notamment en cas de problème
              technique important, d’erreur manifeste, de double facturation ou de situation exceptionnelle.
            </p>

            <h2 className="text-white font-semibold">6. Échec ou erreur de paiement</h2>
            <p>
              En cas d’échec de paiement, l’accès à PAKT Business peut être suspendu. L’utilisateur pourra être invité à mettre
              à jour son moyen de paiement.
            </p>
            <p>
              En cas de paiement réalisé par erreur ou de double prélèvement, l’utilisateur doit contacter PAKT afin qu’une
              vérification soit effectuée.
            </p>

            <h2 className="text-white font-semibold">7. Cagnotte volontaire</h2>
            <p>
              La cagnotte PAKT est facultative et volontaire. Elle ne remplace pas l’abonnement PAKT Business. Elle peut ouvrir
              droit à certains avantages, réductions ou paliers selon les règles affichées dans l’application.
            </p>
            <p>
              Aucune participation à la cagnotte ne garantit un résultat business, financier, commercial, relationnel ou
              entrepreneurial. Sauf mention contraire ou obligation légale, les participations ne sont pas automatiquement
              remboursables.
            </p>

            <h2 className="text-white font-semibold">8. Événements</h2>
            <p>
              PAKT peut proposer des événements gratuits ou payants. Les conditions de remboursement, d’annulation, de report
              ou de transfert peuvent varier selon l’événement et seront précisées au moment de l’inscription.
            </p>
            <p>
              En cas d’annulation d’un événement payant par PAKT, une solution pourra être proposée, notamment remboursement,
              report ou avoir, selon les circonstances.
            </p>

            <h2 className="text-white font-semibold">9. Absence de garantie de résultat</h2>
            <p>
              PAKT fournit une plateforme de mise en relation, des ressources, de l’inspiration, des outils et des événements.
              PAKT ne garantit aucun résultat business, financier, commercial, entrepreneurial ou relationnel.
            </p>
            <p>
              Un remboursement ne peut pas être demandé au seul motif qu’un utilisateur n’a pas obtenu de résultat professionnel,
              financier, commercial ou relationnel.
            </p>

            <h2 className="text-white font-semibold">10. Demande de support</h2>
            <p>
              Pour toute demande liée à un paiement, une résiliation, un remboursement ou une erreur de facturation,
              l’utilisateur peut contacter : supportpaktsupport@gmail.com
            </p>
            <p>
              La demande doit idéalement inclure l’email du compte PAKT, la date du paiement, le montant, une description du
              problème et toute référence Stripe disponible.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}