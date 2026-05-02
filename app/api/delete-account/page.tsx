'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeleteAccountPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const deleteAccount = async () => {
      const token = searchParams.get('token')

      if (!token) {
        setErrorMessage('Lien invalide.')
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/delete-user-final', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Erreur lors de la suppression')
        }

        await supabase.auth.signOut()
        setSuccess(true)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    deleteAccount()
  }, [searchParams, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark text-white px-5">
      <div className="w-full max-w-md bg-dark-200 border border-dark-500 rounded-[12px] p-6 space-y-5 text-center">
        {loading ? (
          <>
            <div className="mx-auto w-12 h-12 rounded-full border-2 border-gold border-t-transparent animate-spin" />
            <h1 className="text-xl font-bold">Suppression du compte...</h1>
          </>
        ) : success ? (
          <>
            <h1 className="text-2xl font-bold">Compte supprimé</h1>
            <p className="text-white/60 text-sm">
              Votre compte PAKT a été supprimé définitivement.
            </p>
            <button
              type="button"
              onClick={() => router.replace('/auth')}
              className="w-full bg-gold text-dark font-semibold py-4 rounded-[12px]"
            >
              Retour connexion
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Suppression impossible</h1>
            <p className="text-red-200 text-sm">{errorMessage}</p>
            <button
              type="button"
              onClick={() => router.replace('/profile')}
              className="w-full bg-gold text-dark font-semibold py-4 rounded-[12px]"
            >
              Retour profil
            </button>
          </>
        )}
      </div>
    </div>
  )
}