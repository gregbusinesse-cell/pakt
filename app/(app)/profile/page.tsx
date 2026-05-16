'use client'

// app/(app)/profile/page.tsx
// User profile page with auto-save editing

import { useState, useCallback, useEffect, useMemo, useRef, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@supabase/auth-helpers-react'
import { useAppStore } from '@/lib/store'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { INTERESTS, MAX_PHOTOS, SKILLS_LIST, validatePhoto, parseSkills, type UserSkill, type SkillFilter } from '@/lib/utils'
import { Check, X, Plus, LogOut, Crown } from 'lucide-react'

import { useRouter, useSearchParams } from 'next/navigation'
import SwipeCard from '@/components/swipe/SwipeCard'
import SkillPicker from '@/components/skills/SkillPicker'
import { AnimatePresence, motion } from 'framer-motion'
import type { Database, Profile } from '@/lib/supabase/types'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

declare global {
  interface Window {
    google?: any
  }
}

let googlePlacesPromise: Promise<void> | null = null

function waitForGooglePlaces(timeoutMs = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now()

    const check = () => {
      if (window.google?.maps?.places?.Autocomplete) {
        resolve()
        return
      }

      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error('Google Places API non disponible apres chargement'))
        return
      }

      window.setTimeout(check, 100)
    }

    check()
  })
}

function loadGooglePlacesScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()

  if (window.google?.maps?.places?.Autocomplete) {
    return Promise.resolve()
  }

  if (googlePlacesPromise) {
    return googlePlacesPromise
  }

  googlePlacesPromise = new Promise((resolve, reject) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      reject(new Error('Cle Google Maps manquante'))
      return
    }

    const existingScript = document.getElementById('google-places-script') as HTMLScriptElement | null

    if (existingScript) {
      waitForGooglePlaces().then(resolve).catch(reject)
      return
    }

    const script = document.createElement('script')
    script.id = 'google-places-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=places&language=fr`
    script.async = true
    script.defer = true

    script.onload = () => {
      waitForGooglePlaces().then(resolve).catch(reject)
    }

    script.onerror = () => {
      reject(new Error('Impossible de charger Google Maps'))
    }

    document.head.appendChild(script)
  })

  return googlePlacesPromise
}

type PhotoItem =
  | { type: 'existing'; url: string }
  | { type: 'new'; url: string; file: File }

type Preferences = {
  distance_km: number
  age_min: number
  age_max: number
  skill_filters?: SkillFilter[]
}

const LOCKED_PREFERENCES: Preferences = {
  distance_km: 1000,
  age_min: 18,
  age_max: 99,
  skill_filters: [],
}

function normalizePlan(plan: unknown) {
  if (plan === 'business_pro' || plan === 'pro') return 'business_pro'
  if (plan === 'business' || plan === 'premium') return 'business'
  return 'free'
}

type ProfileForm = {
  first_name: string
  age: string
  bio: string
  city: string
  interests: string[]
  skills: UserSkill[]
}

function cleanPhotoUrls(photos: unknown): string[] {
  const cleaned = (() => {
    if (Array.isArray(photos)) return photos

    if (typeof photos === 'string') {
      try {
        const parsed = JSON.parse(photos)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }

    return []
  })()

  return cleaned
    .filter((photo): photo is string => typeof photo === 'string' && photo.trim().length > 0)
    .map((photo) => photo.trim())
}

function normalizePhotos(photos: unknown): string[] {
  return cleanPhotoUrls(photos)
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getInitialPreferences(pref: unknown): Preferences {
  const base: Preferences = { distance_km: 50, age_min: 18, age_max: 30 }

  if (!pref || typeof pref !== 'object') return base

  const data = pref as Partial<Record<keyof Preferences, unknown>>

  const distanceKm =
    typeof data.distance_km === 'number' && Number.isFinite(data.distance_km)
      ? clampNumber(data.distance_km, 0, 1000)
      : base.distance_km

  const ageMin =
    typeof data.age_min === 'number' && Number.isFinite(data.age_min)
      ? clampNumber(data.age_min, 18, 99)
      : base.age_min

  const ageMax =
    typeof data.age_max === 'number' && Number.isFinite(data.age_max)
      ? clampNumber(data.age_max, 18, 99)
      : base.age_max

  const skillFilters: SkillFilter[] = (() => {
    const raw = (pref as any)?.skill_filters
    if (!Array.isArray(raw)) return []
    return raw.filter(
      (f: any) =>
        typeof f === 'object' && f !== null &&
        typeof f.name === 'string' && f.name.trim() &&
        typeof f.min_level === 'number' && f.min_level >= 1 && f.min_level <= 10
    ).map((f: any) => ({ name: f.name.trim(), min_level: Math.round(f.min_level) }))
  })()

  return {
    distance_km: distanceKm,
    age_min: Math.min(ageMin, ageMax),
    age_max: Math.max(ageMin, ageMax),
    skill_filters: skillFilters,
  }
}

function ConfirmModal(props: {
  open: boolean
  title: string
  body: string
  question: string
  cancelText?: string
  confirmText: string
  confirmVariant?: 'danger' | 'neutral'
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const {
    open,
    title,
    body,
    question,
    cancelText = 'Annuler',
    confirmText,
    confirmVariant = 'neutral',
    loading = false,
    onCancel,
    onConfirm,
  } = props

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="absolute inset-0 flex items-center justify-center px-5">
        <div className="w-full max-w-md bg-dark-200 border border-dark-500 rounded-[12px] p-5">
          <h3 className="text-white font-semibold text-lg">{title}</h3>
          <p className="text-white/60 text-sm mt-2 leading-relaxed">{body}</p>
          <p className="text-white/70 text-sm mt-3">{question}</p>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 rounded-[12px] border border-dark-500 bg-[#1e1e1e] text-sm text-white/70 hover:text-white hover:border-dark-400 transition-colors disabled:opacity-60"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 rounded-[12px] text-sm font-semibold transition-colors disabled:opacity-60 ${
                confirmVariant === 'danger'
                  ? 'bg-red-500/20 text-red-200 border border-red-500/30 hover:border-red-500/60'
                  : 'bg-dark-300 text-white border border-dark-500 hover:border-gold/50'
              }`}
            >
              {loading ? '...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PhotoSection(props: {
  allDisplayPhotos: string[]
  visiblePhotoSlots: string[]
  getRootProps: ReturnType<typeof useDropzone>['getRootProps']
  getInputProps: ReturnType<typeof useDropzone>['getInputProps']
  setSelectedPhotoIndex: (idx: number) => void
  removePhoto: (idx: number) => void
}) {
  const {
    allDisplayPhotos,
    visiblePhotoSlots,
    getRootProps,
    getInputProps,
    setSelectedPhotoIndex,
    removePhoto,
  } = props

  return (
    <div className="bg-dark-200 border border-dark-500 rounded-[12px] p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-white">
          Photos ({allDisplayPhotos.filter(Boolean).length}/{MAX_PHOTOS})
        </p>
        <p className="text-xs text-white/40">Clique une case pour changer</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {visiblePhotoSlots.map((url, idx) => {
          const rootProps = getRootProps({
            onClick: () => setSelectedPhotoIndex(idx),
            onDragEnter: () => setSelectedPhotoIndex(idx),
          })

          return (
            <div
              key={`${url || 'empty'}-${idx}`}
              {...rootProps}
              className="relative aspect-square rounded-[12px] overflow-hidden bg-[#1e1e1e] border border-dark-500 cursor-pointer hover:border-gold/50 transition-colors"
            >
              <input {...getInputProps()} />

              {url ? (
                <img src={url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/30">
                  <Plus size={22} />
                </div>
              )}

              {url && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    removePhoto(idx)
                  }}
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/70 border border-white/10 flex items-center justify-center text-white hover:bg-red-500/80 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Auto-save status indicator ────────────────────────────────────
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.15 }}
        className="flex items-center gap-1.5"
      >
        {status === 'saving' && (
          <>
            <div className="w-3 h-3 rounded-full border-[1.5px] border-gold/60 border-t-transparent animate-spin" />
            <span className="text-xs text-white/40">Sauvegarde...</span>
          </>
        )}
        {status === 'saved' && (
          <>
            <Check size={12} className="text-green-400/70" />
            <span className="text-xs text-green-400/60">Sauvegarde</span>
          </>
        )}
        {status === 'error' && (
          <span className="text-xs text-red-400/70">Erreur de sauvegarde</span>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default function ProfilePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-full flex items-center justify-center bg-dark"><div className="w-10 h-10 rounded-full border-2 border-gold border-t-transparent animate-spin" /></div>}>
      <ProfilePage />
    </Suspense>
  )
}

function ProfilePage() {
  const session = useSession()
  const supabase = useMemo(() => createClient(), [])
  const { profile, setProfile } = useAppStore()
  const isSuspended = Boolean(profile?.is_suspended)
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = normalizePlan((profile as any)?.plan)
  const isBusinessPro = plan === 'business_pro'

  // ─── Tab mode from URL params ──────────────────────────────────
  const initialTab = searchParams.get('tab') === 'edit' ? 'edit' : 'view'
  const scrollToSection = searchParams.get('section')

  const [mode, setMode] = useState<'view' | 'edit'>(initialTab)

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [filtersShake, setFiltersShake] = useState(0)

  const [logoutOpen, setLogoutOpen] = useState(false)
  const [resetPwdOpen, setResetPwdOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [dangerLoading, setDangerLoading] = useState(false)

  const cityInputRef = useRef<HTMLInputElement | null>(null)
  const autocompleteRef = useRef<any>(null)
  const autocompleteListenerRef = useRef<any>(null)
  const criteriaRef = useRef<HTMLDivElement | null>(null)

  // ─── Auto-save state ───────────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [isSavingCritical, setIsSavingCritical] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveVersionRef = useRef(0)
  const isMountedRef = useRef(true)

  // Track last successfully saved state to prevent spam indicator
  const lastSavedStateRef = useRef<{
    form: ProfileForm
    cityData: { city: string; lat: number | null; lng: number | null }
    photoItems: PhotoItem[]
  } | null>(null)

  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  // Check if there are actual unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    if (!lastSavedStateRef.current) return false // Nothing saved yet
    const last = lastSavedStateRef.current
    return (
      form.first_name !== last.form.first_name ||
      form.age !== last.form.age ||
      form.bio !== last.form.bio ||
      form.city !== last.form.city ||
      JSON.stringify(form.interests) !== JSON.stringify(last.form.interests) ||
      JSON.stringify(form.skills) !== JSON.stringify(last.form.skills) ||
      cityData.city !== last.cityData.city ||
      cityData.lat !== last.cityData.lat ||
      cityData.lng !== last.cityData.lng ||
      JSON.stringify(photoItems) !== JSON.stringify(last.photoItems)
    )
  }, [form, cityData, photoItems])

  // Detect if a save is "heavy" (photos, many skills, etc.)
  const isHeavySave = useCallback((
    currentNewPhotos: File[],
    currentPhotoItems: PhotoItem[],
    currentForm: ProfileForm,
    currentPreferences: Preferences
  ) => {
    // Heavy if uploading photos
    if (currentNewPhotos.length > 0) return true

    // Heavy if photo count changed significantly
    const lastPhotoCount = lastSavedStateRef.current?.photoItems.length || 0
    if (Math.abs(currentPhotoItems.length - lastPhotoCount) > 0) return true

    // Heavy if preferences changed (only for pro users)
    if (isBusinessPro && lastSavedStateRef.current) {
      // Preferences change is considered heavy
      const lastPrefs = lastSavedStateRef.current as any
      if (JSON.stringify(currentPreferences) !== JSON.stringify(lastPrefs.preferences)) {
        return true
      }
    }

    // Heavy if many skills changed
    if (currentForm.skills.length > 2 && lastSavedStateRef.current) {
      if (JSON.stringify(currentForm.skills) !== JSON.stringify(lastSavedStateRef.current.form.skills)) {
        return true
      }
    }

    return false
  }, [isBusinessPro])

  const [preferences, setPreferences] = useState<Preferences>(() =>
    isBusinessPro ? getInitialPreferences(profile?.preferences) : LOCKED_PREFERENCES
  )

  const displayedPreferences = isBusinessPro ? preferences : LOCKED_PREFERENCES

  const handleLockedFiltersClick = () => {
    if (isBusinessPro) return
    setFiltersShake((value) => value + 1)
    toast.error('Disponible avec Business Pro')
  }

  const handleBusinessProCheckout = async () => {
    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      const token = currentSession?.access_token

      if (!token) {
        toast.error('Utilisateur non connecte')
        return
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: 'business_pro' }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'Erreur checkout')
      }

      window.location.href = data.url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur Stripe')
    }
  }

  const [form, setForm] = useState<ProfileForm>({
    first_name: profile?.first_name || '',
    age: String(profile?.age || ''),
    bio: profile?.bio || '',
    city: profile?.city || '',
    interests: Array.isArray(profile?.interests) ? profile.interests.slice(0, 5) : [],
    skills: parseSkills((profile as any)?.skills),
  })

  const [cityData, setCityData] = useState({
    city: form.city || '',
    lat: (profile as any)?.city_lat || null,
    lng: (profile as any)?.city_lng || null,
  })

  const initialPhotos = normalizePhotos(profile?.photos)

  const [newPhotos, setNewPhotos] = useState<File[]>([])
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>(
    initialPhotos.map((url) => ({ type: 'existing', url }))
  )

  const syncPhotoState = (items: PhotoItem[]) => {
    const nextItems = items.slice(0, MAX_PHOTOS)
    const nextNewItems = nextItems.filter(
      (item): item is Extract<PhotoItem, { type: 'new' }> => item.type === 'new'
    )

    setPhotoItems(nextItems)
    setNewPhotos(nextNewItems.map((item) => item.file))
  }

  const [photoValidating, setPhotoValidating] = useState(false)

  // ─── Core save function (called by debounce) ──────────────────
  const doSave = useCallback(async (
    currentForm: ProfileForm,
    currentCityData: { city: string; lat: number | null; lng: number | null },
    currentPreferences: Preferences,
    currentPhotoItems: PhotoItem[],
    currentNewPhotos: File[],
    version: number,
  ) => {
    if (!session?.user) return

    // Detect if this is a heavy save (photos, many changes, etc.)
    const heavy = isHeavySave(currentNewPhotos, currentPhotoItems, currentForm, currentPreferences)
    if (heavy) {
      setIsSavingCritical(true)
    }

    setSaveStatus('saving')

    try {
      const uploadedPhotoMap = new Map<File, string>()

      for (const photo of currentNewPhotos) {
        const path = `${session.user.id}/${Date.now()}-${photo.name}`

        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(path, photo, { upsert: true })

        if (error) throw error

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(data.path)

        uploadedPhotoMap.set(photo, publicUrl)
      }

      const allPhotosRaw = currentPhotoItems
        .map((item) => {
          if (item.type === 'existing') return item.url
          return uploadedPhotoMap.get(item.file)
        })
        .slice(0, MAX_PHOTOS)

      const allPhotos = cleanPhotoUrls(allPhotosRaw)
      const nextInterests = currentForm.interests.slice(0, 5)

      const rawAge = currentForm.age.trim()
      const parsedAge = rawAge === '' ? null : Number(rawAge)
      const normalizedAge = parsedAge !== null && Number.isFinite(parsedAge) ? parsedAge : null

      const updates: ProfileUpdate = {
        first_name: currentForm.first_name.trim() || null,
        age: normalizedAge,
        bio: currentForm.bio.trim() || null,
        city: currentCityData.city || null,
        city_lat: currentCityData.lat,
        city_lng: currentCityData.lng,
        interests: nextInterests,
        photos: allPhotos,
        skills: currentForm.skills.filter((s) => s.level >= 1),
        preferences: isBusinessPro ? currentPreferences : LOCKED_PREFERENCES,
      } as any

      // Race condition guard: only apply if this is still the latest save
      if (version !== saveVersionRef.current) return

      const { error } = await supabase
        .from('profiles')
        .update(updates as never)
        .eq('id', session.user.id)

      if (error) throw error

      // Race condition guard again after async
      if (version !== saveVersionRef.current) return

      if (!isMountedRef.current) return

      if (profile) {
        const nextProfile: Profile = {
          ...profile,
          ...updates,
          interests: nextInterests,
          photos: allPhotos,
        }

        setProfile(nextProfile)
      }

      // If new photos were uploaded, convert them to existing
      if (currentNewPhotos.length > 0) {
        setNewPhotos([])
        setPhotoItems(allPhotos.map((url) => ({ type: 'existing', url })))
      }

      // Track this as last successful save state
      lastSavedStateRef.current = {
        form: { ...currentForm },
        cityData: { ...currentCityData },
        photoItems: currentPhotoItems.slice(),
      }

      setSaveStatus('saved')
      if (heavy) {
        // Keep critical indicator for a moment longer so user sees completion
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
        savedTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setSaveStatus('idle')
            setIsSavingCritical(false)
          }
        }, 1500)
      } else {
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
        savedTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) setSaveStatus('idle')
        }, 1200)
      }
    } catch (err) {
      if (!isMountedRef.current) return
      setSaveStatus('error')
      setIsSavingCritical(false)
      console.error('[PROFILE] auto-save error', err)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      savedTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) setSaveStatus('idle')
      }, 3000)
    }
  }, [session?.user, supabase, isBusinessPro, profile, setProfile, isHeavySave])

  // ─── Debounced trigger ─────────────────────────────────────────
  const scheduleSave = useCallback((delay = 800) => {
    if (mode !== 'edit') return

    saveVersionRef.current += 1
    const version = saveVersionRef.current

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    saveTimerRef.current = setTimeout(() => {
      // Read latest state via refs won't work for state, so we use a callback pattern
      // We'll call doSave with current state captured at schedule time — but we need latest.
      // Solution: we store pending data in a ref updated by the effect.
    }, delay)
  }, [mode])

  // Pending save data ref — always reflects latest state
  const pendingRef = useRef({ form, cityData, preferences, photoItems, newPhotos })
  useEffect(() => {
    pendingRef.current = { form, cityData, preferences, photoItems, newPhotos }
  }, [form, cityData, preferences, photoItems, newPhotos])

  const triggerSave = useCallback((delay = 800) => {
    if (mode !== 'edit') return

    saveVersionRef.current += 1
    const version = saveVersionRef.current

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    saveTimerRef.current = setTimeout(() => {
      const { form: f, cityData: c, preferences: p, photoItems: pi, newPhotos: np } = pendingRef.current
      doSave(f, c, p, pi, np, version)
    }, delay)
  }, [mode, doSave])

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  // Block page unload/navigation when saving critical data
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSavingCritical) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isSavingCritical])

  // ─── Auto-save triggers ────────────────────────────────────────
  const isInitialMount = useRef(true)

  // Text fields: debounce 500ms
  useEffect(() => {
    if (isInitialMount.current) return
    if (mode !== 'edit') return
    triggerSave(500)
  }, [form.first_name, form.age, form.bio, triggerSave])

  // Interests, skills, preferences: debounce 500ms (user clicks)
  useEffect(() => {
    if (isInitialMount.current) return
    if (mode !== 'edit') return
    triggerSave(500)
  }, [form.interests, form.skills, preferences, triggerSave])

  // City (from Google Places selection): save promptly
  useEffect(() => {
    if (isInitialMount.current) return
    if (mode !== 'edit') return
    if (!cityData.lat) return // only save when Google Places sets lat/lng
    triggerSave(500)
  }, [cityData, triggerSave])

  // Photos: save after change
  useEffect(() => {
    if (isInitialMount.current) return
    if (mode !== 'edit') return
    triggerSave(500)
  }, [photoItems, triggerSave])

  // Mark initial mount done after first render in edit mode
  useEffect(() => {
    if (mode === 'edit' && isInitialMount.current) {
      // Small delay to let all initial state settle
      const t = setTimeout(() => { isInitialMount.current = false }, 100)
      return () => clearTimeout(t)
    }
  }, [mode])

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return

      setPhotoValidating(true)
      const result = await validatePhoto(file)
      setPhotoValidating(false)

      if (!result.valid) {
        toast.error(result.reason || 'Photo invalide')
        return
      }

      const url = URL.createObjectURL(file)

      setPhotoItems((currentItems) => {
        const nextItems = [...currentItems]
        const targetIndex =
          selectedPhotoIndex !== null
            ? selectedPhotoIndex
            : Math.min(nextItems.length, MAX_PHOTOS - 1)

        if (targetIndex >= MAX_PHOTOS) return currentItems

        const newItem: PhotoItem = { type: 'new', file, url }

        if (targetIndex < nextItems.length) {
          nextItems[targetIndex] = newItem
        } else {
          nextItems.push(newItem)
        }

        const limitedItems = nextItems.slice(0, MAX_PHOTOS)
        const nextNewItems = limitedItems.filter(
          (item): item is Extract<PhotoItem, { type: 'new' }> => item.type === 'new'
        )

        setNewPhotos(nextNewItems.map((item) => item.file))

        return limitedItems
      })

      setSelectedPhotoIndex(null)
    },
    [selectedPhotoIndex]
  )

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  })

  // ─── Mode switching ────────────────────────────────────────────
  useEffect(() => {
    if (mode === 'edit') {
      // Reset form from profile
      const photos = normalizePhotos(profile?.photos)

      const newForm = {
        first_name: profile?.first_name || '',
        age: String(profile?.age || ''),
        bio: profile?.bio || '',
        city: profile?.city || '',
        interests: Array.isArray(profile?.interests) ? profile.interests.slice(0, 5) : [],
        skills: parseSkills((profile as any)?.skills),
      }

      const newCityData = {
        city: profile?.city || '',
        lat: (profile as any)?.city_lat || null,
        lng: (profile as any)?.city_lng || null,
      }

      const newPhotoItems = photos.map((url) => ({ type: 'existing', url }))

      setForm(newForm)
      setCityData(newCityData)
      setPreferences(isBusinessPro ? getInitialPreferences(profile?.preferences) : LOCKED_PREFERENCES)
      setNewPhotos([])
      setPhotoItems(newPhotoItems)

      // Initialize lastSavedState when entering edit mode
      lastSavedStateRef.current = {
        form: newForm,
        cityData: newCityData,
        photoItems: newPhotoItems,
      }

      // Mark as initial mount to avoid triggering saves
      isInitialMount.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // ─── Scroll to criteria section on URL param ──────────────────
  useEffect(() => {
    if (mode === 'edit' && scrollToSection === 'criteria') {
      const t = setTimeout(() => {
        criteriaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 400)
      return () => clearTimeout(t)
    }
  }, [mode, scrollToSection])

  // ─── Google Places ─────────────────────────────────────────────
  useEffect(() => {
    const styleId = 'google-places-pac-style'

    if (document.getElementById(styleId)) return

    const style = document.createElement('style')
    style.id = styleId
    style.innerHTML = `
      .pac-container {
        z-index: 999999 !important;
        background-color: #1e1e1e;
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 18px 50px rgba(0,0,0,0.35);
      }

      .pac-item {
        padding: 10px 12px;
        color: rgba(255,255,255,0.72);
        border-top: 1px solid rgba(255,255,255,0.08);
        cursor: pointer;
      }

      .pac-item:hover,
      .pac-item-selected {
        background-color: rgba(212,168,83,0.16);
      }

      .pac-item-query,
      .pac-matched {
        color: #ffffff;
      }
    `

    document.head.appendChild(style)
  }, [])

  useEffect(() => {
  if (mode !== 'edit') return

  let cancelled = false
  let retryCount = 0
  const maxRetries = 100

  const cleanupAutocomplete = () => {
    if (autocompleteListenerRef.current) {
      if (typeof autocompleteListenerRef.current.remove === 'function') {
        autocompleteListenerRef.current.remove()
      } else if (window.google?.maps?.event?.removeListener) {
        window.google.maps.event.removeListener(autocompleteListenerRef.current)
      }

      autocompleteListenerRef.current = null
    }

    if (autocompleteRef.current) {
      if (typeof autocompleteRef.current.unbindAll === 'function') {
        autocompleteRef.current.unbindAll()
      }

      autocompleteRef.current = null
    }
  }

  const attachAutocomplete = () => {
    if (cancelled) return true

    const input = cityInputRef.current
    const Autocomplete = window.google?.maps?.places?.Autocomplete

    if (!input || !Autocomplete) {
      retryCount += 1

      if (retryCount >= maxRetries) {
        return true
      }

      return false
    }

    if (autocompleteRef.current) {
      return true
    }

    const autocomplete = new Autocomplete(input, {
      types: ['(cities)'],
      fields: ['place_id', 'name', 'geometry', 'address_components', 'formatted_address'],
    })

    autocompleteRef.current = autocomplete

    autocompleteListenerRef.current = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      const location = place.geometry?.location

      if (!location) return

      const cityName =
        place.address_components?.find((component: any) =>
          component.types.includes('locality')
        )?.long_name ||
        place.address_components?.find((component: any) =>
          component.types.includes('postal_town')
        )?.long_name ||
        place.address_components?.find((component: any) =>
          component.types.includes('administrative_area_level_2')
        )?.long_name ||
        place.name ||
        place.formatted_address ||
        ''

      const nextCity = cityName.trim()
      const nextLat = location.lat()
      const nextLng = location.lng()

      setCityData({
        city: nextCity,
        lat: nextLat,
        lng: nextLng,
      })

      setForm((prev) => ({
        ...prev,
        city: nextCity,
      }))
    })

    return true
  }

  cleanupAutocomplete()

  loadGooglePlacesScript().catch(() => {})

  const intervalId = window.setInterval(() => {
    const done = attachAutocomplete()

    if (done) {
      window.clearInterval(intervalId)
    }
  }, 100)

  return () => {
    cancelled = true
    window.clearInterval(intervalId)
    cleanupAutocomplete()
  }
}, [mode])

  const toggleInterest = (interest: string) => {
    setForm((prev) => {
      if (prev.interests.length >= 5 && !prev.interests.includes(interest)) return prev

      return {
        ...prev,
        interests: prev.interests.includes(interest)
          ? prev.interests.filter((item) => item !== interest)
          : [...prev.interests, interest],
      }
    })
  }

  const removePhoto = (index: number) => {
    const nextItems = photoItems.filter((_, photoIndex) => photoIndex !== index)
    syncPhotoState(nextItems)
  }

  // ─── Account actions ───────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const handleSuspend = async () => {
    if (!session?.user) return

    setDangerLoading(true)

    try {
      const updates: ProfileUpdate = { is_suspended: true }

      const { error } = await supabase
        .from('profiles')
        .update(updates as never)
        .eq('id', session.user.id)

      if (error) throw error

      if (profile) setProfile({ ...profile, is_suspended: true })
      toast.success('Profil suspendu')
      setSuspendOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setDangerLoading(false)
    }
  }

  const handleReactivate = async () => {
    if (!session?.user) return

    setDangerLoading(true)

    try {
      const updates: ProfileUpdate = { is_suspended: false }

      const { error } = await supabase
        .from('profiles')
        .update(updates as never)
        .eq('id', session.user.id)

      if (error) throw error

      if (profile) setProfile({ ...profile, is_suspended: false })
      toast.success('Profil reactive')
    } catch {
      toast.error('Erreur')
    } finally {
      setDangerLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!session?.user?.email) {
      toast.error('Email introuvable')
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(session.user.email, {
        redirectTo: 'https://pakt-sigma.vercel.app/update-password',
      })

      if (error) throw error

      toast.success('Email de reinitialisation envoye')
      setResetPwdOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    }
  }

  const handleDeleteAccount = async () => {
    if (!session?.user) return

    setDangerLoading(true)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      if (!accessToken) {
        throw new Error('Session introuvable')
      }

      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la demande')
      }

      toast.success('Email de confirmation envoye')
      setDeleteOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setDangerLoading(false)
    }
  }

  const allDisplayPhotos = photoItems.map((item) => item.url).slice(0, MAX_PHOTOS)

  const visiblePhotoSlots = Array.from({ length: MAX_PHOTOS }, (_, index) => allDisplayPhotos[index] || '')

  const inputBase =
    'w-full bg-[#1e1e1e] border border-dark-500 text-white placeholder:text-white/30 rounded-[12px] p-4 outline-none focus:border-gold/60 transition-colors'

  const cardBase = 'bg-dark-200 border border-dark-500 rounded-[12px] p-6'

  return (
    <div className="min-h-full flex flex-col bg-dark">
      <header className="shrink-0 px-5 pt-5 pb-4 border-b border-dark-500">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="w-20" />
          <div className="flex items-center bg-dark-200 border border-dark-500 rounded-[12px] p-1">
            <button
              type="button"
              disabled={isSavingCritical}
              onClick={() => setMode('view')}
              className={`px-5 py-2 rounded-[10px] text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                mode === 'view' ? 'bg-[#d4a853] text-dark' : 'text-white/70 hover:text-white'
              }`}
            >
              Visualiser
            </button>

            <button
              type="button"
              disabled={isSavingCritical}
              onClick={() => setMode('edit')}
              className={`px-5 py-2 rounded-[10px] text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                mode === 'edit' ? 'bg-[#d4a853] text-dark' : 'text-white/70 hover:text-white'
              }`}
            >
              Modifier
            </button>
          </div>
          <div className="w-20 flex justify-end">
            <SaveIndicator
              status={hasUnsavedChanges() && (saveStatus === 'saving' || saveStatus === 'saved') ? saveStatus : 'idle'}
            />
          </div>
        </div>
      </header>

      {/* Critical save blocker modal */}
      {isSavingCritical && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70">
          <div className="bg-dark-200 border border-dark-500 rounded-[12px] px-8 py-6 max-w-sm mx-4 text-center">
            <div className="mb-4 flex justify-center">
              <div className="w-4 h-4 rounded-full border-[1.5px] border-gold/60 border-t-transparent animate-spin" />
            </div>
            <p className="text-white/80 text-sm leading-relaxed">
              Patientez quelques secondes, votre profil est en train de se mettre à jour.
            </p>
            <p className="text-white/40 text-xs mt-3">
              Assurez-vous de ne pas quitter la page.
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 px-5 py-6">
        <AnimatePresence mode="wait" initial={false}>
          {mode === 'view' ? (
            <motion.div
              key="view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="flex justify-center"
            >
              {profile ? (
                <div className="w-full max-w-md">
                  <SwipeCard profile={profile} onSwipe={() => {}} isTop={true} isOwnProfile={true} />

                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => setLogoutOpen(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-[12px] border border-dark-500 bg-dark-200 px-4 py-4 text-sm text-white/70 hover:text-white hover:border-red-500/50 transition-colors"
                    >
                      <LogOut size={16} />
                      Se deconnecter
                    </button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          ) : (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="max-w-xl mx-auto space-y-6"
            >
              <div className={cardBase}>
                <p className="text-xs uppercase tracking-widest text-white/40 mb-3">PRENOM</p>
                <input
                  value={form.first_name}
                  onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))}
                  placeholder="Prenom"
                  className={inputBase}
                />
              </div>

              <div className={cardBase}>
                <p className="text-xs uppercase tracking-widest text-white/40 mb-3">AGE</p>
                <input
                  type="number"
                  value={form.age}
                  onChange={(event) => setForm((prev) => ({ ...prev, age: event.target.value }))}
                  placeholder="Age"
                  className={inputBase}
                  min="18"
                />
              </div>

              <div className={cardBase}>
                <p className="text-xs uppercase tracking-widest text-white/40 mb-3">VILLE</p>
                <input
                  ref={cityInputRef}
                  value={cityData.city}
                  onChange={(event) => {
                    setCityData((prev) => ({
                      ...prev,
                      city: event.target.value,
                      lat: null,
                      lng: null,
                    }))

                    setForm((prev) => ({
                      ...prev,
                      city: event.target.value,
                    }))
                  }}
                  placeholder="Paris, Lyon..."
                  autoComplete="off"
                  className={inputBase}
                />
              </div>

              <div className={cardBase}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs uppercase tracking-widest text-white/40">BIO</p>
                  <span className="text-xs text-white/40">{form.bio.length}/1000</span>
                </div>
                <textarea
                  value={form.bio}
                  onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
                  placeholder="Bio"
                  className={`${inputBase} resize-none h-32`}
                  maxLength={1000}
                />
              </div>

              <div className={cardBase}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-white">Interets</p>
                  <span className="text-xs text-white/40">5 max</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {INTERESTS.filter((interest) => interest !== 'Autre').map((interest) => (
                    <button
                      type="button"
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-2 rounded-full text-xs font-semibold transition-all ${
                        form.interests.includes(interest)
                          ? 'bg-[#d4a853] text-dark'
                          : 'bg-[#1e1e1e] text-white/70 border border-dark-500 hover:border-gold/50'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              <div className={cardBase}>
                <div className="mb-4">
                  <p className="text-sm font-semibold text-white">Competences</p>
                  <p className="text-xs text-white/40 mt-1">Uniquement celles que tu maitrises vraiment</p>
                </div>
                <SkillPicker
                  skills={form.skills}
                  onChange={(skills) => setForm((prev) => ({ ...prev, skills }))}
                />
              </div>

              <PhotoSection
                allDisplayPhotos={allDisplayPhotos}
                visiblePhotoSlots={visiblePhotoSlots}
                getRootProps={getRootProps}
                getInputProps={getInputProps}
                setSelectedPhotoIndex={setSelectedPhotoIndex}
                removePhoto={removePhoto}
              />

              <motion.div
                ref={criteriaRef}
                className={`${cardBase} relative overflow-hidden`}
                animate={filtersShake ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
                transition={{ duration: 0.32 }}
              >
                <p className="text-sm font-semibold text-white mb-4">Mes criteres</p>

                <div
                  className={`space-y-5 ${
                    !isBusinessPro ? 'pointer-events-none opacity-45 blur-[1px]' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-white/70">
                        Distance max : {displayedPreferences.distance_km} km
                      </p>
                      <span className="text-xs text-white/40">0 - 1000</span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={1000}
                      value={displayedPreferences.distance_km}
                      disabled={!isBusinessPro}
                      onChange={(event) => {
                        if (!isBusinessPro) return

                        setPreferences((prev) => ({
                          ...prev,
                          distance_km: Number(event.target.value),
                        }))
                      }}
                      className="w-full accent-gold disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-white/70">
                        Age : {displayedPreferences.age_min} - {displayedPreferences.age_max} ans
                      </p>
                      <span className="text-xs text-white/40">18 - 99</span>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="range"
                        min={18}
                        max={99}
                        value={displayedPreferences.age_min}
                        disabled={!isBusinessPro}
                        onChange={(event) => {
                          if (!isBusinessPro) return

                          const value = Number(event.target.value)

                          setPreferences((prev) => ({
                            ...prev,
                            age_min: Math.min(value, prev.age_max),
                          }))
                        }}
                        className="w-full accent-gold disabled:cursor-not-allowed"
                      />

                      <input
                        type="range"
                        min={18}
                        max={99}
                        value={displayedPreferences.age_max}
                        disabled={!isBusinessPro}
                        onChange={(event) => {
                          if (!isBusinessPro) return

                          const value = Number(event.target.value)

                          setPreferences((prev) => ({
                            ...prev,
                            age_max: Math.max(value, prev.age_min),
                          }))
                        }}
                        className="w-full accent-gold disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Skill filters */}
                  <div>
                    <p className="text-sm text-white/70 mb-3">Competences recherchees</p>

                    {(preferences.skill_filters || []).length > 0 && (
                      <div className="space-y-2 mb-3">
                        {(preferences.skill_filters || []).map((filter) => (
                          <div
                            key={filter.name}
                            className="flex items-center gap-2 px-3 py-2 rounded-[10px] bg-dark-300 border border-gold/15"
                          >
                            <span className="flex-1 text-sm text-white/80 truncate">{filter.name}</span>
                            <span className="text-xs text-white/40 mr-1">Min</span>
                            <select
                              value={filter.min_level}
                              disabled={!isBusinessPro}
                              onChange={(e) => {
                                const newLevel = Number(e.target.value)
                                setPreferences((prev) => ({
                                  ...prev,
                                  skill_filters: (prev.skill_filters || []).map((f) =>
                                    f.name === filter.name ? { ...f, min_level: newLevel } : f
                                  ),
                                }))
                              }}
                              className="bg-dark-400 border border-dark-500 text-gold text-xs font-semibold rounded-lg px-2 py-1 outline-none"
                            >
                              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                                <option key={n} value={n}>{n}/10</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() =>
                                setPreferences((prev) => ({
                                  ...prev,
                                  skill_filters: (prev.skill_filters || []).filter((f) => f.name !== filter.name),
                                }))
                              }
                              className="shrink-0 w-6 h-6 rounded-full bg-red-500/15 flex items-center justify-center hover:bg-red-500/30 transition-colors"
                            >
                              <X size={10} className="text-red-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add skill filter suggestions */}
                    <div className="flex flex-wrap gap-1.5">
                      {SKILLS_LIST.filter(
                        (s) => !(preferences.skill_filters || []).some((f) => f.name.toLowerCase() === s.toLowerCase())
                      ).map((name) => (
                        <button
                          key={name}
                          type="button"
                          disabled={!isBusinessPro}
                          onClick={() =>
                            setPreferences((prev) => ({
                              ...prev,
                              skill_filters: [...(prev.skill_filters || []), { name, min_level: 1 }],
                            }))
                          }
                          className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-dark-300 text-white/50 border border-dark-500 hover:border-gold/30 hover:text-white/70 transition-all disabled:cursor-not-allowed"
                        >
                          + {name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {!isBusinessPro && (
                  <button
                    type="button"
                    onClick={handleLockedFiltersClick}
                    className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/35 backdrop-blur-[3px]"
                  >
                    <div className="w-full rounded-[14px] border border-gold/25 bg-[#111111]/85 shadow-[0_18px_55px_rgba(0,0,0,0.45),0_0_30px_rgba(212,168,83,0.12)] p-5 text-center">
                      <div className="mx-auto mb-3 w-11 h-11 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
                        <Crown size={20} className="text-gold" />
                      </div>

                      <h3 className="text-white font-semibold text-sm">
                        Filtres avances reserves aux membres Business Pro
                      </h3>

                      <p className="mt-2 text-xs leading-relaxed text-white/55">
                        Affinez vos recherches avec des criteres personnalises : distance, tranche
                        d&apos;age et plus encore.
                      </p>

                      <span
                        onClick={(event) => {
                          event.stopPropagation()
                          handleBusinessProCheckout()
                        }}
                        className="mt-4 h-11 w-full inline-flex items-center justify-center rounded-[12px] bg-gold text-dark text-sm font-bold hover:bg-gold-light transition-colors"
                      >
                        Passer Business Pro
                      </span>
                    </div>
                  </button>
                )}
              </motion.div>

              <button
                type="button"
                onClick={() => setLogoutOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-[12px] border border-dark-500 bg-[#1e1e1e] px-4 py-4 text-sm text-white/70 hover:text-white hover:border-red-500/50 transition-colors"
              >
                <LogOut size={16} />
                Se deconnecter
              </button>

              <button
                type="button"
                onClick={() => setResetPwdOpen(true)}
                className="w-full rounded-[12px] border border-dark-500 bg-dark-200 px-4 py-4 text-sm font-semibold text-white/70 hover:text-white hover:border-gold/50 transition-colors"
              >
                Modifier mon mot de passe
              </button>

              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="w-full rounded-[12px] border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm font-semibold text-red-200 hover:border-red-500/40 transition-colors"
              >
                Supprimer mon compte
              </button>

              {isSuspended ? (
                <button
                  type="button"
                  onClick={handleReactivate}
                  className="w-full rounded-[12px] border border-gold/40 bg-gold/10 px-4 py-4 text-sm font-semibold text-gold hover:bg-gold/20 transition-colors"
                >
                  Reactiver mon profil
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSuspendOpen(true)}
                  className="w-full rounded-[12px] border border-dark-500 bg-dark-200 px-4 py-4 text-sm font-semibold text-white/70 hover:text-white hover:border-gold/50 transition-colors"
                >
                  Suspendre mon profil
                </button>
              )}

              <ConfirmModal
                open={deleteOpen}
                title="Supprimer votre compte ?"
                body="Cette action est definitive. Toutes vos donnees seront supprimees et ne pourront pas etre recuperees."
                question="Etes-vous sur de vouloir supprimer votre compte ?"
                confirmText="Supprimer"
                confirmVariant="danger"
                loading={dangerLoading}
                onCancel={() => setDeleteOpen(false)}
                onConfirm={handleDeleteAccount}
              />

              <ConfirmModal
                open={resetPwdOpen}
                title="Modifier votre mot de passe ?"
                body="Un email va vous etre envoye pour reinitialiser votre mot de passe."
                question="Etes-vous sur de vouloir reinitialiser votre mot de passe ?"
                confirmText="Oui"
                confirmVariant="neutral"
                onCancel={() => setResetPwdOpen(false)}
                onConfirm={handleResetPassword}
              />

              <ConfirmModal
                open={suspendOpen}
                title="Suspendre votre profil ?"
                body="Votre profil ne sera plus visible par les autres utilisateurs. Vous pourrez le reactiver a tout moment."
                question="Confirmer la suspension de votre profil ?"
                confirmText="Suspendre"
                confirmVariant="neutral"
                loading={dangerLoading}
                onCancel={() => setSuspendOpen(false)}
                onConfirm={handleSuspend}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmModal
        open={logoutOpen}
        title="Se deconnecter ?"
        body="Vous allez etre deconnecte de votre compte."
        question="Confirmer la deconnexion ?"
        confirmText="Oui, se deconnecter"
        confirmVariant="neutral"
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => {
          setLogoutOpen(false)
          handleLogout()
        }}
      />
    </div>
  )
}
