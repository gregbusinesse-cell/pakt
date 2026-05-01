'use client'

// app/(app)/layout.tsx

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@supabase/auth-helpers-react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Flame, MessageCircle, User } from 'lucide-react'
import type { Profile } from '@/lib/supabase/types'

const NAV_ITEMS = [
  { href: '/swipe', icon: Flame, label: 'Découvrir' },
  { href: '/matches', icon: MessageCircle, label: 'Messages' },
  { href: '/profile', icon: User, label: 'Profil' },
  { href: '/settings', icon: null, label: 'PAKT' },
]

export default function AppLayout({ children }: { children: ReactNode }) {
  const session = useSession()
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const pathname = usePathname()
  const { setProfile } = useAppStore()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!session?.user) return

    const syncEmail = async () => {
      if (!session.user.email_confirmed_at) return

      await supabase
        .from('profiles')
        .update({ email_confirmed: true } as never)
        .eq('id', session.user.id)
    }

    syncEmail()
  }, [session, supabase])

  useEffect(() => {
    if (!session) {
      router.push('/auth')
      return
    }

    const loadProfile = async () => {
      const { data } = (await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()) as unknown as { data: Profile | null }

      if (!data) return

      if (!data.is_onboarded) {
        router.push('/onboarding')
        return
      }

      setProfile(data)
    }

    loadProfile()

    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=neq.${session.user.id}`,
        },
        () => {
          setUnreadCount((prev) => prev + 1)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [session, router, setProfile, supabase])

  if (!session) return null

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 overflow-y-auto">{children}</div>

      <nav className="bottom-nav bg-dark-100/95 backdrop-blur-xl border-t border-dark-400 flex items-center justify-around pt-3 shrink-0">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          const showBadge = href === '/matches' && unreadCount > 0

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              onClick={() => setUnreadCount(0)}
              className={`flex flex-col items-center gap-1 px-5 py-1 rounded-xl transition-all duration-200 relative ${
                isActive ? 'text-gold' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <div className="relative h-[22px] flex items-center justify-center">
                {Icon ? (
                  <>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                    {showBadge && (
                      <span className="badge text-[10px] w-4 h-4">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="text-[10px] font-bold tracking-widest text-gold">
                    PAKT
                  </div>
                )}
              </div>

              {isActive ? (
                <motion.div layoutId="nav-indicator" className="w-1 h-1 rounded-full bg-gold" />
              ) : (
                <div className="w-1 h-1" />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}