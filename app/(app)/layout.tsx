'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
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
  const supabase = useMemo(() => createClient(), [])
  const db = supabase as any
  const router = useRouter()
  const pathname = usePathname()
  const { setProfile, notificationsVersion } = useAppStore()

  const [authLoading, setAuthLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [totalNotifications, setTotalNotifications] = useState(0)

  const isChatRoute = pathname?.startsWith('/chat')

  const refreshNotificationCount = useCallback(async () => {
    if (!userId) {
      setTotalNotifications(0)
      return
    }

    try {
      const [
        { count: unreadMatches, error: matchesError },
        { count: unreadLikes, error: likesError },
        { data: conversationsData, error: conversationsError },
      ] = await Promise.all([
        db
          .from('matches')
          .select('id', { count: 'exact', head: true })
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
          .eq('is_viewed', false),
        db
          .from('likes')
          .select('id', { count: 'exact', head: true })
          .eq('liked_id', userId)
          .eq('is_viewed', false),
        db
          .from('conversations')
          .select('id')
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
      ])

      if (matchesError) {
        console.error('[NAVBAR] unread matches count error', matchesError)
      }

      if (likesError) {
        console.error('[NAVBAR] unread likes count error', likesError)
      }

      if (conversationsError) {
        console.error('[NAVBAR] conversations select error', conversationsError)
      }

      const conversationIds = ((conversationsData || []) as { id: string }[]).map(
        (item) => item.id
      )

      let unreadMessages = 0

      if (conversationIds.length > 0) {
        const { count, error: messagesError } = await db
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .in('conversation_id', conversationIds)
          .neq('sender_id', userId)
          .eq('is_read', false)

        if (messagesError) {
          console.error('[NAVBAR] unread messages count error', messagesError)
        }

        unreadMessages = count || 0
      }

      const total = (unreadMatches || 0) + (unreadLikes || 0) + unreadMessages

      console.error('[NAVBAR] notification count refreshed', {
        userId,
        unreadMatches: unreadMatches || 0,
        unreadLikes: unreadLikes || 0,
        unreadMessages,
        total,
      })

      setTotalNotifications(total)
    } catch (error) {
      console.error('[NAVBAR] refreshNotificationCount catch', error)
      setTotalNotifications(0)
    }
  }, [db, userId])

  useEffect(() => {
    let mounted = true

    const loadProfile = async (nextUserId: string) => {
      const { data, error } = (await supabase
        .from('profiles')
        .select('*')
        .eq('id', nextUserId)
        .maybeSingle()) as unknown as { data: Profile | null; error: any }

      if (error) {
        console.error('[APP_LAYOUT] profile select error', error)
      }

      if (!mounted) return

      if (!data) {
        setProfile(null)
        setAuthLoading(false)
        router.replace('/onboarding')
        return
      }

      if (data.is_onboarded !== true) {
        setProfile(null)
        setAuthLoading(false)
        router.replace('/onboarding')
        return
      }

      setProfile(data)
      setAuthLoading(false)
    }

    const initAuth = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('[APP_LAYOUT] getSession error', sessionError)
      }

      if (!mounted) return

      if (!session?.user) {
        console.log('[APP_LAYOUT] no session in initAuth — waiting for auth state')
        setUserId(null)
        setProfile(null)
        setAuthLoading(false)
        // Don't redirect here — server-side page.tsx already handles this.
        // Redirecting here causes loops when cookies are being synced by middleware.
        return
      }

      setUserId(session.user.id)

      if (session.user.email_confirmed_at) {
        const { error: emailUpdateError } = await supabase
          .from('profiles')
          .update({ email_confirmed: true } as never)
          .eq('id', session.user.id)
          .neq('email_confirmed', true)

        if (emailUpdateError) {
          console.error('[APP_LAYOUT] email_confirmed update error', emailUpdateError)
        }
      }

      await loadProfile(session.user.id)
    }

    initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      console.log('[APP_LAYOUT] onAuthStateChange:', event, Boolean(session))

      // Only react to actual sign-out, not INITIAL_SESSION
      // The server-side page.tsx already handles redirect to /auth for unauthenticated users
      if (event === 'SIGNED_OUT') {
        setUserId(null)
        setProfile(null)
        setAuthLoading(false)
        router.replace('/auth')
        return
      }

      if (session?.user) {
        setUserId(session.user.id)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router, setProfile, supabase])

  useEffect(() => {
    if (!authLoading) refreshNotificationCount()
  }, [authLoading, refreshNotificationCount, notificationsVersion, pathname])

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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'likes' },
        () => refreshNotificationCount()
      )
      .subscribe((status) => {
        console.error('[NAVBAR] realtime status', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refreshNotificationCount, supabase, userId])

  if (authLoading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-dark text-white">
        <div className="w-10 h-10 rounded-full border-2 border-gold border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!userId) return null

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col bg-dark text-white">
      <main
        className={
          isChatRoute
            ? 'flex-1 min-h-0 overflow-hidden pb-[calc(env(safe-area-inset-bottom)+74px)]'
            : 'flex-1 min-h-0 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+86px)]'
        }
      >
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-dark-100/95 backdrop-blur-xl border-t border-dark-400 flex items-center justify-around pt-3 pb-[calc(env(safe-area-inset-bottom)+8px)]">
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
