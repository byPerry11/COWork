"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function LandingHeader() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 md:px-12">
      <div className="flex items-center gap-3">
        <div className="relative h-8 w-8 md:h-10 md:w-10 overflow-hidden rounded-xl border border-white/10 shadow-lg">
          <img
            src="/cowork-logo-dark.png"
            alt="COWork"
            className="h-full w-full object-cover"
          />
        </div>
        <span className="font-bold tracking-wider text-xl text-white">COWork</span>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/login" className="hidden sm:block">
          <Button variant="ghost" className="text-white hover:text-white/80 hover:bg-white/10">
            Log In
          </Button>
        </Link>
        <Link href="/login?tab=signup">
          <Button className="bg-white text-black hover:bg-white/90 font-medium px-4 md:px-6 rounded-full text-sm md:text-base h-9 md:h-10">
            Sign Up
          </Button>
        </Link>
      </div>
    </header>
  )
}
