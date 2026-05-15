// lib/utils.ts

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export type PlanKey = 'free' | 'business' | 'business_pro'

/** @deprecated — swipe/like limits removed. Free = unlimited swipes & likes, no messaging. */
export const limits: Record<PlanKey, { swipes: number; messages: number; likes: number }> = {
  free: { swipes: Infinity, messages: 0, likes: Infinity },
  business: { swipes: Infinity, messages: Infinity, likes: Infinity },
  business_pro: { swipes: Infinity, messages: Infinity, likes: Infinity },
}

export function normalizePlan(plan: unknown): PlanKey {
  if (plan === 'business_pro' || plan === 'pro') return 'business_pro'
  if (plan === 'business' || plan === 'premium') return 'business'
  return 'free'
}

/** Returns true if the plan grants messaging access (Business or Business Pro). */
export function isPaidPlan(plan: unknown): boolean {
  const p = normalizePlan(plan)
  return p === 'business' || p === 'business_pro'
}

/**
 * Returns true if BOTH users can chat together.
 * Messaging requires both users to have at least Business.
 */
export function canChat(myPlan: unknown, otherPlan: unknown): boolean {
  return isPaidPlan(myPlan) && isPaidPlan(otherPlan)
}

export function getTodayKey() {
  return new Date().toISOString().split('T')[0]
}

// ─── Photo validation ──────────────────────────────────────────────
export const PHOTO_MIN_WIDTH = 400
export const PHOTO_MIN_HEIGHT = 400
export const PHOTO_MIN_SIZE_KB = 30
export const PHOTO_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

export interface PhotoValidationResult {
  valid: boolean
  reason?: string
}

/**
 * Validates an image file before upload.
 * Checks: format, minimum file size, minimum dimensions.
 */
export function validatePhoto(file: File): Promise<PhotoValidationResult> {
  return new Promise((resolve) => {
    // Check format
    if (!PHOTO_ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(jpe?g|png|webp|heic|heif)$/i)) {
      resolve({
        valid: false,
        reason: 'Format non supporté. Utilise un fichier JPG, PNG ou WebP.',
      })
      return
    }

    // Check minimum file size (very small files = likely corrupt or thumbnail)
    if (file.size < PHOTO_MIN_SIZE_KB * 1024) {
      resolve({
        valid: false,
        reason: `Cette photo est trop légère (${formatFileSize(file.size)}). Utilise une photo de meilleure qualité pour un rendu optimal.`,
      })
      return
    }

    // Check dimensions via Image object
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(url)

      if (img.naturalWidth < PHOTO_MIN_WIDTH || img.naturalHeight < PHOTO_MIN_HEIGHT) {
        resolve({
          valid: false,
          reason: `Cette photo est trop petite (${img.naturalWidth}×${img.naturalHeight}px). Pour un rendu net, utilise une photo d'au moins ${PHOTO_MIN_WIDTH}×${PHOTO_MIN_HEIGHT}px.`,
        })
        return
      }

      resolve({ valid: true })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({
        valid: false,
        reason: 'Impossible de lire cette image. Le fichier est peut-être corrompu.',
      })
    }

    img.src = url
  })
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

export const SKILLS_LIST = [
  'Marketing',
  'Vente / Closing',
  'Copywriting',
  'IA / Automation',
  'Développement Web',
  'Stratégie digitale',
  'Réseaux sociaux',
  'Montage vidéo',
  'Ads / Acquisition',
  'SEO / Growth',
]

export interface UserSkill {
  name: string
  level: number // 1-10
  comment?: string
}

export interface SkillFilter {
  name: string
  min_level: number // 1-10
}

export function parseSkills(value: unknown): UserSkill[] {
  try {
    const arr = Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? JSON.parse(value || '[]')
        : []
    if (!Array.isArray(arr)) return []
    return arr.filter(
      (s: any) =>
        typeof s === 'object' &&
        s !== null &&
        typeof s.name === 'string' &&
        s.name.trim().length > 0 &&
        typeof s.level === 'number' &&
        s.level >= 0 &&
        s.level <= 10
    ).map((s: any) => ({
      name: s.name.trim(),
      level: Math.round(s.level),
      ...(typeof s.comment === 'string' && s.comment.trim() ? { comment: s.comment.trim() } : {}),
    }))
  } catch {
    return []
  }
}

export const MAX_PHOTOS = 6