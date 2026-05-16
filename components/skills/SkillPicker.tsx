'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SKILLS_LIST, type UserSkill } from '@/lib/utils'
import { X, Plus } from 'lucide-react'

interface SkillPickerProps {
  skills: UserSkill[]
  onChange: (skills: UserSkill[]) => void
}

export default function SkillPicker({ skills, onChange }: SkillPickerProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  const [selectedLevel, setSelectedLevel] = useState(5)

  const skillNames = new Set(skills.map((s) => s.name))
  const availableSkills = SKILLS_LIST.filter((skill) => !skillNames.has(skill))

  const handleAddSkill = useCallback(() => {
    if (!selectedSkill) return

    const newSkill: UserSkill = {
      name: selectedSkill,
      level: selectedLevel,
    }

    onChange([...skills, newSkill])
    setSelectedSkill(null)
    setSelectedLevel(5)
    setShowAddModal(false)
  }, [selectedSkill, selectedLevel, skills, onChange])

  const handleRemoveSkill = useCallback(
    (skillName: string) => {
      onChange(skills.filter((s) => s.name !== skillName))
    },
    [skills, onChange]
  )

  const handleUpdateLevel = useCallback(
    (skillName: string, level: number) => {
      onChange(
        skills.map((s) =>
          s.name === skillName ? { ...s, level } : s
        )
      )
    },
    [skills, onChange]
  )

  return (
    <div className="space-y-4">
      {/* Selected Skills */}
      <AnimatePresence mode="popLayout">
        {skills.map((skill) => (
          <motion.div
            key={skill.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="p-4 rounded-[12px] bg-dark-300 border border-dark-400 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">{skill.name}</span>
              <button
                onClick={() => handleRemoveSkill(skill.name)}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-red-500/30 flex items-center justify-center text-white/40 hover:text-red-300 transition-all"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs text-white/60">Niveau</label>
                <span className="text-xs font-medium text-gold">{skill.level}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={skill.level}
                onChange={(e) => handleUpdateLevel(skill.name, Number(e.target.value))}
                className="w-full h-2 rounded-lg bg-dark-400 appearance-none cursor-pointer accent-gold"
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add Skill Button */}
      {availableSkills.length > 0 && (
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full px-4 py-3 rounded-[12px] border border-gold/30 bg-gold/5 text-white text-sm font-medium flex items-center gap-2 justify-center hover:bg-gold/10 hover:border-gold/50 transition-all"
        >
          <Plus size={16} />
          Ajouter une compétence
        </button>
      )}

      {/* Add Skill Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-sm mx-auto"
            >
              <div className="bg-dark-200 border border-dark-400 rounded-[12px] p-5 space-y-4">
                <h3 className="text-lg font-bold text-white">Ajouter une compétence</h3>

                <div className="space-y-2">
                  <label className="text-sm text-white/60">Compétence</label>
                  <select
                    value={selectedSkill || ''}
                    onChange={(e) => setSelectedSkill(e.target.value || null)}
                    className="w-full px-4 py-2 rounded-[10px] bg-dark-300 border border-dark-400 text-white text-sm focus:border-gold/50 focus:outline-none"
                  >
                    <option value="">Sélectionner une compétence...</option>
                    {availableSkills.map((skill) => (
                      <option key={skill} value={skill}>
                        {skill}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-white/60">Niveau</label>
                    <span className="text-xs font-medium text-gold">{selectedLevel}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(Number(e.target.value))}
                    className="w-full h-2 rounded-lg bg-dark-400 appearance-none cursor-pointer accent-gold"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 rounded-[10px] border border-white/10 bg-white/5 text-white/60 text-sm font-medium hover:bg-white/10 transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddSkill}
                    disabled={!selectedSkill}
                    className="flex-1 px-4 py-2 rounded-[10px] bg-gradient-to-r from-gold to-[#e2c06d] text-dark text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_4px_15px_rgba(212,168,83,0.3)] active:scale-95 transition-all"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {skills.length === 0 && availableSkills.length === 0 && (
        <p className="text-center text-sm text-white/40">
          Toutes les compétences ont déjà été sélectionnées.
        </p>
      )}
    </div>
  )
}
