"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface GenericLoadingProps {
    className?: string;
    size?: number;
}

export function GenericLoading({ className, size = 128 }: GenericLoadingProps) {
    const [mounted, setMounted] = useState(false)
    const { resolvedTheme } = useTheme()

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className={className || "h-screen w-full bg-background"} />
    }

    // Logic requested by user:
    // onlycow-white.png -> Dark Mode
    // onlycow-black.png -> Light Mode
    const logoSrc = resolvedTheme === "dark"
        ? "/onlycow-white.png"
        : "/onlycow-black.png"

    return (
        <div className={`flex flex-col items-center justify-center ${className || "h-screen w-full bg-background"}`}>
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                    opacity: [0.8, 1, 0.8]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="relative flex items-center justify-center"
                style={{ width: size, height: size }}
            >
                {/* Glow effect matching theme */}
                <div className={`absolute inset-0 blur-3xl rounded-full ${resolvedTheme === 'dark' ? 'bg-white/10' : 'bg-black/10'}`} />

                <img
                    src={logoSrc}
                    alt="Loading..."
                    className="relative z-10 w-full h-full object-contain drop-shadow-xl"
                />
            </motion.div>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 text-sm font-medium tracking-widest text-muted-foreground uppercase"
            >
                Loading
            </motion.p>
        </div>
    )
}
