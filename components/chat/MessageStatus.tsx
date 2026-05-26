import { Check, CheckCheck } from 'lucide-react'

interface Props {
  isRead: boolean
  isSending?: boolean
}

export default function MessageStatus({ isRead, isSending }: Props) {
  if (isSending) {
    return (
      <div className="inline-flex items-center gap-0.5 ml-1">
        <Check size={14} className="text-white/40" />
      </div>
    )
  }

  if (isRead) {
    return (
      <div className="inline-flex items-center gap-0.5 ml-1">
        <CheckCheck size={14} className="text-gold" />
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-0.5 ml-1">
      <Check size={14} className="text-white/40" />
    </div>
  )
}
