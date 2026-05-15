'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')

  const isSuccess = status === 'success'

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-5">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-black tracking-wider text-[#d4a853] mb-8">PAKT</h1>

        <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-2xl p-8">
          {isSuccess ? (
            <>
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(74,222,128,0.8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-3">Desinscription confirmee</h2>
              <p className="text-sm text-white/50 leading-relaxed">
                Tu ne recevras plus d&apos;emails automatiques de PAKT. Tu peux te reinscrire a tout moment depuis les parametres de ton profil.
              </p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(248,113,113,0.8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-3">Lien invalide</h2>
              <p className="text-sm text-white/50 leading-relaxed">
                Ce lien de desinscription est invalide ou a expire. Si tu souhaites te desinscrire, utilise le lien dans ton dernier email PAKT.
              </p>
            </>
          )}

          <a
            href="/swipe"
            className="inline-block mt-6 px-6 py-3 rounded-xl bg-[#d4a853] text-[#0a0a0a] text-sm font-bold hover:opacity-90 transition-opacity"
          >
            Retour sur PAKT
          </a>
        </div>
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <UnsubscribeContent />
    </Suspense>
  )
}
