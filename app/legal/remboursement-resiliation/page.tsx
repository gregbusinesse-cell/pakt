'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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
            <p className="text-white/50">Dernière mise à jour : 18 mai 2025</p>

            <p>
              La présente politique précise les conditions de résiliation, de remboursement et de gestion des paiements
              liés aux services payants de PAKT, en complément des{' '}
              <Link href="/legal/billing" className="text-gold underline">
                Conditions Générales de Vente
              </Link>.
            </p>

            <h2 className="text-white font-semibold">1. Plans et abonnements</h2>
            <p>PAKT propose trois plans d’utilisation :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-white/90">PAKT Free</strong> — gratuit, par défaut</li>
              <li><strong className="text-white/90">PAKT Business</strong> — 5 € par mois</li>
              <li><strong className="text-white/90">PAKT Business Pro</strong> — 10 € par mois</li>
            </ul>
            <p>
              Les abonnements PAKT Business et PAKT Business Pro sont actuellement proposés à la fréquence mensuelle,
              sans engagement de durée. Des formules annuelles pourront être proposées ultérieurement.
            </p>

            <h2 className="text-white font-semibold">2. Renouvellement automatique</h2>
            <p>
              Les abonnements payants sont renouvelés automatiquement à chaque période, sauf résiliation par
              l’utilisateur avant la date de renouvellement. Le paiement est traité par Stripe Payments Europe Ltd. ou,
              pour les abonnements souscrits via l’App Store ou Google Play, par Apple Inc. ou Google LLC selon la
              plateforme utilisée.
            </p>

            <h2 className="text-white font-semibold">3. Comment résilier</h2>
            <p>L’utilisateur peut résilier son abonnement à tout moment, gratuitement, par les voies suivantes :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Depuis les paramètres de son compte dans l’application</li>
              <li>Depuis son espace de gestion d’abonnement Stripe</li>
              <li>Pour les abonnements souscrits via l’App Store : depuis les paramètres de son compte Apple</li>
              <li>Pour les abonnements souscrits via Google Play : depuis les paramètres de son compte Google Play</li>
              <li>En contactant le support : paktsupport@gmail.com</li>
            </ul>
            <p>
              Après résiliation, l’utilisateur conserve l’accès aux fonctionnalités premium jusqu’à la fin de la
              période déjà payée. Aucun nouveau prélèvement n’est effectué après la prise en compte effective de la
              résiliation.
            </p>

            <h2 className="text-white font-semibold">4. Effet sur le compte utilisateur</h2>
            <p>
              La résiliation met fin au renouvellement automatique mais n’entraîne pas la suppression du compte
              utilisateur. L’utilisateur peut continuer à utiliser les fonctionnalités gratuites ou accessibles sans
              abonnement.
            </p>
            <p>
              Pour supprimer définitivement son compte, l’utilisateur doit utiliser l’option de suppression de compte
              dédiée, depuis les paramètres de l’application. La suppression du compte entraîne l’effacement définitif
              des données dans un délai maximal de 48 heures.
            </p>

            <h2 className="text-white font-semibold">5. Droit légal de rétractation</h2>
            <p>
              Conformément aux articles L.221-18 et suivants du Code de la consommation, le consommateur dispose d’un
              délai de quatorze (14) jours à compter de la souscription pour exercer son droit de rétractation, sans
              avoir à motiver sa décision.
            </p>
            <p>
              Toutefois, en application de l’article L.221-28 du Code de la consommation, l’utilisateur qui demande
              l’exécution immédiate du service numérique et active les fonctionnalités premium dès la souscription
              renonce expressément à son droit de rétractation pour la part déjà exécutée du service.
            </p>

            <h2 className="text-white font-semibold">6. Remboursement de l’abonnement</h2>
            <p>
              Sauf obligation légale contraire ou exercice du droit de rétractation dans les conditions ci-dessus, les
              paiements déjà effectués pour PAKT Business sont fermes et non remboursables. Une période d’abonnement
              déjà payée reste due, même en cas de résiliation avant la fin de cette période.
            </p>
            <p>
              Velura peut néanmoins, à sa seule discrétion et au cas par cas, accorder un remboursement total ou
              partiel notamment dans les cas suivants :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Problème technique majeur empêchant durablement l’utilisation du service</li>
              <li>Erreur manifeste de facturation ou de tarification</li>
              <li>Double prélèvement</li>
              <li>Souscription effectuée par un mineur sans accord du représentant légal</li>
              <li>Situation exceptionnelle dûment justifiée</li>
            </ul>

            <h2 className="text-white font-semibold">7. Remboursements via l’App Store ou Google Play</h2>
            <p>
              Lorsque l’abonnement a été souscrit via l’App Store d’Apple Inc. ou le Google Play Store de Google LLC,
              toute demande de remboursement relève exclusivement de la plateforme concernée et de ses propres
              conditions. L’utilisateur doit dans ce cas adresser sa demande directement à Apple ou Google via la
              procédure prévue à cet effet sur leur site respectif.
            </p>

            <h2 className="text-white font-semibold">8. Échec ou erreur de paiement</h2>
            <p>
              En cas d’échec de paiement, de moyen de paiement expiré, d’opposition ou de rejet, l’accès aux
              fonctionnalités payantes peut être suspendu. L’utilisateur sera invité à mettre à jour son moyen de
              paiement pour rétablir l’accès.
            </p>
            <p>
              En cas de paiement effectué par erreur, de double prélèvement ou de débit non reconnu, l’utilisateur doit
              contacter PAKT dans les meilleurs délais à paktsupport@gmail.com afin qu’une vérification soit
              effectuée. Les demandes de régularisation reçues seront traitées dans un délai raisonnable.
            </p>

            <h2 className="text-white font-semibold">9. Cagnotte volontaire</h2>
            <p>
              PAKT proposera ultérieurement un système de cagnotte facultatif et volontaire. La cagnotte ne remplace
              pas un abonnement payant et repose exclusivement sur le bénévolat des utilisateurs souhaitant soutenir
              le développement de la plateforme. Elle pourra ouvrir droit à des récompenses, avantages, accès anticipés
              ou paliers selon les règles affichées dans l’application au moment de la participation.
            </p>
            <p>
              <strong className="text-white/90">Les contributions à la cagnotte sont définitives et non remboursables.</strong>{' '}
              Aucune participation ne constitue un investissement, un placement financier ou un produit d’épargne et
              ne garantit aucun résultat business, financier, commercial, relationnel ou entrepreneurial.
            </p>

            <h2 className="text-white font-semibold">10. Événements</h2>
            <p>
              PAKT peut proposer ou relayer des événements gratuits ou payants. Les conditions de remboursement,
              d’annulation, de report ou de transfert peuvent varier selon l’événement et seront précisées au moment
              de l’inscription.
            </p>
            <p>
              En cas d’annulation d’un événement payant par PAKT, une solution sera proposée à l’utilisateur :
              remboursement, report ou avoir, selon les circonstances et la nature de l’événement.
            </p>

            <h2 className="text-white font-semibold">11. Absence de garantie de résultat</h2>
            <p>
              PAKT fournit une plateforme de mise en relation, des ressources, de l’inspiration, des outils et des
              événements liés à l’entrepreneuriat. PAKT ne garantit aucun résultat business, financier, commercial,
              entrepreneurial ou relationnel.
            </p>
            <p>
              Un remboursement ne peut pas être demandé au seul motif qu’un utilisateur n’a pas obtenu de résultat
              professionnel, financier, commercial ou relationnel à la suite de l’utilisation du service.
            </p>

            <h2 className="text-white font-semibold">12. Procédure de demande</h2>
            <p>
              Pour toute demande liée à un paiement, une résiliation, un remboursement ou une erreur de facturation,
              l’utilisateur peut contacter le support à : paktsupport@gmail.com
            </p>
            <p>La demande doit idéalement inclure :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>L’adresse email associée au compte PAKT</li>
              <li>La date et le montant du paiement concerné</li>
              <li>Une description claire du problème</li>
              <li>Toute référence de transaction disponible (Stripe, Apple, etc.)</li>
            </ul>
            <p>
              Les demandes sont traitées dans un délai raisonnable. PAKT fera ses meilleurs efforts pour apporter une
              réponse claire à chaque utilisateur.
            </p>

            <h2 className="text-white font-semibold">13. Droit applicable</h2>
            <p>
              La présente politique de remboursement et de résiliation est régie par le droit français. Les recours et
              voies de règlement amiable applicables sont détaillés dans les{' '}
              <Link href="/legal/billing" className="text-gold underline">
                Conditions Générales de Vente
              </Link>{' '}
              et les{' '}
              <Link href="/legal/cgu" className="text-gold underline">
                Conditions Générales d’Utilisation
              </Link>.
            </p>

            <h2 className="text-white font-semibold">14. Contact</h2>
            <p>
              Pour toute question : paktsupport@gmail.com
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
