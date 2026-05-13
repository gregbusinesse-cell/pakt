// app/auth/callback/route.ts
// Server-side OAuth callback — exchanges PKCE code for session and sets cookies

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  console.log('[AUTH_CALLBACK] code present:', Boolean(code))

  if (code) {
    const cookieStore = cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[AUTH_CALLBACK] exchangeCodeForSession error:', error.message)
      return NextResponse.redirect(`${origin}/auth?error=callback_failed`)
    }

    console.log('[AUTH_CALLBACK] session exchanged successfully')
  }

  // Redirect to root — server-side page.tsx will route to onboarding or swipe
  return NextResponse.redirect(`${origin}/`)
}
