'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function ConfirmEmailPage() {
  const params = useParams()
  const token = params?.token as string
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_used'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setErrorMsg('Token manquant'); return }

    // On mobile browser → redirect to app deep link immediately
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile) {
      window.location.href = `pakt://confirm/${token}`
      // Fallback after 2s if app not installed
      setTimeout(() => setStatus('success'), 2000)
      return
    }

    // On PC → verify token via Supabase Edge Function
    const verify = async () => {
      try {
        const res = await fetch(
          'https://cpgnczuqhwdoalgyezvr.supabase.co/functions/v1/verify-email-confirmation',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwZ25jenVxaHdkb2FsZ3llenZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MjA2NDcsImV4cCI6MjA5NTE5NjY0N30.GagM-CyNkl9YJmor26eepk3DF3EWcRsa7xnFIZyBeFY',
            },
            body: JSON.stringify({ token }),
          }
        )
        const data = await res.json()
        if (data.success) {
          setStatus('success')
        } else if (data.error === 'Token already used') {
          setStatus('already_used')
        } else {
          setStatus('error')
          setErrorMsg(data.error || 'Lien invalide ou expiré')
        }
      } catch {
        setStatus('error')
        setErrorMsg('Erreur réseau')
      }
    }

    verify()
  }, [token])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: '24px',
    }}>
      {/* Logo */}
      <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: 8, color: '#d4a853', marginBottom: 48 }}>
        PAKT
      </div>

      {/* Card */}
      <div style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: '40px 36px',
        maxWidth: 440,
        width: '100%',
        textAlign: 'center',
      }}>
        {status === 'loading' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>⏳</div>
            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>
              Vérification en cours...
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Nous confirmons ton adresse email.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            {/* Green checkmark circle */}
            <div style={{
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: '#d4a853',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, margin: '0 auto 24px',
            }}>
              ✓
            </div>
            <h2 style={{ color: '#ffffff', fontSize: 22, fontWeight: 800, margin: '0 0 12px' }}>
              Email confirmé !
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.7, margin: '0 0 32px' }}>
              Ton adresse email a bien été confirmée. Ton compte PAKT est maintenant actif.
            </p>

            {/* Divider */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '0 0 28px' }} />

            {/* Mobile app instruction */}
            <div style={{
              backgroundColor: 'rgba(212,168,83,0.08)',
              border: '1px solid rgba(212,168,83,0.2)',
              borderRadius: 12,
              padding: '18px 20px',
              marginBottom: 24,
            }}>
              <p style={{ color: '#d4a853', fontSize: 14, fontWeight: 700, margin: '0 0 8px' }}>
                Retourne sur l'application mobile
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                Ouvre l'app PAKT sur ton téléphone, connecte-toi et complète ton profil pour commencer à swiper !
              </p>
            </div>

            {/* App store badges placeholder */}
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: 0 }}>
              Disponible sur iOS et Android
            </p>
          </>
        )}

        {status === 'already_used' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>✅</div>
            <h2 style={{ color: '#ffffff', fontSize: 22, fontWeight: 800, margin: '0 0 12px' }}>
              Déjà confirmé
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.7, margin: '0 0 28px' }}>
              Ton email a déjà été confirmé. Tu peux te connecter directement sur l'application PAKT.
            </p>
            <div style={{
              backgroundColor: 'rgba(212,168,83,0.08)',
              border: '1px solid rgba(212,168,83,0.2)',
              borderRadius: 12,
              padding: '16px 20px',
            }}>
              <p style={{ color: '#d4a853', fontSize: 13, margin: 0 }}>
                Ouvre l'app PAKT sur ton téléphone pour te connecter.
              </p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>❌</div>
            <h2 style={{ color: '#ffffff', fontSize: 22, fontWeight: 800, margin: '0 0 12px' }}>
              Lien invalide
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.7, margin: '0 0 8px' }}>
              {errorMsg || 'Ce lien est invalide ou a expiré.'}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.6, margin: '0 0 28px' }}>
              Crée un nouveau compte sur l'application PAKT pour recevoir un nouvel email de confirmation.
            </p>
            <div style={{
              backgroundColor: 'rgba(255,68,68,0.08)',
              border: '1px solid rgba(255,68,68,0.2)',
              borderRadius: 12,
              padding: '16px 20px',
            }}>
              <p style={{ color: '#ff6b6b', fontSize: 13, margin: 0 }}>
                Les liens de confirmation expirent après 24h.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 32 }}>
        PAKT © 2026 · <a href="https://pakt-sigma.vercel.app" style={{ color: 'rgba(212,168,83,0.4)', textDecoration: 'none' }}>paktapp.fr</a>
      </p>
    </div>
  )
}
