'use client'

// components/providers/SupabaseProvider.tsx

import { useState } from 'react'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { createClient } from '@/lib/supabase/client'

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabaseClient] = useState(() => createClient())

  return (
    <SessionContextProvider supabaseClient={supabaseClient as any}>
      {children}
    </SessionContextProvider>
  )
}