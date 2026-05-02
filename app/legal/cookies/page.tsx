'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

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
            <p>Dernière mise à jour : 2 mai 2026</p>

            <h2 className="text-white font-semibold">1. Définition</h2>
            <p>
              Un cookie est un petit fichier ou traceur pouvant être enregistré ou lu sur le terminal de l’utilisateur lors de
              sa navigation. PAKT peut utiliser des cookies ou technologies similaires pour faire fonctionner l’application.
            </p>

            <h2 className="text-white font-semibold">2. Cookies nécessaires</h2>
            <p>
              PAKT utilise ou peut utiliser des cookies strictement nécessaires au fonctionnement de l’application. Ils servent
              notamment à l’authentification, la sécurité, la conservation de session, la prévention de la fraude, le paiement
              et la stabilité technique.
            </p>
            <p>
              Ces cookies ne nécessitent pas toujours le consentement préalable lorsqu’ils sont strictement nécessaires au
              service demandé par l’utilisateur.
            </p>

            <h2 className="text-white font-semibold">3. Prestataires concernés</h2>
            <p>
              Certains cookies ou traceurs techniques peuvent être liés à Vercel pour l’hébergement, Supabase pour
              l’authentification et la base de données, ou Stripe pour le paiement et la prévention de la fraude.
            </p>

            <h2 className="text-white font-semibold">4. Cookies analytics</h2>
            <p>
              PAKT n’utilise pas actuellement d’outil analytics marketing avancé. Des outils d’analyse de fréquentation,
              performance ou amélioration produit pourront être ajoutés ultérieurement.
            </p>
            <p>
              Lorsque ces outils nécessitent un consentement, ils ne seront activés qu’après accord de l’utilisateur via une
              bannière ou un module de gestion du consentement.
            </p>

            <h2 className="text-white font-semibold">5. Cookies marketing</h2>
            <p>
              PAKT n’utilise pas actuellement de cookies marketing ou publicitaires. Si des cookies marketing, publicitaires
              ou de suivi intersite sont ajoutés plus tard, ils ne seront déposés qu’après consentement préalable.
            </p>

            <h2 className="text-white font-semibold">6. Bannière cookies</h2>
            <p>
              PAKT prévoit la mise en place d’une bannière cookies permettant d’accepter, refuser ou personnaliser les cookies
              soumis à consentement. L’utilisateur pourra modifier ses choix à tout moment.
            </p>

            <h2 className="text-white font-semibold">7. Refus des cookies</h2>
            <p>
              Le refus des cookies non essentiels ne bloque pas l’accès aux fonctionnalités principales. En revanche, la
              désactivation de certains cookies techniques peut dégrader ou empêcher le fonctionnement normal de l’application.
            </p>

            <h2 className="text-white font-semibold">8. Gestion depuis le navigateur</h2>
            <p>
              L’utilisateur peut gérer les cookies depuis les paramètres de son navigateur ou de son appareil. Les choix de
              consentement peuvent aussi être conservés afin d’éviter de redemander la même décision à chaque visite.
            </p>

            <h2 className="text-white font-semibold">9. Contact</h2>
            <p>
              Pour toute question relative aux cookies, l’utilisateur peut contacter PAKT à l’adresse :
              supportpaktsupport@gmail.com
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}