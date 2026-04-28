// app/auth/callback/route.ts

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/supabase/types'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  const supabase = createRouteHandlerClient<Database>({ cookies })

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth`)
    }
  }

  // ⚠️ IMPORTANT: forcer un refresh complet
  return NextResponse.redirect(`${requestUrl.origin}/`)
}