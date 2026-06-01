'use client'
// Intermediate page: Stripe redirects here after successful mobile payment
// This page then redirects the user back to the PAKT mobile app via deep link

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function MobilePaymentSuccess() {
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') || 'business'
  const sessionId = searchParams.get('session_id') || ''

  useEffect(() => {
    // Redirect to mobile app deep link
    const deepLink = `pakt://payment/success?plan=${plan}&session_id=${sessionId}`

    // Small delay to ensure page renders first
    const timer = setTimeout(() => {
      window.location.href = deepLink
    }, 500)

    return () => clearTimeout(timer)
  }, [plan, sessionId])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      padding: '24px',
    }}>
      <div style={{
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#d4a853',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 40,
        marginBottom: 24,
      }}>
        ✓
      </div>
      <h1 style={{ color: '#ffffff', fontSize: 24, fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>
        Paiement confirmé !
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, textAlign: 'center', marginBottom: 32 }}>
        Retour vers l'application PAKT...
      </p>
      <a
        href={`pakt://payment/success?plan=${plan}&session_id=${sessionId}`}
        style={{
          backgroundColor: '#d4a853',
          color: '#000',
          fontWeight: 700,
          fontSize: 15,
          padding: '14px 32px',
          borderRadius: 12,
          textDecoration: 'none',
        }}
      >
        Ouvrir PAKT
      </a>
    </div>
  )
}
