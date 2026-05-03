'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@supabase/auth-helpers-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Message, Profile } from '@/lib/supabase/types'
import { formatTime, formatFileSize } from '@/lib/utils'
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
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'

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
  const supabase = useMemo(() => createClient(), [])
  const db = supabase as any
  const router = useRouter()
  const { refreshNotifications } = useAppStore()

  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showAttachMenu, setShowAttachMenu] = useState(false)

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

    if (!error) refreshNotifications()
  }, [conversationId, currentUserId, db, refreshNotifications])

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
          toast.error(`Erreur chargement messages: ${error.message}`)
          return
        }

        setMessages((data || []) as Message[])
        await markMessagesAsRead()
        setTimeout(scrollToBottom, 100)
      } catch {
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
          setMessages((prev) => [...prev, newMessage])

          if (currentUserId && newMessage.sender_id !== currentUserId) {
            const { error } = await db.from('messages').update({ is_read: true }).eq('id', newMessage.id)
            if (!error) refreshNotifications()
          }

          setTimeout(scrollToBottom, 100)
        }
      )
      .subscribe()

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

    if (error) throw error

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
        toast.error(`Erreur envoi: ${insertError.message}`)
        return
      }

      setMessages((prev) => [...prev, insertedMessage as Message])
      setText('')
      setTimeout(scrollToBottom, 100)
    } catch (err) {
      toast.error('Erreur envoi: ' + (err instanceof Error ? err.message : 'Erreur inconnue'))
    } finally {
      setSending(false)
    }
  }

  const startRecording = async () => {
    if (recordingRef.current || stoppingRef.current || sending) return

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
        toast.error('Erreur pendant l’enregistrement audio')
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
    } catch {
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
      } catch {
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

  return (
    <div className="h-full flex flex-col bg-dark">
      <div className="flex items-center gap-3 px-4 py-3 bg-dark-100 border-b border-dark-400 shrink-0">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-dark-300 transition-colors">
          <ChevronLeft size={20} className="text-white/70" />
        </button>

        <div className="w-10 h-10 rounded-full overflow-hidden bg-dark-300 shrink-0">
          {otherUser.photos?.[0] ? (
            <img src={otherUser.photos[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{otherUser.first_name}</p>
          {otherUser.city && <p className="text-xs text-white/40 truncate">{otherUser.city}</p>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading ? (
          <div className="flex justify-center pt-8">
            <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 pb-8">
            <span className="text-4xl">👋</span>
            <p className="text-white/40 text-sm">
              Commence la conversation avec {otherUser.first_name} !
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.sender_id === session?.user?.id
            const showTime =
              idx === 0 ||
              new Date(msg.created_at).getTime() -
                new Date(messages[idx - 1].created_at).getTime() >
                300000

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
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <MessageBubble msg={msg} isMine={isMine} />
                </motion.div>
              </div>
            )
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-3 bg-dark-100 border-t border-dark-400 shrink-0">
        <AnimatePresence>
          {showAttachMenu && (
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
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className={`p-2.5 rounded-xl transition-colors shrink-0 ${
              showAttachMenu ? 'bg-gold text-dark' : 'bg-dark-300 text-white/50 hover:text-white'
            }`}
          >
            {showAttachMenu ? <X size={18} /> : <Paperclip size={18} />}
          </button>

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            rows={1}
            className="flex-1 bg-dark-300 rounded-2xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-gold/30 resize-none text-sm max-h-24 overflow-y-auto"
            style={{ lineHeight: '1.4' }}
          />

          {text.trim() ? (
            <button
              onClick={handleSendText}
              disabled={sending}
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
              disabled={sending}
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
    </div>
  )
}

function useMessageFileUrl(fileUrl: string | null) {
  const supabase = useMemo(() => createClient(), [])
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
        console.error('file signed url error', error)
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
    } catch {
      toast.error('Lecture audio impossible')
    }
  }

  const progress =
    duration > 0 && Number.isFinite(duration)
      ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
      : 0

  return (
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
  )
}

function ImageBubble({ msg, isMine }: { msg: Message; isMine: boolean }) {
  const imageUrl = useMessageFileUrl(msg.file_url)

  if (!imageUrl) return null

  return (
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
  )
}

function MessageBubble({ msg, isMine }: { msg: Message; isMine: boolean }) {
  if (msg.message_type === 'text') {
    return (
      <div className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed ${isMine ? 'bubble-sent' : 'bubble-received'}`}>
        {msg.content}
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