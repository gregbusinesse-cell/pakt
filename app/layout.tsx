// app/layout.tsx

import type { Metadata, Viewport } from 'next'
import { Sora } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import SupabaseProvider from '@/components/providers/SupabaseProvider'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'PAKT – Connecte les ambitieux',
  description: 'La plateforme de mise en relation entre personnes ambitieuses.',
  manifest: '/manifest.json',
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
  return (
    <html lang="fr" className={`${sora.variable} dark`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-dark text-white antialiased overflow-hidden h-[100dvh]">
        <SupabaseProvider>
          {children}
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