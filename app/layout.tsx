// app/layout.tsx

import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Sora } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import SupabaseProvider from '@/components/providers/SupabaseProvider'
import RefCaptureProvider from '@/components/providers/RefCaptureProvider'
import CookieBanner from '@/components/legal/CookieBanner'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'PAKT – Le Tinder du Business',
  description: 'La plateforme de mise en relation entre personnes ambitieuses.',
  manifest: '/manifest.json',

  icons: {
    icon: '/favicon-v2.ico',
    shortcut: '/favicon-v2.ico',
    apple: '/favicon-v2.ico',
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PAKT',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  return (
    <html lang="fr" className={`${sora.variable} dark`}>
      <body className="bg-dark text-white antialiased">
        {googleMapsKey && (
          <Script
            id="google-places-script"
            src={`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
              googleMapsKey
            )}&libraries=places&language=fr&region=FR&v=weekly`}
            strategy="afterInteractive"
          />
        )}

        <SupabaseProvider>
          <Suspense fallback={null}>
            <RefCaptureProvider>{children}</RefCaptureProvider>
          </Suspense>

          <CookieBanner />

          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid #2e2e2e',
                borderRadius: '12px',
                fontFamily: 'var(--font-sora)',
              },
              success: {
                iconTheme: { primary: '#d4a853', secondary: '#0a0a0a' },
              },
            }}
          />
        </SupabaseProvider>
      </body>
    </html>
  )
}