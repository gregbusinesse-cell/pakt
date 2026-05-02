import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export const runtime = 'nodejs'

const SITE_URL = 'https://pakt-sigma.vercel.app'
const TOKEN_DURATION_MS = 1000 * 60 * 30

function createDeleteToken(userId: string, email: string) {
  const expiresAt = Date.now() + TOKEN_DURATION_MS
  const payload = `${userId}.${email}.${expiresAt}`
  const signature = crypto
    .createHmac('sha256', process.env.DELETE_ACCOUNT_SECRET!)
    .update(payload)
    .digest('hex')

  return Buffer.from(
    JSON.stringify({
      userId,
      email,
      expiresAt,
      signature,
    })
  ).toString('base64url')
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '').trim()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user?.email) {
      return NextResponse.json({ error: 'Utilisateur invalide' }, { status: 401 })
    }

    const deleteToken = createDeleteToken(user.id, user.email)
    const deleteUrl = `${SITE_URL}/delete-account?token=${deleteToken}`

    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'PAKT',
          email: process.env.BREVO_FROM_EMAIL!,
        },
        to: [
          {
            email: user.email,
          },
        ],
        subject: 'Confirmation de suppression de votre compte PAKT',
        htmlContent: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
            <h2>Confirmer la suppression de votre compte PAKT</h2>
            <p>Vous avez demandé la suppression définitive de votre compte.</p>
            <p>Cette action est irréversible.</p>
            <p>
              <a href="${deleteUrl}" style="display:inline-block;background:#d4a853;color:#0a0a0a;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold">
                Supprimer définitivement mon compte
              </a>
            </p>
            <p>Ce lien expire dans 30 minutes.</p>
            <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
          </div>
        `,
      }),
    })

    if (!brevoResponse.ok) {
      const errorText = await brevoResponse.text()
      console.error('Brevo error:', errorText)

      return NextResponse.json(
        { error: "Impossible d'envoyer l'email" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete account request error:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}