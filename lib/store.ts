import { create } from 'zustand'
import type { Profile } from '@/lib/supabase/types'

interface AppState {
  user: { id: string; email: string } | null
  profile: Profile | null
  setUser: (user: { id: string; email: string } | null) => void
  setProfile: (profile: Profile | null) => void

  activeTab: 'swipe' | 'matches' | 'profile' | 'settings'
  setActiveTab: (tab: 'swipe' | 'matches' | 'profile' | 'settings') => void

  /** @deprecated — no longer used, swipes are unlimited */
  swipesLeft: number
  /** @deprecated — no longer used, swipes are unlimited */
  setSwipesLeft: (n: number) => void

  notificationsVersion: number
  refreshNotifications: () => void

  // Profile auto-save — shared between profile page and layout
  // isDirty: there are unsaved changes (covers both debounce window AND active save)
  // isSaveInProgress: doSave() is currently running an async save
  // pendingNavTarget: navigation target queued while save is in progress
  isDirty: boolean
  setDirty: (v: boolean) => void
  isSaveInProgress: boolean
  setSaveInProgress: (v: boolean) => void
  pendingNavTarget: string | null
  setPendingNavTarget: (t: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  profile: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),

  activeTab: 'swipe',
  setActiveTab: (tab) => set({ activeTab: tab }),

  swipesLeft: 10,
  setSwipesLeft: (n) => set({ swipesLeft: n }),

  notificationsVersion: 0,
  refreshNotifications: () =>
    set((state) => ({ notificationsVersion: state.notificationsVersion + 1 })),

  isDirty: false,
  setDirty: (v) => set({ isDirty: v }),
  isSaveInProgress: false,
  setSaveInProgress: (v) => set({ isSaveInProgress: v }),
  pendingNavTarget: null,
  setPendingNavTarget: (t) => set({ pendingNavTarget: t }),
}))