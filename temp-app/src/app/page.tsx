"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      // Check if there's an existing session
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        // User is already logged in, redirect to dashboard
        router.push("/dashboard")
      } else {
        // No session, redirect to login
        router.push("/login")
      }
    }

    checkSession()
  }, [router])

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
