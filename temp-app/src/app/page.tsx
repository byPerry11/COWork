"use client"

import { ParticleBackground } from "@/components/particle-background"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingHero } from "@/components/landing/landing-hero"
import { LandingFeatures } from "@/components/landing/landing-features"
import { LandingFooter } from "@/components/landing/landing-footer"

export default function LandingPage() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-black text-white selection:bg-white/20">
      {/* Background Animation */}
      <ParticleBackground />

      {/* Navigation / Header */}
      <LandingHeader />

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center">
        <LandingHero />
        <LandingFeatures />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}
