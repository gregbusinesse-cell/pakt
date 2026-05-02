'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function ConfidentialitePage() {
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
          <h1 className="text-2xl font-bold">Politique de confidentialité</h1>

          <div className="bg-dark-200 border border-dark-500 rounded-[12px] p-6 space-y-4 text-white/70 text-sm leading-relaxed">
            <p>Dernière mise à jour : 2 mai 2026</p>

            <h2 className="text-white font-semibold">1. Responsable du traitement</h2>
            <p>
              Le responsable du traitement est Velura, micro-entreprise exploitant la marque PAKT.
            </p>
            <p>
              Siège : 229 rue Saint-Honoré, 75001 Paris, France<br />
              SIRET : 925 272 957 00018<br />
              Email : supportpaktsupport@gmail.com
            </p>

            <h2 className="text-white font-semibold">2. Données collectées</h2>
            <p>
              PAKT peut collecter les données suivantes : nom, prénom, email, téléphone, photo, bio, ville, entreprise,
              liens sociaux, messages, données liées à l’abonnement, données de paiement, données techniques, logs, adresse IP,
              type d’appareil et informations nécessaires à la sécurité.
            </p>

            <h2 className="text-white font-semibold">3. Finalités</h2>
            <p>
              Les données sont utilisées pour créer et gérer les comptes, permettre l’accès à l’application, afficher les
              profils, permettre la mise en relation, gérer la messagerie, traiter les paiements, gérer l’abonnement PAKT
              Business, organiser les événements, assurer le support, prévenir les abus et améliorer le service.
            </p>

            <h2 className="text-white font-semibold">4. Bases légales</h2>
            <p>
              Les traitements peuvent reposer sur l’exécution du contrat, le consentement, l’intérêt légitime de PAKT ou le
              respect d’obligations légales, comptables et fiscales.
            </p>

            <h2 className="text-white font-semibold">5. Prestataires</h2>
            <p>
              PAKT utilise notamment Vercel pour l’hébergement de l’application, Supabase pour la base de données et Stripe
              pour les paiements. Ces prestataires peuvent traiter certaines données conformément à leurs propres politiques
              de confidentialité.
            </p>

            <h2 className="text-white font-semibold">6. Paiements</h2>
            <p>
              Les paiements sont traités par Stripe. PAKT ne stocke pas directement les numéros complets de carte bancaire.
              Les données nécessaires au paiement, à la facturation et à la prévention de la fraude peuvent être transmises à
              Stripe.
            </p>

            <h2 className="text-white font-semibold">7. Conservation</h2>
            <p>
              Les données de compte sont conservées tant que le compte est actif. En cas de suppression du compte, les données
              sont supprimées ou anonymisées sur demande, sauf conservation nécessaire pour respecter une obligation légale,
              prévenir une fraude, résoudre un litige ou établir une preuve.
            </p>
            <p>
              Les données liées à la facturation, aux paiements et aux preuves de transaction peuvent être conservées pendant
              la durée légale applicable, notamment jusqu’à 3 ans ou plus lorsque des obligations comptables ou fiscales
              l’exigent.
            </p>

            <h2 className="text-white font-semibold">8. Newsletter et emails marketing</h2>
            <p>
              PAKT n’envoie pas actuellement de newsletter marketing régulière. Si cette fonctionnalité est ajoutée plus tard,
              les utilisateurs concernés seront invités à donner leur consentement lorsque celui-ci est nécessaire.
            </p>

            <h2 className="text-white font-semibold">9. Analytics</h2>
            <p>
              PAKT n’utilise pas actuellement d’outils d’analyse marketing avancés. Des outils d’analyse pourront être ajoutés
              ultérieurement. Lorsque ces outils nécessitent un consentement, ils ne seront activés qu’après accord de
              l’utilisateur.
            </p>

            <h2 className="text-white font-semibold">10. Sécurité</h2>
            <p>
              PAKT met en œuvre des mesures raisonnables pour protéger les données personnelles contre l’accès non autorisé,
              la perte, l’altération, la divulgation ou la destruction.
            </p>

            <h2 className="text-white font-semibold">11. Droits des utilisateurs</h2>
            <p>
              L’utilisateur peut demander l’accès à ses données, leur rectification, leur suppression, la limitation du
              traitement, l’opposition à certains traitements, la portabilité lorsque cela s’applique, ou le retrait de son
              consentement.
            </p>
            <p>
              Pour exercer ces droits, l’utilisateur peut écrire à : supportpaktsupport@gmail.com
            </p>

            <h2 className="text-white font-semibold">12. CNIL</h2>
            <p>
              Si l’utilisateur estime que ses droits ne sont pas respectés, il peut adresser une réclamation à la CNIL :
              https://www.cnil.fr
            </p>

            <h2 className="text-white font-semibold">13. Mineurs</h2>
            <p>
              PAKT est accessible à partir de 15 ans. Les utilisateurs mineurs doivent disposer de l’accord de leur représentant
              légal lorsque celui-ci est nécessaire, notamment pour les paiements ou participations financières.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}