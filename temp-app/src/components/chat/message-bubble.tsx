"use client"

import { Message, Profile } from "@/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showSender?: boolean
}

export function MessageBubble({ message, isOwn, showSender }: MessageBubbleProps) {
  const sender = message.sender as Profile | null
  const initials = sender?.display_name?.charAt(0).toUpperCase()
    ?? sender?.username?.charAt(0).toUpperCase()
    ?? "?"

  return (
    <div className={cn("flex items-end gap-2 mb-2", isOwn ? "flex-row-reverse" : "flex-row")}>
      {!isOwn && (
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarImage src={sender?.avatar_url ?? ""} />
          <AvatarFallback className="text-xs bg-primary/20 text-primary">{initials}</AvatarFallback>
        </Avatar>
      )}

      <div className={cn("flex flex-col gap-0.5 max-w-[70%]", isOwn ? "items-end" : "items-start")}>
        {showSender && !isOwn && (
          <span className="text-xs text-muted-foreground ml-1">
            {sender?.display_name ?? sender?.username ?? "Usuario"}
          </span>
        )}
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm"
          )}
        >
          {message.content}
        </div>
        <span className="text-[10px] text-muted-foreground px-1">
          {format(new Date(message.created_at), "HH:mm")}
          {message.is_edited && " · editado"}
        </span>
      </div>

      {isOwn && <div className="h-7 w-7 shrink-0" />}
    </div>
  )
}
