// lib/utils.ts

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export type PlanKey = 'free' | 'business' | 'business_pro'

export const limits: Record<PlanKey, { swipes: number; messages: number }> = {
  free: { swipes: 10, messages: 0 },
  business: { swipes: 20, messages: 1 },
  business_pro: { swipes: Infinity, messages: Infinity },
}

export function normalizePlan(plan: unknown): PlanKey {
  if (plan === 'business_pro' || plan === 'pro') return 'business_pro'
  if (plan === 'business' || plan === 'premium') return 'business'
  return 'free'
}

export function getTodayKey() {
  return new Date().toISOString().split('T')[0]
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'maintenant'
  if (diffMins < 60) return `${diffMins}min`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export const INTERESTS = [
  'Business',
  'Tech',
  'Finance',
  'Marketing',
  'Design',
  'Startups',
  'Investissement',
  'Coaching',
  'Networking',
  'Développement personnel',
  'E-commerce',
  'IA',
  'Immobilier',
  'Sport',
  'Art',
  'Musique',
  'Voyage',
  'Autre',
]

export const MAX_PHOTOS = 6