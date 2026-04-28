'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Home() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/auth')
        return
      }

      const { data: profile } = (await supabase
        .from('profiles')
        .select('is_onboarded')
        .eq('id', session.user.id)
        .maybeSingle()) as any

      // 👇 IMPORTANT : d'abord vérifier profile
      if (!profile) {
        await supabase.from('profiles').upsert({
          id: session.user.id,
          email: session.user.email,
          is_onboarded: false,
        } as never)

        router.replace('/onboarding')
        return
      }

      // 👇 ensuite vérifier onboarding
      if (!profile.is_onboarded) {
        router.replace('/onboarding')
        return
      }

      router.replace('/swipe')
    }

    checkAuth()
  }, [])

  return null
}