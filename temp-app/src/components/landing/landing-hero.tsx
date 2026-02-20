"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LandingHero() {
    return (
        <div className="relative z-10 flex flex-col items-center justify-center px-4 pt-32 pb-16 text-center">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex flex-col items-center max-w-4xl"
            >
                {/* App Icon / Logo Main */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="mb-8 relative group"
                >
                    <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
                    <img
                        src="/cowork-logo-dark.png"
                        alt="COWork Logo"
                        className="h-48 w-48 md:h-64 md:w-64 relative z-10 drop-shadow-2xl rounded-[3.5rem]"
                    />
                </motion.div>

                <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-7xl lg:text-8xl">
                    <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                        Collaborate
                    </span>
                    <br />
                    <span className="text-stroke-white text-transparent" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.3)" }}>
                        Without Limits.
                    </span>
                </h1>

                <p className="mb-10 max-w-2xl text-base text-gray-400 md:text-xl leading-relaxed">
                    The ultimate workspace management platform designed for modern teams.
                    Streamline projects, manage members, and boost productivity with an elegant, dark-mode first experience.
                </p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="flex flex-col sm:flex-row gap-4"
                >
                    <Link href="/login?tab=signup">
                        <Button size="lg" className="bg-white text-black hover:bg-gray-200 text-lg h-12 px-8 rounded-full group w-full sm:w-auto">
                            Get Started Free
                            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </Link>
                    <Link href="/about">
                        <Button size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10 text-lg h-12 px-8 rounded-full backdrop-blur-sm w-full sm:w-auto">
                            Learn More
                        </Button>
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    )
}
