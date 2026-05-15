'use client'

import { type UserSkill, parseSkills } from '@/lib/utils'

interface Props {
  skills: unknown
  compact?: boolean
}

export default function SkillDisplay({ skills, compact = false }: Props) {
  const parsed = parseSkills(skills).filter((s) => s.level >= 1)

  if (parsed.length === 0) return null

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {parsed.map((skill) => (
          <div
            key={skill.name}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/[0.08] border border-gold/15"
          >
            <span className="text-xs text-white/70 font-medium">{skill.name}</span>
            <span className="text-[10px] text-gold font-bold">{skill.level}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {parsed.map((skill) => (
        <div key={skill.name} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/80 font-medium">{skill.name}</span>
            <span className="text-xs text-gold/70 font-semibold">{skill.level}/10</span>
          </div>

          <div className="h-1.5 rounded-full bg-dark-400 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold transition-all duration-300"
              style={{ width: `${skill.level * 10}%` }}
            />
          </div>

          {skill.comment && (
            <p className="text-[11px] text-white/35 leading-relaxed">{skill.comment}</p>
          )}
        </div>
      ))}
    </div>
  )
}
