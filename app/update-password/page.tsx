'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const handleRecovery = async () => {
      setErrorMessage('')

      try {
        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))
        const searchParams = new URLSearchParams(window.location.search)

        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const code = searchParams.get('code')

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) throw error

          window.history.replaceState(null, '', '/update-password')
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) throw error

          window.history.replaceState(null, '', '/update-password')
        }

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) throw error

        if (!session) {
          setErrorMessage('Lien invalide ou expiré. Veuillez refaire une demande de réinitialisation.')
          setReady(true)
          return
        }

        setReady(true)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Impossible de vérifier le lien de réinitialisation.'
        )
        setReady(true)
      }
    }

    handleRecovery()
  }, [router, supabase])

  const handleUpdate = async () => {
    if (!password || password.length < 6) {
      setErrorMessage('Mot de passe trop court. Minimum 6 caractères.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) throw sessionError

      if (!session) {
        setErrorMessage('Session expirée. Veuillez refaire une demande de réinitialisation.')
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) throw error

      await supabase.auth.signOut()

      alert('Mot de passe modifié')
      router.replace('/auth')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erreur lors de la modification.')
    } finally {
      setLoading(false)
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-white px-5">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-gold border-t-transparent animate-spin" />
          <p className="text-white/50 text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark text-white px-5">
      <div className="w-full max-w-md bg-dark-200 border border-dark-500 rounded-[12px] p-6 space-y-5">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>
          <p className="text-white/50 text-sm">
            Choisissez un nouveau mot de passe pour votre compte PAKT.
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-[12px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full bg-[#1e1e1e] border border-dark-500 text-white placeholder:text-white/30 rounded-[12px] p-4 outline-none focus:border-gold/60 transition-colors"
        />

        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="w-full bg-[#1e1e1e] border border-dark-500 text-white placeholder:text-white/30 rounded-[12px] p-4 outline-none focus:border-gold/60 transition-colors"
        />

        <button
          type="button"
          onClick={handleUpdate}
          disabled={loading}
          className="w-full bg-gold text-dark font-semibold py-4 rounded-[12px] hover:bg-gold-light transition-colors disabled:opacity-60"
        >
          {loading ? 'Modification...' : 'Modifier le mot de passe'}
        </button>

        <button
          type="button"
          onClick={() => router.replace('/auth')}
          disabled={loading}
          className="w-full border border-dark-500 bg-[#1e1e1e] text-white/70 font-semibold py-4 rounded-[12px] hover:text-white hover:border-dark-400 transition-colors disabled:opacity-60"
        >
          Retour connexion
        </button>
      </div>
    </div>
  )
}