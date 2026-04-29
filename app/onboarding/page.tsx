'use client'

// app/onboarding/page.tsx

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { useSession } from '@supabase/auth-helpers-react'
import { INTERESTS, MAX_PHOTOS } from '@/lib/utils'
import { X, Plus, ChevronRight, ChevronLeft, MapPin } from 'lucide-react'

const STEPS = 5
const MAX_INTERESTS = 5

type PhotoItem = { type: 'new'; url: string; file: File }

declare global {
  interface Window {
    google?: any
  }
}

let googlePlacesPromise: Promise<void> | null = null

function waitForGooglePlaces(timeoutMs = 10000) {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google Places indisponible côté serveur'))
      return
    }

    const startedAt = Date.now()

    const check = () => {
      const hasGoogle = Boolean(window.google)
      const hasMaps = Boolean(window.google?.maps)
      const hasPlaces = Boolean(window.google?.maps?.places)
      const hasAutocomplete = Boolean(window.google?.maps?.places?.Autocomplete)

      if (hasAutocomplete) {
        console.info('[Google Places] window.google.maps.places.Autocomplete prêt')
        resolve()
        return
      }

      if (Date.now() - startedAt >= timeoutMs) {
        console.error('[Google Places] timeout', {
          hasGoogle,
          hasMaps,
          hasPlaces,
          hasAutocomplete,
        })
        reject(new Error('Google Places timeout'))
        return
      }

      window.setTimeout(check, 150)
    }

    check()
  })
}

async function loadGooglePlacesScript() {
  if (typeof window === 'undefined') return

  if (window.google?.maps?.places?.Autocomplete) {
    console.info('[Google Places] déjà chargé')
    return
  }

  if (googlePlacesPromise) {
    console.info('[Google Places] chargement déjà en cours')
    return googlePlacesPromise
  }

  googlePlacesPromise = new Promise((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!key) {
      console.error('[Google Places] clé NEXT_PUBLIC_GOOGLE_MAPS_API_KEY manquante')
      googlePlacesPromise = null
      reject(new Error('Clé Google Maps manquante'))
      return
    }

    const existingScripts = Array.from(
      document.querySelectorAll<HTMLScriptElement>('script[data-google-places="true"]')
    )

    const existing = existingScripts[0]

    existingScripts.slice(1).forEach((script) => {
      console.warn('[Google Places] script dupliqué supprimé')
      script.remove()
    })

    if (existing) {
      console.info('[Google Places] script déjà injecté', existing.src)

      if (window.google?.maps?.places?.Autocomplete) {
        console.info('[Google Places] Google déjà disponible après détection script existant')
        resolve()
        return
      }

      const onLoad = () => {
        console.info('[Google Places] script existant chargé')
        waitForGooglePlaces().then(resolve).catch((error) => {
          googlePlacesPromise = null
          reject(error)
        })
      }

      const onError = () => {
        console.error('[Google Places] erreur script existant')
        googlePlacesPromise = null
        reject(new Error('Google Maps indisponible'))
      }

      existing.addEventListener('load', onLoad, { once: true })
      existing.addEventListener('error', onError, { once: true })

      waitForGooglePlaces()
        .then(resolve)
        .catch((error) => {
          console.warn('[Google Places] script existant présent mais Google non prêt', error)
          googlePlacesPromise = null
          reject(error)
        })

      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      key
    )}&libraries=places&language=fr&region=FR&v=weekly`
    script.async = true
    script.defer = true
    script.dataset.googlePlaces = 'true'

    script.onload = () => {
      console.info('[Google Places] script chargé')
      waitForGooglePlaces()
        .then(resolve)
        .catch((error) => {
          console.error('[Google Places] script chargé mais Google Places absent', error)
          googlePlacesPromise = null
          reject(error)
        })
    }

    script.onerror = () => {
      console.error('[Google Places] erreur chargement script')
      googlePlacesPromise = null
      script.remove()
      reject(new Error('Google Maps indisponible'))
    }

    console.info('[Google Places] injection script')
    document.head.appendChild(script)
  })

  return googlePlacesPromise
}

function ensureGooglePlacesStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById('google-places-autocomplete-style')) return

  const style = document.createElement('style')
  style.id = 'google-places-autocomplete-style'
  style.innerHTML = `
    .pac-container {
  z-index: 999999 !important;
  position: fixed !important;
  background: #1e1e1e !important;
  border: 1px solid rgba(255,255,255,0.12) !important;
  border-radius: 14px !important;
  margin-top: 8px !important;
  box-shadow: 0 18px 50px rgba(0,0,0,0.45) !important;
  overflow: hidden !important;
}

    .pac-item {
      padding: 12px 14px !important;
      border-top: 1px solid rgba(255,255,255,0.08) !important;
      color: rgba(255,255,255,0.7) !important;
      cursor: pointer !important;
      font-size: 14px !important;
      line-height: 1.4 !important;
      background: #1e1e1e !important;
    }

    .pac-item:first-child {
      border-top: 0 !important;
    }

    .pac-item:hover,
    .pac-item-selected {
      background: rgba(212,175,55,0.12) !important;
    }

    .pac-item-query {
      color: #ffffff !important;
      font-size: 14px !important;
      font-weight: 600 !important;
    }

    .pac-matched {
      color: #d4af37 !important;
      font-weight: 700 !important;
    }

    .pac-icon {
      filter: invert(1) opacity(0.6) !important;
    }
  `

  document.head.appendChild(style)
}

interface OnboardingData {
  firstName: string
  age: string
  bio: string
  city: string
  cityPlaceId: string
  lat: number | null
  lng: number | null
  photos: File[]
  photoUrls: string[]
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [direction, setDirection] = useState(1)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>([])
  const [cityAutocompleteReady, setCityAutocompleteReady] = useState(false)
  const [cityAutocompleteError, setCityAutocompleteError] = useState(false)
  const cityInputRef = useRef<HTMLInputElement | null>(null)
  const autocompleteRef = useRef<any>(null)

  const [data, setData] = useState<OnboardingData>({
    firstName: '',
    age: '',
    bio: '',
    city: '',
    cityPlaceId: '',
    lat: null,
    lng: null,
    photos: [],
    photoUrls: [],
  })

  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [otherInput, setOtherInput] = useState('')

  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const session = useSession()

  const progress = ((step + 1) / STEPS) * 100
  const citySelected = Boolean(data.city.trim() && data.cityPlaceId && data.lat !== null && data.lng !== null)

  const updateData = (
    key: keyof OnboardingData,
    value: string | number | null | File[] | string[]
  ) => setData((prev) => ({ ...prev, [key]: value }))

  useEffect(() => {
    ensureGooglePlacesStyles()
  }, [])

  useEffect(() => {
    if (step !== 3) return

    let cancelled = false
    let initFrame: number | null = null
    let inputWaitTimer: number | null = null
    let fallbackTimer: number | null = null

    const waitForInput = () =>
      new Promise<HTMLInputElement>((resolve, reject) => {
        const startedAt = Date.now()

        const check = () => {
          if (cancelled) {
            reject(new Error('Initialisation annulée'))
            return
          }

          if (cityInputRef.current) {
            resolve(cityInputRef.current)
            return
          }

          if (Date.now() - startedAt >= 3000) {
            reject(new Error('Champ ville introuvable'))
            return
          }

          inputWaitTimer = window.setTimeout(check, 50)
        }

        check()
      })

    const initAutocomplete = async () => {
      try {
        console.info('[Google Places] init step ville')

        setCityAutocompleteError(false)
        setCityAutocompleteReady(false)

        fallbackTimer = window.setTimeout(() => {
          if (!cancelled && !cityAutocompleteReady) {
            console.error('[Google Places] fallback timeout init')
            setCityAutocompleteError(true)
            setCityAutocompleteReady(false)
          }
        }, 12000)

        const input = await waitForInput()
        await loadGooglePlacesScript()

        if (cancelled) return

        if (!window.google?.maps?.places?.Autocomplete) {
          console.error('[Google Places] Autocomplete absent après chargement', {
            google: Boolean(window.google),
            maps: Boolean(window.google?.maps),
            places: Boolean(window.google?.maps?.places),
          })
          throw new Error('Google Places non chargé')
        }

        if (autocompleteRef.current && window.google?.maps?.event) {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
          autocompleteRef.current = null
        }

        const autocomplete = new window.google.maps.places.Autocomplete(input, {
          types: ['(cities)'],
          fields: ['place_id', 'name', 'formatted_address', 'geometry', 'address_components'],
        })

        autocompleteRef.current = autocomplete

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          const location = place.geometry?.location

          console.info('[Google Places] place_changed', {
            placeId: place.place_id,
            name: place.name,
            hasGeometry: Boolean(location),
          })

          if (!place.place_id || !location) {
            setData((prev) => ({
              ...prev,
              cityPlaceId: '',
              lat: null,
              lng: null,
            }))
            return
          }

          const cityName =
            place.address_components?.find((component: any) => component.types?.includes('locality'))
              ?.long_name ||
            place.address_components?.find((component: any) =>
              component.types?.includes('postal_town')
            )?.long_name ||
            place.name ||
            place.formatted_address ||
            ''

          setData((prev) => ({
            ...prev,
            city: cityName,
            cityPlaceId: place.place_id,
            lat: location.lat(),
            lng: location.lng(),
          }))
        })

        if (fallbackTimer) {
          window.clearTimeout(fallbackTimer)
          fallbackTimer = null
        }

        console.info('[Google Places] autocomplete initialisé')
        setCityAutocompleteReady(true)
        setCityAutocompleteError(false)
      } catch (error) {
        if (fallbackTimer) {
          window.clearTimeout(fallbackTimer)
          fallbackTimer = null
        }

        console.error('[Google Places] init failed', error)

        googlePlacesPromise = null

        if (!cancelled) {
          setCityAutocompleteReady(false)
          setCityAutocompleteError(true)
          toast.error('Autocomplete ville indisponible')
        }
      }
    }

    initFrame = window.requestAnimationFrame(() => {
      initAutocomplete()
    })

    return () => {
      cancelled = true

      if (initFrame) {
        window.cancelAnimationFrame(initFrame)
      }

      if (inputWaitTimer) {
        window.clearTimeout(inputWaitTimer)
      }

      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer)
      }

      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }

      autocompleteRef.current = null
    }
  }, [step, cityAutocompleteReady])

  const addInterestsFromText = (text: string) => {
    const parts = text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    if (parts.length === 0) return

    setSelectedInterests((prev) => {
      const existing = new Set(prev.map((i) => i.toLowerCase()))
      const next = [...prev]

      for (const raw of parts) {
        if (next.length >= MAX_INTERESTS) break
        const key = raw.toLowerCase()
        if (existing.has(key)) continue
        existing.add(key)
        next.push(raw)
      }

      return next
    })

    setOtherInput('')
  }

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) => {
      const already = prev.some((i) => i.toLowerCase() === interest.toLowerCase())
      if (already) return prev.filter((i) => i.toLowerCase() !== interest.toLowerCase())
      if (prev.length >= MAX_INTERESTS) return prev
      return [...prev, interest]
    })
  }

  const syncPhotoState = (items: PhotoItem[]) => {
    const nextItems = items.slice(0, MAX_PHOTOS)

    setPhotoItems(nextItems)
    setData((prev) => ({
      ...prev,
      photos: nextItems.map((item) => item.file),
      photoUrls: nextItems.map((item) => item.url),
    }))
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

        setData((prev) => ({
          ...prev,
          photos: limitedItems.map((item) => item.file),
          photoUrls: limitedItems.map((item) => item.url),
        }))

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

  const removePhoto = (idx: number) => {
    const nextItems = photoItems.filter((_, photoIndex) => photoIndex !== idx)
    syncPhotoState(nextItems)
  }

  const canProceed = () => {
    switch (step) {
      case 0:
        return data.firstName.trim() && data.age && parseInt(data.age) >= 15
      case 1:
        return data.bio.trim().length >= 21
      case 2:
        return selectedInterests.length > 0
      case 3:
        return citySelected
      case 4:
        return data.photos.length >= 1
      default:
        return true
    }
  }

  const handleSubmit = async () => {
    if (!session?.user) return

    setLoading(true)

    try {
      const uploadedUrls: string[] = []

      for (const photo of data.photos) {
        const fileName = `${session.user.id}/${Date.now()}-${photo.name}`

        const { data: uploadData, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, photo, { upsert: true })

        if (error) throw error

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(uploadData.path)

        uploadedUrls.push(publicUrl)
      }

      const isGoogle = session.user.app_metadata?.provider === 'google'

      const { error } = await supabase.from('profiles').upsert({
        id: session.user.id,
        email: session.user.email!,
        first_name: data.firstName,
        age: parseInt(data.age),
        bio: data.bio,
        interests: selectedInterests,
        city: data.city,
        city_lat: data.lat,
        city_lng: data.lng,
        photos: uploadedUrls,
        is_onboarded: true,
        email_confirmed: isGoogle,
        plan: 'free',
        swipes_today: 0,
        last_swipe_date: new Date().toISOString().split('T')[0],
      } as never)

      if (error) throw error

      router.push('/loading')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la création du profil')
    } finally {
      setLoading(false)
    }
  }

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? 60 : -60, opacity: 0 }),
  }

  const goNext = () => {
    if (!canProceed()) return

    if (step === 2 && otherInput.trim()) addInterestsFromText(otherInput)

    if (step === STEPS - 1) {
      handleSubmit()
      return
    }

    setDirection(1)
    setStep((s) => s + 1)
  }

  const goPrev = () => {
    setDirection(-1)
    setStep((s) => s - 1)
  }

  const maxReached = selectedInterests.length >= MAX_INTERESTS
  const allDisplayPhotos = photoItems.map((item) => item.url).slice(0, MAX_PHOTOS)
  const visiblePhotoSlots = Array.from({ length: MAX_PHOTOS }, (_, index) => allDisplayPhotos[index] || '')

  return (
    <div className="app-height flex flex-col bg-dark">
      <div className="h-1 bg-dark-400 mt-safe">
        <motion.div className="h-full bg-gold" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
      </div>

      <div className="flex items-center justify-between px-6 py-4">
        {step > 0 ? (
          <button onClick={goPrev} className="p-2 rounded-xl hover:bg-dark-300 transition-colors">
            <ChevronLeft size={20} className="text-white/70" />
          </button>
        ) : (
          <div />
        )}

        <span className="text-white/40 text-sm">
          {step + 1} / {STEPS}
        </span>

        <div />
      </div>

      <div className="flex-1 overflow-hidden relative px-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="h-full flex flex-col"
          >
            {step === 0 && (
              <div className="flex flex-col gap-6 pt-4">
                <div>
                  <h2 className="text-3xl font-bold mb-1">Bienvenue 👋</h2>
                  <p className="text-white/50">Quelques infos pour commencer</p>
                </div>

                <input
                  type="text"
                  placeholder="Ton prénom"
                  value={data.firstName}
                  onChange={(event) => updateData('firstName', event.target.value)}
                  className="pakt-input text-lg"
                  autoFocus
                />

                <input
                  type="number"
                  placeholder="Ton âge"
                  value={data.age}
                  onChange={(event) => updateData('age', event.target.value)}
                  className="pakt-input text-lg"
                  min="15"
                  max="99"
                />

                {data.age && parseInt(data.age) < 15 && (
                  <p className="text-red-400 text-sm">Tu dois avoir au moins 15 ans.</p>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-col gap-6 pt-4">
                <div>
                  <h2 className="text-3xl font-bold mb-1">Ta bio ✍️</h2>
                  <p className="text-white/50">Présente-toi en quelques mots</p>
                </div>

                <div>
                  <textarea
                    placeholder="Qui es-tu ? Quels sont tes projets ? Qu'est-ce qui te définit..."
                    value={data.bio}
                    onChange={(event) => updateData('bio', event.target.value)}
                    className="pakt-input resize-none h-40 text-base leading-relaxed"
                    maxLength={500}
                  />

                  <div className="flex items-center justify-end mt-2">
                    <p className="text-xs text-white/30">Minimum 21 caractères</p>
                  </div>
                </div>

                <p className="text-white/30 text-xs text-right">{data.bio.length}/500</p>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-5 pt-4">
                <div>
                  <h2 className="text-3xl font-bold mb-1">Tes intérêts 🎯</h2>
                  <p className="text-white/50">Sélectionne ce qui te correspond</p>
                </div>

                {selectedInterests.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedInterests.map((interest) => (
                      <button
                        key={interest.toLowerCase()}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 bg-gold text-dark"
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 overflow-y-auto max-h-64">
                  {INTERESTS.filter((interest) => interest !== 'Autre').map((interest) => {
                    const selected = selectedInterests.some((item) => item.toLowerCase() === interest.toLowerCase())
                    const disabled = maxReached && !selected

                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        disabled={disabled}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          selected
                            ? 'bg-gold text-dark'
                            : 'bg-dark-300 text-white/70 border border-dark-500 hover:border-gold/30'
                        } ${disabled ? 'opacity-40 hover:border-dark-500 cursor-not-allowed' : ''}`}
                      >
                        {interest}
                      </button>
                    )
                  })}
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Autre (précise...)"
                    value={otherInput}
                    onChange={(event) => {
                      const value = event.target.value
                      if (value.includes(',')) addInterestsFromText(value)
                      else setOtherInput(value)
                    }}
                    onBlur={() => {
                      if (otherInput.trim()) addInterestsFromText(otherInput)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        if (otherInput.trim()) addInterestsFromText(otherInput)
                      }
                    }}
                    className="pakt-input text-sm"
                  />

                  <p className="text-white/40 text-xs mt-2">Sépare tes intérêts par une virgule</p>
                  <p className="text-white/40 text-xs mt-1">Maximum 5 intérêts</p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-6 pt-4">
                <div>
                  <h2 className="text-3xl font-bold mb-1">Ta ville 📍</h2>
                  <p className="text-white/50">Pour trouver des personnes près de toi</p>
                </div>

                <div className="relative">
                  <input
                    ref={cityInputRef}
                    type="text"
                    placeholder="Paris, Lyon, Bordeaux..."
                    value={data.city}
                    onChange={(event) =>
                      setData((prev) => ({
                        ...prev,
                        city: event.target.value,
                        cityPlaceId: '',
                        lat: null,
                        lng: null,
                      }))
                    }
                    className="pakt-input text-lg pr-12"
                    autoFocus
                    autoComplete="off"
                  />

                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <MapPin
                      size={20}
                      className={citySelected ? 'text-gold' : 'text-white/30'}
                    />
                  </div>
                </div>

                {cityAutocompleteError && (
                  <p className="text-red-400 text-sm">
                    Impossible de charger Google Places. Vérifie ta clé Google Maps.
                  </p>
                )}

                {!cityAutocompleteError && !cityAutocompleteReady && (
                  <p className="text-white/35 text-sm">Chargement des villes...</p>
                )}

                {data.city.trim() && !citySelected && cityAutocompleteReady && (
                  <p className="text-white/40 text-sm">
                    Sélectionne une ville dans la liste Google pour continuer.
                  </p>
                )}

                {citySelected && (
                  <p className="text-gold text-sm">
                    Ville sélectionnée : {data.city}
                  </p>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="flex flex-col gap-5 pt-4">
                <div>
                  <h2 className="text-3xl font-bold mb-1">Tes photos 📸</h2>
                  <p className="text-white/50">Ajoute jusqu'à {MAX_PHOTOS} photos (min 1)</p>
                </div>

                <div className="grid grid-cols-3 gap-3 w-full max-w-[650px] mx-auto">
                  {visiblePhotoSlots.map((url, idx) => {
                    const rootProps = getRootProps({
                      onClick: () => setSelectedPhotoIndex(idx),
                      onDragEnter: () => setSelectedPhotoIndex(idx),
                    })

                    return (
                      <div
                        key={`${url || 'empty'}-${idx}`}
                        {...rootProps}
                        className="relative aspect-square rounded-xl overflow-hidden bg-[#1e1e1e] border border-dark-500 cursor-pointer hover:border-gold/50 transition-colors"
                      >
                        <input {...getInputProps()} />

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

                        {url && (
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
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-6 pb-8 pt-4">
        <button
          onClick={goNext}
          disabled={!canProceed() || loading}
          className="btn-primary flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin w-4 h-4 border-2 border-dark border-t-transparent rounded-full" />
              Création du profil...
            </>
          ) : step === STEPS - 1 ? (
            '🚀 Lancer PAKT'
          ) : (
            <>
              Continuer
              <ChevronRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}