"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Message, Profile } from "@/types"
import { MessageBubble } from "@/components/chat/message-bubble"
import { ChatInput } from "@/components/chat/chat-input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Loader2, Users, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { toast } from "sonner"

interface ChatWindowProps {
  chatId: string
  currentUserId: string
}

interface ChatMeta {
  name?: string | null
  type: string
  otherParticipant?: Profile | null
}

export function ChatWindow({ chatId, currentUserId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [chatMeta, setChatMeta] = useState<ChatMeta | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = (smooth = false) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" })
  }

  const loadChatInfo = useCallback(async () => {
    const { data: chat } = await supabase
      .from("chats")
      .select("type, name")
      .eq("id", chatId)
      .single()

    if (!chat) return

    if (chat.type === "direct") {
      const { data: others } = await supabase
        .from("chat_participants")
        .select("profile:profiles(id, username, display_name, avatar_url, color_hex, badges, updated_at)")
        .eq("chat_id", chatId)
        .neq("user_id", currentUserId)
        .limit(1)
      setChatMeta({
        type: chat.type,
        name: chat.name,
        otherParticipant: (others?.[0]?.profile as unknown as Profile) ?? null,
      })
    } else {
      setChatMeta({ type: chat.type, name: chat.name })
    }
  }, [chatId, currentUserId])

  const loadMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*, sender:profiles(id, username, display_name, avatar_url, color_hex, badges, updated_at)")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })

    if (error) {
      toast.error("Error al cargar mensajes")
      return
    }
    setMessages((data as Message[]) ?? [])
    setLoading(false)
    setTimeout(() => scrollToBottom(false), 50)
  }, [chatId])

  const sendMessage = async (content: string) => {
    const { error } = await supabase.from("messages").insert({
      chat_id: chatId,
      sender_id: currentUserId,
      content,
    })
    if (error) {
      toast.error("Error al enviar el mensaje")
    }
    // Also update chat updated_at so list re-orders
    await supabase.from("chats").update({ updated_at: new Date().toISOString() }).eq("id", chatId)
  }

  useEffect(() => {
    loadChatInfo()
    loadMessages()

    // Realtime subscription
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
        async (payload) => {
          // Fetch the full message with sender profile
          const { data: newMsg } = await supabase
            .from("messages")
            .select("*, sender:profiles(id, username, display_name, avatar_url, color_hex, badges, updated_at)")
            .eq("id", payload.new.id)
            .single()

          if (newMsg) {
            setMessages((prev) => [...prev, newMsg as Message])
            setTimeout(() => scrollToBottom(true), 50)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatId, loadChatInfo, loadMessages])

  const getHeaderTitle = () => {
    if (chatMeta?.type === "direct" && chatMeta.otherParticipant) {
      return chatMeta.otherParticipant.display_name ?? chatMeta.otherParticipant.username ?? "Usuario"
    }
    return chatMeta?.name ?? "Chat"
  }

  const getHeaderSubtitle = () => {
    if (chatMeta?.type === "direct" && chatMeta.otherParticipant?.username) {
      return `@${chatMeta.otherParticipant.username}`
    }
    return null
  }

  const headerAvatar = chatMeta?.type === "direct" ? chatMeta?.otherParticipant?.avatar_url ?? "" : ""
  const headerInitial =
    chatMeta?.type === "direct"
      ? (chatMeta.otherParticipant?.display_name ?? chatMeta.otherParticipant?.username ?? "?").charAt(0).toUpperCase()
      : null

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
        <Link href="/chats" className="md:hidden">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Avatar className="h-9 w-9">
          <AvatarImage src={headerAvatar} />
          <AvatarFallback className="bg-primary/15 text-primary text-sm">
            {headerInitial ?? <Users className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{getHeaderTitle()}</p>
          {getHeaderSubtitle() && (
            <p className="text-xs text-muted-foreground">{getHeaderSubtitle()}</p>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground text-center">
              No hay mensajes aún. ¡Sé el primero en escribir!
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const prevMsg = messages[index - 1]
              const showSender = !prevMsg || prevMsg.sender_id !== msg.sender_id
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.sender_id === currentUserId}
                  showSender={showSender}
                />
              )
            })}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} />
    </div>
  )
}
