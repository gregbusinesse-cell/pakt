'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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
          <h1 className="text-2xl font-bold">Conditions Générales de Vente</h1>

          <div className="bg-dark-200 border border-dark-500 rounded-[12px] p-6 space-y-4 text-white/70 text-sm leading-relaxed">
            <p className="text-white/50">Dernière mise à jour : 18 mai 2025</p>

            <p>
              Les présentes Conditions Générales de Vente (ci-après « CGV ») régissent l’ensemble des ventes de
              services payants proposés au sein de l’application PAKT. La souscription à un service payant vaut
              acceptation pleine et entière des présentes CGV.
            </p>

            <h2 className="text-white font-semibold">1. Vendeur</h2>
            <p>
              Les services payants de PAKT sont vendus par Velura, micro-entreprise exploitant la marque PAKT.
            </p>
            <p>
              Siège social : 229 rue Saint-Honoré, 75001 Paris, France<br />
              SIRET : 925 272 957 00018<br />
              TVA non applicable, article 293 B du Code général des impôts<br />
              Email : paktsupport@gmail.com<br />
              Directeur de la publication : Grégoire Direz
            </p>

            <h2 className="text-white font-semibold">2. Services proposés</h2>
            <p>PAKT propose trois plans d’utilisation :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-white/90">PAKT Free</strong> — plan gratuit par défaut, donnant accès aux
                fonctionnalités de base de l’application
              </li>
              <li>
                <strong className="text-white/90">PAKT Business</strong> — abonnement payant donnant accès à des
                fonctionnalités étendues, notamment un usage illimité ou étendu de certaines fonctionnalités
              </li>
              <li>
                <strong className="text-white/90">PAKT Business Pro</strong> — abonnement payant donnant accès à
                l’ensemble des fonctionnalités premium de l’application
              </li>
            </ul>
            <p>
              La liste des fonctionnalités incluses dans chaque plan est susceptible d’évoluer. Les ajouts,
              modifications ou retraits éventuels seront communiqués dans l’application.
            </p>

            <h2 className="text-white font-semibold">3. Prix et durée des abonnements</h2>
            <p>Les tarifs en vigueur à la date de mise à jour des présentes CGV sont les suivants :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-white/90">PAKT Business</strong> : 5 € par mois</li>
              <li><strong className="text-white/90">PAKT Business Pro</strong> : 10 € par mois</li>
            </ul>
            <p>
              Les abonnements sont actuellement proposés à la fréquence mensuelle, sans engagement de durée. Des
              formules annuelles pourront être proposées ultérieurement, à des tarifs et conditions précisés dans
              l’application avant souscription.
            </p>
            <p>
              Les prix sont indiqués en euros, toutes taxes comprises. Conformément à l’article 293 B du Code général
              des impôts, la TVA n’est pas applicable.
            </p>
            <p>
              Velura se réserve le droit de modifier les tarifs à tout moment. Toute évolution tarifaire applicable aux
              abonnements en cours sera notifiée à l’utilisateur avec un préavis raisonnable lui permettant de résilier
              sans frais avant l’entrée en vigueur du nouveau prix.
            </p>

            <h2 className="text-white font-semibold">4. Paiement</h2>
            <p>
              Les paiements effectués depuis le site web sont traités par Stripe Payments Europe Ltd. PAKT ne stocke ni
              les numéros complets de carte bancaire, ni les cryptogrammes visuels.
            </p>
            <p>
              L’utilisateur garantit qu’il est titulaire ou autorisé à utiliser le moyen de paiement choisi et que les
              informations communiquées sont exactes. Toute utilisation frauduleuse d’un moyen de paiement peut donner
              lieu à la suspension immédiate du compte et à des poursuites judiciaires.
            </p>
            <p>
              Lorsque l’application est téléchargée depuis l’App Store d’Apple Inc. ou le Google Play Store de
              Google LLC, les achats peuvent être effectués via le système d’achat intégré de la plateforme concernée
              (« In-App Purchase » pour Apple, « Google Play Billing » pour Google). Dans ce cas, les conditions de
              paiement, de facturation et de remboursement applicables sont celles définies par Apple ou Google selon
              la plateforme utilisée.
            </p>

            <h2 className="text-white font-semibold">5. Promotions, parrainages et essais gratuits</h2>
            <p>
              PAKT peut, à titre exceptionnel et discrétionnaire, proposer des codes promotionnels, offres spéciales,
              essais gratuits ou programmes de parrainage donnant accès à des avantages ou fonctionnalités premium pour
              une durée limitée.
            </p>
            <p>
              Ces offres sont soumises à des conditions spécifiques précisées au moment de leur diffusion et ne
              constituent ni un droit acquis, ni une garantie de reconduction. Velura se réserve le droit de modifier,
              suspendre ou supprimer toute offre promotionnelle à tout moment.
            </p>

            <h2 className="text-white font-semibold">6. Renouvellement automatique</h2>
            <p>
              Sauf indication contraire, l’abonnement PAKT Business est à renouvellement automatique. À l’issue de
              chaque période d’abonnement (mensuelle ou annuelle), celui-ci est automatiquement reconduit pour une
              nouvelle période identique, au tarif alors en vigueur, jusqu’à résiliation par l’utilisateur.
            </p>
            <p>
              L’utilisateur peut désactiver le renouvellement automatique à tout moment :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Depuis les paramètres de son compte dans l’application</li>
              <li>Depuis son espace de gestion d’abonnement Stripe</li>
              <li>Pour les abonnements souscrits via l’App Store : depuis les paramètres de son compte Apple</li>
              <li>Pour les abonnements souscrits via Google Play : depuis les paramètres de son compte Google Play</li>
            </ul>
            <p>
              La désactivation prend effet à la fin de la période d’abonnement en cours, qui reste pleinement due.
            </p>

            <h2 className="text-white font-semibold">7. Résiliation</h2>
            <p>
              L’utilisateur peut résilier son abonnement à tout moment depuis l’application, depuis le portail Stripe
              ou Apple selon la plateforme utilisée pour la souscription, ou en contactant : paktsupport@gmail.com
            </p>
            <p>
              Après résiliation, l’utilisateur conserve l’accès aux fonctionnalités premium payées jusqu’à la fin de la
              période d’abonnement en cours. La résiliation de l’abonnement n’entraîne pas la suppression du compte
              utilisateur, qui reste accessible avec les fonctionnalités gratuites.
            </p>
            <p>
              L’utilisateur reste seul responsable de la gestion et de la résiliation effective de son abonnement.
            </p>

            <h2 className="text-white font-semibold">8. Droit de rétractation</h2>
            <p>
              Conformément aux articles L.221-18 et suivants du Code de la consommation, le consommateur dispose d’un
              délai de quatorze (14) jours à compter de la souscription pour exercer son droit de rétractation, sans
              avoir à motiver sa décision.
            </p>
            <p>
              Toutefois, en application de l’article L.221-28 du Code de la consommation, l’utilisateur qui demande
              l’exécution immédiate du service numérique avant la fin du délai de rétractation, et qui active dès la
              souscription les fonctionnalités premium, reconnaît et accepte expressément renoncer à son droit de
              rétractation dans la limite des fonctionnalités déjà consommées.
            </p>

            <h2 className="text-white font-semibold">9. Remboursements</h2>
            <p>
              Sauf obligation légale contraire, les paiements effectués pour PAKT Business sont fermes et non
              remboursables. Velura peut néanmoins, à sa seule discrétion et au cas par cas, accorder un remboursement
              total ou partiel notamment en cas de problème technique majeur, d’erreur manifeste, de double facturation
              ou de situation exceptionnelle.
            </p>
            <p>
              Pour les abonnements souscrits via l’App Store, les demandes de remboursement relèvent exclusivement
              d’Apple Inc. et doivent être adressées directement à Apple selon ses propres conditions. Pour les
              abonnements souscrits via Google Play, les demandes de remboursement relèvent exclusivement de Google et
              de ses conditions.
            </p>

            <h2 className="text-white font-semibold">10. Défaut de paiement</h2>
            <p>
              En cas d’échec de paiement, de moyen de paiement expiré, d’opposition, de rejet bancaire ou de défaut
              prolongé, Velura se réserve le droit de suspendre l’accès aux fonctionnalités payantes, de résilier
              l’abonnement et, le cas échéant, de bloquer l’accès au compte jusqu’à régularisation.
            </p>

            <h2 className="text-white font-semibold">11. Cagnotte</h2>
            <p>
              PAKT proposera ultérieurement un système de cagnotte volontaire, facultatif et distinct des abonnements
              PAKT Business et PAKT Business Pro. La cagnotte repose exclusivement sur le bénévolat et la volonté de
              soutenir le développement de la plateforme, l’organisation d’événements et la mise en place de
              fonctionnalités au bénéfice de la communauté.
            </p>
            <p>
              Les contributions à la cagnotte sont libres, définitives et non remboursables. Aucune contribution ne
              constitue un investissement, un placement financier ou un produit d’épargne, et ne garantit aucun résultat
              business, financier, commercial, relationnel ou entrepreneurial. Les règles applicables (montants,
              avantages, paliers, récompenses) sont précisées dans l’application au moment de la participation.
            </p>

            <h2 className="text-white font-semibold">12. Événements</h2>
            <p>
              PAKT pourra organiser, à l’avenir, des événements gratuits ou payants, en ligne ou physiques. Ces
              événements pourront être organisés directement par PAKT ou en partenariat avec des tiers. Lorsque les
              événements sont organisés en partenariat, les paiements pourront être gérés via une solution telle que
              Stripe Connect.
            </p>
            <p>
              Certains événements peuvent être inclus partiellement, proposés avec réduction ou soumis à des conditions
              spécifiques selon l’abonnement, la participation à la cagnotte ou les règles affichées dans l’application
              au moment de l’inscription. Les conditions de participation, d’annulation et de remboursement éventuel à
              un événement sont précisées avant chaque inscription. La responsabilité de Velura au titre des événements
              est limitée à l’organisation logistique lorsque celle-ci lui incombe directement.
            </p>

            <h2 className="text-white font-semibold">13. Facturation</h2>
            <p>
              Une preuve de paiement (reçu ou facture simplifiée) est mise à disposition de l’utilisateur après chaque
              transaction. Les utilisateurs peuvent retrouver l’historique de leurs paiements via leur espace personnel
              ou en contactant le support à paktsupport@gmail.com.
            </p>

            <h2 className="text-white font-semibold">14. Mineurs</h2>
            <p>
              Les souscriptions à un abonnement payant ou les participations financières par un utilisateur mineur
              nécessitent l’accord préalable du représentant légal. Velura se réserve le droit d’annuler toute
              transaction dont elle aurait connaissance qu’elle a été effectuée par un mineur sans cet accord.
            </p>

            <h2 className="text-white font-semibold">15. Absence de garantie de résultat</h2>
            <p>
              PAKT est une plateforme de mise en relation, de ressources, d’inspiration et d’événements liés à
              l’entrepreneuriat. PAKT n’est pas un conseiller financier, juridique, fiscal, comptable ou en
              investissement et ne garantit aucun résultat business, financier, commercial, entrepreneurial ou
              relationnel.
            </p>

            <h2 className="text-white font-semibold">16. Force majeure</h2>
            <p>
              Velura ne saurait être tenue responsable d’une inexécution ou d’un retard d’exécution résultant d’un cas
              de force majeure tel que défini par l’article 1218 du Code civil, en ce compris notamment les pannes de
              réseaux, défaillances des prestataires techniques (Stripe, Vercel, Supabase, Apple), cyberattaques,
              événements sanitaires, décisions des autorités publiques, grèves ou catastrophes naturelles.
            </p>

            <h2 className="text-white font-semibold">17. Distribution via les magasins d’applications mobiles</h2>
            <p>
              Lorsque l’application PAKT est téléchargée depuis l’App Store d’Apple Inc., les transactions effectuées
              via l’In-App Purchase sont soumises aux conditions générales d’Apple. Apple Inc. n’est pas partie aux
              présentes CGV. Toute réclamation relative à un achat in-app (facturation, remboursement, double débit)
              doit être adressée directement à Apple selon ses procédures.
            </p>
            <p>
              De la même manière, lorsque l’application est téléchargée depuis le Google Play Store, les transactions
              effectuées via Google Play Billing sont soumises aux conditions générales de Google. Toute réclamation
              relative à un achat in-app doit être adressée directement à Google selon ses procédures.
            </p>
            <p>
              Apple et ses filiales sont reconnues comme bénéficiaires tiers des présentes CGV et peuvent en exiger
              l’application à l’égard de l’utilisateur final.
            </p>

            <h2 className="text-white font-semibold">18. Modification des CGV</h2>
            <p>
              Velura se réserve le droit de modifier les présentes CGV afin de les adapter aux évolutions légales,
              jurisprudentielles, techniques ou commerciales. Les utilisateurs seront informés de toute modification
              substantielle dans l’application ou par email. La poursuite de l’utilisation des services payants après
              notification vaut acceptation des nouvelles CGV.
            </p>

            <h2 className="text-white font-semibold">19. Invalidité partielle</h2>
            <p>
              Si l’une quelconque des stipulations des présentes CGV venait à être déclarée nulle, illicite, invalide
              ou inapplicable par une juridiction compétente, les autres stipulations conserveraient leur pleine force
              et effet. La stipulation jugée invalide sera, dans la mesure du possible, remplacée par une stipulation
              valide produisant un effet économique équivalent.
            </p>

            <h2 className="text-white font-semibold">20. Droit applicable et règlement des litiges</h2>
            <p>
              Les présentes CGV sont régies par le droit français. En cas de litige, l’utilisateur est invité à
              contacter PAKT en priorité à l’adresse paktsupport@gmail.com afin de rechercher une solution amiable.
            </p>
            <p>
              Le consommateur peut également déposer une réclamation sur la plateforme européenne de règlement en ligne
              des litiges : https://ec.europa.eu/consumers/odr
            </p>
            <p>
              À défaut de résolution amiable, tout litige sera porté devant les juridictions françaises compétentes,
              sous réserve des règles d’ordre public protectrices du consommateur.
            </p>

            <h2 className="text-white font-semibold">21. Contact</h2>
            <p>
              Pour toute question relative aux présentes CGV : paktsupport@gmail.com
            </p>
            <p>
              Voir également les{' '}
              <Link href="/legal/legal-notice" className="text-gold underline">
                Mentions légales
              </Link>
              , la{' '}
              <Link href="/legal/privacy" className="text-gold underline">
                Politique de confidentialité
              </Link>{' '}
              et les{' '}
              <Link href="/legal/cgu" className="text-gold underline">
                Conditions Générales d’Utilisation
              </Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
