'use client'

// app/(app)/onboarding/page.tsx

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { useSession } from '@supabase/auth-helpers-react'
import { INTERESTS, MAX_PHOTOS, validatePhoto, type UserSkill } from '@/lib/utils'
import { X, Plus, ChevronRight, ChevronLeft, MapPin } from 'lucide-react'
import { getStoredRef, clearStoredRef } from '@/components/providers/RefCaptureProvider'
import SkillPicker from '@/components/skills/SkillPicker'

const STEPS = 6
const MAX_INTERESTS = 5

type PhotoItem = { type: 'new'; url: string; file: File }

type CityPrediction = {
  place_id: string
  description: string
  structured_formatting?: {
    main_text?: string
    secondary_text?: string
  }
}

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
      console.log('google:', window.google)

      if (
        window.google?.maps?.places?.AutocompleteService &&
        window.google?.maps?.places?.PlacesService
      ) {
        resolve()
        return
      }

      if (Date.now() - startedAt >= timeoutMs) {
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

  if (
    window.google?.maps?.places?.AutocompleteService &&
    window.google?.maps?.places?.PlacesService
  ) {
    return
  }

  if (googlePlacesPromise) {
    return googlePlacesPromise
  }

  googlePlacesPromise = new Promise((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!key) {
      googlePlacesPromise = null
      reject(new Error('Clé Google Maps manquante'))
      return
    }

    const existingScript =
      document.getElementById('google-places-script') ||
      document.querySelector<HTMLScriptElement>('script[data-google-places="true"]')

    if (existingScript) {
      waitForGooglePlaces()
        .then(resolve)
        .catch((error) => {
          googlePlacesPromise = null
          reject(error)
        })

      return
    }

    const script = document.createElement('script')
    script.id = 'google-places-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      key
    )}&libraries=places&language=fr&region=FR&v=weekly`
    script.async = true
    script.defer = true
    script.dataset.googlePlaces = 'true'

    script.onload = () => {
      waitForGooglePlaces()
        .then(resolve)
        .catch((error) => {
          googlePlacesPromise = null
          reject(error)
        })
    }

    script.onerror = () => {
      googlePlacesPromise = null
      script.remove()
      reject(new Error('Google Maps indisponible'))
    }

    document.head.appendChild(script)
  })

  return googlePlacesPromise
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
  const [citySuggestions, setCitySuggestions] = useState<CityPrediction[]>([])
  const [citySuggestionsLoading, setCitySuggestionsLoading] = useState(false)
  const [cityInputFocused, setCityInputFocused] = useState(false)
  const [cityDebugMessage, setCityDebugMessage] = useState('')

  const autocompleteServiceRef = useRef<any>(null)
  const placesServiceRef = useRef<any>(null)
  const placesSessionTokenRef = useRef<any>(null)
  const cityDebounceRef = useRef<number | null>(null)

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
  const [selectedSkills, setSelectedSkills] = useState<UserSkill[]>([])

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
    if (step !== 3) return

    let cancelled = false

    async function initGooglePlaces() {
      try {
        setCityAutocompleteError(false)
        setCityAutocompleteReady(false)
        setCityDebugMessage('')

        await loadGooglePlacesScript()

        if (cancelled) return

        console.log('google:', window.google)

        if (
          !window.google?.maps?.places?.AutocompleteService ||
          !window.google?.maps?.places?.PlacesService
        ) {
          throw new Error('Google Places non chargé')
        }

        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService()
        placesServiceRef.current = new window.google.maps.places.PlacesService(
          document.createElement('div')
        )
        placesSessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken()

        setCityAutocompleteReady(true)
        setCityAutocompleteError(false)
      } catch (error) {
        console.error('[Google Places] init failed', error)

        if (!cancelled) {
          setCityAutocompleteReady(false)
          setCityAutocompleteError(true)
          setCityDebugMessage(error instanceof Error ? error.message : 'Erreur Google Places')
          toast.error('Autocomplete ville indisponible')
        }
      }
    }

    initGooglePlaces()

    return () => {
      cancelled = true
      setCitySuggestions([])
      setCitySuggestionsLoading(false)

      if (cityDebounceRef.current) {
        window.clearTimeout(cityDebounceRef.current)
      }
    }
  }, [step])

  useEffect(() => {
    if (step !== 3 || !cityAutocompleteReady || citySelected) {
      setCitySuggestions([])
      setCitySuggestionsLoading(false)
      return
    }

    const input = data.city.trim()

    if (cityDebounceRef.current) {
      window.clearTimeout(cityDebounceRef.current)
    }

    if (input.length < 2) {
      setCitySuggestions([])
      setCitySuggestionsLoading(false)
      setCityDebugMessage('')
      return
    }

    cityDebounceRef.current = window.setTimeout(() => {
      if (!autocompleteServiceRef.current || !window.google?.maps?.places) {
        setCitySuggestions([])
        setCitySuggestionsLoading(false)
        setCityAutocompleteError(true)
        setCityDebugMessage('Google Places non disponible')
        return
      }

      setCitySuggestionsLoading(true)
      setCityAutocompleteError(false)
      setCityDebugMessage('')

      autocompleteServiceRef.current.getPlacePredictions(
        {
          input,
          types: ['(cities)'],
          componentRestrictions: { country: 'fr' },
          sessionToken: placesSessionTokenRef.current,
        },
        (predictions: CityPrediction[] | null, status: string) => {
          setCitySuggestionsLoading(false)

          console.log('[Google Places] predictions status:', status)
          console.log('[Google Places] predictions:', predictions)

          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions?.length) {
            setCitySuggestions(predictions)
            setCityAutocompleteError(false)
            setCityDebugMessage('')
            return
          }

          setCitySuggestions([])

          if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            setCityDebugMessage('Aucune ville trouvée')
            return
          }

          if (status === 'REQUEST_DENIED') {
            setCityAutocompleteError(true)
            setCityDebugMessage('Google refuse la clé API ou le domaine')
            toast.error('Google Places refuse la clé API ou le domaine')
            return
          }

          if (status === 'OVER_QUERY_LIMIT') {
            setCityAutocompleteError(true)
            setCityDebugMessage('Quota Google Places dépassé')
            toast.error('Quota Google Places dépassé')
            return
          }

          setCityDebugMessage(`Google Places: ${status}`)
        }
      )
    }, 250)
  }, [data.city, cityAutocompleteReady, citySelected, step])

  const selectCity = (prediction: CityPrediction) => {
    if (!placesServiceRef.current || !window.google?.maps?.places) {
      toast.error('Google Places indisponible')
      return
    }

    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['place_id', 'name', 'formatted_address', 'geometry', 'address_components'],
        sessionToken: placesSessionTokenRef.current,
      },
      (place: any, status: string) => {
        console.log('[Google Places] details status:', status)
        console.log('[Google Places] place:', place)

        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place) {
          toast.error('Ville introuvable')
          return
        }

        const location = place.geometry?.location

        if (!place.place_id || !location) {
          toast.error('Ville invalide')
          return
        }

        const cityName =
          place.address_components?.find((component: any) =>
            component.types?.includes('locality')
          )?.long_name ||
          place.address_components?.find((component: any) =>
            component.types?.includes('postal_town')
          )?.long_name ||
          place.address_components?.find((component: any) =>
            component.types?.includes('administrative_area_level_2')
          )?.long_name ||
          place.name ||
          place.formatted_address ||
          prediction.description

        setData((prev) => ({
          ...prev,
          city: cityName,
          cityPlaceId: place.place_id,
          lat: location.lat(),
          lng: location.lng(),
        }))

        setCitySuggestions([])
        setCityInputFocused(false)
        setCityAutocompleteError(false)
        setCityDebugMessage('')
        placesSessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken()
      }
    )
  }

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

  const [photoValidating, setPhotoValidating] = useState(false)

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
        // Skills — optional, but if any selected they must all have levels set
        return selectedSkills.length === 0 || selectedSkills.every((s) => s.level >= 1)
      case 5:
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
        const safeName = photo.name.replace(/[^a-zA-Z0-9._-]/g, '-')
        const fileName = `${session.user.id}/${Date.now()}-${safeName}`

        console.log('[ONBOARDING] uploading photo:', fileName, 'size:', photo.size, 'type:', photo.type)

        const { data: uploadData, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, photo, { upsert: true })

        if (error) {
          console.error('[ONBOARDING] photo upload error:', {
            message: error.message,
            name: error.name,
            fileName,
          })
          throw new Error(`Upload photo: ${error.message}`)
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(uploadData.path)

        console.log('[ONBOARDING] photo uploaded:', publicUrl)
        uploadedUrls.push(publicUrl)
      }

      const isGoogle = session.user.app_metadata?.provider === 'google'
      const today = new Date().toISOString().split('T')[0]

      const referralCode = getStoredRef()

      const profilePayload: Record<string, unknown> = {
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
        skills: selectedSkills.filter((s) => s.level >= 1),
        is_onboarded: true,
        email_confirmed: isGoogle,
        plan: 'free',
        swipes_today: 0,
        messages_today: 0,
        last_swipe_date: today,
        last_message_date: today,
      }

      console.log('[ONBOARDING] profile payload:', profilePayload)

      const { error, data: upsertResult } = await supabase
        .from('profiles')
        .upsert(profilePayload as never)
        .select('id')
        .single()

      if (error) {
        console.error('[ONBOARDING] profile upsert error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw new Error(`Profil: ${error.message}`)
      }

      console.log('[ONBOARDING] profile created:', upsertResult)

      // Send welcome email (non-blocking)
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (currentSession?.access_token) {
          fetch('/api/emails/welcome', {
            method: 'POST',
            headers: { Authorization: `Bearer ${currentSession.access_token}` },
          }).catch(() => {})
        }
      } catch {
        // Silent — welcome email is not critical
      }

      // Track referral (non-blocking — don't fail onboarding if referral fails)
      if (referralCode) {
        try {
          await supabase.from('referrals').insert({
            referred_id: session.user.id,
            referrer_id: referralCode,
          } as never)
          clearStoredRef()
        } catch (refErr) {
          console.warn('[ONBOARDING] referral insert failed (non-blocking):', refErr)
        }
      }

      router.push('/loading')
    } catch (err) {
      console.error('[ONBOARDING] handleSubmit error:', err)
      const message = err instanceof Error ? err.message : 'Erreur lors de la création du profil'
      toast.error(message, { duration: 6000 })
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

      <div className={`flex-1 relative px-6 ${step === 3 ? 'overflow-visible z-50' : 'overflow-hidden'}`}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className={`h-full flex flex-col ${step === 3 ? 'overflow-visible z-50' : ''}`}
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
              <div className="flex flex-col gap-6 pt-4 overflow-visible relative z-50">
                <div>
                  <h2 className="text-3xl font-bold mb-1">Ta ville 📍</h2>
                  <p className="text-white/50">Pour trouver des personnes près de toi</p>
                </div>

                <div className="relative z-[999999]">
                  <input
                    type="text"
                    placeholder="Paris, Lyon, Bordeaux..."
                    value={data.city}
                    onFocus={() => setCityInputFocused(true)}
                    onBlur={() => window.setTimeout(() => setCityInputFocused(false), 180)}
                    onChange={(event) => {
                      setData((prev) => ({
                        ...prev,
                        city: event.target.value,
                        cityPlaceId: '',
                        lat: null,
                        lng: null,
                      }))
                    }}
                    className="pakt-input text-lg pr-12"
                    autoFocus
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />

                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <MapPin
                      size={20}
                      className={citySelected ? 'text-gold' : 'text-white/30'}
                    />
                  </div>

                  {cityInputFocused && cityAutocompleteReady && citySuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-2 max-h-72 overflow-y-auto rounded-xl border border-dark-500 bg-[#1e1e1e] shadow-2xl z-[999999]">
                      {citySuggestions.map((suggestion) => (
                        <button
                          key={suggestion.place_id}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault()
                            selectCity(suggestion)
                          }}
                          className="w-full text-left px-4 py-3 border-b border-white/5 last:border-b-0 hover:bg-gold/10 transition-colors"
                        >
                          <span className="block text-sm font-semibold text-white">
                            {suggestion.structured_formatting?.main_text || suggestion.description}
                          </span>

                          {suggestion.structured_formatting?.secondary_text && (
                            <span className="block text-xs text-white/45 mt-0.5">
                              {suggestion.structured_formatting.secondary_text}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {cityAutocompleteError && (
                  <p className="text-red-400 text-sm">
                    Impossible de charger Google Places. {cityDebugMessage || 'Vérifie ta clé Google Maps.'}
                  </p>
                )}

                {!cityAutocompleteError && !cityAutocompleteReady && (
                  <p className="text-white/35 text-sm">Chargement des villes...</p>
                )}

                {citySuggestionsLoading && data.city.trim().length >= 2 && !citySelected && (
                  <p className="text-white/35 text-sm">Recherche des villes...</p>
                )}

                {!cityAutocompleteError && cityDebugMessage && !citySelected && (
                  <p className="text-white/35 text-sm">{cityDebugMessage}</p>
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
                  <h2 className="text-3xl font-bold mb-1">Tes competences</h2>
                  <p className="text-white/50">Selectionne uniquement les competences que tu maitrises vraiment.</p>
                  <p className="text-white/30 text-xs mt-1">Chaque competence necessite un niveau honnete de 1 a 10.</p>
                </div>

                <SkillPicker skills={selectedSkills} onChange={setSelectedSkills} />
              </div>
            )}

            {step === 5 && (
              <div className="flex flex-col gap-5 pt-4">
                <div>
                  <h2 className="text-3xl font-bold mb-1">Tes photos 📸</h2>
                  <p className="text-white/50">Ajoute jusqu&apos;à {MAX_PHOTOS} photos (min 1)</p>
                  <p className="text-white/30 text-xs mt-1">Minimum 400×400px · JPG, PNG ou WebP</p>
                </div>

                {photoValidating && (
                  <div className="flex items-center gap-2 text-gold text-sm">
                    <div className="w-4 h-4 rounded-full border-2 border-gold border-t-transparent animate-spin" />
                    Vérification de la photo...
                  </div>
                )}

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