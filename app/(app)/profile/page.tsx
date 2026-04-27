'use client'

// app/(app)/profile/page.tsx
// User profile page with edit capabilities

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@supabase/auth-helpers-react'
import { useAppStore } from '@/lib/store'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { INTERESTS, MAX_PHOTOS } from '@/lib/utils'
import { Check, X, Plus, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import SwipeCard from '@/components/swipe/SwipeCard'
import { AnimatePresence, motion } from 'framer-motion'

type PhotoItem =
  | { type: 'existing'; url: string }
  | { type: 'new'; url: string; file: File }

type Preferences = {
  distance_km: number
  age_min: number
  age_max: number
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
    .filter((p) => typeof p === 'string' && p.trim().length > 0)
    .map((p) => (p as string).trim())
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
  const p = pref as any
  const distance_km = Number.isFinite(p.distance_km)
    ? clampNumber(Number(p.distance_km), 0, 1000)
    : base.distance_km
  const age_min = Number.isFinite(p.age_min) ? clampNumber(Number(p.age_min), 18, 99) : base.age_min
  const age_max = Number.isFinite(p.age_max) ? clampNumber(Number(p.age_max), 18, 99) : base.age_max
  return {
    distance_km,
    age_min: Math.min(age_min, age_max),
    age_max: Math.max(age_min, age_max),
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
  editing: boolean
  allDisplayPhotos: string[]
  visiblePhotoSlots: string[]
  getRootProps: ReturnType<typeof useDropzone>['getRootProps']
  getInputProps: ReturnType<typeof useDropzone>['getInputProps']
  setSelectedPhotoIndex: (idx: number) => void
  removePhoto: (idx: number) => void
}) {
  const {
    editing,
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
          const rootProps = editing
            ? getRootProps({
                onClick: () => setSelectedPhotoIndex(idx),
                onDragEnter: () => setSelectedPhotoIndex(idx),
              })
            : {}

          return (
            <div
              key={`${url || 'empty'}-${idx}`}
              {...rootProps}
              className={`relative aspect-square rounded-[12px] overflow-hidden bg-[#1e1e1e] border border-dark-500 ${
                editing ? 'cursor-pointer hover:border-gold/50 transition-colors' : ''
              }`}
            >
              {editing && <input {...getInputProps()} />}

              {url ? (
                <img src={url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Plus size={20} className="text-white/30" />
                </div>
              )}

              {idx === 0 && url && (
                <div className="absolute top-1 left-1 bg-gold text-dark text-[10px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none">
                  Principal
                </div>
              )}

              {editing && url && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    removePhoto(idx)
                  }}
                  className="absolute top-1 right-1 bg-black/70 rounded-full p-1"
                >
                  <X size={10} className="text-white" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const session = useSession()
  const supabase = createClient()
  const { profile, setProfile } = useAppStore()
  const isSuspended = false
    const router = useRouter()

  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)

  const [logoutOpen, setLogoutOpen] = useState(false)
  const [resetPwdOpen, setResetPwdOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [dangerLoading, setDangerLoading] = useState(false)

  const [preferences, setPreferences] = useState<Preferences>(() =>
    getInitialPreferences((profile as any)?.preferences)
  )

  const [form, setForm] = useState({
    first_name: profile?.first_name || '',
    age: String(profile?.age || ''),
    bio: profile?.bio || '',
    city: profile?.city || '',
    interests: Array.isArray(profile?.interests) ? profile.interests.slice(0, 5) : [],
  })

  const initialPhotos = normalizePhotos(profile?.photos)

  const [newPhotos, setNewPhotos] = useState<File[]>([])
  const [newPhotoUrls, setNewPhotoUrls] = useState<string[]>([])
  const [existingPhotos, setExistingPhotos] = useState<string[]>(initialPhotos)
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>(
    initialPhotos.map((url) => ({ type: 'existing', url }))
  )

  const syncPhotoState = (items: PhotoItem[]) => {
    const nextItems = items.slice(0, MAX_PHOTOS)
    const nextExistingPhotos = nextItems
      .filter((item): item is Extract<PhotoItem, { type: 'existing' }> => item.type === 'existing')
      .map((item) => item.url)
    const nextNewItems = nextItems.filter(
      (item): item is Extract<PhotoItem, { type: 'new' }> => item.type === 'new'
    )

    setPhotoItems(nextItems)
    setExistingPhotos(nextExistingPhotos)
    setNewPhotos(nextNewItems.map((item) => item.file))
    setNewPhotoUrls(nextNewItems.map((item) => item.url))
  }

  const onDrop = useCallback(
    (files: File[]) => {
      const file = files[0]
      if (!file) return

      const url = URL.createObjectURL(file)

      setPhotoItems((currentItems) => {
        const nextItems = [...currentItems]
        const targetIndex =
          selectedPhotoIndex !== null ? selectedPhotoIndex : Math.min(nextItems.length, MAX_PHOTOS - 1)

        if (targetIndex >= MAX_PHOTOS) return currentItems

        const newItem: PhotoItem = { type: 'new', file, url }

        if (targetIndex < nextItems.length) nextItems[targetIndex] = newItem
        else nextItems.push(newItem)

        const limitedItems = nextItems.slice(0, MAX_PHOTOS)
        const nextExistingPhotos = limitedItems
          .filter((item): item is Extract<PhotoItem, { type: 'existing' }> => item.type === 'existing')
          .map((item) => item.url)
        const nextNewItems = limitedItems.filter(
          (item): item is Extract<PhotoItem, { type: 'new' }> => item.type === 'new'
        )

        setExistingPhotos(nextExistingPhotos)
        setNewPhotos(nextNewItems.map((item) => item.file))
        setNewPhotoUrls(nextNewItems.map((item) => item.url))

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
    disabled: !editing,
  })

  const startEdit = () => {
    const photos = normalizePhotos(profile?.photos)

    setForm({
      first_name: profile?.first_name || '',
      age: String(profile?.age || ''),
      bio: profile?.bio || '',
      city: profile?.city || '',
      interests: Array.isArray(profile?.interests) ? profile.interests.slice(0, 5) : [],
    })

    setPreferences(getInitialPreferences((profile as any)?.preferences))

    setExistingPhotos(photos)
    setNewPhotos([])
    setNewPhotoUrls([])
    setPhotoItems(photos.map((url) => ({ type: 'existing', url })))
    setEditing(true)
  }

  const cancelEdit = () => {
    const photos = normalizePhotos(profile?.photos)

    setEditing(false)
    setSelectedPhotoIndex(null)
    setNewPhotos([])
    setNewPhotoUrls([])
    setExistingPhotos(photos)
    setPhotoItems(photos.map((url) => ({ type: 'existing', url })))
  }

  useEffect(() => {
    if (mode === 'edit') startEdit()
    if (mode === 'view') cancelEdit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])
  
  useEffect(() => {
  if (mode !== 'edit') return

  const scriptId = 'google-places-script'

  if (document.getElementById(scriptId)) return

  const script = document.createElement('script')
  script.id = scriptId
  script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&language=fr`
  script.async = true
  script.defer = true

  document.head.appendChild(script)
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

  const saveProfile = async () => {
    if (!session?.user) return

    setSaving(true)

    try {
      const uploadedPhotoMap = new Map<File, string>()

      for (const photo of newPhotos) {
        const path = `${session.user.id}/${Date.now()}-${photo.name}`

        const { data, error } = await supabase.storage.from('avatars').upload(path, photo, { upsert: true })
        if (error) throw error

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(data.path)

        uploadedPhotoMap.set(photo, publicUrl)
      }

      const allPhotosRaw = photoItems
        .map((item) => {
          if (item.type === 'existing') return item.url
          return uploadedPhotoMap.get(item.file)
        })
        .slice(0, MAX_PHOTOS)

      const allPhotos = cleanPhotoUrls(allPhotosRaw)

      const updates = {
  first_name: form.first_name || null,
  age: form.age || null,
  bio: form.bio || null,
  city: form.city || null,
  interests: form.interests || [],
  photos: allPhotos || [],
}

      const { error } = await supabase.from('profiles').update(updates as any).eq('id', session.user.id)
      if (error) throw error

      setProfile({ ...profile!, ...updates })
      setExistingPhotos(allPhotos)
      setNewPhotos([])
      setNewPhotoUrls([])
      setPhotoItems(allPhotos.map((url) => ({ type: 'existing', url })))
      setEditing(false)
      setMode('view')
      toast.success('Profil mis à jour !')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const handleSuspend = async () => {
    if (!session?.user) return
    setDangerLoading(true)
    try {
      const { error } = await supabase.from('profiles').update({ is_suspended: true }).eq('id', session.user.id)
      if (error) throw error

setProfile({ ...(profile as any), is_suspended: true })
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
    const { error } = await supabase
      .from('profiles')
      .update({ is_suspended: false })
      .eq('id', session.user.id)

    if (error) throw error

    setProfile({ ...(profile as any), is_suspended: false })
    toast.success('Profil réactivé')
  } catch (err) {
    toast.error('Erreur')
  } finally {
    setDangerLoading(false)
  }
}

const handleResetPassword = async () => {
  if (!session?.user?.email) return

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(session.user.email, {
      redirectTo: 'http://localhost:3000/update-password',
    })

    if (error) throw error

    toast.success('Email de réinitialisation envoyé')
    setResetPwdOpen(false)
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Erreur')
  }
}

  const handleDeleteAccount = async () => {
    if (!session?.user) return
    setDangerLoading(true)
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', session.user.id)
      if (error) throw error

      await supabase.auth.signOut()
      router.push('/auth')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
      setDangerLoading(false)
    }
  }

  const allDisplayPhotos = editing
    ? photoItems.map((item) => item.url).slice(0, MAX_PHOTOS)
    : normalizePhotos(profile?.photos).slice(0, MAX_PHOTOS)

  const visiblePhotoSlots = editing
    ? Array.from({ length: MAX_PHOTOS }, (_, index) => allDisplayPhotos[index] || '')
    : allDisplayPhotos

  const inputBase =
    'w-full bg-[#1e1e1e] border border-dark-500 text-white placeholder:text-white/30 rounded-[12px] p-4 outline-none focus:border-gold/60 transition-colors'

  const cardBase = 'bg-dark-200 border border-dark-500 rounded-[12px] p-6'

  return (
    <div className="h-full flex flex-col bg-dark overflow-y-auto">
      <header className="shrink-0 px-5 pt-5 pb-4 border-b border-dark-500">
        <div className="max-w-xl mx-auto flex justify-center">
          <div className="flex items-center bg-dark-200 border border-dark-500 rounded-[12px] p-1">
            <button
              type="button"
              onClick={() => setMode('view')}
              className={`px-5 py-2 rounded-[10px] text-sm font-semibold transition-colors ${
                mode === 'view' ? 'bg-[#d4a853] text-dark' : 'text-white/70 hover:text-white'
              }`}
            >
              Visualiser
            </button>
            <button
              type="button"
              onClick={() => setMode('edit')}
              className={`px-5 py-2 rounded-[10px] text-sm font-semibold transition-colors ${
                mode === 'edit' ? 'bg-[#d4a853] text-dark' : 'text-white/70 hover:text-white'
              }`}
            >
              Modifier
            </button>
          </div>
        </div>
      </header>

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
    <SwipeCard
  profile={profile as any}
  onSwipe={() => {}}
  isTop={true}
  isOwnProfile={true}
/>                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => setLogoutOpen(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-[12px] border border-dark-500 bg-dark-200 px-4 py-4 text-sm text-white/70 hover:text-white hover:border-red-500/50 transition-colors"
                    >
                      <LogOut size={16} />
                      Se déconnecter
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
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="p-2.5 rounded-full bg-dark-200/80 backdrop-blur-sm border border-dark-500 hover:border-red-500/50 transition-colors"
                >
                  <X size={18} className="text-white/70" />
                </button>

                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={saving}
                  className="p-2.5 rounded-full bg-gold text-dark hover:bg-gold-light transition-colors disabled:opacity-60"
                >
                  {saving ? (
                    <div className="w-4 h-4 rounded-full border-2 border-dark border-t-transparent animate-spin" />
                  ) : (
                    <Check size={18} />
                  )}
                </button>
              </div>

              <div className={cardBase}>
                <p className="text-xs uppercase tracking-widest text-white/40 mb-3">PRÉNOM</p>
                <input
                  value={form.first_name}
                  onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))}
                  placeholder="Prénom"
                  className={inputBase}
                />
              </div>

              <div className={cardBase}>
                <p className="text-xs uppercase tracking-widest text-white/40 mb-3">ÂGE</p>
                <input
                  type="number"
                  value={form.age}
                  onChange={(event) => setForm((prev) => ({ ...prev, age: event.target.value }))}
                  placeholder="Âge"
                  className={inputBase}
                  min="18"
                />
              </div>

              <div className={cardBase}>
                <p className="text-xs uppercase tracking-widest text-white/40 mb-3">VILLE</p>
               <input
  ref={(ref) => {
    if (!ref) return
    if (ref.dataset.init === 'true') return // ✅ évite double init
    if (!window.google?.maps?.places) return

    ref.dataset.init = 'true'

    const autocomplete = new window.google.maps.places.Autocomplete(ref, {
      types: ['(cities)'],
      fields: ['name', 'geometry'],
    })

    autocomplete.addListener('place_changed', () => {
  const place = autocomplete.getPlace()
  if (!place.geometry) return

  const lat = place.geometry.location.lat()
  const lng = place.geometry.location.lng()

  setForm((prev) => ({
    ...prev,
    city: place.name || '',
    lat,
    lng
  }))
})
  }}
  value={form.city}
  onChange={(event) =>
  setForm((prev) => ({
    ...prev,
    city: event.target.value,
    lat: null,
    lng: null
  }))
}
  placeholder="Paris, Lyon..."
  className={inputBase}
/> </div>

              <div className={cardBase}>
                <p className="text-xs uppercase tracking-widest text-white/40 mb-3">BIO</p>
                <textarea
                  value={form.bio}
                  onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
                  placeholder="Bio"
                  className={`${inputBase} resize-none h-32`}
                  maxLength={500}
                />
              </div>

              <div className={cardBase}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-white">Intérêts</p>
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

              <PhotoSection
                editing={editing}
                allDisplayPhotos={allDisplayPhotos}
                visiblePhotoSlots={visiblePhotoSlots}
                getRootProps={getRootProps}
                getInputProps={getInputProps}
                setSelectedPhotoIndex={setSelectedPhotoIndex}
                removePhoto={removePhoto}
              />

              <div className={cardBase}>
                <p className="text-sm font-semibold text-white mb-4">Mes critères</p>

                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-white/70">Distance max : {preferences.distance_km} km</p>
                      <span className="text-xs text-white/40">0 - 1000</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1000}
                      value={preferences.distance_km}
                      onChange={(e) => {
                        const next = { ...preferences, distance_km: Number(e.target.value) }
                        setPreferences(next)
                        if (profile) setProfile({ ...(profile as any), preferences: next })
                      }}
                      className="w-full accent-gold"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-white/70">
                        Âge : {preferences.age_min} - {preferences.age_max} ans
                      </p>
                      <span className="text-xs text-white/40">18 - 99</span>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="range"
                        min={18}
                        max={99}
                        value={preferences.age_min}
                        onChange={(e) => {
                          const v = Number(e.target.value)
                          const next = { ...preferences, age_min: Math.min(v, preferences.age_max) }
                          setPreferences(next)
                          if (profile) setProfile({ ...(profile as any), preferences: next })
                        }}
                        className="w-full accent-gold"
                      />

                      <input
                        type="range"
                        min={18}
                        max={99}
                        value={preferences.age_max}
                        onChange={(e) => {
                          const v = Number(e.target.value)
                          const next = { ...preferences, age_max: Math.max(v, preferences.age_min) }
                          setPreferences(next)
                          if (profile) setProfile({ ...(profile as any), preferences: next })
                        }}
                        className="w-full accent-gold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLogoutOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-[12px] border border-dark-500 bg-[#1e1e1e] px-4 py-4 text-sm text-white/70 hover:text-white hover:border-red-500/50 transition-colors"
              >
                <LogOut size={16} />
                Se déconnecter
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
    Réactiver mon profil
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
                body="Cette action est définitive. Toutes vos données seront supprimées et ne pourront pas être récupérées."
                question="Êtes-vous sûr de vouloir supprimer votre compte ?"
                confirmText="Supprimer"
                confirmVariant="danger"
                loading={dangerLoading}
                onCancel={() => setDeleteOpen(false)}
                onConfirm={handleDeleteAccount}
              />
<ConfirmModal
  open={resetPwdOpen}
  title="Modifier votre mot de passe ?"
  body="Un email va vous être envoyé pour réinitialiser votre mot de passe."
  question="Êtes-vous sûr de vouloir réinitialiser votre mot de passe ?"
  confirmText="Oui"
  confirmVariant="neutral"
  onCancel={() => setResetPwdOpen(false)}
  onConfirm={handleResetPassword}
/>

              <ConfirmModal
                open={suspendOpen}
                title="Suspendre votre profil ?"
                body="Votre profil ne sera plus visible par les autres utilisateurs. Vous pourrez le réactiver à tout moment."
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
        title="Se déconnecter ?"
        body="Vous allez être déconnecté de votre compte."
        question="Confirmer la déconnexion ?"
        confirmText="Oui, se déconnecter"
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