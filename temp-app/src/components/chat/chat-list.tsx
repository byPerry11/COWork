"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Chat, Message, Profile } from "@/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, Plus, Users, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { useParams } from "next/navigation"
import { NewChatDialog } from "./new-chat-dialog"

interface ChatListItemData {
  chat: Chat
  lastMessage?: Message | null
  otherParticipant?: Profile | null
  unread?: number
}

interface ChatListProps {
  currentUserId: string
}

export function ChatList({ currentUserId }: ChatListProps) {
  const [items, setItems] = useState<ChatListItemData[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewChat, setShowNewChat] = useState(false)
  const params = useParams()
  const activeChatId = params?.chatId as string | undefined

  const loadChats = async () => {
    const { data: participations } = await supabase
      .from("chat_participants")
      .select("chat_id")
      .eq("user_id", currentUserId)

    if (!participations?.length) {
      setLoading(false)
      return
    }

    const chatIds = participations.map((p) => p.chat_id)

    const { data: chats } = await supabase
      .from("chats")
      .select("*")
      .in("id", chatIds)
      .order("updated_at", { ascending: false })

    if (!chats) {
      setLoading(false)
      return
    }

    const enriched = await Promise.all(
      chats.map(async (chat): Promise<ChatListItemData> => {
        // Last message
        const { data: lastMsgs } = await supabase
          .from("messages")
          .select("*, sender:profiles(id, username, display_name, avatar_url, color_hex, badges, updated_at)")
          .eq("chat_id", chat.id)
          .order("created_at", { ascending: false })
          .limit(1)

        const lastMessage = lastMsgs?.[0] ?? null

        // For direct chats, get the other participant profile
        let otherParticipant: Profile | null = null
        if (chat.type === "direct") {
          const { data: others } = await supabase
            .from("chat_participants")
            .select("user_id, profile:profiles(id, username, display_name, avatar_url, color_hex, badges, updated_at)")
            .eq("chat_id", chat.id)
            .neq("user_id", currentUserId)
            .limit(1)
          otherParticipant = (others?.[0]?.profile as unknown as Profile) ?? null
        }

        return { chat, lastMessage, otherParticipant }
      })
    )

    setItems(enriched)
    setLoading(false)
  }

  useEffect(() => {
    loadChats()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const getChatName = (item: ChatListItemData) => {
    if (item.chat.type === "direct" && item.otherParticipant) {
      return item.otherParticipant.display_name ?? item.otherParticipant.username ?? "Usuario"
    }
    return item.chat.name ?? "Chat"
  }

  const getChatAvatar = (item: ChatListItemData): string => {
    if (item.chat.type === "direct" && item.otherParticipant) {
      return item.otherParticipant.avatar_url ?? ""
    }
    return ""
  }

  const getChatInitials = (item: ChatListItemData): string => {
    const name = getChatName(item)
    return name.charAt(0).toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="font-semibold text-base flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          Mensajes
        </h2>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowNewChat(true)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
            <div className="p-4 rounded-full bg-muted">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No tienes conversaciones aún.</p>
            <Button size="sm" variant="outline" onClick={() => setShowNewChat(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nuevo chat
            </Button>
          </div>
        ) : (
          items.map((item) => (
            <Link
              key={item.chat.id}
              href={`/chats/${item.chat.id}`}
              className={cn(
                "flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50",
                activeChatId === item.chat.id && "bg-muted"
              )}
            >
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={getChatAvatar(item)} />
                  <AvatarFallback className="bg-primary/15 text-primary text-sm">
                    {item.chat.type === "direct" ? (
                      getChatInitials(item)
                    ) : (
                      <Users className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">{getChatName(item)}</span>
                  {item.lastMessage && (
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(item.lastMessage.created_at), { addSuffix: false, locale: es })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {item.lastMessage?.content ?? "Sin mensajes aún"}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>

      {showNewChat && (
        <NewChatDialog
          currentUserId={currentUserId}
          onClose={() => setShowNewChat(false)}
          onCreated={() => {
            loadChats()
            setShowNewChat(false)
          }}
        />
      )}
    </div>
  )
}
