'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function MentionsLegalesPage() {
  const router = useRouter()

  return (
    <div className="px-5 py-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/70 hover:text-white"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Retour</span>
        </button>

        <h1 className="text-2xl font-bold">Mentions légales</h1>

        <div className="bg-dark-200 border border-dark-500 rounded-[12px] p-6 space-y-4 text-white/70 text-sm leading-relaxed">
          <p>Dernière mise à jour : 2 mai 2026</p>

          <h2 className="text-white font-semibold">Éditeur de l’application</h2>
          <p>
            L’application PAKT est éditée par Velura, micro-entreprise exploitant la marque PAKT.
          </p>

          <p>
            Siège : 229 rue Saint-Honoré, 75001 Paris, France<br />
            SIRET : 925 272 957 00018<br />
            TVA : TVA non applicable, article 293 B du Code général des impôts<br />
            Email : supportpaktsupport@gmail.com
          </p>

          <h2 className="text-white font-semibold">Directeur de publication</h2>
          <p>Le directeur de publication est Grégoire Direz.</p>

          <h2 className="text-white font-semibold">Application concernée</h2>
          <p>
            PAKT est une application de mise en relation et d’accompagnement entrepreneurial permettant aux utilisateurs
            de rencontrer des partenaires, développer des projets et accéder à des outils, événements et ressources pour
            lancer et structurer un business.
          </p>

          <p>URL actuelle : https://pakt-sigma.vercel.app/auth</p>

          <h2 className="text-white font-semibold">Hébergement et prestataires techniques</h2>
          <p>
            L’application est hébergée par Vercel. La base de données est fournie par Supabase. Les paiements sont traités
            par Stripe. Les coordonnées légales complètes de ces prestataires sont disponibles sur leurs sites officiels.
          </p>

          <h2 className="text-white font-semibold">Propriété intellectuelle</h2>
          <p>
            Les éléments présents sur PAKT, notamment la marque, les textes, interfaces, visuels, fonctionnalités, bases de
            données, codes et contenus éditoriaux, sont protégés par les lois relatives à la propriété intellectuelle.
          </p>

          <p>
            Toute reproduction, modification, diffusion ou exploitation non autorisée de tout ou partie de PAKT est interdite,
            sauf autorisation écrite préalable de Velura.
          </p>

          <h2 className="text-white font-semibold">Responsabilité</h2>
          <p>
            PAKT est une plateforme de mise en relation, de ressources, d’inspiration et d’événements autour de
            l’entrepreneuriat. PAKT n’est pas un conseiller financier, juridique, fiscal, comptable ou en investissement.
          </p>

          <p>
            PAKT ne garantit aucun résultat business, financier, commercial, entrepreneurial ou relationnel. L’utilisateur
            reste seul responsable de ses décisions, actions, échanges, relations, investissements et résultats.
          </p>

          <h2 className="text-white font-semibold">Contact</h2>
          <p>
            Pour toute question relative à l’application ou aux présentes mentions légales, vous pouvez écrire à :
            supportpaktsupport@gmail.com
          </p>
        </div>
      </div>
    </div>
  )
}