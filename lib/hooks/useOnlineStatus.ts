import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@supabase/auth-helpers-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * Hook to track and update user's online status
 * Updates last_active_at every 30 seconds while on the current page
 * and subscribes to realtime updates for the target user
 */
export function useOnlineStatus(targetUserId: string | null) {
  const supabase = createClient()
  const session = useSession()
  const [isOnline, setIsOnline] = useState(false)
  const [lastSeen, setLastSeen] = useState<Date | null>(null)
  const [statusText, setStatusText] = useState<string>('Chargement...')

  // Format status text: "Connecté" or "Hors ligne il y a X jours"
  const formatStatus = useCallback((date: Date | null, online: boolean) => {
    if (!date) return 'Statut inconnu'
    if (online) return 'Connecté'

    try {
      const distance = formatDistanceToNow(date, {
        locale: fr,
        addSuffix: false,
      })
      return `Hors ligne il y a ${distance}`
    } catch {
      return 'Statut inconnu'
    }
  }, [])

  // Update current user's last_active_at
  const updateMyActivity = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      const now = new Date().toISOString()
      await supabase
        .from('profiles')
        .update({ last_active_at: now })
        .eq('id', session.user.id)
    } catch (error) {
      console.error('[ONLINE_STATUS] Failed to update activity:', error)
    }
  }, [supabase, session?.user?.id])

  // Check if a user is online (was active in last 5 minutes)
  const checkOnlineStatus = useCallback(async () => {
    if (!targetUserId) {
      setIsOnline(false)
      return
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('last_active_at')
        .eq('id', targetUserId)
        .single()

      if (error || !profile?.last_active_at) {
        setIsOnline(false)
        setLastSeen(null)
        return
      }

      const lastActiveDate = new Date(profile.last_active_at)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      const online = lastActiveDate > fiveMinutesAgo

      setIsOnline(online)
      setLastSeen(lastActiveDate)
      setStatusText(formatStatus(lastActiveDate, online))
    } catch (error) {
      console.error('[ONLINE_STATUS] Failed to check online status:', error)
      setIsOnline(false)
    }
  }, [supabase, targetUserId, formatStatus])

  // Update my activity every 30 seconds
  useEffect(() => {
    updateMyActivity()
    const interval = setInterval(updateMyActivity, 30000)
    return () => clearInterval(interval)
  }, [updateMyActivity])

  // Check target user's online status on mount and when targetUserId changes
  useEffect(() => {
    checkOnlineStatus()
  }, [targetUserId, checkOnlineStatus])

  // Subscribe to realtime updates on target user's profile
  useEffect(() => {
    if (!targetUserId) return

    const channel = supabase
      .channel(`profile:${targetUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${targetUserId}`,
        },
        (payload) => {
          if (payload.new?.last_active_at) {
            const lastActiveDate = new Date(payload.new.last_active_at)
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
            const online = lastActiveDate > fiveMinutesAgo

            setIsOnline(online)
            setLastSeen(lastActiveDate)
            setStatusText(formatStatus(lastActiveDate, online))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, targetUserId, formatStatus])

  return {
    isOnline,
    lastSeen,
    statusText,
  }
}
