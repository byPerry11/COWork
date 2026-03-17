"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Profile } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface NewChatDialogProps {
  currentUserId: string
  onClose: () => void
  onCreated: () => void
}

export function NewChatDialog({ currentUserId, onClose, onCreated }: NewChatDialogProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const timeout = setTimeout(async () => {
      setLoading(true)
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, color_hex, badges, updated_at")
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .neq("id", currentUserId)
        .limit(8)
      setResults((data as Profile[]) ?? [])
      setLoading(false)
    }, 300)

    return () => clearTimeout(timeout)
  }, [query, currentUserId])

  const startDirectChat = async (otherUser: Profile) => {
    setCreating(otherUser.id)
    try {
      // Check if a direct chat already exists between both users
      const { data: myChats } = await supabase
        .from("chat_participants")
        .select("chat_id")
        .eq("user_id", currentUserId)

      const myChatIds = myChats?.map((c) => c.chat_id) ?? []

      if (myChatIds.length > 0) {
        const { data: existing } = await supabase
          .from("chat_participants")
          .select("chat_id")
          .eq("user_id", otherUser.id)
          .in("chat_id", myChatIds)

        if (existing?.length) {
          // Check it's a direct chat
          const { data: chatInfo } = await supabase
            .from("chats")
            .select("id, type")
            .eq("id", existing[0].chat_id)
            .eq("type", "direct")
            .single()

          if (chatInfo) {
            onClose()
            router.push(`/chats/${chatInfo.id}`)
            return
          }
        }
      }

      // Create new direct chat
      const { data: newChat, error: chatError } = await supabase
        .from("chats")
        .insert({ type: "direct" })
        .select()
        .single()

      if (chatError || !newChat) throw chatError

      const { error: partError } = await supabase.from("chat_participants").insert([
        { chat_id: newChat.id, user_id: currentUserId },
        { chat_id: newChat.id, user_id: otherUser.id },
      ])

      if (partError) throw partError

      onCreated()
      router.push(`/chats/${newChat.id}`)
    } catch {
      toast.error("No se pudo iniciar la conversación")
    } finally {
      setCreating(null)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva conversación</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuario…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="min-h-[160px]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 && query.trim() ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No se encontraron usuarios
            </p>
          ) : (
            <div className="space-y-1 mt-1">
              {results.map((user) => (
                <button
                  key={user.id}
                  disabled={!!creating}
                  onClick={() => startDirectChat(user)}
                  className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 hover:bg-muted/60 transition-colors text-left"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar_url ?? ""} />
                    <AvatarFallback className="bg-primary/15 text-primary text-sm">
                      {user.display_name?.charAt(0).toUpperCase() ?? user.username?.charAt(0).toUpperCase() ?? <User className="h-3 w-3" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{user.display_name ?? user.username}</p>
                    {user.display_name && <p className="text-xs text-muted-foreground">@{user.username}</p>}
                  </div>
                  {creating === user.id && <Loader2 className="h-4 w-4 animate-spin" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
