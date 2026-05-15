'use client'

import { useState } from 'react'

const TEMPLATES = [
  { id: 'welcome', label: 'Welcome', desc: 'Email de bienvenue apres onboarding' },
  { id: 'like', label: 'Nouveau like', desc: "Quelqu'un a like ton profil" },
  { id: 'match', label: 'Nouveau match', desc: 'Match mutuel detecte' },
  { id: 'inactive-day-1', label: 'Inactif J+1', desc: 'Premiere relance apres 24h' },
  { id: 'inactive-day-2', label: 'Inactif J+2', desc: 'Deuxieme relance apres 48h' },
  { id: 'inactive-day-3', label: 'Inactif J+3', desc: 'Derniere relance apres 72h' },
  { id: 'incomplete-profile', label: 'Profil incomplet', desc: 'Photos, bio ou competences manquantes' },
]

export default function EmailsPreviewPage() {
  const [active, setActive] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-6xl mx-auto px-5 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-wider text-[#d4a853]">PAKT</h1>
          <p className="text-white/40 text-sm mt-1">Email Preview — aucun email envoye</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Sidebar */}
          <div className="space-y-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  active === t.id
                    ? 'bg-[#d4a853]/15 border-[#d4a853]/40 text-white'
                    : 'bg-[#1a1a1a] border-white/[0.06] text-white/60 hover:border-white/15 hover:text-white/80'
                }`}
              >
                <p className="text-sm font-semibold">{t.label}</p>
                <p className="text-[11px] text-white/35 mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-white/[0.06] bg-[#1a1a1a] overflow-hidden">
            {active ? (
              <iframe
                key={active}
                src={`/api/emails/preview?template=${active}`}
                className="w-full border-0"
                style={{ height: '700px' }}
                title={`Preview: ${active}`}
              />
            ) : (
              <div className="flex items-center justify-center h-[700px] text-white/20 text-sm">
                Selectionne un template
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
