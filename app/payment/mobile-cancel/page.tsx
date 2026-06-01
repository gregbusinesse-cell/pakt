'use client'

import { useEffect } from 'react'

export default function MobilePaymentCancel() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = 'pakt://payment/cancel'
    }, 500)
    return () => clearTimeout(timer)
  }, [])

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
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18 }}>
        Paiement annulé. Retour vers PAKT...
      </p>
      <a href="pakt://payment/cancel" style={{ color: '#d4a853', marginTop: 16 }}>
        Retour à l'app
      </a>
    </div>
  )
}
