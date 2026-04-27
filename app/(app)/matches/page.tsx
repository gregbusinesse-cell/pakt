'use client'
// app/(app)/matches/page.tsx
// Messages page: matches + direct messages

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@supabase/auth-helpers-react'
import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { formatTime } from '@/lib/utils'
import type { Profile } from '@/lib/supabase/types'
import { MessageCircle, Users, Crown } from 'lucide-react'

interface ConversationItem {
  id: string
  type: 'match' | 'direct'
  otherUser: Profile
  lastMessage: string | null
  lastMessageAt: string | null
  unread?: boolean
}

function BusinessBanner({ type }: { type: 'matches' | 'direct' }) {
  const router = useRouter()

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
    window.location.href = "https://checkout.stripe.com/c/pay/cs_test_a1EOyhQb3zvA2y8kvEY2t5qaAFMEtLVxEExzPNpRIyx3EkYYmoqCtWQrwi"
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
  }, [session?.user?.id])

  const loadConversations = async () => {
    if (!session?.user) return
    setLoading(true)

    try {
      // Load match conversations
      const { data: matchConvs } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant1_id.eq.${session.user.id},participant2_id.eq.${session.user.id}`)
        .order('last_message_at', { ascending: false })

      // Load direct conversations
      const { data: directConvs } = await supabase
        .from('direct_conversations')
        .select('*')
        .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
        .order('last_message_at', { ascending: false })

      // Get all other user IDs
      const matchUserIds =
        matchConvs?.map((c) =>
(c as any).participant1_id === session.user.id 
  ? (c as any).participant2_id 
  : (c as any).participant1_id
          ) || []
      const directUserIds =
        directConvs?.map((c) =>
          (c as any).sender_id === session.user.id 
  ? (c as any).receiver_id 
  : (c as any).sender_id
        ) || []

      const allIds = [...new Set([...matchUserIds, ...directUserIds])]
      if (allIds.length === 0) {
        setLoading(false)
        return
      }

      const { data: profiles } = await supabase.from('profiles').select('*').in('id', allIds)

      const profileMap = new Map(profiles?.map((p) => [p.id, p]))

      const matchItems: ConversationItem[] = (matchConvs || [])
        .map((c) => ({
          id: c.id,
          type: 'match' as const,
          otherUser: profileMap.get(
            (c as any).participant1_id === session.user.id 
  ? (c as any).participant2_id 
  : (c as any).participant1_id
          )!,
          lastMessage: c.last_message,
          lastMessageAt: c.last_message_at,
        }))
        .filter((c) => c.otherUser)

      const directItems: ConversationItem[] = (directConvs || [])
        .map((c) => ({
          id: c.id,
          type: 'direct' as const,
          otherUser: profileMap.get(c.sender_id === session.user.id ? c.receiver_id : c.sender_id)!,
          lastMessage: c.last_message,
          lastMessageAt: c.last_message_at,
        }))
        .filter((c) => c.otherUser)

      setConversations([...matchItems, ...directItems])
    } finally {
      setLoading(false)
    }
  }

  const filtered = conversations.filter((c) => c.type === tab)

  return (
    <div className="h-full flex flex-col bg-dark">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 shrink-0">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>

        {/* Tabs */}
        <div className="flex bg-dark-200 rounded-2xl p-1">
          <button
            onClick={() => setTab('matches')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              tab === 'matches' ? 'bg-gold text-dark' : 'text-white/50'
            }`}
          >
            <Users size={15} />
            Matchs
          </button>
          <button
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

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {profile?.plan === 'free' && (
          <BusinessBanner type={tab === 'matches' ? 'matches' : 'direct'} />
        )}

        {loading ? (
          <div className="flex flex-col gap-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3">
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
            {filtered.map((conv, idx) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  href={`/chat/${conv.id}?type=${conv.type}&userId=${conv.otherUser.id}`}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-dark-200 active:bg-dark-300 transition-colors"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-dark-300 ring-2 ring-offset-2 ring-offset-dark ring-gold/30">
                      {conv.otherUser.photos?.[0] ? (
                        <img
                          src={(conv.otherUser.photos as any)[0]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          👤
                        </div>
                      )}
                    </div>
                    {conv.type === 'match' && (
                      <div className="absolute -bottom-0.5 -right-0.5 bg-gold text-dark text-[9px] font-black px-1 py-0.5 rounded-full">
                        ✓
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-semibold truncate">{conv.otherUser.first_name}</p>
                      {conv.lastMessageAt && (
                        <span className="text-white/30 text-xs shrink-0 ml-2">
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-white/40 text-sm truncate">
                      {conv.lastMessage ||
                        (conv.type === 'match'
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