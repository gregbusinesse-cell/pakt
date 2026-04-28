// app/page.tsx
// Entry point - redirects based on auth state

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type ProfileRow = { is_onboarded: boolean } | null

export default async function Home() {
  const supabase = createServerClient() as any

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/auth')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('is_onboarded')
    .eq('id', session.user.id)
    .maybeSingle()

  const profile = profileData as ProfileRow

  // si pas de profile: onboarding (et on crée un row minimal best-effort)
  if (!profile) {
    await supabase.from('profiles').upsert(
      {
        id: session.user.id,
        email: session.user.email,
        is_onboarded: false,
      } as never
    )
    redirect('/onboarding')
  }

  if (!profile.is_onboarded) redirect('/onboarding')

  redirect('/swipe')
}