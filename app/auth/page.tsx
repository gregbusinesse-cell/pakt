'use client'
// app/auth/page.tsx

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Link from 'next/link'

declare global {
  interface Window {
    google?: any
  }
}

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)

  const googleButtonRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)

  const supabase = useMemo(() => createClient(), [])

  // Redirect on sign-in
  useEffect(() => {
    let redirecting = false

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AUTH] onAuthStateChange:', event, Boolean(session))

      if (session && !redirecting && event === 'SIGNED_IN') {
        redirecting = true
        console.log('[AUTH] redirecting to / after SIGNED_IN')
        window.location.href = '/'
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Callback for Google ID token
  const handleGoogleCredential = useCallback(
    async (response: any) => {
      try {
        console.log('[AUTH] Google credential received')

        if (!response?.credential) {
          throw new Error('Aucun token reçu de Google')
        }

        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
        })

        if (error) throw error

        console.log('[AUTH] signInWithIdToken success')
      } catch (err: any) {
        console.error('[AUTH] Google sign-in error:', err)
        toast.error(err?.message || 'Erreur de connexion Google')
      }
    },
    [supabase]
  )

  // Initialize Google Identity Services (called when GIS script is loaded)
  const initializeGoogle = useCallback(() => {
    if (initializedRef.current) return

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
      console.error('[AUTH] NEXT_PUBLIC_GOOGLE_CLIENT_ID manquant — verifier les variables Vercel')
      return
    }

    if (typeof window === 'undefined' || !window.google?.accounts?.id) {
      console.warn('[AUTH] Google Identity Services pas encore chargé')
      return
    }

    console.log('[AUTH] Initializing Google Identity Services')

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
    })

    // Render the official Google button INVISIBLE on top of our custom button
    // (clicks go to this button, which opens the Google popup with PAKT branding)
    if (googleButtonRef.current) {
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'left',
        width: 320,
      })
    }

    // Auto-trigger One Tap on page load (small dialog top-right)
    window.google.accounts.id.prompt((notification: any) => {
      if (notification?.isNotDisplayed?.()) {
        console.log('[AUTH] One Tap not displayed:', notification.getNotDisplayedReason?.())
      }
    })

    initializedRef.current = true
    setGoogleReady(true)
    console.log('[AUTH] Google ready')
  }, [handleGoogleCredential])

  // Try initializing on mount if script is already loaded (e.g., back navigation)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      initializeGoogle()
    }
  }, [initializeGoogle])

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        toast.success('Compte créé ! Vérifie ton email.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err: any) {
      toast.error(err?.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Load Google Identity Services */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('[AUTH] GIS script loaded')
          initializeGoogle()
        }}
      />

      <div className="app-height flex flex-col items-center justify-center bg-dark px-6 pt-16 overflow-y-auto">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gold/5 blur-[100px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-gold/3 blur-[80px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm relative z-10"
        >
          <div className="text-center mb-10">
            <h1 className="text-5xl font-black tracking-widest text-gold-gradient mb-2">PAKT</h1>
            <p className="text-white/40 text-sm tracking-wider">Le Tinder du Business</p>
          </div>

          <div className="flex bg-dark-200 rounded-2xl p-1 mb-6">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${
                  mode === m ? 'bg-gold text-dark' : 'text-white/50 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pakt-input"
              required
            />

            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pakt-input"
              required
              minLength={6}
            />

            <button type="submit" disabled={loading} className="btn-primary mt-2">
              {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-dark-400" />
            <span className="text-white/30 text-xs uppercase">ou</span>
            <div className="flex-1 h-px bg-dark-400" />
          </div>

          {/* Custom Google button — visually styled like PAKT, but Google's official button
              is rendered INVISIBLE on top (opacity 0.0001) to capture clicks.
              Clicks naturally go to Google's button which opens popup with PAKT branding. */}
          <div className="relative w-full">
            {/* Visual custom button (no functionality, just for display) */}
            <div
              className="w-full flex items-center justify-center gap-3 bg-dark-200 border border-dark-400 rounded-2xl py-4 text-white pointer-events-none select-none"
              aria-hidden="true"
            >
              <GoogleIcon />
              Continuer avec Google
            </div>

            {/* Invisible but clickable Google official button overlay */}
            <div
              ref={googleButtonRef}
              className="absolute inset-0 flex items-center justify-center [&>div]:!w-full [&>div]:!h-full [&_iframe]:!w-full [&_iframe]:!h-full"
              style={{
                opacity: 0.0001, // Almost invisible but still clickable
              }}
            />

            {/* Loading state if Google not ready */}
            {!googleReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-dark-200 rounded-2xl">
                <span className="text-white/40 text-sm">Chargement Google...</span>
              </div>
            )}
          </div>

          <p className="text-center text-white/30 text-xs mt-8">
            En continuant, tu acceptes nos{' '}
            <Link href="/legal/cgu" className="text-gold/60 underline">
              CGU
            </Link>
          </p>
        </motion.div>
      </div>
    </>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path
        fill="#4285F4"
        d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"
      />
      <path
        fill="#34A853"
        d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"
      />
      <path
        fill="#FBBC05"
        d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"
      />
      <path
        fill="#EA4335"
        d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"
      />
    </svg>
  )
}
