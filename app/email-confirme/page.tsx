// Simple static page — no client JS, no hooks, no build issues
// Shown after email confirmation (success or error)

export const dynamic = 'force-static'

interface Props {
  searchParams: { [key: string]: string | undefined }
}

export default function EmailConfirmePage({ searchParams }: Props) {
  const status = searchParams.status || 'ok'

  const configs: Record<string, { color: string; symbol: string; title: string; message: string }> = {
    ok: {
      color: '#d4a853',
      symbol: '✓',
      title: 'Email confirmé !',
      message: 'Ton adresse email a bien été confirmée. Ton compte PAKT est maintenant actif.',
    },
    already: {
      color: '#d4a853',
      symbol: '✓',
      title: 'Déjà confirmé',
      message: 'Ton adresse email a déjà été confirmée.',
    },
    expired: {
      color: '#ff4444',
      symbol: '!',
      title: 'Lien expiré',
      message: 'Ce lien a expiré (validité 24h). Crée un nouveau compte depuis l\'application PAKT.',
    },
    error: {
      color: '#ff4444',
      symbol: '!',
      title: 'Lien invalide',
      message: 'Ce lien de confirmation est invalide. Contacte le support : paktsupport@gmail.com',
    },
  }

  const c = configs[status] ?? configs.error

  return (
    <html lang="fr">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>PAKT</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background: #0a0a0a;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 24px;
            color: #fff;
          }
          .logo {
            font-size: 32px;
            font-weight: 900;
            letter-spacing: 8px;
            color: #d4a853;
            margin-bottom: 40px;
          }
          .card {
            background: #161616;
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 20px;
            padding: 40px 32px;
            max-width: 400px;
            width: 100%;
            text-align: center;
          }
          .badge {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            background: ${c.color};
            color: #000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            font-weight: 900;
            margin: 0 auto 24px;
          }
          h1 { font-size: 20px; font-weight: 800; margin-bottom: 12px; }
          p { color: rgba(255,255,255,0.5); font-size: 14px; line-height: 1.7; }
          .notice {
            background: rgba(212,168,83,0.08);
            border: 1px solid rgba(212,168,83,0.2);
            border-radius: 12px;
            padding: 16px 18px;
            margin-top: 24px;
          }
          .notice p { color: #d4a853; font-weight: 600; font-size: 13px; }
          .btn {
            display: inline-block;
            background: #d4a853;
            color: #000;
            font-weight: 700;
            font-size: 15px;
            text-decoration: none;
            padding: 13px 32px;
            border-radius: 12px;
            margin-top: 20px;
          }
          footer { color: rgba(255,255,255,0.18); font-size: 11px; margin-top: 28px; }
        `}</style>
      </head>
      <body>
        <div className="logo">PAKT</div>
        <div className="card">
          <div className="badge">{c.symbol}</div>
          <h1>{c.title}</h1>
          <p>{c.message}</p>
          {(status === 'ok' || status === 'already') && (
            <>
              <div className="notice">
                <p>Retourne sur l&apos;application mobile PAKT et connecte-toi avec ton mot de passe.</p>
              </div>
              <a className="btn" href="pakt://auth">Ouvrir PAKT</a>
            </>
          )}
        </div>
        <footer>PAKT &copy; 2026</footer>
      </body>
    </html>
  )
}
