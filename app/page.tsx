// app/page.tsx
// Entry point - redirects based on auth state

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth')
  }

  // Check if onboarded
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_onboarded')
    .eq('id', session.user.id)
    .single()

  if (!profile?.is_onboarded) {
    redirect('/onboarding')
  }

  redirect('/swipe')
}
