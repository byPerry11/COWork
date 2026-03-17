import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { ChatWindow } from "@/components/chat/chat-window"

interface ChatPageProps {
  params: Promise<{ chatId: string }>
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { chatId } = await params
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Verify the user is a participant of this chat
  const { data: participation } = await supabase
    .from("chat_participants")
    .select("chat_id")
    .eq("chat_id", chatId)
    .eq("user_id", user.id)
    .single()

  if (!participation) redirect("/chats")

  return <ChatWindow chatId={chatId} currentUserId={user.id} />
}
