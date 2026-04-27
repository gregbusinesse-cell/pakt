'use client'
// components/chat/ChatView.tsx
// Real-time chat with text, images, audio, and file support

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@supabase/auth-helpers-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Message, Profile } from '@/lib/supabase/types'
import { formatTime, formatFileSize } from '@/lib/utils'
import { Send, Paperclip, Mic, Image, X, Download, FileText, Play, Square, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Props {
  conversationId: string
  conversationType: 'match' | 'direct'
  otherUser: Profile
}

export default function ChatView({ conversationId, conversationType, otherUser }: Props) {
  const session = useSession()
  const supabase = createClient()
  const router = useRouter()

  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [showAttachMenu, setShowAttachMenu] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('conversation_type', conversationType)
        .order('created_at', { ascending: true })
        .limit(100)

      setMessages(data || [])
      setLoading(false)
      setTimeout(scrollToBottom, 100)
    }

    loadMessages()

    // Realtime subscription
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
        setTimeout(scrollToBottom, 100)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  const uploadFile = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()
    const path = `messages/${session!.user.id}/${Date.now()}.${ext}`
    const { data, error } = await supabase.storage
      .from('messages')
      .upload(path, file)
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('messages').getPublicUrl(data.path)
    return publicUrl
  }

  const sendMessage = async (
    content?: string,
    type: Message['message_type'] = 'text',
    file?: File
  ) => {
    if (!session?.user) return
    setSending(true)

    try {
      let fileUrl: string | undefined
      let fileName: string | undefined
      let fileSize: number | undefined

      if (file) {
        fileUrl = await uploadFile(file)
        fileName = file.name
        fileSize = file.size
      }

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        conversation_type: conversationType,
        sender_id: session.user.id,
        content: content || null,
        message_type: type,
        file_url: fileUrl || null,
        file_name: fileName || null,
        file_size: fileSize || null,
      })

      // Update last message in conversation
      const table = conversationType === 'match' ? 'conversations' : 'direct_conversations'
      await supabase.from(table as any).update({
        last_message: content || `[${type}]`,
        last_message_at: new Date().toISOString(),
      }).eq('id', conversationId)

      setText('')
    } catch (err: any) {
      toast.error('Erreur envoi: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  const handleSendText = () => {
    if (!text.trim()) return
    sendMessage(text.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0]
    if (file) sendMessage(undefined, type, file)
    e.target.value = ''
    setShowAttachMenu(false)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data)
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], 'audio.webm', { type: 'audio/webm' })
        await sendMessage(undefined, 'audio', file)
        stream.getTracks().forEach(t => t.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch {
      toast.error('Accès micro refusé')
    }
  }

  const stopRecording = () => {
    mediaRecorder?.stop()
    setIsRecording(false)
    setMediaRecorder(null)
  }

  return (
    <div className="h-full flex flex-col bg-dark">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-dark-100 border-b border-dark-400 shrink-0">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-dark-300 transition-colors"
        >
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
          {otherUser.city && (
            <p className="text-xs text-white/40 truncate">{otherUser.city}</p>
          )}
        </div>
      </div>

      {/* Messages */}
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
            const showTime = idx === 0 || 
              new Date(msg.created_at).getTime() - new Date(messages[idx-1].created_at).getTime() > 300000

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

      {/* Input */}
      <div className="px-4 py-3 bg-dark-100 border-t border-dark-400 shrink-0">
        {/* Attachment menu */}
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
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            rows={1}
            className="flex-1 bg-dark-300 rounded-2xl px-4 py-3 text-white placeholder-white/30
              focus:outline-none focus:ring-1 focus:ring-gold/30 resize-none text-sm max-h-24 overflow-y-auto"
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
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`p-2.5 rounded-xl shrink-0 transition-all ${
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
            🔴 Enregistrement en cours... Relâche pour envoyer
          </motion.p>
        )}
      </div>

      {/* Hidden inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => handleFileSelect(e, 'image')}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
        className="hidden"
        onChange={e => handleFileSelect(e, 'file')}
      />
    </div>
  )
}

function MessageBubble({ msg, isMine }: { msg: Message; isMine: boolean }) {
  if (msg.message_type === 'text') {
    return (
      <div className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed ${
        isMine ? 'bubble-sent' : 'bubble-received'
      }`}>
        {msg.content}
      </div>
    )
  }

  if (msg.message_type === 'image' && msg.file_url) {
    return (
      <div className={`max-w-[75%] rounded-2xl overflow-hidden border ${
        isMine ? 'border-gold/30' : 'border-dark-500'
      }`}>
        <img
          src={msg.file_url}
          alt="image"
          className="max-w-full max-h-64 object-cover cursor-pointer"
          onClick={() => window.open(msg.file_url!, '_blank')}
        />
      </div>
    )
  }

  if (msg.message_type === 'audio' && msg.file_url) {
    return (
      <div className={`max-w-[75%] px-4 py-3 flex items-center gap-3 ${
        isMine ? 'bubble-sent' : 'bubble-received'
      }`}>
        <Play size={16} />
        <audio src={msg.file_url} controls className="h-8 w-40 accent-current" />
      </div>
    )
  }

  if (msg.message_type === 'file' && msg.file_url) {
    return (
      <a
        href={msg.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className={`max-w-[75%] px-4 py-3 flex items-center gap-3 no-underline ${
          isMine ? 'bubble-sent' : 'bubble-received'
        }`}
      >
        <FileText size={20} className="shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{msg.file_name || 'Fichier'}</p>
          {msg.file_size && (
            <p className="text-xs opacity-70">{formatFileSize(msg.file_size)}</p>
          )}
        </div>
        <Download size={16} className="shrink-0" />
      </a>
    )
  }

  return null
}
