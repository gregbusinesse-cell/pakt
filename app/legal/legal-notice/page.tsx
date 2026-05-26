'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function MentionsLegalesPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-dark text-white">
      <div className="px-5 pt-5">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/70 hover:text-white"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Retour</span>
        </button>
      </div>

      <div className="px-5 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold">Mentions légales</h1>

          <div className="bg-dark-200 border border-dark-500 rounded-[12px] p-6 space-y-4 text-white/70 text-sm leading-relaxed">
            <p className="text-white/50">Dernière mise à jour : 18 mai 2025</p>

            <h2 className="text-white font-semibold">1. Éditeur de l’application</h2>
            <p>
              L’application PAKT est éditée par Velura, micro-entreprise immatriculée en France et exploitant la marque
              commerciale PAKT.
            </p>
            <p>
              Dénomination sociale : Velura<br />
              Marque exploitée : PAKT<br />
              Forme juridique : Micro-entreprise<br />
              Siège social : 229 rue Saint-Honoré, 75001 Paris, France<br />
              SIRET : 925 272 957 00018<br />
              TVA : TVA non applicable, article 293 B du Code général des impôts<br />
              Email : paktsupport@gmail.com<br />
              Site officiel : https://paktapp.fr
            </p>

            <h2 className="text-white font-semibold">2. Directeur de la publication</h2>
            <p>
              Le directeur de la publication est Grégoire Direz, en sa qualité de représentant légal de Velura.
            </p>

            <h2 className="text-white font-semibold">3. Présentation de l’application</h2>
            <p>
              PAKT est une application de networking et d’accompagnement entrepreneurial permettant aux utilisateurs de
              se rencontrer, échanger, créer des projets, développer leur activité et accéder à des ressources, outils et
              événements liés à l’entrepreneuriat.
            </p>
            <p>
              L’application est accessible sur https://paktapp.fr et pourra être distribuée ultérieurement via les
              plateformes de téléchargement applicables, notamment l’App Store d’Apple Inc. et le Google Play Store
              de Google LLC.
            </p>

            <h2 className="text-white font-semibold">4. Hébergement</h2>
            <p>
              L’application est hébergée par Vercel Inc., société dont le siège social est situé au 440 N Barranca Ave
              #4133, Covina, CA 91723, États-Unis. Site : https://vercel.com
            </p>
            <p>
              La base de données et l’infrastructure d’authentification sont fournies par Supabase Inc., 970 Toa Payoh
              North #07-04, Singapour 318992. Site : https://supabase.com
            </p>
            <p>
              Le traitement des paiements en ligne est assuré par Stripe Payments Europe, Limited, 1 Grand Canal Street
              Lower, Grand Canal Dock, Dublin, Irlande. Site : https://stripe.com
            </p>

            <h2 className="text-white font-semibold">5. Propriété intellectuelle</h2>
            <p>
              L’ensemble des éléments composant l’application PAKT (marque, logo, identité visuelle, nom de domaine,
              textes, graphismes, photographies, vidéos, sons, illustrations, interfaces, codes sources, scripts, bases
              de données et toute autre composante) est protégé par les dispositions du Code de la propriété
              intellectuelle et appartient à Velura ou à ses partenaires licenciés.
            </p>
            <p>
              Toute reproduction, représentation, modification, adaptation, traduction, publication, transmission,
              distribution ou exploitation, totale ou partielle, par quelque procédé que ce soit, sans autorisation
              écrite préalable de Velura, est interdite et constitue une contrefaçon sanctionnée par les articles L.335-2
              et suivants du Code de la propriété intellectuelle.
            </p>

            <h2 className="text-white font-semibold">6. Contenus publiés par les utilisateurs</h2>
            <p>
              Les utilisateurs sont seuls responsables des contenus qu’ils publient, transmettent ou rendent accessibles
              via l’application (profil, photos, vidéos, messages, liens, descriptions, etc.). Ces contenus n’engagent
              que leurs auteurs.
            </p>
            <p>
              PAKT agit en qualité d’hébergeur au sens de l’article 6-I-2 de la Loi pour la confiance dans l’économie
              numérique (LCEN) du 21 juin 2004. À ce titre, PAKT ne procède pas à une vérification systématique des
              contenus mis en ligne, mais s’engage à retirer promptement tout contenu manifestement illicite qui lui
              serait signalé via le mécanisme prévu à cet effet.
            </p>

            <h2 className="text-white font-semibold">7. Responsabilité de la plateforme</h2>
            <p>
              PAKT est une plateforme de mise en relation, de ressources et d’événements liés à l’entrepreneuriat. PAKT
              ne fournit ni conseil financier, juridique, fiscal, comptable, médical, professionnel, ni recommandation
              d’investissement.
            </p>
            <p>
              PAKT ne garantit aucun résultat business, financier, commercial, professionnel ou relationnel. Les
              utilisateurs restent seuls responsables de leurs décisions, échanges, relations, accords, contrats et
              actions menées suite à l’utilisation de l’application.
            </p>
            <p>
              La responsabilité de Velura ne saurait être engagée pour les dommages indirects, immatériels ou imprévisibles
              résultant de l’utilisation ou de l’impossibilité d’utiliser le service, dans les limites permises par la
              législation applicable.
            </p>

            <h2 className="text-white font-semibold">8. Suspension et suppression de comptes</h2>
            <p>
              Velura se réserve le droit, à tout moment et sans préavis, de suspendre, restreindre ou supprimer le compte
              de tout utilisateur en cas de non-respect des Conditions Générales d’Utilisation, de comportement contraire
              à la loi, à la sécurité ou au bon fonctionnement de l’application, ou en cas de signalements répétés.
            </p>

            <h2 className="text-white font-semibold">9. Distribution via plateformes tierces (App Store, Google Play)</h2>
            <p>
              Lorsque l’application est téléchargée depuis l’App Store d’Apple Inc. ou le Google Play Store de
              Google LLC, l’utilisateur reconnaît que ces plateformes ne sont pas parties au présent contrat et que
              l’éditeur Velura est seul responsable du service, de son contenu, de la maintenance, du support
              technique, de la conformité du produit et des éventuelles réclamations relatives à l’application, dans
              les limites prévues par les conditions d’Apple et de Google.
            </p>
            <p>
              Apple Inc. et ses filiales sont reconnues comme bénéficiaires tiers du présent contrat et peuvent en
              exiger l’application à l’égard de l’utilisateur final, conformément aux conditions d’Apple.
            </p>

            <h2 className="text-white font-semibold">10. Données personnelles</h2>
            <p>
              Le traitement des données personnelles des utilisateurs est décrit dans la{' '}
              <Link href="/legal/privacy" className="text-gold underline">
                Politique de confidentialité
              </Link>{' '}
              de PAKT, qui fait partie intégrante des présentes mentions légales.
            </p>

            <h2 className="text-white font-semibold">11. Conditions Générales d’Utilisation</h2>
            <p>
              L’utilisation de l’application PAKT est encadrée par les{' '}
              <Link href="/legal/cgu" className="text-gold underline">
                Conditions Générales d’Utilisation
              </Link>{' '}
              applicables, que l’utilisateur accepte lors de la création de son compte.
            </p>

            <h2 className="text-white font-semibold">12. Médiation et résolution des litiges</h2>
            <p>
              Conformément à l’article L.612-1 du Code de la consommation, en cas de litige non résolu à l’amiable,
              l’utilisateur consommateur peut recourir gratuitement à un médiateur de la consommation. L’utilisateur
              peut également déposer une réclamation sur la plateforme européenne de règlement en ligne des litiges :
              https://ec.europa.eu/consumers/odr
            </p>

            <h2 className="text-white font-semibold">13. Droit applicable et juridiction compétente</h2>
            <p>
              Les présentes mentions légales sont régies par le droit français. À défaut de résolution amiable, tout
              litige relatif à l’interprétation ou à l’exécution des présentes sera soumis aux tribunaux français
              compétents, sous réserve des règles d’ordre public applicables au consommateur.
            </p>

            <h2 className="text-white font-semibold">14. Contact</h2>
            <p>
              Pour toute question relative à l’application, à son fonctionnement ou aux présentes mentions légales :
              paktsupport@gmail.com
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
