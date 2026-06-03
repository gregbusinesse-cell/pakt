'use client'
import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import type { Metadata } from 'next'

export default function ReferPage() {
  const params = useParams()
  const code = params?.code as string

  useEffect(() => {
    // On mobile → open the app directly
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile) {
      window.location.href = `pakt://signup?ref=${code}`
    }
  }, [code])

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 8, color: '#d4a853', marginBottom: 40 }}>PAKT</div>
      <div style={{
        background: '#161616', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20, padding: '36px 28px', maxWidth: 380, width: '100%', textAlign: 'center',
      }}>
        <div style={{
          width: 68, height: 68, borderRadius: 34, background: '#d4a853',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, margin: '0 auto 20px', color: '#000', fontWeight: 900,
        }}>🚀</div>
        <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 0 10px' }}>
          Tu as été invité sur PAKT
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7, margin: '0 0 24px' }}>
          PAKT est l'application de networking business. Crée ton compte et entre le code de parrainage lors de l'inscription.
        </p>
        <div style={{
          background: 'rgba(212,168,83,0.08)', border: '1px solid rgba(212,168,83,0.2)',
          borderRadius: 12, padding: '14px 18px', marginBottom: 20,
        }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '0 0 6px' }}>Code de parrainage</p>
          <p style={{ color: '#d4a853', fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: 1 }}>{code}</p>
        </div>
        <a href={`pakt://signup?ref=${code}`} style={{
          display: 'block', background: '#d4a853', color: '#000',
          fontWeight: 700, fontSize: 15, textDecoration: 'none',
          padding: '13px 28px', borderRadius: 10, marginBottom: 12,
        }}>
          Ouvrir PAKT
        </a>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, margin: 0 }}>
          Si PAKT n'est pas installé, télécharge-le sur le Play Store ou l'App Store.
        </p>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11, marginTop: 24 }}>PAKT © 2026</p>
    </div>
  )
}
