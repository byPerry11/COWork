"use client"

import { FloatingNav } from "@/components/layout/floating-nav"
import { PomodoroProvider } from "@/contexts/pomodoro-context"
import { MiniPomodoroTimer } from "@/components/layout/mini-pomodoro-timer"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    return (
        <PomodoroProvider>
            <FloatingNav />
            <div className="hidden md:block fixed top-6 left-6 z-50">
                <img src="/main-logo.png" alt="COWork" className="h-12 w-auto" />
            </div>
            
            <AnimatePresence mode="wait">
                <motion.div
                    key={pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="md:pl-24 w-full"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
            
            <MiniPomodoroTimer />
        </PomodoroProvider>
    )
}
