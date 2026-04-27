'use client'

// app/(app)/matches/page.tsx
// Messages page: matches + direct messages

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@supabase/auth-helpers-react'
import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { formatTime } from '@/lib/utils'
import type { Profile } from '@/lib/supabase/types'
import { MessageCircle, Users, Crown } from 'lucide-react'

type ConversationItem = {
  id: string
  type: 'match' | 'direct'
  otherUser: any

  lastMessage?: string
  lastMessageAt?: string
}

interface ConversationItem {
  id: string
  type: 'match' | 'direct'
  otherUser: Profile
  lastMessage: string | null
  lastMessageAt: string | null
  unread?: boolean
}

interface MatchConversationRow {
  id: string
  participant1_id: string
  participant2_id: string
  last_message: string | null
  last_message_at: string | null
}

interface DirectConversationRow {
  id: string
  sender_id: string
  receiver_id: string
  last_message: string | null
  last_message_at: string | null
}

function BusinessBanner({ type }: { type: 'matches' | 'direct' }) {
  const content =
    type === 'matches'
      ? {
          title: 'Pssst... Trouve ton partenaire plus vite',
          text: 'Les membres PAKT Business trouvent leur partenaire jusqu’à 4x plus rapidement.',
        }
      : {
          title: 'Pssst... Passe à la vitesse supérieure',
          text: 'Envoie des messages sans limite et maximise tes opportunités avec PAKT Business.',
        }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gold/10 border border-gold/30 rounded-[12px] p-4 mb-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Crown size={16} className="text-gold" />
            <p className="font-semibold text-white text-sm">{content.title}</p>
          </div>
          <p className="text-white/60 text-sm leading-relaxed">{content.text}</p>
        </div>

        <button
          type="button"
          onClick={() => {
            window.location.href =
              'https://checkout.stripe.com/c/pay/cs_test_a1EOyhQb3zvA2y8kvEY2t5qaAFMEtLVxEExzPNpRIyx3EkYYmoqCtWQrwi'
          }}
          className="shrink-0 bg-gold text-dark px-4 py-2 rounded-[10px] text-sm font-bold transition-transform hover:scale-[1.03] active:scale-[0.99]"
        >
          Découvrir PAKT Business
        </button>
      </div>
    </motion.div>
  )
}

export default function MatchesPage() {
  const session = useSession()
  const supabase = createClient()
  const { profile } = useAppStore()

  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'matches' | 'direct'>('matches')

  useEffect(() => {
    if (!session?.user) return

    loadConversations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id])

  const loadConversations = async () => {
    if (!session?.user) return

    setLoading(true)

    try {
      const { data: matchConvsData } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant1_id.eq.${session.user.id},participant2_id.eq.${session.user.id}`)
        .order('last_message_at', { ascending: false })

      const { data: directConvsData } = await supabase
        .from('direct_conversations')
        .select('*')
        .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
        .order('last_message_at', { ascending: false })

      const matchConvs = (matchConvsData ?? []) as MatchConversationRow[]
      const directConvs = (directConvsData ?? []) as DirectConversationRow[]

      const matchUserIds = matchConvs.map((conversation) =>
        conversation.participant1_id === session.user.id
          ? conversation.participant2_id
          : conversation.participant1_id,
      )

      const directUserIds = directConvs.map((conversation) =>
        conversation.sender_id === session.user.id
          ? conversation.receiver_id
          : conversation.sender_id,
      )

      const allIds = Array.from(new Set([...matchUserIds, ...directUserIds]))

      if (allIds.length === 0) {
        setConversations([])
        return
      }

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', allIds)

      const profiles = (profilesData ?? []) as Profile[]
      const profileMap = new Map<string, Profile>(
        profiles.map((userProfile) => [userProfile.id, userProfile]),
      )

      const matchItems: ConversationItem[] = (matchConvs || [])
  .map((conversation) => {
    if (!conversation) return null

    const otherUserId =
      conversation.participant1_id === session.user.id
        ? conversation.participant2_id
        : conversation.participant1_id

    const otherUser = profileMap.get(otherUserId)

    if (!otherUser) return null

    return {
      id: conversation.id,
      type: 'match' as const,
      otherUser,
    }
  })
  .filter(Boolean) as ConversationItem[]
  
      const directItems: ConversationItem[] = (directConvs || [])
  .map((conversation) => {
    if (!conversation) return null

    const otherUserId =
      conversation.sender_id === session.user.id
        ? conversation.receiver_id
        : conversation.sender_id

    const otherUser = profileMap.get(otherUserId)

    if (!otherUser) return null

    return {
      id: conversation.id,
      type: 'direct' as const,
      otherUser,
      lastMessage: conversation.last_message,
      lastMessageAt: conversation.last_message_at,
    }
  })
  .filter(Boolean) as ConversationItem[]
  
      setConversations([...matchItems, ...directItems])
    } finally {
      setLoading(false)
    }
  }

  const filtered = conversations.filter((conversation) => conversation.type === tab)

  return (
    <div className="h-full flex flex-col bg-dark">
      <div className="px-5 pt-5 pb-3 shrink-0">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>

        <div className="flex bg-dark-200 rounded-2xl p-1">
          <button
            type="button"
            onClick={() => setTab('matches')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              tab === 'matches' ? 'bg-gold text-dark' : 'text-white/50'
            }`}
          >
            <Users size={15} />
            Matchs
          </button>

          <button
            type="button"
            onClick={() => setTab('direct')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              tab === 'direct' ? 'bg-gold text-dark' : 'text-white/50'
            }`}
          >
            <MessageCircle size={15} />
            Conversations
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {profile?.plan === 'free' && (
          <BusinessBanner type={tab === 'matches' ? 'matches' : 'direct'} />
        )}

        {loading ? (
          <div className="flex flex-col gap-3 pt-2">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center gap-3 p-3">
                <div className="w-14 h-14 rounded-full shimmer shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded shimmer" />
                  <div className="h-3 w-40 rounded shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-2/3 text-center gap-4">
            <span className="text-5xl">{tab === 'matches' ? '⚔️' : '✉️'}</span>
            <div>
              <h3 className="font-semibold text-lg mb-1">
                {tab === 'matches' ? 'Pas encore de matchs' : 'Aucune conversation pour le moment'}
              </h3>
              <p className="text-white/40 text-sm">
                {tab === 'matches'
                  ? 'Continue à swiper pour trouver tes matchs !'
                  : "Tu peux envoyer un message depuis le profil de quelqu'un"}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1 pt-2">
            {filtered.map((conversation, index) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={`/chat/${conversation.id}?type=${conversation.type}&userId=${conversation.otherUser.id}`}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-dark-200 active:bg-dark-300 transition-colors"
                >
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-dark-300 ring-2 ring-offset-2 ring-offset-dark ring-gold/30">
                      {conversation.otherUser.photos?.[0] ? (
                        <img
                          src={(conversation.otherUser.photos as string[])[0]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          👤
                        </div>
                      )}
                    </div>

                    {conversation.type === 'match' && (
                      <div className="absolute -bottom-0.5 -right-0.5 bg-gold text-dark text-[9px] font-black px-1 py-0.5 rounded-full">
                        ✓
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-semibold truncate">
                        {conversation.otherUser.first_name}
                      </p>

                      {conversation.lastMessageAt && (
                        <span className="text-white/30 text-xs shrink-0 ml-2">
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                      )}
                    </div>

                    <p className="text-white/40 text-sm truncate">
                      {conversation.lastMessage ||
                        (conversation.type === 'match'
                          ? '🎉 Nouveau match ! Dis bonjour'
                          : 'Nouveau message')}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}