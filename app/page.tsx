// app/page.tsx
// Entry point - redirects based on auth state

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type OnboardingProfile = {
  is_onboarded: boolean
}

export default async function Home() {
  const supabase = createServerClient() as any

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth')
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('is_onboarded')
    .eq('id', session.user.id)
    .single()

  const profile = profileData as OnboardingProfile | null

  if (!profile || !profile.is_onboarded) {
    redirect('/onboarding')
  }

  redirect('/swipe')
}