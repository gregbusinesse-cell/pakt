// app/page.tsx

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // ❌ pas connecté → login
  if (!session) {
    redirect('/auth')
  }

  // 🔥 sécurité : si profil pas encore créé
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_onboarded')
    .eq('id', session.user.id)
    .maybeSingle()

  // ❌ pas onboarded → onboarding
  if (!profile || !profile.is_onboarded) {
    redirect('/onboarding')
  }

  // ✅ sinon app normale
  redirect('/swipe')
}