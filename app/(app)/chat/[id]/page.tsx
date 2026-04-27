'use client'
// app/(app)/chat/[id]/page.tsx
// Individual chat page

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@supabase/auth-helpers-react'
import ChatView from '@/components/chat/ChatView'
import type { Profile } from '@/lib/supabase/types'

export default function ChatPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const session = useSession()
  const supabase = createClient()

  const conversationId = params.id as string
  const conversationType = (searchParams.get('type') || 'match') as 'match' | 'direct'
  const userId = searchParams.get('userId')

  const [otherUser, setOtherUser] = useState<Profile | null>(null)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data }) => setOtherUser(data))
  }, [userId])

  if (!otherUser) {
    return (
      <div className="h-full flex items-center justify-center bg-dark">
        <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <ChatView
      conversationId={conversationId}
      conversationType={conversationType}
      otherUser={otherUser}
    />
  )
}
