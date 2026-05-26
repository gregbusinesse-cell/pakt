'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CookiesPage() {
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
          <h1 className="text-2xl font-bold">Politique cookies</h1>

          <div className="bg-dark-200 border border-dark-500 rounded-[12px] p-6 space-y-4 text-white/70 text-sm leading-relaxed">
            <p className="text-white/50">Dernière mise à jour : 18 mai 2025</p>

            <p>
              La présente politique décrit l’usage des cookies et technologies similaires (identifiants techniques,
              jetons de session, identifiants d’appareil) sur l’application PAKT, conformément à la directive ePrivacy,
              au RGPD et aux recommandations de la CNIL.
            </p>

            <h2 className="text-white font-semibold">1. Définition</h2>
            <p>
              Un cookie est un petit fichier ou traceur pouvant être enregistré ou lu sur le terminal de l’utilisateur
              (navigateur web, application mobile) lors de sa navigation. PAKT peut également utiliser des technologies
              similaires telles que le stockage local (localStorage, sessionStorage) ou des identifiants techniques liés
              à l’authentification, qui obéissent aux mêmes règles que les cookies.
            </p>

            <h2 className="text-white font-semibold">2. Cookies et traceurs strictement nécessaires</h2>
            <p>
              PAKT utilise des cookies et traceurs strictement nécessaires au fonctionnement de l’application. Ils
              servent notamment à :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Authentifier l’utilisateur et maintenir sa session</li>
              <li>Garantir la sécurité du compte et prévenir les usurpations</li>
              <li>Mémoriser certains choix techniques (langue, préférences d’affichage)</li>
              <li>Permettre le traitement sécurisé des paiements</li>
              <li>Détecter et prévenir la fraude</li>
              <li>Assurer la stabilité et la performance technique du service</li>
            </ul>
            <p>
              Conformément à l’article 82 de la Loi Informatique et Libertés, ces cookies ne nécessitent pas le
              consentement préalable de l’utilisateur lorsqu’ils sont strictement nécessaires à la fourniture du service
              expressément demandé.
            </p>

            <h2 className="text-white font-semibold">3. Prestataires concernés</h2>
            <p>
              Certains cookies, traceurs ou identifiants techniques peuvent être liés à nos sous-traitants
              indispensables au fonctionnement du service :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-white/90">Vercel</strong> — hébergement et stabilité technique</li>
              <li><strong className="text-white/90">Supabase</strong> — authentification, base de données, sessions</li>
              <li><strong className="text-white/90">Stripe</strong> — traitement sécurisé des paiements et prévention de la fraude</li>
              <li><strong className="text-white/90">Google</strong> — uniquement lorsque l’utilisateur choisit la connexion via Google Sign-In</li>
              <li><strong className="text-white/90">Apple</strong> — uniquement lorsque l’utilisateur choisit la connexion via Apple Sign In sur les versions iOS</li>
            </ul>

            <h2 className="text-white font-semibold">4. Durée de conservation</h2>
            <p>
              Les cookies et identifiants techniques sont conservés pendant une durée maximale conforme aux
              recommandations de la CNIL :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cookies de session : effacés à la fermeture de la session ou de l’application</li>
              <li>Cookies d’authentification persistants : jusqu’à 12 mois</li>
              <li>Cookies de sécurité ou anti-fraude : selon les exigences techniques, généralement 6 à 13 mois</li>
            </ul>

            <h2 className="text-white font-semibold">5. Cookies analytics</h2>
            <p>
              PAKT n’utilise pas actuellement d’outil d’analyse marketing avancé. Des outils d’analyse de fréquentation,
              de performance ou d’amélioration produit pourront être mis en place ultérieurement.
            </p>
            <p>
              Lorsque ces outils nécessitent un consentement, ils ne seront activés qu’après accord explicite de
              l’utilisateur, recueilli via une bannière ou un module de gestion du consentement.
            </p>

            <h2 className="text-white font-semibold">6. Cookies marketing et publicitaires</h2>
            <p>
              PAKT n’utilise pas actuellement de cookies marketing, publicitaires ou de suivi intersite. Si de tels
              cookies sont ajoutés plus tard, ils ne seront déposés qu’après consentement préalable, libre, spécifique,
              éclairé et univoque de l’utilisateur.
            </p>

            <h2 className="text-white font-semibold">7. Identifiants d’appareil (application mobile)</h2>
            <p>
              Sur les versions mobiles de l’application, PAKT pourra utiliser certains identifiants techniques propres
              à l’appareil (jeton de notification push, identifiant de session) strictement nécessaires au fonctionnement
              du service.
            </p>
            <p>
              PAKT n’utilise pas l’identifiant publicitaire (IDFA pour iOS, AAID pour Android) et ne procède à aucun
              suivi inter-applications. Aucune donnée n’est partagée avec des régies publicitaires ou des plateformes
              de tracking tierces. Si l’usage de tels identifiants devait évoluer à l’avenir, l’utilisateur en serait
              informé et son consentement serait recueilli conformément aux exigences applicables (App Tracking
              Transparency pour iOS, équivalent pour Android).
            </p>

            <h2 className="text-white font-semibold">8. Bannière de gestion du consentement</h2>
            <p>
              Lorsque PAKT introduit des cookies ou traceurs nécessitant un consentement, une bannière ou un module
              dédié permet à l’utilisateur d’accepter, de refuser ou de personnaliser ses choix. L’utilisateur peut
              modifier ses préférences à tout moment via le module de gestion du consentement intégré à l’application.
            </p>

            <h2 className="text-white font-semibold">9. Conséquences du refus</h2>
            <p>
              Le refus des cookies non essentiels n’empêche pas l’accès aux fonctionnalités principales de PAKT. En
              revanche, la désactivation des cookies strictement nécessaires (notamment d’authentification) peut
              dégrader ou empêcher le fonctionnement normal de l’application.
            </p>

            <h2 className="text-white font-semibold">10. Gestion depuis le navigateur ou l’appareil</h2>
            <p>
              L’utilisateur peut gérer les cookies depuis les paramètres de son navigateur (Chrome, Safari, Firefox,
              Edge) ou de son appareil. Les choix de consentement sont mémorisés pour une durée raisonnable, dans la
              limite de six (6) mois pour les refus, conformément aux recommandations de la CNIL.
            </p>

            <h2 className="text-white font-semibold">11. Données collectées via les cookies</h2>
            <p>
              Les données collectées par les cookies et traceurs techniques sont traitées conformément à la{' '}
              <Link href="/legal/privacy" className="text-gold underline">
                Politique de confidentialité
              </Link>{' '}
              de PAKT, qui détaille les finalités, les durées de conservation et les droits de l’utilisateur.
            </p>

            <h2 className="text-white font-semibold">12. Modifications de la politique cookies</h2>
            <p>
              Velura se réserve le droit de modifier la présente politique pour l’adapter aux évolutions légales,
              jurisprudentielles, techniques ou fonctionnelles. Les utilisateurs seront informés de toute modification
              substantielle dans l’application.
            </p>

            <h2 className="text-white font-semibold">13. Contact</h2>
            <p>
              Pour toute question relative aux cookies ou à l’exercice de vos droits : paktsupport@gmail.com
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
