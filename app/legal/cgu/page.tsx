'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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
          <h1 className="text-2xl font-bold">Conditions Générales d’Utilisation</h1>

          <div className="bg-dark-200 border border-dark-500 rounded-[12px] p-6 space-y-4 text-white/70 text-sm leading-relaxed">
            <p className="text-white/50">Dernière mise à jour : 18 mai 2025</p>

            <h2 className="text-white font-semibold">1. Objet et acceptation</h2>
            <p>
              Les présentes Conditions Générales d’Utilisation (ci-après « CGU ») encadrent l’accès et l’utilisation de
              l’application PAKT, éditée par Velura, micro-entreprise immatriculée sous le SIRET 925 272 957 00018,
              dont le siège social est situé 229 rue Saint-Honoré, 75001 Paris, France.
            </p>
            <p>
              La création d’un compte et l’utilisation de l’application valent acceptation pleine, entière et sans
              réserve des présentes CGU. À défaut d’acceptation, l’utilisateur doit s’abstenir d’utiliser le service.
            </p>

            <h2 className="text-white font-semibold">2. Description du service</h2>
            <p>
              PAKT est une application de networking et d’accompagnement entrepreneurial permettant aux utilisateurs de
              découvrir d’autres profils, échanger via messages privés, créer ou rejoindre des projets, participer à
              des événements, accéder à des ressources et bénéficier de fonctionnalités premium par abonnement.
            </p>
            <p>
              Le service est accessible via le site https://paktapp.fr et pourra être distribué via les plateformes de
              téléchargement applicables, notamment l’App Store d’Apple Inc. et le Google Play Store de Google LLC.
            </p>

            <h2 className="text-white font-semibold">3. Éligibilité et utilisateurs mineurs</h2>
            <p>
              PAKT est accessible aux personnes physiques âgées d’au moins 15 ans. Les utilisateurs mineurs déclarent
              disposer de l’accord de leur représentant légal lorsque celui-ci est nécessaire, notamment pour la
              fourniture de leurs données personnelles et pour toute souscription à un abonnement payant.
            </p>
            <p>
              PAKT se réserve le droit de suspendre ou de supprimer tout compte en cas de doute raisonnable sur l’âge
              déclaré ou sur l’obtention du consentement parental requis.
            </p>

            <h2 className="text-white font-semibold">4. Création et gestion du compte</h2>
            <p>
              L’utilisateur s’engage à fournir des informations exactes, complètes, à jour et sincères lors de la
              création de son compte. L’utilisateur ne peut détenir qu’un seul compte actif, sauf accord exprès de
              Velura.
            </p>
            <p>
              La localisation (ville, région ou pays) est renseignée librement par l’utilisateur dans son profil. PAKT
              ne collecte ni ne stocke de géolocalisation GPS précise.
            </p>

            <h2 className="text-white font-semibold">5. Sécurité du compte</h2>
            <p>
              L’utilisateur est seul responsable de la confidentialité de ses identifiants (email, mot de passe, comptes
              tiers liés tels que Google) et de toutes les actions effectuées depuis son compte. Il s’engage à choisir
              un mot de passe robuste et à le tenir secret.
            </p>
            <p>
              En cas d’utilisation frauduleuse, de perte ou de soupçon de compromission de son compte, l’utilisateur
              doit en informer immédiatement PAKT à l’adresse paktsupport@gmail.com afin que les mesures nécessaires
              puissent être prises.
            </p>

            <h2 className="text-white font-semibold">6. Profil et contenus publiés</h2>
            <p>
              L’utilisateur peut publier sur PAKT diverses informations et contenus : photo de profil, biographie,
              ville, entreprise, secteur d’activité, centres d’intérêt, messages texte, messages vocaux, photos et
              fichiers.
            </p>
            <p>
              L’utilisateur garantit qu’il dispose de l’ensemble des droits nécessaires sur les contenus qu’il publie
              et qu’ils n’enfreignent aucun droit de tiers (droit à l’image, propriété intellectuelle, vie privée,
              droit d’auteur, etc.). Il assume seul l’entière responsabilité des contenus qu’il met en ligne.
            </p>
            <p>
              En publiant un contenu sur PAKT, l’utilisateur concède à Velura une licence non exclusive, mondiale et
              gratuite d’hébergement, de reproduction, d’affichage et d’adaptation technique strictement nécessaire au
              fonctionnement du service, pour la durée de présence du contenu sur la plateforme.
            </p>

            <h2 className="text-white font-semibold">7. Vérification de profil</h2>
            <p>
              PAKT mettra en place ultérieurement un dispositif de vérification de profil destiné à renforcer la
              confiance entre utilisateurs et à mieux protéger les utilisateurs mineurs. Les modalités de cette
              vérification (volontaire ou requise pour certaines fonctionnalités) seront précisées au moment de sa
              mise en place.
            </p>
            <p>
              La présence ou l’absence d’un statut « vérifié » ne constitue en aucun cas une garantie absolue de
              l’identité, des compétences, des intentions ou de la fiabilité d’un utilisateur.
            </p>

            <h2 className="text-white font-semibold">8. Comportements et contenus interdits</h2>
            <p>L’utilisateur s’interdit, sans que cette liste soit limitative, de :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Créer un faux profil, usurper l’identité d’un tiers ou tromper d’autres utilisateurs sur son identité, sa profession ou son projet</li>
              <li>Publier des contenus illégaux, haineux, racistes, sexistes, homophobes, discriminatoires ou incitant à la violence</li>
              <li>Publier des contenus à caractère pornographique, sexuellement explicite ou choquant</li>
              <li>Harceler, menacer, intimider, stalker ou abuser un autre utilisateur</li>
              <li>Diffuser du spam, des messages publicitaires non sollicités, des chaînes ou des sollicitations commerciales abusives</li>
              <li>Insérer ou diffuser des liens externes cliquables au sein des conversations, des profils, des bios ou des contenus publics, sauf autorisation expresse de PAKT</li>
              <li>Diffuser des contenus diffamatoires, injurieux ou portant atteinte à la vie privée d’autrui</li>
              <li>Proposer, promouvoir ou participer à des arnaques, escroqueries, schémas pyramidaux, ventes multi-niveaux trompeuses, fausses opportunités d’investissement ou cryptomonnaies frauduleuses</li>
              <li>Manipuler ou tenter de manipuler d’autres utilisateurs à des fins financières, sentimentales ou personnelles nuisibles</li>
              <li>Utiliser des bots, scripts, robots, scrapers, crawlers ou tout dispositif automatisé pour interagir avec la plateforme, collecter des données ou contourner ses limitations</li>
              <li>Tenter de contourner les mesures de sécurité, d’accéder à des comptes ou contenus auxquels l’utilisateur n’est pas autorisé, ou d’y introduire des virus, scripts ou logiciels malveillants</li>
              <li>Reproduire, copier, dupliquer, vendre ou exploiter commercialement tout ou partie de la plateforme sans autorisation écrite</li>
              <li>Détourner les fonctionnalités de mise en relation de leur finalité professionnelle et entrepreneuriale</li>
            </ul>
            <p>
              Tout manquement peut entraîner la suppression du contenu, la suspension temporaire ou définitive du compte,
              le bannissement de l’adresse IP en cas d’abus graves ou répétés et, le cas échéant, le signalement aux
              autorités compétentes.
            </p>

            <h2 className="text-white font-semibold">9. Confidentialité des conversations privées</h2>
            <p>
              PAKT respecte la confidentialité des messages échangés entre utilisateurs. Aucune lecture automatique ni
              aucune analyse systématique des conversations privées n’est effectuée.
            </p>
            <p>
              Les messages ne pourront être consultés par l’équipe PAKT que dans des cas limitativement énumérés :
              traitement d’un signalement, demande d’une autorité compétente, obligation légale, ou nécessité de
              prévenir un risque grave pour la sécurité d’un utilisateur ou de la plateforme.
            </p>

            <h2 className="text-white font-semibold">10. Signalement et modération</h2>
            <p>
              PAKT met à disposition des utilisateurs un mécanisme de signalement permettant d’alerter sur tout contenu
              ou comportement contraire aux présentes CGU ou à la législation applicable. La modération est assurée
              par l’équipe PAKT.
            </p>
            <p>
              Les signalements sont en principe traités sous 24 heures et au plus tard sous 72 heures suivant leur
              réception. La modération de la plateforme est principalement manuelle ; PAKT pourra mettre en place, à
              l’avenir, des outils automatisés de détection. Les contenus manifestement illicites portés à la
              connaissance de PAKT sont retirés promptement conformément à la Loi pour la confiance dans l’économie
              numérique (LCEN).
            </p>

            <h2 className="text-white font-semibold">11. Blocage entre utilisateurs et bannissement</h2>
            <p>
              L’utilisateur peut bloquer un autre utilisateur à tout moment depuis l’interface de l’application. Le
              blocage interrompt toute interaction entre les deux comptes et masque réciproquement les contenus du
              profil concerné.
            </p>
            <p>
              En cas d’abus graves, de violations répétées des présentes CGU ou de comportements illégaux, Velura se
              réserve le droit de bannir définitivement le compte concerné et, dans les cas les plus graves, l’adresse
              IP associée afin de prévenir la création de nouveaux comptes.
            </p>

            <h2 className="text-white font-semibold">12. Suppression du compte par l’utilisateur</h2>
            <p>
              L’utilisateur peut supprimer son compte à tout moment, gratuitement, depuis les paramètres de
              l’application. La suppression entraîne l’effacement définitif, dans un délai maximal de quarante-huit
              (48) heures, de l’ensemble des données de profil, photos, vidéos, fichiers et messages envoyés et reçus,
              sans possibilité de récupération ultérieure, sous réserve des obligations légales de conservation
              (facturation, lutte contre la fraude, obligations comptables).
            </p>
            <p>
              Cette suppression est définitive. Aucune restauration du compte ou des données associées ne sera possible
              après expiration du délai de 48 heures.
            </p>

            <h2 className="text-white font-semibold">13. Suspension ou suppression par PAKT</h2>
            <p>
              Velura se réserve le droit de suspendre ou de supprimer un compte, sans préavis ni indemnité, en cas :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>De non-respect des présentes CGU ou de la législation applicable</li>
              <li>De comportement contraire à l’éthique de la plateforme ou portant préjudice à d’autres utilisateurs</li>
              <li>De signalements multiples justifiés</li>
              <li>De fraude, tentative de fraude, manipulation ou contournement technique</li>
              <li>De non-paiement d’un abonnement échu</li>
              <li>D’inactivité prolongée (à compter de 24 mois sans connexion)</li>
            </ul>
            <p>
              En cas d’abus grave, la suspension peut intervenir sans préavis et de manière immédiate.
            </p>

            <h2 className="text-white font-semibold">14. Plans et abonnements payants</h2>
            <p>
              PAKT propose trois plans d’utilisation :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-white/90">PAKT Free</strong> — plan gratuit par défaut, donnant accès aux
                fonctionnalités de base de l’application
              </li>
              <li>
                <strong className="text-white/90">PAKT Business</strong> — abonnement payant proposé au prix de 5 € par
                mois, donnant accès à des fonctionnalités étendues
              </li>
              <li>
                <strong className="text-white/90">PAKT Business Pro</strong> — abonnement payant proposé au prix de
                10 € par mois, donnant accès à l’ensemble des fonctionnalités premium
              </li>
            </ul>
            <p>
              Les abonnements sont actuellement proposés à la fréquence mensuelle, sans engagement de durée, et
              résiliables à tout moment dans les conditions précisées ci-après. Des formules annuelles pourront être
              proposées ultérieurement.
            </p>
            <p>
              Les fonctionnalités incluses dans chaque plan sont décrites dans l’application avant toute souscription.
              Velura se réserve le droit de modifier les tarifs ; toute évolution tarifaire applicable aux abonnements
              en cours sera notifiée à l’utilisateur avec un préavis raisonnable lui permettant de résilier sans frais.
            </p>

            <h2 className="text-white font-semibold">15. Promotions, parrainages et essais gratuits</h2>
            <p>
              PAKT peut, à titre exceptionnel et discrétionnaire, proposer des offres promotionnelles, des codes
              promotionnels, des essais gratuits ou des programmes de parrainage donnant accès à des avantages ou
              fonctionnalités premium pour une durée limitée.
            </p>
            <p>
              Ces offres sont soumises à des conditions spécifiques précisées au moment de leur diffusion et ne
              constituent ni un droit acquis, ni une garantie de reconduction. Velura se réserve le droit de modifier,
              suspendre ou supprimer toute offre promotionnelle à tout moment.
            </p>

            <h2 className="text-white font-semibold">16. Renouvellement automatique</h2>
            <p>
              Sauf indication contraire, les abonnements PAKT sont à renouvellement automatique. À l’issue de chaque
              période d’abonnement (mensuelle ou annuelle), celui-ci est automatiquement reconduit pour une nouvelle
              période identique, au tarif alors en vigueur, jusqu’à résiliation par l’utilisateur.
            </p>
            <p>
              L’utilisateur peut désactiver le renouvellement automatique à tout moment depuis les paramètres de son
              compte, depuis son espace de gestion d’abonnement Stripe ou, pour les abonnements souscrits via
              l’App Store, depuis les paramètres de son compte Apple. La désactivation prend effet à la fin de la
              période d’abonnement en cours, qui reste pleinement due.
            </p>

            <h2 className="text-white font-semibold">17. Résiliation</h2>
            <p>
              L’utilisateur est seul responsable de la gestion et de la résiliation de son abonnement. La résiliation
              n’entraîne pas la suppression du compte utilisateur : le compte reste accessible avec les fonctionnalités
              non premium.
            </p>
            <p>
              Pour résilier complètement le service, l’utilisateur doit également procéder à la suppression de son
              compte depuis les paramètres de l’application.
            </p>

            <h2 className="text-white font-semibold">18. Droit de rétractation et remboursements</h2>
            <p>
              Conformément aux articles L.221-18 et suivants du Code de la consommation, le consommateur dispose d’un
              délai de quatorze (14) jours à compter de la souscription pour exercer son droit de rétractation, sans
              avoir à motiver sa décision.
            </p>
            <p>
              Toutefois, en application de l’article L.221-28 du Code de la consommation, l’utilisateur reconnaît et
              accepte expressément, en activant les fonctionnalités premium dès la souscription, renoncer à son droit
              de rétractation dans la limite des fonctionnalités déjà consommées. La part déjà exécutée du service ne
              pourra alors faire l’objet d’un remboursement.
            </p>
            <p>
              Au-delà du délai de rétractation, les abonnements sont fermes et non remboursables, sauf cas exceptionnel
              apprécié par Velura ou obligation légale contraire. Pour les abonnements souscrits via l’App Store, les
              demandes de remboursement relèvent exclusivement d’Apple Inc. et de ses propres conditions.
            </p>

            <h2 className="text-white font-semibold">19. Mise en relation et responsabilité de l’utilisateur</h2>
            <p>
              PAKT facilite la découverte et la mise en relation entre utilisateurs mais ne garantit en aucune façon
              l’identité réelle, l’âge, les compétences, la fiabilité, la solvabilité, les intentions, l’honnêteté ou
              la qualité professionnelle des utilisateurs présents sur la plateforme.
            </p>
            <p>
              Chaque utilisateur reste seul responsable de ses échanges, rencontres physiques, collaborations, contrats,
              transactions et décisions prises à la suite d’une mise en relation effectuée via PAKT. PAKT n’est en
              aucun cas partie aux relations établies entre utilisateurs et ne saurait être tenue responsable des
              événements survenant hors de la plateforme, en ligne comme dans la vie réelle.
            </p>
            <p>
              L’utilisateur est invité à faire preuve de prudence, à vérifier les informations communiquées par ses
              interlocuteurs et à signaler tout comportement suspect via les outils de signalement intégrés.
            </p>

            <h2 className="text-white font-semibold">20. Événements</h2>
            <p>
              PAKT pourra proposer ou organiser, à l’avenir, des événements physiques ou en ligne autour du business,
              du networking et de l’entrepreneuriat. Ces événements pourront être organisés directement par PAKT ou
              en partenariat avec des tiers, et pourront être gratuits, payants ou réservés à certaines catégories
              d’utilisateurs.
            </p>
            <p>
              Les conditions de participation, d’annulation et de remboursement éventuelles à un événement sont
              précisées avant chaque inscription. Lorsque l’événement est organisé en partenariat avec un tiers, les
              paiements pourront être gérés via une solution telle que Stripe Connect. La responsabilité de PAKT au
              titre des événements est limitée à l’organisation logistique lorsque celle-ci lui incombe directement.
            </p>

            <h2 className="text-white font-semibold">21. Cagnotte</h2>
            <p>
              PAKT proposera ultérieurement un système de cagnotte volontaire et facultatif. La participation à la
              cagnotte repose exclusivement sur le bénévolat et la volonté de soutenir le développement de la
              plateforme, l’organisation d’événements et la mise en place de fonctionnalités au bénéfice de la
              communauté.
            </p>
            <p>
              Les utilisateurs participants peuvent contribuer librement, selon leurs moyens, et peuvent bénéficier en
              retour de récompenses, avantages, accès anticipés ou paliers selon les règles communiquées clairement
              dans l’application au moment de la participation.
            </p>
            <p>
              Les contributions à la cagnotte sont définitives et non remboursables. Aucune participation à la
              cagnotte ne constitue un investissement, un placement financier ou un produit d’épargne et ne garantit
              aucun résultat business, financier, commercial ou entrepreneurial.
            </p>

            <h2 className="text-white font-semibold">22. Absence de conseil professionnel</h2>
            <p>
              PAKT n’est pas un conseiller financier, juridique, fiscal, comptable, médical ou en investissement. Les
              contenus, profils, événements et ressources proposés ont une vocation informative, relationnelle et
              inspirationnelle. Aucune information disponible sur PAKT ne constitue un conseil personnalisé ni une
              garantie de résultat.
            </p>

            <h2 className="text-white font-semibold">23. Propriété intellectuelle</h2>
            <p>
              L’ensemble des éléments de l’application PAKT (marque, logo, identité visuelle, textes, interfaces, code
              source, base de données, fonctionnalités, contenus éditoriaux) est protégé par le droit de la propriété
              intellectuelle et reste la propriété exclusive de Velura ou de ses partenaires.
            </p>
            <p>
              Toute reproduction, représentation, modification, diffusion ou exploitation, en tout ou partie, sans
              autorisation écrite préalable, est strictement interdite et expose son auteur à des poursuites
              judiciaires (articles L.335-2 et suivants du Code de la propriété intellectuelle).
            </p>

            <h2 className="text-white font-semibold">24. Disponibilité du service</h2>
            <p>
              Velura met en œuvre ses meilleurs efforts pour assurer une disponibilité continue de l’application, sans
              garantir une accessibilité permanente et ininterrompue. Des interruptions peuvent survenir pour des
              raisons de maintenance, de mise à jour, d’incident technique, d’attaque informatique ou en cas de force
              majeure.
            </p>

            <h2 className="text-white font-semibold">25. Évolution du service et fonctionnalités expérimentales</h2>
            <p>
              Velura se réserve le droit de faire évoluer, modifier, suspendre temporairement ou supprimer
              définitivement, à tout moment et sans préavis, tout ou partie des fonctionnalités de l’application.
            </p>
            <p>
              Certaines fonctionnalités peuvent être proposées à titre expérimental (bêta) et fonctionner de manière
              partielle, imparfaite ou évolutive. L’utilisateur en accepte les limites éventuelles et reconnaît que
              ces fonctionnalités sont susceptibles d’évoluer, d’être modifiées ou retirées sans contrepartie.
            </p>

            <h2 className="text-white font-semibold">26. Limitation de responsabilité</h2>
            <p>
              Dans les limites permises par la législation applicable, la responsabilité de Velura ne saurait être
              engagée pour les dommages indirects, immatériels, imprévisibles ou inhérents aux relations entre
              utilisateurs : perte de profit, perte d’opportunité commerciale, atteinte à la réputation, conséquences
              d’une mise en relation, d’une rencontre physique, d’un partenariat, d’un contrat conclu entre
              utilisateurs ou de toute action menée hors de la plateforme.
            </p>
            <p>
              Velura ne saurait être tenue responsable des contenus publiés par les utilisateurs, des comportements de
              ces derniers, des arnaques éventuelles entre utilisateurs ou des conséquences résultant d’interactions
              menées en dehors de la plateforme.
            </p>

            <h2 className="text-white font-semibold">27. Force majeure</h2>
            <p>
              Velura ne saurait être tenue responsable d’une inexécution ou d’un retard d’exécution résultant d’un cas
              de force majeure tel que défini par l’article 1218 du Code civil et la jurisprudence française, en ce
              compris notamment les pannes de réseaux, défaillances des prestataires techniques (hébergeur, base de
              données, paiement), cyberattaques, événements sanitaires, décisions des autorités publiques, grèves ou
              catastrophes naturelles.
            </p>

            <h2 className="text-white font-semibold">28. Cookies, notifications et communications</h2>
            <p>
              PAKT utilise des cookies et technologies similaires strictement nécessaires au fonctionnement du service
              (authentification, session, sécurité). PAKT peut être amenée, ultérieurement, à envoyer des
              communications par email à finalité commerciale ou des notifications push.
            </p>
            <p>
              L’utilisateur peut activer ou désactiver les notifications push depuis les paramètres de son appareil et
              se désabonner des emails optionnels via les liens prévus à cet effet, dans le respect des préférences
              définies dans son compte.
            </p>

            <h2 className="text-white font-semibold">29. Modification des CGU</h2>
            <p>
              Velura se réserve le droit de modifier les présentes CGU à tout moment afin de les adapter aux évolutions
              légales, jurisprudentielles, techniques ou fonctionnelles. Les utilisateurs seront informés de toute
              modification substantielle dans l’application ou par email. La poursuite de l’utilisation du service
              après notification vaut acceptation des nouvelles CGU.
            </p>

            <h2 className="text-white font-semibold">30. Invalidité partielle</h2>
            <p>
              Si l’une quelconque des stipulations des présentes CGU venait à être déclarée nulle, illicite, invalide
              ou inapplicable par une juridiction compétente, les autres stipulations conserveraient leur pleine
              force et effet. La stipulation jugée invalide sera, dans la mesure du possible, remplacée par une
              stipulation valide produisant un effet économique équivalent.
            </p>

            <h2 className="text-white font-semibold">31. Distribution via les magasins d’applications mobiles</h2>
            <p>
              Lorsque l’application PAKT est téléchargée depuis l’App Store d’Apple Inc. ou le Google Play Store de
              Google LLC, les présentes CGU s’appliquent entre l’utilisateur et Velura. Apple Inc. et Google LLC ne
              sont pas parties à ce contrat.
            </p>
            <p>Conformément aux conditions d’Apple, lorsque l’application est distribuée via l’App Store :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Apple n’est pas responsable de l’application, de son contenu, de sa maintenance, ni de son support technique.</li>
              <li>Toute réclamation relative à l’application doit être adressée à Velura, et non à Apple.</li>
              <li>Apple n’est pas responsable des réclamations de tiers concernant l’application ou son utilisation, y compris en matière de propriété intellectuelle.</li>
              <li>Apple et ses filiales sont des bénéficiaires tiers des présentes CGU et peuvent en exiger l’application à l’égard de l’utilisateur.</li>
              <li>L’utilisateur déclare ne pas résider dans un pays soumis à un embargo des États-Unis et ne pas être inscrit sur une liste de personnes interdites ou restreintes par le gouvernement américain.</li>
              <li>Les demandes de remboursement relatives aux achats effectués via l’App Store relèvent exclusivement d’Apple.</li>
            </ul>
            <p>
              Pour les téléchargements via le Google Play Store, les demandes de remboursement relatives aux achats
              effectués via Google Play relèvent exclusivement de Google et de ses conditions.
            </p>

            <h2 className="text-white font-semibold">32. Droit applicable et règlement des litiges</h2>
            <p>
              Les présentes CGU sont régies par le droit français. En cas de litige, l’utilisateur est invité à
              contacter PAKT en priorité à l’adresse paktsupport@gmail.com afin de rechercher une solution amiable.
            </p>
            <p>
              Le consommateur peut également déposer une réclamation sur la plateforme européenne de règlement en
              ligne des litiges : https://ec.europa.eu/consumers/odr
            </p>
            <p>
              À défaut de résolution amiable, tout litige sera porté devant les juridictions françaises compétentes,
              sous réserve des règles d’ordre public protectrices du consommateur.
            </p>

            <h2 className="text-white font-semibold">33. Contact</h2>
            <p>
              Pour toute question relative aux présentes CGU : paktsupport@gmail.com
            </p>
            <p>
              Voir également les{' '}
              <Link href="/legal/legal-notice" className="text-gold underline">
                Mentions légales
              </Link>{' '}
              et la{' '}
              <Link href="/legal/privacy" className="text-gold underline">
                Politique de confidentialité
              </Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
