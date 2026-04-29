'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Callback() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const handleAuth = async () => {
      // récupère la session après redirect Google
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error(error)
        router.replace('/auth')
        return
      }

      if (data.session) {
        router.replace('/')
      } else {
        router.replace('/auth')
      }
    }

    handleAuth()
  }, [router, supabase])

  return <div>Connexion...</div>
}