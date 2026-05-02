'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function CGUPage() {
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
          <h1 className="text-2xl font-bold">CGU</h1>

          <div className="bg-dark-200 border border-dark-500 rounded-[12px] p-6 space-y-4 text-white/70 text-sm leading-relaxed">
            <p>Dernière mise à jour : 2 mai 2026</p>

            <h2 className="text-white font-semibold">1. Objet</h2>
            <p>
              Les présentes Conditions Générales d’Utilisation encadrent l’accès et l’utilisation de PAKT, application éditée
              par Velura. En créant un compte ou en utilisant PAKT, l’utilisateur accepte les présentes conditions.
            </p>

            <h2 className="text-white font-semibold">2. Description du service</h2>
            <p>
              PAKT est une application de mise en relation et d’accompagnement entrepreneurial permettant aux utilisateurs de
              rencontrer des partenaires, développer des projets et accéder à des outils, événements et ressources pour lancer
              et structurer un business.
            </p>

            <h2 className="text-white font-semibold">3. Utilisateurs autorisés</h2>
            <p>
              PAKT est accessible aux utilisateurs âgés d’au moins 15 ans. Les utilisateurs mineurs déclarent disposer de
              l’autorisation de leur représentant légal lorsque celle-ci est nécessaire, notamment pour les paiements ou
              participations financières.
            </p>

            <h2 className="text-white font-semibold">4. Compte utilisateur</h2>
            <p>
              L’utilisateur s’engage à fournir des informations exactes, complètes et à jour. Il est responsable de la
              confidentialité de ses identifiants et de toutes les actions réalisées depuis son compte.
            </p>

            <h2 className="text-white font-semibold">5. Fonctionnalités</h2>
            <p>
              PAKT peut permettre la création d’un profil, l’ajout d’une photo, d’une bio, d’une ville, d’une entreprise,
              de liens sociaux, la mise en relation avec d’autres utilisateurs, l’envoi de messages, l’accès à des ressources,
              à des événements et à certaines fonctionnalités premium.
            </p>
            <p>
              Des fonctionnalités comme les stories pourront être ajoutées ultérieurement. PAKT peut faire évoluer, modifier,
              suspendre ou supprimer certaines fonctionnalités pour améliorer le service.
            </p>

            <h2 className="text-white font-semibold">6. Mise en relation</h2>
            <p>
              PAKT facilite la découverte et la mise en relation entre utilisateurs. PAKT ne garantit pas l’identité réelle,
              les compétences, la fiabilité, la disponibilité, la solvabilité ou les intentions des utilisateurs.
            </p>
            <p>
              Chaque utilisateur reste seul responsable de ses échanges, rendez-vous, collaborations, contrats, décisions et
              actions.
            </p>

            <h2 className="text-white font-semibold">7. Absence de conseil professionnel</h2>
            <p>
              PAKT n’est pas un conseiller financier, juridique, fiscal, comptable ou en investissement. Les contenus,
              ressources, profils, événements et échanges proposés sur PAKT ont une vocation informative, relationnelle et
              inspirationnelle.
            </p>
            <p>
              Aucune information disponible sur PAKT ne constitue un conseil personnalisé ou une garantie de résultat.
            </p>

            <h2 className="text-white font-semibold">8. Contenus utilisateurs</h2>
            <p>
              L’utilisateur est responsable des contenus qu’il publie ou transmet, notamment photo, bio, informations de profil,
              liens sociaux et messages. Il garantit disposer des droits nécessaires sur ces contenus.
            </p>

            <h2 className="text-white font-semibold">9. Contenus interdits</h2>
            <p>
              Sont interdits les contenus illégaux, haineux, violents, discriminatoires, diffamatoires, frauduleux,
              pornographiques, harcelants, menaçants, trompeurs, portant atteinte à la vie privée, relevant du spam, de
              l’usurpation d’identité ou contenant des virus ou éléments nuisibles.
            </p>

            <h2 className="text-white font-semibold">10. Modération et suspension</h2>
            <p>
              PAKT se réserve le droit de modérer, masquer, supprimer ou limiter tout contenu ou compte contraire aux présentes
              CGU, à la loi ou au bon fonctionnement de la plateforme.
            </p>
            <p>
              PAKT peut suspendre ou supprimer un compte en cas d’abus, fraude, spam, harcèlement, comportement nuisible,
              signalements répétés, contournement technique ou utilisation contraire à l’esprit de la plateforme.
            </p>

            <h2 className="text-white font-semibold">11. Événements</h2>
            <p>
              PAKT peut proposer des événements physiques ou informatifs autour du business et du networking. Ces événements
              peuvent être gratuits, payants, inclus partiellement ou proposés avec réduction selon l’abonnement, la
              participation à la cagnotte ou les règles affichées dans l’application.
            </p>

            <h2 className="text-white font-semibold">12. Cagnotte</h2>
            <p>
              La cagnotte PAKT est volontaire et facultative. Elle ne remplace pas l’abonnement PAKT Business. Elle peut ouvrir
              droit à certains avantages, réductions ou paliers selon les règles affichées dans l’application.
            </p>
            <p>
              Aucune participation à la cagnotte ne garantit un résultat business, financier, commercial ou entrepreneurial.
            </p>

            <h2 className="text-white font-semibold">13. Disponibilité</h2>
            <p>
              PAKT fait ses meilleurs efforts pour assurer l’accès à l’application, sans garantir une disponibilité permanente
              ou sans interruption. Des interruptions peuvent survenir pour maintenance, mise à jour, incident technique ou
              cas de force majeure.
            </p>

            <h2 className="text-white font-semibold">14. Droit applicable</h2>
            <p>
              Les présentes CGU sont soumises au droit français. En cas de litige, l’utilisateur est invité à contacter PAKT
              en priorité à l’adresse : supportpaktsupport@gmail.com
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}