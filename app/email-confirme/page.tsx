import { headers } from 'next/headers'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PAKT — Confirmation email',
}

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function EmailConfirmePage({ searchParams }: Props) {
  const { status = 'ok' } = await searchParams

  // Detect mobile via User-Agent
  const headersList = await headers()
  const ua = headersList.get('user-agent') || ''
  const isMobile = /iPhone|iPad|iPod|Android|Mobile/i.test(ua)

  type Config = { color: string; symbol: string; title: string; message: string; showOpenBtn: boolean }

  const configs: Record<string, Config> = {
    ok: {
      color: '#d4a853', symbol: '✓',
      title: 'Email confirmé !',
      message: 'Ton adresse email a bien été confirmée. Ton compte PAKT est maintenant actif.',
      showOpenBtn: true,
    },
    already: {
      color: '#d4a853', symbol: '✓',
      title: 'Déjà confirmé',
      message: 'Ton adresse email a déjà été confirmée.',
      showOpenBtn: true,
    },
    expired: {
      color: '#ff4444', symbol: '!',
      title: 'Lien expiré',
      message: 'Ce lien a expiré (validité 24h). Crée un nouveau compte depuis l\'application PAKT.',
      showOpenBtn: false,
    },
    error: {
      color: '#ff4444', symbol: '!',
      title: 'Lien invalide',
      message: 'Ce lien est invalide. Contacte-nous : paktsupport@gmail.com',
      showOpenBtn: false,
    },
  }

  const c = configs[status] ?? configs.error

  return (
    <div style={{
      margin: 0, padding: 0,
      background: '#0a0a0a',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: '#fff',
    }}>
      {/* Logo */}
      <div style={{
        fontSize: 30, fontWeight: 900, letterSpacing: 8,
        color: '#d4a853', marginBottom: 36, textAlign: 'center',
      }}>
        PAKT
      </div>

      {/* Card */}
      <div style={{
        background: '#161616',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20,
        padding: '36px 28px',
        maxWidth: 380,
        width: '100%',
        textAlign: 'center',
      }}>
        {/* Badge */}
        <div style={{
          width: 68, height: 68, borderRadius: '50%',
          background: c.color, color: '#000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, fontWeight: 900,
          margin: '0 auto 20px',
        }}>
          {c.symbol}
        </div>

        {/* Title */}
        <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800, marginBottom: 10, margin: '0 0 10px' }}>
          {c.title}
        </h1>

        {/* Message */}
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          {c.message}
        </p>

        {/* Action box */}
        <div style={{
          background: 'rgba(212,168,83,0.08)',
          border: '1px solid rgba(212,168,83,0.2)',
          borderRadius: 12, padding: '14px 16px', marginTop: 20,
        }}>
          {isMobile && c.showOpenBtn ? (
            <p style={{ color: '#d4a853', fontWeight: 600, fontSize: 13, margin: 0 }}>
              Appuie sur le bouton ci-dessous pour ouvrir l&apos;application et te connecter.
            </p>
          ) : c.showOpenBtn ? (
            <p style={{ color: '#d4a853', fontWeight: 600, fontSize: 13, margin: 0 }}>
              Ouvre l&apos;application <strong>PAKT</strong> sur ton téléphone et connecte-toi avec ton mot de passe.
            </p>
          ) : (
            <p style={{ color: '#d4a853', fontWeight: 600, fontSize: 13, margin: 0 }}>
              Retourne sur l&apos;application PAKT et recommence l&apos;inscription.
            </p>
          )}
        </div>

        {/* Button — only on mobile */}
        {isMobile && c.showOpenBtn && (
          <a
            href="pakt://auth"
            style={{
              display: 'inline-block', marginTop: 18,
              background: '#d4a853', color: '#000',
              fontWeight: 700, fontSize: 14, textDecoration: 'none',
              padding: '12px 28px', borderRadius: 10,
            }}
          >
            Ouvrir PAKT
          </a>
        )}
      </div>

      <footer style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11, marginTop: 24 }}>
        PAKT &copy; 2026
      </footer>
    </div>
  )
}
