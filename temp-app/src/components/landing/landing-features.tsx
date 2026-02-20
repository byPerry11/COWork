"use client"

import { motion } from "framer-motion"
import { LayoutDashboard, ShieldCheck, Zap } from "lucide-react"

export function LandingFeatures() {
    const features = [
        {
            icon: <LayoutDashboard className="h-6 w-6" />,
            title: "Intuitive Dashboard",
            desc: "Everything you need at a glance. Projects, tasks, and team stats in one place."
        },
        {
            icon: <ShieldCheck className="h-6 w-6" />,
            title: "Secure & Fast",
            desc: "Built with Supabase for enterprise-grade security and real-time performance."
        },
        {
            icon: <Zap className="h-6 w-6" />,
            title: "Real-time Collab",
            desc: "Work together seamlessly. See updates instantly as they happen."
        }
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex justify-center px-4 md:px-0"
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 text-left w-full max-w-5xl">
                {features.map((feature, i) => (
                    <div key={i} className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm">
                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white group-hover:scale-110 transition-transform duration-300">
                            {feature.icon}
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-white">{feature.title}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                    </div>
                ))}
            </div>
        </motion.div>
    )
}
