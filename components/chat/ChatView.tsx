'use client'

// components/chat/ChatView.tsx

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@supabase/auth-helpers-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Message, Profile } from '@/lib/supabase/types'
import { formatTime, formatFileSize, normalizePlan, isPaidPlan, canChat } from '@/lib/utils'
import {
  Send,
  Paperclip,
  Mic,
  Image,
  X,
  Download,
  FileText,
  Play,
  Pause,
  Square,
  ChevronLeft,
  Sparkles,
  MoreVertical,
  Flag,
  Ban,
  Trash2,
  UserCircle2,
  Lock,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import SwipeCard from '@/components/swipe/SwipeCard'
import { useAppStore } from '@/lib/store'
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'
import MessageStatus from '@/components/chat/MessageStatus'

interface Props {
  conversationId: string
  conversationType: 'match' | 'direct'
  otherUser: Profile
}

const MIN_AUDIO_SIZE_BYTES = 3000
const MIN_RECORDING_MS = 900

function getSupportedAudioMimeType() {
  if (typeof MediaRecorder === 'undefined') return ''

  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    return 'audio/webm;codecs=opus'
  }

  if (MediaRecorder.isTypeSupported('audio/webm')) {
    return 'audio/webm'
  }

  return ''
}

function getAudioExtension(mimeType: string) {
  if (mimeType.includes('webm')) return 'webm'
  return 'webm'
}

function normalizeContentType(type: string) {
  if (type.includes('audio/webm')) return 'audio/webm'
  if (type.includes('audio/mp4')) return 'audio/mp4'
  if (type.includes('audio/ogg')) return 'audio/ogg'
  if (type.startsWith('image/')) return type
  if (type) return type
  return 'application/octet-stream'
}

function getStoragePathFromUrl(fileUrl: string) {
  const publicMarker = '/storage/v1/object/public/messages/'
  const signedMarker = '/storage/v1/object/sign/messages/'

  if (fileUrl.includes(publicMarker)) {
    return decodeURIComponent(fileUrl.split(publicMarker)[1].split('?')[0])
  }

  if (fileUrl.includes(signedMarker)) {
    return decodeURIComponent(fileUrl.split(signedMarker)[1].split('?')[0])
  }

  if (!fileUrl.startsWith('http')) {
    return fileUrl
  }

  return null
}

function formatAudioTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return '0:00'

  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function createMessageStoragePath(userId: string, file: File, type: Message['message_type']) {
  const rawExtension = file.name.split('.').pop()
  const extension = rawExtension || (type === 'audio' ? 'webm' : 'file')
  const safeName = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .slice(0, 50)

  return `messages/${userId}/${Date.now()}-${safeName || type}.${extension}`
}

export default function ChatView({ conversationId, conversationType, otherUser }: Props) {
  const session = useSession()
  const [supabase] = useState(() => createClient())
  const db = supabase as any
  const router = useRouter()
  const { profile, refreshNotifications } = useAppStore()
  const { isOnline, statusText } = useOnlineStatus(otherUser?.id || null)

  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [hasMatchWithOtherUser, setHasMatchWithOtherUser] = useState(false)
  const [encourageSending, setEncourageSending] = useState(false)
  const [encourageCooldown, setEncourageCooldown] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportSending, setReportSending] = useState(false)
  const [showBlockConfirm, setShowBlockConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [checkingBlockStatus, setCheckingBlockStatus] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingRef = useRef(false)
  const stoppingRef = useRef(false)
  const recordingStartedAtRef = useRef(0)
  const ignoreMouseUntilRef = useRef(0)

  const currentUserId = session?.user?.id
  const myPlan = normalizePlan(profile?.plan)
  const otherPlan = normalizePlan(otherUser.plan)
  const bothCanChat = canChat(myPlan, otherPlan)
  const iAmPaid = isPaidPlan(myPlan)
  const otherIsFree = otherPlan === 'free'
  const canEncourage = iAmPaid && otherIsFree

  const getAccessToken = async () => {
    const { data: { session: s } } = await supabase.auth.getSession()
    return s?.access_token ?? null
  }

  const handleReport = async () => {
    if (!reportReason.trim()) return
    setReportSending(true)
    try {
      const token = await getAccessToken()
      if (!token) { toast.error('Session manquante'); return }

      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetUserId: otherUser.id, conversationId, reason: reportReason.trim() }),
      })

      if (!res.ok) { toast.error('Erreur envoi signalement'); return }
      toast.success('Signalement envoyé')
      setShowReportModal(false)
      setReportReason('')
    } catch { toast.error('Erreur réseau') }
    finally { setReportSending(false) }
  }

  const handleBlock = async () => {
    setActionLoading(true)
    try {
      const token = await getAccessToken()
      if (!token) { toast.error('Session manquante'); return }

      const res = await fetch('/api/block-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetUserId: otherUser.id }),
      })

      if (!res.ok) { toast.error('Erreur blocage'); return }
      toast.success('Utilisateur bloqué')
      router.replace('/matches')
    } catch { toast.error('Erreur réseau') }
    finally { setActionLoading(false) }
  }

  const handleDeleteConversation = async () => {
    setActionLoading(true)
    try {
      const token = await getAccessToken()
      if (!token) { toast.error('Session manquante'); return }

      const res = await fetch('/api/delete-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conversationId, otherUserId: otherUser.id }),
      })

      if (!res.ok) { toast.error('Erreur suppression'); return }
      toast.success('Conversation supprimée')
      router.replace('/matches')
    } catch { toast.error('Erreur réseau') }
    finally { setActionLoading(false) }
  }

  const handleUnblock = async () => {
    setActionLoading(true)
    try {
      const token = await getAccessToken()
      if (!token) { toast.error('Session manquante'); return }

      const res = await fetch('/api/unblock-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetUserId: otherUser.id }),
      })

      if (!res.ok) { toast.error('Erreur déblocage'); return }
      toast.success('Utilisateur débloqué')
      setIsBlocked(false)
      refreshNotifications()
    } catch { toast.error('Erreur réseau') }
    finally { setActionLoading(false) }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const cleanupRecorder = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    mediaStreamRef.current = null
    mediaRecorderRef.current = null
    audioChunksRef.current = []
    recordingRef.current = false
    stoppingRef.current = false
    setIsRecording(false)
  }, [])

  const markMessagesAsRead = useCallback(async () => {
    if (!conversationId || !currentUserId) return

    const { error } = await db
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', currentUserId)
      .eq('is_read', false)

    if (error) {
      console.error('[CHAT_VIEW] markMessagesAsRead error', {
        conversationId,
        currentUserId,
        error,
      })
      return
    }

    console.error('[CHAT_VIEW] messages marked as read', {
      conversationId,
      currentUserId,
    })

    refreshNotifications()
  }, [conversationId, currentUserId, db, refreshNotifications])

  const sendEncouragement = async () => {
    if (!currentUserId || !conversationId || encourageSending || encourageCooldown) return

    setEncourageSending(true)

    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      const token = currentSession?.access_token

      if (!token) {
        toast.error('Session manquante')
        return
      }

      const res = await fetch('/api/encourage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId,
          otherUserId: otherUser.id,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        console.error('[CHAT_VIEW] encourage API error', {
          status: res.status,
          data,
        })

        if (res.status === 429) {
          setEncourageCooldown(true)
          toast.error(data?.error || 'Encouragement déjà envoyé récemment')
        } else {
          toast.error(data?.error || 'Erreur envoi encouragement')
        }

        return
      }

      setEncourageCooldown(true)
      toast.success('Encouragement envoyé !')
    } catch (error) {
      console.error('[CHAT_VIEW] encourage catch', error)
      toast.error('Erreur réseau')
    } finally {
      setEncourageSending(false)
    }
  }

  useEffect(() => {
    if (!currentUserId || !otherUser?.id) return

    const loadMatchStatus = async () => {
      const [user1_id, user2_id] = [currentUserId, otherUser.id].sort()

      const { data, error } = await db
        .from('matches')
        .select('id')
        .eq('user1_id', user1_id)
        .eq('user2_id', user2_id)
        .maybeSingle()

      if (error) {
        console.error('[CHAT_VIEW] match status error', {
          user1_id,
          user2_id,
          error,
        })
      }

      setHasMatchWithOtherUser(Boolean(data))
    }

    loadMatchStatus()
  }, [currentUserId, db, otherUser?.id])

  const assertCanSendMessage = async () => {
    if (!iAmPaid) {
      throw new Error('Passe à PAKT Business pour débloquer les conversations.')
    }

    // Reload other user's plan to check latest status
    const { data: freshOtherUser, error: refreshError } = await db
      .from('profiles')
      .select('plan')
      .eq('id', otherUser.id)
      .single()

    if (refreshError) {
      console.error('[CHAT_VIEW] Failed to refresh other user plan:', refreshError)
      // Fall back to cached plan
    } else if (freshOtherUser && !isPaidPlan(freshOtherUser.plan)) {
      throw new Error("Ce membre doit passer Business pour débloquer la conversation.")
    } else if (!freshOtherUser) {
      throw new Error("Profil introuvable")
    }

    if (!isPaidPlan(otherPlan)) {
      throw new Error("Ce membre doit passer Business pour débloquer la conversation.")
    }

    if (isBlocked) {
      throw new Error('Vous ne pouvez plus envoyer de messages dans cette conversation.')
    }
  }

  // Check if we're blocked by the other user on mount
  useEffect(() => {
    const checkBlockStatus = async () => {
      if (!currentUserId || !otherUser?.id) {
        setCheckingBlockStatus(false)
        return
      }

      try {
        // Query blocked_users to see if otherUser blocked us
        const { data, error } = await db
          .from('blocked_users')
          .select('id')
          .eq('blocker_id', otherUser.id)
          .eq('blocked_id', currentUserId)
          .maybeSingle()

        if (error) {
          console.error('[CHAT_VIEW] block status check error', error)
        }

        setIsBlocked(!!data)
      } catch (error) {
        console.error('[CHAT_VIEW] checkBlockStatus catch', error)
      } finally {
        setCheckingBlockStatus(false)
      }
    }

    checkBlockStatus()
  }, [currentUserId, otherUser?.id, db])

  useEffect(() => {
    const loadMessages = async () => {
      if (!conversationId) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await db
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(100)

        if (error) {
          console.error('[CHAT_VIEW] messages select error', {
            conversationId,
            error,
          })
          toast.error(`Erreur chargement messages: ${error.message}`)
          return
        }

        setMessages((data || []) as Message[])
        await markMessagesAsRead()
        setTimeout(scrollToBottom, 100)
      } catch (error) {
        console.error('[CHAT_VIEW] loadMessages catch', error)
        toast.error('Erreur chargement messages')
      } finally {
        setLoading(false)
      }
    }

    loadMessages()

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message

          setMessages((prev) => {
            if (prev.some((item) => item.id === newMessage.id)) return prev
            return [...prev, newMessage]
          })

          if (currentUserId && newMessage.sender_id !== currentUserId) {
            const { error } = await db
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMessage.id)

            if (error) {
              console.error('[CHAT_VIEW] realtime mark message read error', {
                messageId: newMessage.id,
                error,
              })
            } else {
              refreshNotifications()
            }
          }

          setTimeout(scrollToBottom, 100)
        }
      )
      .subscribe((status) => {
        console.error('[CHAT_VIEW] realtime status', status)
      })

    return () => {
      supabase.removeChannel(channel)

      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }

      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [conversationId, currentUserId, db, markMessagesAsRead, supabase, refreshNotifications])

  const uploadFile = async (file: File, type: Message['message_type']): Promise<string> => {
    if (!session?.user) throw new Error('Session manquante')

    const path = createMessageStoragePath(session.user.id, file, type)

    const { data, error } = await supabase.storage.from('messages').upload(path, file, {
      contentType: normalizeContentType(file.type),
      upsert: false,
    })

    if (error) {
      console.error('[CHAT_VIEW] upload file error', error)
      throw error
    }

    return data.path
  }

  const sendMessage = async (
    content?: string,
    type: Message['message_type'] = 'text',
    file?: File
  ) => {
    if (!session?.user?.id) {
      toast.error('Session manquante')
      return
    }

    if (!conversationId) {
      toast.error('Conversation introuvable')
      return
    }

    if (!content?.trim() && !file) return

    setSending(true)

    try {
      await assertCanSendMessage()

      let fileUrl: string | undefined
      let fileName: string | undefined
      let fileSize: number | undefined

      if (file) {
        if (type === 'audio' && file.size < MIN_AUDIO_SIZE_BYTES) {
          toast.error('Message vocal trop court')
          return
        }

        if (file.size <= 0) {
          toast.error('Fichier vide, veuillez réessayer')
          return
        }

        fileUrl = await uploadFile(file, type)
        fileName = file.name
        fileSize = file.size
      }

      const payload = {
        conversation_id: conversationId,
        sender_id: session.user.id,
        content: content?.trim() || `[${type}]`,
        message_type: type,
        file_url: fileUrl || null,
        file_name: fileName || null,
        file_size: fileSize || null,
        is_read: false,
      }

      const { data: insertedMessage, error: insertError } = await db
        .from('messages')
        .insert(payload as never)
        .select('*')
        .single()

      if (insertError) {
        console.error('[CHAT_VIEW] insert message error', insertError)
        toast.error(`Erreur envoi: ${insertError.message}`)
        return
      }

      setMessages((prev) => {
        const nextMessage = insertedMessage as Message
        if (prev.some((item) => item.id === nextMessage.id)) return prev
        return [...prev, nextMessage]
      })

      setText('')
      setTimeout(scrollToBottom, 100)
    } catch (err) {
      console.error('[CHAT_VIEW] sendMessage catch', err)
      toast.error(err instanceof Error ? err.message : 'Erreur envoi')
    } finally {
      setSending(false)
    }
  }

  const startRecording = async () => {
    if (recordingRef.current || stoppingRef.current || sending) return

    try {
      await assertCanSendMessage()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur profil')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("L'enregistrement audio n'est pas supporté sur ce navigateur")
      return
    }

    if (typeof MediaRecorder === 'undefined') {
      toast.error("MediaRecorder n'est pas supporté sur ce navigateur")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      const mimeType = getSupportedAudioMimeType()
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)

      audioChunksRef.current = []
      mediaStreamRef.current = stream
      mediaRecorderRef.current = recorder
      recordingStartedAtRef.current = Date.now()
      recordingRef.current = true
      stoppingRef.current = false
      setIsRecording(true)

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onerror = () => {
        toast.error("Erreur pendant l'enregistrement audio")
        cleanupRecorder()
      }

      recorder.onstop = async () => {
        const chunks = [...audioChunksRef.current]
        const blobType = recorder.mimeType || mimeType || 'audio/webm'
        const blob = new Blob(chunks, { type: blobType })
        const durationMs = Date.now() - recordingStartedAtRef.current

        cleanupRecorder()

        if (durationMs < MIN_RECORDING_MS) {
          toast.error('Message vocal trop court')
          return
        }

        if (chunks.length === 0 || blob.size <= 0) {
          toast.error('Aucun son capturé, veuillez réessayer')
          return
        }

        if (blob.size < MIN_AUDIO_SIZE_BYTES) {
          toast.error('Message vocal trop court ou silencieux')
          return
        }

        const extension = getAudioExtension(blobType)
        const file = new File([blob], `audio-${Date.now()}.${extension}`, {
          type: normalizeContentType(blobType),
        })

        await sendMessage(undefined, 'audio', file)
      }

      recorder.start()
    } catch (error) {
      console.error('[CHAT_VIEW] startRecording catch', error)
      cleanupRecorder()
      toast.error('Accès micro refusé ou micro indisponible')
    }
  }

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current

    if (!recordingRef.current || stoppingRef.current || !recorder) return

    stoppingRef.current = true

    const elapsedMs = Date.now() - recordingStartedAtRef.current
    const delay = Math.max(0, MIN_RECORDING_MS - elapsedMs)

    window.setTimeout(() => {
      const currentRecorder = mediaRecorderRef.current

      if (!currentRecorder || currentRecorder.state !== 'recording') return

      try {
        currentRecorder.requestData()

        window.setTimeout(() => {
          if (currentRecorder.state === 'recording') {
            currentRecorder.stop()
          }
        }, 120)
      } catch (error) {
        console.error('[CHAT_VIEW] stopRecording catch', error)
        cleanupRecorder()
        toast.error('Erreur arrêt enregistrement')
      }
    }, delay)
  }

  const cancelRecording = () => {
    if (!recordingRef.current) return
    stopRecording()
  }

  const handleSendText = () => {
    if (!text.trim()) return
    sendMessage(text.trim())
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendText()
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = event.target.files?.[0]
    if (file) sendMessage(undefined, type, file)
    event.target.value = ''
    setShowAttachMenu(false)
  }

  const inputLocked = !bothCanChat || isBlocked

  return (
    <div className="h-full min-h-0 flex flex-col bg-dark">
      <div className="flex items-center gap-3 px-4 py-3 bg-dark-100 border-b border-dark-400 shrink-0">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-dark-300 transition-colors">
          <ChevronLeft size={20} className="text-white/70" />
        </button>

        <button onClick={() => setShowProfileModal(true)} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-dark-300 shrink-0 flex items-center justify-center relative">
            {otherUser.photos?.[0] ? (
              <img src={otherUser.photos[0]} alt="" className="w-full h-full object-cover" />
            ) : (
              <UserCircle2 size={24} className="text-white/20" />
            )}
            {isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-100" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{otherUser.first_name}</p>
            <div className="flex items-center gap-1.5">
              <p className={`text-xs ${isOnline ? 'text-green-400' : 'text-white/40'}`}>
                {statusText}
              </p>
            </div>
          </div>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-xl hover:bg-dark-300 transition-colors"
          >
            <MoreVertical size={20} className="text-white/50" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[80]"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 z-[81] w-52 bg-dark-200 border border-dark-500 rounded-[14px] shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                  <button
                    onClick={() => { setShowMenu(false); setShowReportModal(true) }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:bg-dark-300 transition-colors"
                  >
                    <Flag size={16} className="text-white/40" />
                    Signaler
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); setShowBlockConfirm(true) }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-300 hover:bg-dark-300 transition-colors"
                  >
                    <Ban size={16} className="text-red-400/60" />
                    Bloquer
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); setShowDeleteConfirm(true) }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-300 hover:bg-dark-300 transition-colors border-t border-dark-500"
                  >
                    <Trash2 size={16} className="text-red-400/60" />
                    Supprimer la conversation
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-2 pb-3">
        {loading ? (
          <div className="flex justify-center pt-8">
            <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
          </div>
        ) : !bothCanChat ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-6 pb-8">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
              <Lock size={32} className="text-gold/60" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">{otherUser.first_name} n'a pas le plan Business</h3>
              <p className="text-white/50 text-sm max-w-xs">
                Cette personne doit passer au plan Business pour pouvoir discuter. Vous pouvez l'encourager à le faire !
              </p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 pb-8">
            <MessageCircle size={48} className="text-white/20" />
            <p className="text-white/40 text-sm">
              Commence la conversation avec {otherUser.first_name} !
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.sender_id === session?.user?.id
            const isSystemMessage = msg.message_type === 'system'
            const showTime =
              !isSystemMessage && (idx === 0 ||
              new Date(msg.created_at).getTime() -
                new Date(messages[idx - 1].created_at).getTime() >
                300000)

            return (
              <div key={msg.id}>
                {showTime && (
                  <p className="text-center text-white/25 text-xs my-3">
                    {formatTime(msg.created_at)}
                  </p>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isSystemMessage ? 'justify-center' : isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <MessageBubble msg={msg} isMine={isMine} />
                </motion.div>
              </div>
            )
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+14px)] bg-dark-100 border-t border-dark-400">
        {canEncourage && (
          <div className="mb-3 rounded-[16px] border border-gold/25 bg-gradient-to-b from-gold/[0.08] to-gold/[0.03] p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={18} className="text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm mb-1">Encourager à passer Business</p>
                <p className="text-[12px] text-white/50">
                  Envoyer un message à {otherUser.first_name} pour lui proposer de passer au plan Business et discuter ensemble
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={sendEncouragement}
              disabled={encourageSending || encourageCooldown}
              className={`w-full flex items-center justify-center gap-2 h-10 rounded-[11px] text-sm font-bold transition-all ${
                encourageCooldown
                  ? 'bg-dark-300 text-white/40'
                  : 'bg-gradient-to-r from-gold to-[#e2c06d] text-dark shadow-[0_4px_16px_rgba(212,168,83,0.2)] hover:shadow-[0_6px_24px_rgba(212,168,83,0.35)] active:scale-[0.98]'
              } disabled:opacity-50`}
            >
              {encourageCooldown ? (
                <>
                  <Sparkles size={14} />
                  Envoyé !
                </>
              ) : encourageSending ? (
                'Envoi...'
              ) : (
                <>
                  <Sparkles size={14} />
                  Envoyer l'encouragement
                </>
              )}
            </button>
          </div>
        )}

        {isBlocked && (
          <div className="mb-3 rounded-[14px] border border-red-500/20 bg-red-500/[0.08] p-3">
            <p className="text-xs text-white/50 text-center mb-2">
              Vous ne pouvez plus envoyer de messages dans cette conversation.
            </p>
            <button
              type="button"
              onClick={handleUnblock}
              disabled={actionLoading}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-[10px] text-xs font-semibold bg-red-500/30 text-red-200 hover:bg-red-500/40 transition-all disabled:opacity-50"
            >
              {actionLoading ? 'Déblocage...' : 'Débloquer cette personne'}
            </button>
          </div>
        )}

        {inputLocked && !canEncourage && !isBlocked && (
          <p className="mb-2 text-center text-xs text-white/45">
            {!iAmPaid
              ? 'Passe à PAKT Business pour débloquer les conversations.'
              : 'Ce membre doit passer Business pour pouvoir échanger.'}
          </p>
        )}

        <AnimatePresence>
          {showAttachMenu && !inputLocked && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex gap-3 mb-3"
            >
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-2 bg-dark-300 rounded-xl px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-dark-400 transition-colors"
              >
                <Image size={16} className="text-gold" />
                Photo
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-dark-300 rounded-xl px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-dark-400 transition-colors"
              >
                <FileText size={16} className="text-gold" />
                Fichier
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2">
          <button
            onClick={() => {
              if (inputLocked) return
              setShowAttachMenu(!showAttachMenu)
            }}
            disabled={inputLocked}
            className={`p-2.5 rounded-xl transition-colors shrink-0 disabled:opacity-40 ${
              showAttachMenu ? 'bg-gold text-dark' : 'bg-dark-300 text-white/50 hover:text-white'
            }`}
          >
            {showAttachMenu ? <X size={18} /> : <Paperclip size={18} />}
          </button>

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={inputLocked ? (iAmPaid ? 'En attente du plan Business de ce membre' : 'Passe Business pour débloquer') : 'Message...'}
            rows={1}
            disabled={inputLocked}
            className="flex-1 min-h-[44px] bg-dark-300 rounded-2xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-gold/30 resize-none text-sm max-h-24 overflow-y-auto disabled:opacity-50"
            style={{ lineHeight: '1.4' }}
          />

          {text.trim() ? (
            <button
              onClick={handleSendText}
              disabled={sending || inputLocked}
              className="p-2.5 rounded-xl bg-gold text-dark shrink-0 hover:bg-gold-light transition-colors disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          ) : (
            <button
              type="button"
              onMouseDown={() => {
                if (Date.now() < ignoreMouseUntilRef.current) return
                startRecording()
              }}
              onMouseUp={() => {
                if (Date.now() < ignoreMouseUntilRef.current) return
                stopRecording()
              }}
              onMouseLeave={() => {
                if (Date.now() < ignoreMouseUntilRef.current) return
                cancelRecording()
              }}
              onTouchStart={(event) => {
                event.preventDefault()
                ignoreMouseUntilRef.current = Date.now() + 700
                startRecording()
              }}
              onTouchEnd={(event) => {
                event.preventDefault()
                ignoreMouseUntilRef.current = Date.now() + 700
                stopRecording()
              }}
              onTouchCancel={(event) => {
                event.preventDefault()
                ignoreMouseUntilRef.current = Date.now() + 700
                cancelRecording()
              }}
              disabled={sending || inputLocked}
              className={`p-2.5 rounded-xl shrink-0 transition-all disabled:opacity-50 ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse-gold scale-110'
                  : 'bg-dark-300 text-white/50 hover:text-white'
              }`}
            >
              {isRecording ? <Square size={18} /> : <Mic size={18} />}
            </button>
          )}
        </div>

        {isRecording && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-red-400 text-xs mt-2"
          >
            Enregistrement en cours... Relâche pour envoyer
          </motion.p>
        )}
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFileSelect(event, 'image')}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
        className="hidden"
        onChange={(event) => handleFileSelect(event, 'file')}
      />

      {/* ── Report Modal ── */}
      <AnimatePresence>
        {showReportModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" onClick={() => setShowReportModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[101] max-w-sm mx-auto"
            >
              <div className="bg-dark-200 border border-dark-500 rounded-[20px] p-6">
                <h3 className="text-lg font-bold text-white mb-1">Signaler {otherUser.first_name}</h3>
                <p className="text-xs text-white/40 mb-4">Décris le problème rencontré. Notre équipe examinera ton signalement.</p>

                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Décris le motif du signalement..."
                  rows={4}
                  className="w-full bg-dark-300 rounded-[12px] px-4 py-3 text-white placeholder-white/30 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gold/30"
                />

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => { setShowReportModal(false); setReportReason('') }}
                    className="flex-1 h-11 rounded-[12px] border border-dark-500 text-white/60 text-sm font-semibold hover:bg-dark-300 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleReport}
                    disabled={!reportReason.trim() || reportSending}
                    className="flex-1 h-11 rounded-[12px] bg-red-500/80 text-white text-sm font-bold hover:bg-red-500 transition-colors disabled:opacity-50"
                  >
                    {reportSending ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Block Confirm Modal ── */}
      <AnimatePresence>
        {showBlockConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" onClick={() => setShowBlockConfirm(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[101] max-w-sm mx-auto"
            >
              <div className="bg-dark-200 border border-dark-500 rounded-[20px] p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                  <Ban size={24} className="text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Bloquer {otherUser.first_name} ?</h3>
                <p className="text-sm text-white/50 mb-5">
                  Vous ne pourrez plus vous écrire. La conversation, les messages et le match restent visibles. Vous pouvez débloquer à tout moment.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setShowBlockConfirm(false)} className="flex-1 h-11 rounded-[12px] border border-dark-500 text-white/60 text-sm font-semibold hover:bg-dark-300 transition-colors">
                    Annuler
                  </button>
                  <button onClick={handleBlock} disabled={actionLoading} className="flex-1 h-11 rounded-[12px] bg-red-500/80 text-white text-sm font-bold hover:bg-red-500 transition-colors disabled:opacity-50">
                    {actionLoading ? 'Blocage...' : 'Bloquer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm Modal ── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[101] max-w-sm mx-auto"
            >
              <div className="bg-dark-200 border border-dark-500 rounded-[20px] p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={24} className="text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Supprimer définitivement ?</h3>
                <p className="text-sm text-white/50 mb-5">
                  La conversation, le match et tous les messages seront supprimés définitivement. Vous ne reverrez plus cette personne dans les swipes.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 h-11 rounded-[12px] border border-dark-500 text-white/60 text-sm font-semibold hover:bg-dark-300 transition-colors">
                    Annuler
                  </button>
                  <button onClick={handleDeleteConversation} disabled={actionLoading} className="flex-1 h-11 rounded-[12px] bg-red-500/80 text-white text-sm font-bold hover:bg-red-500 transition-colors disabled:opacity-50">
                    {actionLoading ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Profile Modal ── */}
      <AnimatePresence>
        {showProfileModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm"
              onClick={() => setShowProfileModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="fixed inset-0 z-[111] flex items-center justify-center p-4"
              onClick={() => setShowProfileModal(false)}
            >
              <div className="w-full max-w-md bg-dark rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <SwipeCard
                  profile={otherUser as any}
                  onSwipe={() => {}}
                  disabledActions={true}
                  readonlyMatchView={true}
                  isTop={true}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function useMessageFileUrl(fileUrl: string | null) {
  const [supabase] = useState(() => createClient())
  const [resolvedUrl, setResolvedUrl] = useState(fileUrl || '')

  useEffect(() => {
    let mounted = true

    const loadUrl = async () => {
      if (!fileUrl) {
        setResolvedUrl('')
        return
      }

      const path = getStoragePathFromUrl(fileUrl)

      if (!path) {
        setResolvedUrl(fileUrl)
        return
      }

      const { data, error } = await supabase.storage
        .from('messages')
        .createSignedUrl(path, 60 * 60)

      if (!mounted) return

      if (error || !data?.signedUrl) {
        console.error('[CHAT_VIEW] file signed url error', error)
        setResolvedUrl(fileUrl)
        return
      }

      setResolvedUrl(data.signedUrl)
    }

    loadUrl()

    return () => {
      mounted = false
    }
  }, [fileUrl, supabase])

  return resolvedUrl
}

function AudioBubble({ msg, isMine }: { msg: Message; isMine: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const audioSrc = useMessageFileUrl(msg.file_url)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }, [audioSrc])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio || !audioSrc) return

    try {
      if (isPlaying) {
        audio.pause()
        return
      }

      await audio.play()
    } catch (error) {
      console.error('[CHAT_VIEW] audio play error', error)
      toast.error('Lecture audio impossible')
    }
  }

  const progress =
    duration > 0 && Number.isFinite(duration)
      ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
      : 0

  return (
    <div className="flex flex-col gap-1">
      <div
        className={`max-w-[85%] min-w-[230px] px-4 py-3 flex items-center gap-3 rounded-[20px] ${
          isMine ? 'bubble-sent' : 'bubble-received'
        }`}
      >
      <button
        type="button"
        onClick={togglePlay}
        disabled={!audioSrc}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          isMine
            ? 'bg-dark/15 text-dark hover:bg-dark/25'
            : 'bg-white/10 text-white hover:bg-white/15'
        } disabled:opacity-40`}
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className={`h-1.5 rounded-full overflow-hidden ${isMine ? 'bg-dark/20' : 'bg-white/10'}`}>
          <div
            className={`h-full rounded-full transition-[width] duration-100 ${
              isMine ? 'bg-dark/70' : 'bg-gold'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className={`mt-1.5 flex items-center justify-between text-[11px] ${
          isMine ? 'text-dark/70' : 'text-white/50'
        }`}>
          <span>{formatAudioTime(currentTime)}</span>
          <span>{formatAudioTime(duration)}</span>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
        className="hidden"
        onLoadedMetadata={(event) => {
          const nextDuration = event.currentTarget.duration
          setDuration(Number.isFinite(nextDuration) ? nextDuration : 0)
        }}
        onDurationChange={(event) => {
          const nextDuration = event.currentTarget.duration
          setDuration(Number.isFinite(nextDuration) ? nextDuration : 0)
        }}
        onTimeUpdate={(event) => {
          setCurrentTime(event.currentTarget.currentTime)
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false)
          setCurrentTime(0)
        }}
        onError={() => {
          setIsPlaying(false)
        }}
      />
      </div>
      {isMine && (
        <div className="flex justify-end pr-1">
          <MessageStatus isRead={msg.is_read || false} />
        </div>
      )}
    </div>
  )
}

function ImageBubble({ msg, isMine }: { msg: Message; isMine: boolean }) {
  const imageUrl = useMessageFileUrl(msg.file_url)

  if (!imageUrl) return null

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => window.open(imageUrl, '_blank', 'noopener,noreferrer')}
        className={`max-w-[78%] rounded-[16px] overflow-hidden border text-left ${
          isMine ? 'border-gold/30 bg-gold/10' : 'border-dark-500 bg-dark-200'
        }`}
      >
        <img
          src={imageUrl}
          alt={msg.file_name || 'Image'}
          className="block max-h-72 w-full object-cover"
        />

        {msg.file_name && (
          <div className={`px-3 py-2 text-xs truncate ${isMine ? 'text-dark/70 bg-gold' : 'text-white/60 bg-dark-200'}`}>
            {msg.file_name}
          </div>
        )}
      </button>
      {isMine && (
        <div className="flex justify-end pr-1">
          <MessageStatus isRead={msg.is_read || false} />
        </div>
      )}
    </div>
  )
}

function FileBubble({ msg, isMine }: { msg: Message; isMine: boolean }) {
  const fileUrl = useMessageFileUrl(msg.file_url)
  const fileName = msg.file_name || 'Fichier'
  const fileSize = msg.file_size ? formatFileSize(msg.file_size) : null

  const handleOpen = () => {
    if (!fileUrl) {
      toast.error('Fichier indisponible')
      return
    }

    window.open(fileUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleOpen}
        className={`max-w-[85%] min-w-[240px] px-4 py-3 flex items-center gap-3 rounded-[16px] text-left ${
          isMine ? 'bubble-sent' : 'bubble-received'
        }`}
      >
        <div
          className={`w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0 ${
            isMine ? 'bg-dark/15 text-dark' : 'bg-white/10 text-gold'
          }`}
        >
          <FileText size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{fileName}</p>
          {fileSize && (
            <p className={`text-xs mt-0.5 ${isMine ? 'text-dark/60' : 'text-white/45'}`}>
              {fileSize}
            </p>
          )}
        </div>

        <a
          href={fileUrl || '#'}
          download={fileName}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => {
            event.stopPropagation()
            if (!fileUrl) event.preventDefault()
          }}
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
            isMine ? 'bg-dark/15 text-dark hover:bg-dark/25' : 'bg-white/10 text-white hover:bg-white/15'
          }`}
        >
          <Download size={17} />
        </a>
      </button>
      {isMine && (
        <div className="flex justify-end pr-1">
          <MessageStatus isRead={msg.is_read || false} />
        </div>
      )}
    </div>
  )
}

function MessageBubble({ msg, isMine }: { msg: Message; isMine: boolean }) {
  if (msg.message_type === 'system') {
    return (
      <div className="flex justify-center w-full">
        <p className="text-center text-white/40 text-xs px-4 py-1.5 bg-dark-300/50 rounded-full">
          {msg.content}
        </p>
      </div>
    )
  }

  if (msg.message_type === 'text') {
    return (
      <div className={`max-w-[75%] flex flex-col gap-1 px-4 py-2.5 text-sm leading-relaxed ${isMine ? 'bubble-sent' : 'bubble-received'}`}>
        <div>{msg.content}</div>
        {isMine && (
          <div className="flex items-center justify-end">
            <MessageStatus isRead={msg.is_read || false} />
          </div>
        )}
      </div>
    )
  }

  if (msg.message_type === 'image' && msg.file_url) {
    return <ImageBubble msg={msg} isMine={isMine} />
  }

  if (msg.message_type === 'audio' && msg.file_url) {
    return <AudioBubble msg={msg} isMine={isMine} />
  }

  if (msg.message_type === 'file' && msg.file_url) {
    return <FileBubble msg={msg} isMine={isMine} />
  }

  return null
}