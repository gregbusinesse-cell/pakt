// lib/store.ts
// Global state management with Zustand

import { create } from 'zustand'
import type { Profile } from '@/lib/supabase/types'

interface AppState {
  // Auth
  user: { id: string; email: string } | null
  profile: Profile | null
  setUser: (user: { id: string; email: string } | null) => void
  setProfile: (profile: Profile | null) => void

  // UI
  activeTab: 'swipe' | 'matches' | 'profile' | 'settings'
  setActiveTab: (tab: 'swipe' | 'matches' | 'profile' | 'settings') => void

  // Swipe
  swipesLeft: number
  setSwipesLeft: (n: number) => void
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
}))
