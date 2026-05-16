'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SKILLS_LIST, type SkillFilter } from '@/lib/utils'
import { X, Plus } from 'lucide-react'

interface SkillFiltersPickerProps {
  selectedFilters: SkillFilter[]
  onFiltersChange: (filters: SkillFilter[]) => void
}

export default function SkillFiltersPicker({ selectedFilters, onFiltersChange }: SkillFiltersPickerProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  const [selectedLevel, setSelectedLevel] = useState(5)

  const selectedSkillNames = new Set(selectedFilters.map((f) => f.name))
  const availableSkills = SKILLS_LIST.filter((skill) => !selectedSkillNames.has(skill))

  const handleAddFilter = useCallback(() => {
    if (!selectedSkill) return

    const newFilter: SkillFilter = {
      name: selectedSkill,
      min_level: selectedLevel,
    }

    onFiltersChange([...selectedFilters, newFilter])
    setSelectedSkill(null)
    setSelectedLevel(5)
    setShowDropdown(false)
  }, [selectedSkill, selectedLevel, selectedFilters, onFiltersChange])

  const handleRemoveFilter = useCallback(
    (skillName: string) => {
      onFiltersChange(selectedFilters.filter((f) => f.name !== skillName))
    },
    [selectedFilters, onFiltersChange]
  )

  const handleUpdateLevel = useCallback(
    (skillName: string, level: number) => {
      onFiltersChange(
        selectedFilters.map((f) =>
          f.name === skillName ? { ...f, min_level: level } : f
        )
      )
    },
    [selectedFilters, onFiltersChange]
  )

  return (
    <div className="space-y-4">
      {/* Selected Filters */}
      <AnimatePresence mode="popLayout">
        {selectedFilters.map((filter) => (
          <motion.div
            key={filter.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="p-3 rounded-[12px] bg-dark-300 border border-gold/20 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">{filter.name}</span>
              <button
                onClick={() => handleRemoveFilter(filter.name)}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-red-500/30 flex items-center justify-center text-white/40 hover:text-red-300 transition-all"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs text-white/60">Niveau minimum</label>
                <span className="text-xs font-medium text-gold">{filter.min_level}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={filter.min_level}
                onChange={(e) => handleUpdateLevel(filter.name, Number(e.target.value))}
                className="w-full h-1.5 rounded-lg bg-dark-400 appearance-none cursor-pointer accent-gold"
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add Filter Button */}
      {availableSkills.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full px-4 py-3 rounded-[12px] border border-gold/30 bg-gold/5 text-white text-sm font-medium flex items-center gap-2 justify-center hover:bg-gold/10 hover:border-gold/50 transition-all"
          >
            <Plus size={16} />
            Ajouter un filtre de compétence
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 z-10 bg-dark-200 border border-dark-400 rounded-[12px] overflow-hidden shadow-xl"
              >
                <div className="max-h-48 overflow-y-auto">
                  {availableSkills.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => setSelectedSkill(skill)}
                      className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-gold/10 transition-colors border-b border-dark-400 last:border-b-0"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Skill Level Selector */}
      {selectedSkill && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="p-4 rounded-[12px] bg-gold/10 border border-gold/30 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">{selectedSkill}</span>
            <span className="text-xs font-medium text-gold">Niveau: {selectedLevel}/10</span>
          </div>

          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(Number(e.target.value))}
            className="w-full h-2 rounded-lg bg-dark-300 appearance-none cursor-pointer accent-gold"
          />

          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedSkill(null)
                setSelectedLevel(5)
              }}
              className="flex-1 px-3 py-2 rounded-[10px] border border-white/10 bg-white/5 text-white/60 text-xs font-medium hover:bg-white/10 transition-all"
            >
              Annuler
            </button>
            <button
              onClick={handleAddFilter}
              className="flex-1 px-3 py-2 rounded-[10px] bg-gradient-to-r from-gold to-[#e2c06d] text-dark text-xs font-bold hover:shadow-[0_4px_15px_rgba(212,168,83,0.3)] active:scale-95 transition-all"
            >
              Ajouter
            </button>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {selectedFilters.length === 0 && availableSkills.length === 0 && (
        <p className="text-center text-sm text-white/40">
          Toutes les compétences ont déjà été sélectionnées.
        </p>
      )}
    </div>
  )
}
