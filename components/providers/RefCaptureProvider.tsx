'use client'

// components/providers/RefCaptureProvider.tsx
// Captures ?ref= parameter from URL and persists it in localStorage

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

const REF_STORAGE_KEY = 'pakt_ref'
const REF_TIMESTAMP_KEY = 'pakt_ref_ts'
const REF_EXPIRY_DAYS = 30

export function getStoredRef(): string | null {
  if (typeof window === 'undefined') return null

  const ref = localStorage.getItem(REF_STORAGE_KEY)
  const ts = localStorage.getItem(REF_TIMESTAMP_KEY)

  if (!ref || !ts) return null

  const age = Date.now() - parseInt(ts, 10)
  const maxAge = REF_EXPIRY_DAYS * 24 * 60 * 60 * 1000

  if (age > maxAge) {
    localStorage.removeItem(REF_STORAGE_KEY)
    localStorage.removeItem(REF_TIMESTAMP_KEY)
    return null
  }

  return ref
}

export function clearStoredRef() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(REF_STORAGE_KEY)
  localStorage.removeItem(REF_TIMESTAMP_KEY)
}

function RefCaptureInner() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (!ref || ref.length < 2 || ref.length > 50) return

    const sanitized = ref.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase()
    if (!sanitized) return

    localStorage.setItem(REF_STORAGE_KEY, sanitized)
    localStorage.setItem(REF_TIMESTAMP_KEY, Date.now().toString())
  }, [searchParams])

  return null
}

export default function RefCaptureProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RefCaptureInner />
      {children}
    </>
  )
}
