'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Callback() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()

      if (data.session) {
        router.replace('/')
      } else {
        router.replace('/auth')
      }
    }

    getSession()
  }, [])

  return null
}