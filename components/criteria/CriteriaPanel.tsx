'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DEFAULT_PREFERENCES, type Preferences, type SkillFilter } from '@/lib/utils'
import { X, Check, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import SkillFiltersPicker from '@/components/skills/SkillFiltersPicker'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface CriteriaPanelProps {
  isOpen: boolean
  preferences: Preferences
  isPro: boolean
  onClose: () => void
  onSave: (prefs: Preferences) => Promise<void>
}

export default function CriteriaPanel({
  isOpen,
  preferences,
  isPro,
  onClose,
  onSave,
}: CriteriaPanelProps) {
  const [localPrefs, setLocalPrefs] = useState<Preferences>(preferences)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingPrefsRef = useRef<Preferences>(localPrefs)

  // Update pending ref whenever localPrefs changes
  useEffect(() => {
    pendingPrefsRef.current = localPrefs
  }, [localPrefs])

  // Sync localPrefs when preferences prop changes (panel opened)
  useEffect(() => {
    if (isOpen) {
      setLocalPrefs(preferences)
      setSaveStatus('idle')
    }
  }, [isOpen, preferences])

  const triggerSave = useCallback((delay = 800) => {
    if (!isPro) return // Non-Pro users can't save

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    setSaveStatus('saving')

    saveTimerRef.current = setTimeout(async () => {
      try {
        console.log('[CRITERIA] Saving preferences:', pendingPrefsRef.current)
        await onSave(pendingPrefsRef.current)
        setSaveStatus('saved')

        // Clear saved status after delay
        const clearTimer = setTimeout(() => {
          setSaveStatus('idle')
        }, 2000)

        return () => clearTimeout(clearTimer)
      } catch (error) {
        console.error('[CRITERIA] save error', error)
        setSaveStatus('error')
        toast.error('Erreur lors de la sauvegarde des critères')

        // Clear error status after delay
        const clearTimer = setTimeout(() => {
          setSaveStatus('idle')
        }, 3000)

        return () => clearTimeout(clearTimer)
      }
    }, delay)
  }, [isPro, onSave])

  const handleDistanceChange = (value: number) => {
    const numValue = Number(value)
    console.log('[CRITERIA] Distance changed:', { value, numValue, type: typeof numValue })
    setLocalPrefs((prev) => ({ ...prev, distance_km: numValue }))
    triggerSave()
  }

  const handleAgeMinChange = (value: number) => {
    const numValue = Number(value)
    console.log('[CRITERIA] Age min changed:', { value, numValue, type: typeof numValue })
    setLocalPrefs((prev) => ({
      ...prev,
      age_min: Math.min(numValue, prev.age_max),
    }))
    triggerSave()
  }

  const handleAgeMaxChange = (value: number) => {
    const numValue = Number(value)
    console.log('[CRITERIA] Age max changed:', { value, numValue, type: typeof numValue })
    setLocalPrefs((prev) => ({
      ...prev,
      age_max: Math.max(numValue, prev.age_min),
    }))
    triggerSave()
  }

  const handleSkillFiltersChange = (filters: SkillFilter[]) => {
    setLocalPrefs((prev) => ({ ...prev, skill_filters: filters }))
    triggerSave()
  }

  const handleReset = () => {
    setLocalPrefs(DEFAULT_PREFERENCES)
    triggerSave(400)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="fixed inset-x-4 bottom-0 z-[81] max-w-2xl mx-auto pb-6"
      >
        <div className="relative overflow-hidden rounded-t-[24px] border border-gold/20 bg-[#111111] shadow-[0_-25px_70px_rgba(0,0,0,0.6),0_0_40px_rgba(212,168,83,0.08)]">
          <div className="absolute inset-0 bg-gradient-to-b from-gold/[0.04] to-transparent pointer-events-none" />

          <div className="relative px-6 pt-6 pb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Mes critères</h2>
                <p className="text-xs text-white/40 mt-1">
                  {isPro ? 'Personnalise tes préférences de recherche' : 'Critères maximalement ouverts (Business Pro)'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Save Status */}
            <AnimatePresence mode="wait">
              {saveStatus !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className={`mb-4 p-3 rounded-[12px] flex items-center gap-2 text-sm ${
                    saveStatus === 'saving'
                      ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                      : saveStatus === 'saved'
                        ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                        : 'bg-red-500/10 border border-red-500/20 text-red-300'
                  }`}
                >
                  {saveStatus === 'saving' && (
                    <>
                      <div className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
                      <span>Sauvegarde en cours...</span>
                    </>
                  )}
                  {saveStatus === 'saved' && (
                    <>
                      <Check size={16} />
                      <span>Critères enregistrés</span>
                    </>
                  )}
                  {saveStatus === 'error' && (
                    <>
                      <AlertCircle size={16} />
                      <span>Erreur de sauvegarde</span>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {!isPro && (
              <div className="mb-6 p-4 rounded-[12px] bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-200">
                  📌 Passe Business Pro pour personnaliser tes critères et accéder à des filtres avancés par compétence.
                </p>
              </div>
            )}

            {/* Content */}
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              {/* Distance */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-white">
                    Distance
                    <span className="text-gold ml-1.5">{localPrefs.distance_km} km</span>
                  </label>
                  {!isPro && <span className="text-xs text-white/40">Verrouillé</span>}
                </div>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="10"
                  value={localPrefs.distance_km}
                  onChange={(e) => handleDistanceChange(Number(e.target.value))}
                  disabled={!isPro}
                  className="w-full h-2 rounded-lg bg-dark-300 appearance-none cursor-pointer accent-gold disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between text-xs text-white/30 mt-2">
                  <span>0 km</span>
                  <span>1000 km</span>
                </div>
              </div>

              {/* Age Range */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-white">
                    Âge
                    <span className="text-gold ml-1.5">
                      {localPrefs.age_min} - {localPrefs.age_max} ans
                    </span>
                  </label>
                  {!isPro && <span className="text-xs text-white/40">Verrouillé</span>}
                </div>

                <div className="space-y-3">
                  {/* Min Age */}
                  <div>
                    <input
                      type="range"
                      min="18"
                      max="99"
                      step="1"
                      value={localPrefs.age_min}
                      onChange={(e) => handleAgeMinChange(Number(e.target.value))}
                      disabled={!isPro}
                      className="w-full h-2 rounded-lg bg-dark-300 appearance-none cursor-pointer accent-gold disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="flex justify-between text-xs text-white/30 mt-1">
                      <span>18 ans</span>
                      <span>99 ans</span>
                    </div>
                  </div>

                  {/* Max Age */}
                  <div>
                    <input
                      type="range"
                      min="18"
                      max="99"
                      step="1"
                      value={localPrefs.age_max}
                      onChange={(e) => handleAgeMaxChange(Number(e.target.value))}
                      disabled={!isPro}
                      className="w-full h-2 rounded-lg bg-dark-300 appearance-none cursor-pointer accent-gold disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Skill Filters (Pro only) */}
              {isPro && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-white">
                      Filtres de compétences
                      <span className="text-white/40 ml-1.5 font-normal text-xs">
                        {localPrefs.skill_filters?.length || 0} filtre(s)
                      </span>
                    </label>
                  </div>
                  <SkillFiltersPicker
                    selectedFilters={localPrefs.skill_filters || []}
                    onFiltersChange={handleSkillFiltersChange}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            {isPro && (
              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-end gap-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-[12px] border border-white/10 bg-white/[0.04] text-white/60 text-sm font-medium hover:bg-white/[0.08] hover:text-white/80 transition-all"
                >
                  Réinitialiser
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  )
}
