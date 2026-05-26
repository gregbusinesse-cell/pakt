'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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
            <p className="text-white/50">Dernière mise à jour : 18 mai 2025</p>

            <p>
              La présente politique de confidentialité décrit comment Velura, exploitant l’application PAKT, collecte,
              utilise, conserve et protège les données personnelles de ses utilisateurs, conformément au Règlement (UE)
              2016/679 (RGPD) et à la Loi Informatique et Libertés du 6 janvier 1978 modifiée.
            </p>

            <h2 className="text-white font-semibold">1. Responsable du traitement</h2>
            <p>
              Le responsable du traitement est Velura, micro-entreprise exploitant la marque PAKT.
            </p>
            <p>
              Siège social : 229 rue Saint-Honoré, 75001 Paris, France<br />
              SIRET : 925 272 957 00018<br />
              Email de contact : paktsupport@gmail.com<br />
              Directeur de la publication : Grégoire Direz
            </p>

            <h2 className="text-white font-semibold">2. Données collectées</h2>
            <p>Dans le cadre de l’utilisation de PAKT, les catégories suivantes de données peuvent être collectées :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-white/90">Données d’identification :</strong> nom, prénom, adresse email, mot de
                passe (haché), date de naissance, identifiants de comptes liés (Google, Apple lorsque disponible).
              </li>
              <li>
                <strong className="text-white/90">Données de profil :</strong> photo de profil, biographie, ville,
                entreprise, secteur d’activité, centres d’intérêt, compétences.
              </li>
              <li>
                <strong className="text-white/90">Contenus publiés :</strong> messages textes, messages vocaux, photos
                et fichiers téléversés, contenus partagés au sein de l’application.
              </li>
              <li>
                <strong className="text-white/90">Données d’usage :</strong> profils consultés, likes, matchs, dates et
                heures de connexion, préférences de recherche, interactions au sein de l’application.
              </li>
              <li>
                <strong className="text-white/90">Données techniques :</strong> adresse IP, identifiant d’appareil, type
                de navigateur, système d’exploitation, logs de connexion, identifiants de session.
              </li>
              <li>
                <strong className="text-white/90">Données de paiement :</strong> informations nécessaires au traitement
                de l’abonnement (les coordonnées bancaires complètes sont traitées directement par Stripe et ne sont pas
                stockées par PAKT).
              </li>
              <li>
                <strong className="text-white/90">Données de support :</strong> contenu des échanges avec le support, des
                signalements ou des réclamations.
              </li>
            </ul>
            <p>
              PAKT ne collecte ni ne stocke de géolocalisation GPS précise. Seule la ville déclarée librement par
              l’utilisateur dans son profil est utilisée à des fins de mise en relation. PAKT ne collecte pas non plus
              le numéro de téléphone de l’utilisateur.
            </p>
            <p>
              PAKT ne collecte aucune donnée sensible au sens de l’article 9 du RGPD : aucune donnée relative à la
              santé, aux opinions politiques, aux convictions religieuses, à l’orientation sexuelle, à l’origine
              ethnique ou raciale, à l’appartenance syndicale ni aux données biométriques n’est traitée par PAKT.
            </p>

            <h2 className="text-white font-semibold">3. Finalités du traitement</h2>
            <p>Les données collectées sont traitées aux fins suivantes :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Créer, authentifier et gérer le compte utilisateur</li>
              <li>Permettre l’affichage du profil et la mise en relation entre utilisateurs</li>
              <li>Assurer la messagerie et les interactions au sein de l’application</li>
              <li>Gérer les abonnements payants (PAKT Business, PAKT Business Pro), la facturation et la prévention de la fraude</li>
              <li>Envoyer des notifications transactionnelles (matchs, messages, événements) par email ou push</li>
              <li>Modérer la plateforme, traiter les signalements et lutter contre les abus</li>
              <li>Améliorer le service, corriger les bugs et développer de nouvelles fonctionnalités</li>
              <li>Respecter les obligations légales, comptables et fiscales applicables</li>
              <li>Garantir la sécurité technique de l’application et de ses utilisateurs</li>
            </ul>

            <h2 className="text-white font-semibold">4. Bases légales du traitement</h2>
            <p>Les traitements reposent sur les bases légales suivantes :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-white/90">Exécution du contrat</strong> (art. 6.1.b RGPD) : gestion du compte,
                fourniture du service, abonnement payant
              </li>
              <li>
                <strong className="text-white/90">Consentement</strong> (art. 6.1.a RGPD) : notifications push,
                communications optionnelles, traitements ultérieurs nécessitant un accord
              </li>
              <li>
                <strong className="text-white/90">Intérêt légitime</strong> (art. 6.1.f RGPD) : sécurité de la
                plateforme, prévention de la fraude, amélioration du service, modération
              </li>
              <li>
                <strong className="text-white/90">Obligation légale</strong> (art. 6.1.c RGPD) : conservation des
                factures, lutte contre les contenus illicites
              </li>
            </ul>

            <h2 className="text-white font-semibold">5. Sous-traitants et destinataires des données</h2>
            <p>
              Velura fait appel à des sous-traitants techniques pour le bon fonctionnement de l’application. Ces
              sous-traitants n’ont accès qu’aux données strictement nécessaires à l’exécution de leur mission et sont
              tenus par des engagements contractuels conformes au RGPD :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-white/90">Vercel Inc.</strong> (États-Unis) – hébergement de l’application
              </li>
              <li>
                <strong className="text-white/90">Supabase Inc.</strong> (Singapour) – base de données, authentification,
                stockage de fichiers
              </li>
              <li>
                <strong className="text-white/90">Stripe Payments Europe Ltd.</strong> (Irlande) – traitement des
                paiements et facturation
              </li>
              <li>
                <strong className="text-white/90">Brevo (Sendinblue)</strong> (France) – envoi d’emails
                transactionnels
              </li>
              <li>
                <strong className="text-white/90">Google LLC</strong> (États-Unis) – authentification via Google Sign-In
                (optionnel)
              </li>
              <li>
                <strong className="text-white/90">Apple Inc.</strong> (États-Unis) – authentification via Apple Sign In
                lorsque l’application est distribuée sur l’App Store
              </li>
            </ul>

            <h2 className="text-white font-semibold">6. Transferts de données hors de l’Union européenne</h2>
            <p>
              Certains sous-traitants peuvent être situés en dehors de l’Espace économique européen, notamment aux
              États-Unis ou à Singapour. Ces transferts sont encadrés par les Clauses Contractuelles Types adoptées par
              la Commission européenne ou par toute autre garantie appropriée au sens du Chapitre V du RGPD,
              garantissant un niveau de protection adéquat des données personnelles.
            </p>

            <h2 className="text-white font-semibold">7. Durées de conservation</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-white/90">Compte actif :</strong> les données sont conservées tant que le compte
                est actif.
              </li>
              <li>
                <strong className="text-white/90">Suppression du compte :</strong> les données personnelles, profils,
                messages, photos et vidéos sont supprimés de manière définitive dans un délai maximal de quarante-huit
                (48) heures suivant la demande de suppression, sans possibilité de récupération ultérieure, sauf
                obligation légale contraire.
              </li>
              <li>
                <strong className="text-white/90">Données de facturation :</strong> 10 ans après la fin de l’exercice
                comptable, conformément aux obligations comptables.
              </li>
              <li>
                <strong className="text-white/90">Logs techniques et de sécurité :</strong> jusqu’à 12 mois.
              </li>
              <li>
                <strong className="text-white/90">Signalements et historique de modération :</strong> jusqu’à 3 ans à
                des fins de prévention des abus et de protection des utilisateurs.
              </li>
            </ul>

            <h2 className="text-white font-semibold">8. Suppression du compte et des contenus</h2>
            <p>
              L’utilisateur peut supprimer son compte à tout moment et gratuitement depuis les paramètres de
              l’application. La suppression entraîne l’effacement définitif, dans un délai maximal de quarante-huit (48)
              heures, des données de profil, des photos, des vidéos, des préférences ainsi que des messages envoyés et
              reçus, sans possibilité de récupération ultérieure, sous réserve des conservations légales obligatoires
              (facturation, prévention de la fraude, obligations comptables ou judiciaires).
            </p>
            <p>
              Certaines données strictement nécessaires peuvent être conservées sous forme anonymisée ou pseudonymisée
              à des fins statistiques, de sécurité ou de respect d’obligations légales.
            </p>

            <h2 className="text-white font-semibold">9. Contenus utilisateurs (photos, fichiers, messages texte et vocaux)</h2>
            <p>
              Les contenus publiés par les utilisateurs (photos, fichiers, messages texte, messages vocaux, descriptions
              de profil) sont stockés sur les infrastructures de Supabase Inc. Ils sont accessibles aux utilisateurs
              autorisés de l’application conformément aux paramètres de visibilité de chaque fonctionnalité.
            </p>
            <p>
              Les contenus signalés peuvent être consultés par l’équipe de modération de PAKT afin d’évaluer leur
              conformité aux Conditions Générales d’Utilisation et à la législation applicable.
            </p>

            <h2 className="text-white font-semibold">10. Paiements et abonnements</h2>
            <p>
              Les paiements liés aux abonnements PAKT sont traités par Stripe Payments Europe Ltd. PAKT ne stocke ni les
              numéros de carte bancaire complets, ni les cryptogrammes visuels. Seules les informations nécessaires à
              la facturation et à la gestion de l’abonnement sont conservées (identifiant client Stripe, dates et
              montants des transactions, statut de l’abonnement).
            </p>

            <h2 className="text-white font-semibold">11. Notifications push et notifications par email</h2>
            <p>
              PAKT envoie actuellement des emails transactionnels (matchs, nouveaux messages, alertes de sécurité, mises
              à jour importantes). Les notifications push seront mises en place lors de la publication de l’application
              sur les magasins d’applications mobiles (App Store et Google Play).
            </p>
            <p>
              L’utilisateur pourra à tout moment activer ou désactiver les notifications depuis les paramètres de son
              appareil ou de son compte, à l’exception des notifications indispensables au fonctionnement du service
              ou à la sécurité du compte.
            </p>

            <h2 className="text-white font-semibold">12. Cookies et technologies similaires</h2>
            <p>
              Lors de l’utilisation de l’application via un navigateur web, PAKT peut utiliser des cookies et
              technologies similaires strictement nécessaires au fonctionnement du service (authentification, session,
              sécurité). Ces cookies ne nécessitent pas de consentement préalable.
            </p>
            <p>
              PAKT n’utilise aucun cookie publicitaire, aucun traceur de suivi intersite et aucun outil de tracking
              inter-applications. Sur les versions mobiles, PAKT n’utilise pas l’identifiant publicitaire (IDFA pour
              iOS, AAID pour Android). Toute évolution future fera l’objet d’une information préalable et d’un recueil
              du consentement.
            </p>

            <h2 className="text-white font-semibold">13. Sécurité des données</h2>
            <p>
              Velura met en œuvre des mesures techniques et organisationnelles appropriées pour préserver la sécurité,
              l’intégrité et la confidentialité des données personnelles, notamment le chiffrement des communications
              (HTTPS/TLS), le hachage des mots de passe, l’authentification renforcée, le contrôle d’accès aux bases de
              données et la journalisation des accès sensibles.
            </p>
            <p>
              En cas de violation de données susceptible d’engendrer un risque élevé pour les droits et libertés des
              utilisateurs, Velura notifiera l’autorité compétente et, le cas échéant, les utilisateurs concernés,
              conformément aux articles 33 et 34 du RGPD.
            </p>

            <h2 className="text-white font-semibold">14. Utilisateurs mineurs</h2>
            <p>
              L’application PAKT est ouverte aux utilisateurs âgés de 15 ans et plus. En France, conformément à
              l’article 8 du RGPD et à la Loi Informatique et Libertés, le traitement des données d’un mineur de moins
              de 15 ans nécessite le consentement conjoint du titulaire de l’autorité parentale. PAKT n’est donc pas
              accessible aux mineurs de moins de 15 ans.
            </p>
            <p>
              Les utilisateurs mineurs déclarent disposer de l’autorisation de leur représentant légal lorsque celle-ci
              est nécessaire, notamment pour la souscription à un abonnement payant. Une fonctionnalité de vérification
              de profil pourra être déployée ultérieurement, notamment pour renforcer la protection des mineurs.
              Velura se réserve le droit de suspendre ou de supprimer un compte en cas de doute sur l’âge déclaré.
            </p>

            <h2 className="text-white font-semibold">15. Modération et signalements</h2>
            <p>
              PAKT met à disposition de ses utilisateurs un système de signalement permettant de notifier tout contenu
              ou comportement inapproprié. La modération est assurée par l’équipe PAKT. Les signalements sont en
              principe traités sous 24 heures et au plus tard sous 72 heures suivant leur réception. Les contenus jugés
              manifestement illicites sont retirés rapidement et leurs auteurs peuvent voir leur compte suspendu, leur
              compte supprimé et, en cas d’abus graves ou répétés, leur adresse IP bannie.
            </p>

            <h2 className="text-white font-semibold">16. Droits des utilisateurs</h2>
            <p>Conformément au RGPD, chaque utilisateur dispose des droits suivants :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Droit d’accès à ses données personnelles</li>
              <li>Droit de rectification des données inexactes ou incomplètes</li>
              <li>Droit à l’effacement (« droit à l’oubli »)</li>
              <li>Droit à la limitation du traitement</li>
              <li>Droit à la portabilité des données</li>
              <li>Droit d’opposition au traitement fondé sur l’intérêt légitime</li>
              <li>Droit de retirer son consentement à tout moment</li>
              <li>Droit de définir des directives relatives au sort de ses données après son décès</li>
            </ul>
            <p>
              Pour exercer ces droits, l’utilisateur peut écrire à : paktsupport@gmail.com. Une preuve d’identité
              pourra être demandée en cas de doute raisonnable sur l’identité du demandeur.
            </p>

            <h2 className="text-white font-semibold">17. Réclamation auprès de la CNIL</h2>
            <p>
              Si l’utilisateur estime que ses droits ne sont pas respectés, il peut introduire une réclamation auprès
              de la Commission Nationale de l’Informatique et des Libertés (CNIL) : 3 Place de Fontenoy, TSA 80715,
              75334 Paris Cedex 07 — https://www.cnil.fr
            </p>

            <h2 className="text-white font-semibold">18. Modifications de la présente politique</h2>
            <p>
              Velura se réserve le droit de modifier la présente politique de confidentialité afin de l’adapter aux
              évolutions législatives, jurisprudentielles, techniques ou fonctionnelles. Les utilisateurs seront
              informés de toute modification substantielle par notification dans l’application ou par email.
            </p>

            <h2 className="text-white font-semibold">19. Contact</h2>
            <p>
              Pour toute question relative à la présente politique de confidentialité ou à l’exercice de vos droits :
              paktsupport@gmail.com
            </p>
            <p>
              Voir également les{' '}
              <Link href="/legal/legal-notice" className="text-gold underline">
                Mentions légales
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
