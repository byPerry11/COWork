"use client"

import { Button } from "@/components/ui/button"
import { Timer, PenTool, Target, Sparkles } from "lucide-react"
import { ToolsMenu } from "@/components/layout/tools-menu"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"
import { useState } from "react"
import { motion } from "framer-motion"

interface ToolsWidgetProps {
    userId: string
}

const tools = [
    {
        id: "pomodoro",
        label: "Pomodoro",
        description: "Gestiona tu tiempo",
        icon: Timer,
        color: "from-orange-500 to-amber-400",
        bgHover: "hover:bg-orange-500/10",
        iconColor: "text-orange-500",
        borderColor: "border-orange-500/20",
    },
    {
        id: "whiteboard",
        label: "Canvas",
        description: "Pizarra digital",
        icon: PenTool,
        color: "from-blue-500 to-cyan-400",
        bgHover: "hover:bg-blue-500/10",
        iconColor: "text-blue-500",
        borderColor: "border-blue-500/20",
    },
    {
        id: "checkpoints",
        label: "Metas",
        description: "Objetivos del proyecto",
        icon: Target,
        color: "from-emerald-500 to-green-400",
        bgHover: "hover:bg-emerald-500/10",
        iconColor: "text-emerald-500",
        borderColor: "border-emerald-500/20",
    },
]

export function ToolsWidget({ userId }: ToolsWidgetProps) {
    const router = useRouter()
    const [isToolsOpen, setIsToolsOpen] = useState(false)
    const [activeTab, setActiveTab] = useState("pomodoro")

    const handleOpenTool = (toolId: string) => {
        if (toolId === "whiteboard") {
            handleCreateWhiteboard()
            return
        }
        setActiveTab(toolId)
        setIsToolsOpen(true)
    }

    const handleCreateWhiteboard = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user) {
                toast.error("Debes iniciar sesión para crear un canvas")
                return
            }

            const { data, error } = await supabase
                .from('whiteboards')
                .insert({ owner_id: session.user.id, title: "Nuevo Whiteboard" })
                .select()
                .single()

            if (error) throw error

            if (data) {
                router.push(`/tools/whiteboard/${data.id}`)
            }
        } catch (e) {
            console.error("Error creating whiteboard:", e)
            toast.error("Error al crear el canvas")
        }
    }

    return (
        <>
            <ToolsMenu 
                userId={userId} 
                open={isToolsOpen} 
                onOpenChange={setIsToolsOpen} 
                defaultTab={activeTab}
            />
            
            <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-background to-muted/30 p-4 shadow-sm">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-md">
                        <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold tracking-tight">Herramientas</h3>
                        <p className="text-[11px] text-muted-foreground leading-none">Productividad</p>
                    </div>
                </div>

                {/* Tool Cards Grid */}
                <div className="grid gap-2">
                    {tools.map((tool, index) => {
                        const Icon = tool.icon
                        return (
                            <motion.button
                                key={tool.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.08, duration: 0.3 }}
                                onClick={() => handleOpenTool(tool.id)}
                                className={`
                                    group flex items-center gap-3 w-full p-3 rounded-xl 
                                    border ${tool.borderColor} bg-background/60 backdrop-blur-sm
                                    ${tool.bgHover} hover:shadow-md
                                    transition-all duration-200 cursor-pointer text-left
                                    hover:scale-[1.02] active:scale-[0.98]
                                `}
                            >
                                {/* Icon Container */}
                                <div className={`
                                    flex items-center justify-center w-10 h-10 rounded-xl
                                    bg-gradient-to-br ${tool.color} shadow-sm
                                    group-hover:shadow-md transition-shadow duration-200
                                `}>
                                    <Icon className="h-5 w-5 text-white" />
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium leading-none mb-0.5">{tool.label}</p>
                                    <p className="text-[11px] text-muted-foreground leading-none truncate">
                                        {tool.description}
                                    </p>
                                </div>

                                {/* Arrow indicator */}
                                <svg 
                                    className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all duration-200" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor" 
                                    strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </motion.button>
                        )
                    })}
                </div>
            </div>
        </>
    )
}
