import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { ChatList } from "@/components/chat/chat-list"
import { MessageCircle } from "lucide-react"

export const metadata = {
  title: "Chats · COWork",
  description: "Mensajes y conversaciones",
}

export default async function ChatsLayout({ children }: { children: React.ReactNode }) {
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

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Chat list sidebar */}
      <aside className="w-full md:w-80 border-r flex-shrink-0 flex flex-col md:flex overflow-hidden">
        <ChatList currentUserId={user.id} />
      </aside>

      {/* Chat content area */}
      <main className="hidden md:flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
