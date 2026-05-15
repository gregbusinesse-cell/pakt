'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { SKILLS_LIST, type UserSkill } from '@/lib/utils'

interface Props {
  skills: UserSkill[]
  onChange: (skills: UserSkill[]) => void
}

export default function SkillPicker({ skills, onChange }: Props) {
  const [customInput, setCustomInput] = useState('')
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null)

  const selectedNames = new Set(skills.map((s) => s.name.toLowerCase()))

  const addSkill = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed || selectedNames.has(trimmed.toLowerCase())) return

    // level=0 means "not yet set" — user MUST adjust the slider
    const newSkill: UserSkill = { name: trimmed, level: 0 }
    onChange([...skills, newSkill])
    setExpandedSkill(trimmed)
    setCustomInput('')
  }

  const removeSkill = (name: string) => {
    onChange(skills.filter((s) => s.name !== name))
    if (expandedSkill === name) setExpandedSkill(null)
  }

  const updateLevel = (name: string, level: number) => {
    onChange(skills.map((s) => (s.name === name ? { ...s, level } : s)))
  }

  const updateComment = (name: string, comment: string) => {
    onChange(
      skills.map((s) =>
        s.name === name
          ? { ...s, comment: comment || undefined }
          : s
      )
    )
  }

  const toggleExpand = (name: string) => {
    setExpandedSkill((prev) => (prev === name ? null : name))
  }

  const levelLabel = (level: number) => {
    if (level === 0) return 'A definir'
    if (level <= 3) return 'Debutant'
    if (level <= 5) return 'Intermediaire'
    if (level <= 7) return 'Avance'
    if (level <= 9) return 'Expert'
    return 'Maitre'
  }

  const availableSuggestions = SKILLS_LIST.filter(
    (s) => !selectedNames.has(s.toLowerCase())
  )

  const hasUnsetLevels = skills.some((s) => s.level === 0)

  return (
    <div className="space-y-4">
      {/* Selected skills */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {skills.map((skill) => {
            const isExpanded = expandedSkill === skill.name
            const needsLevel = skill.level === 0

            return (
              <motion.div
                key={skill.name}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`rounded-[12px] border overflow-hidden ${
                  needsLevel
                    ? 'border-red-500/30 bg-dark-200'
                    : 'border-gold/20 bg-dark-200'
                }`}
              >
                {/* Header */}
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => removeSkill(skill.name)}
                    className="shrink-0 w-6 h-6 rounded-full bg-red-500/15 flex items-center justify-center hover:bg-red-500/30 transition-colors"
                  >
                    <X size={12} className="text-red-400" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{skill.name}</p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {needsLevel ? (
                      <span className="text-[10px] text-red-400 font-medium">Niveau requis</span>
                    ) : (
                      <>
                        <span className="text-xs text-gold/70 font-semibold">{skill.level}/10</span>
                        <span className="text-[10px] text-white/40">{levelLabel(skill.level)}</span>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleExpand(skill.name)}
                    className="shrink-0 w-7 h-7 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUp size={14} className="text-white/40" />
                    ) : (
                      <ChevronDown size={14} className="text-white/40" />
                    )}
                  </button>
                </div>

                {/* Level bar */}
                {skill.level > 0 && (
                  <div className="px-3 pb-2">
                    <div className="h-1.5 rounded-full bg-dark-400 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold"
                        initial={false}
                        animate={{ width: `${skill.level * 10}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  </div>
                )}

                {/* Expanded: slider + comment */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-3 border-t border-white/5 pt-3">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-xs text-white/50">
                              Niveau {needsLevel && <span className="text-red-400">*</span>}
                            </p>
                            <p className={`text-xs font-semibold ${needsLevel ? 'text-red-400' : 'text-gold'}`}>
                              {skill.level === 0 ? 'Non defini' : `${skill.level}/10`}
                            </p>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={10}
                            step={1}
                            value={skill.level || 1}
                            onChange={(e) => updateLevel(skill.name, parseInt(e.target.value))}
                            className="w-full h-2 rounded-full appearance-none bg-dark-400 accent-[#d4a853] cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-dark"
                          />
                          <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-white/25">1</span>
                            <span className="text-[10px] text-white/25">5</span>
                            <span className="text-[10px] text-white/25">10</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-white/50 mb-1.5">Commentaire (optionnel)</p>
                          <input
                            type="text"
                            value={skill.comment || ''}
                            onChange={(e) => updateComment(skill.name, e.target.value)}
                            placeholder="Ex: 3 ans d'experience..."
                            maxLength={100}
                            className="w-full bg-dark-300 border border-dark-500 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-gold/50 placeholder:text-white/25 transition-colors"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {hasUnsetLevels && (
        <p className="text-xs text-red-400/80">
          Certaines competences n'ont pas de niveau. Clique sur la fleche pour le definir.
        </p>
      )}

      {/* Add custom skill */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (customInput.trim()) addSkill(customInput)
            }
          }}
          placeholder="Ajouter une competence..."
          maxLength={40}
          className="flex-1 bg-dark-300 border border-dark-500 text-white text-sm rounded-lg px-3 py-2.5 outline-none focus:border-gold/50 placeholder:text-white/30 transition-colors"
        />
        <button
          type="button"
          onClick={() => {
            if (customInput.trim()) addSkill(customInput)
          }}
          disabled={!customInput.trim()}
          className="shrink-0 w-10 h-10 rounded-lg bg-gold/15 border border-gold/25 flex items-center justify-center hover:bg-gold/25 transition-colors disabled:opacity-30"
        >
          <Plus size={16} className="text-gold" />
        </button>
      </div>

      {/* Suggestions */}
      {availableSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {availableSuggestions.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => addSkill(name)}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-dark-300 text-white/60 border border-dark-500 hover:border-gold/30 hover:text-white/80 transition-all"
            >
              + {name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
