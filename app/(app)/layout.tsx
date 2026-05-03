'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@supabase/auth-helpers-react'
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
  const db = supabase as any
  const router = useRouter()
  const pathname = usePathname()
  const { setProfile, notificationsVersion } = useAppStore()
  const [totalNotifications, setTotalNotifications] = useState(0)

  const userId = session?.user?.id

  const refreshNotificationCount = useCallback(async () => {
    if (!userId) {
      setTotalNotifications(0)
      return
    }

    const { count: unreadMatches } = await db
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('is_viewed', false)

    const { data: conversationsData } = await db
      .from('conversations')
      .select('id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

    const conversationIds = ((conversationsData || []) as { id: string }[]).map((item) => item.id)

    let unreadMessages = 0

    if (conversationIds.length > 0) {
      const { count } = await db
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .neq('sender_id', userId)
        .eq('is_read', false)

      unreadMessages = count || 0
    }

    setTotalNotifications((unreadMatches || 0) + unreadMessages)
  }, [db, userId])

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
  }, [session, router, setProfile, supabase])

  useEffect(() => {
    refreshNotificationCount()
  }, [refreshNotificationCount, notificationsVersion])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`navbar-notifications-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => refreshNotificationCount()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => refreshNotificationCount()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refreshNotificationCount, supabase, userId])

  if (!session) return null

  return (
    <div className="flex flex-col min-h-screen bg-dark text-white">
      <main className="flex-1 pb-[100px]">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-dark-100/95 backdrop-blur-xl border-t border-dark-400 flex items-center justify-around pt-3 pb-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          const showBadge = href === '/matches' && totalNotifications > 0

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={`flex flex-col items-center gap-1 px-5 py-1 rounded-xl ${
                isActive ? 'text-gold' : 'text-white/40'
              }`}
            >
              <div className="relative h-[22px] flex items-center justify-center">
                {Icon ? (
                  <>
                    <Icon size={22} />
                    {showBadge && (
                      <span className="absolute -top-2 -right-3 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-dark-100">
                        {totalNotifications > 9 ? '9+' : totalNotifications}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="text-[10px] font-bold text-gold">PAKT</div>
                )}
              </div>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}