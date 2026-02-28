"use client"

import { useState, useRef, useEffect } from "react"
import { usePomodoro } from "@/contexts/pomodoro-context"
import { Button } from "@/components/ui/button"
import { Play, Pause, X, Maximize2, Brain, Coffee, Moon, GripVertical, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence, useDragControls } from "framer-motion"

export function MiniPomodoroTimer() {
    const {
        phase,
        timeLeft,
        isRunning,
        currentSessionId,
        sessionCount,
        pauseSession,
        resumeSession,
        resetSession,
        settings
    } = usePomodoro()

    const [isExpanded, setIsExpanded] = useState(false)
    const [isDismissed, setIsDismissed] = useState(false)
    const constraintsRef = useRef(null)

    // No mostrar si no hay sesión activa o se ha descartado
    if (!currentSessionId || isDismissed) return null

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const getPhaseInfo = () => {
        switch (phase) {
            case 'work':
                return {
                    label: 'Focus',
                    icon: Brain,
                    color: 'text-indigo-500',
                    bgColor: 'bg-indigo-500',
                    ringColor: 'ring-indigo-500/20',
                    total: settings.workDuration
                }
            case 'shortBreak':
                return {
                    label: 'Break',
                    icon: Coffee,
                    color: 'text-emerald-500',
                    bgColor: 'bg-emerald-500',
                    ringColor: 'ring-emerald-500/20',
                    total: settings.shortBreakDuration
                }
            case 'longBreak':
                return {
                    label: 'Rest',
                    icon: Moon,
                    color: 'text-amber-500',
                    bgColor: 'bg-amber-500',
                    ringColor: 'ring-amber-500/20',
                    total: settings.longBreakDuration
                }
        }
    }

    const phaseInfo = getPhaseInfo()
    const PhaseIcon = phaseInfo.icon
    const progress = ((phaseInfo.total - timeLeft) / phaseInfo.total) * 100

    return (
        <motion.div
            drag
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="fixed bottom-24 right-6 z-[100] touch-none"
        >
            <div
                className={cn(
                    "bg-background/95 backdrop-blur-md border shadow-xl rounded-2xl overflow-hidden transition-all duration-300",
                    "ring-1",
                    phaseInfo.ringColor,
                    isExpanded ? "w-64" : "w-auto"
                )}
            >
                <AnimatePresence mode="wait">
                    {!isExpanded ? (
                        <motion.div
                            key="collapsed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-3 p-2 pl-3"
                        >
                            <div 
                                onClick={() => setIsExpanded(true)}
                                className="flex items-center gap-3 cursor-pointer group"
                            >
                                <div className="relative h-10 w-10 flex-shrink-0">
                                    <svg className="w-full h-full -rotate-90">
                                        <circle
                                            cx="20" cy="20" r="18"
                                            stroke="currentColor" strokeWidth="3" fill="none"
                                            className="text-muted/30"
                                        />
                                        <motion.circle
                                            cx="20" cy="20" r="18"
                                            stroke="currentColor" strokeWidth="3" fill="none"
                                            strokeDasharray={113}
                                            animate={{ strokeDashoffset: 113 - (progress / 100) * 113 }}
                                            className={phaseInfo.color}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <PhaseIcon className={cn("h-4 w-4", phaseInfo.color)} />
                                    </div>
                                </div>
                                
                                <div className="flex flex-col pr-2">
                                    <span className="text-sm font-bold tabular-nums leading-none">
                                        {formatTime(timeLeft)}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-medium">
                                        Session {sessionCount + 1}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center border-l pl-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={() => isRunning ? pauseSession() : resumeSession()}
                                >
                                    {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="expanded"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-4 pt-3 space-y-3"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <PhaseIcon className={cn("h-4 w-4", phaseInfo.color)} />
                                    <span className={cn("text-xs font-bold uppercase tracking-wider", phaseInfo.color)}>
                                        {phaseInfo.label}
                                    </span>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => setIsExpanded(false)}
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>

                            <div className="text-center">
                                <span className="text-4xl font-black tabular-nums tracking-tighter">
                                    {formatTime(timeLeft)}
                                </span>
                            </div>

                            <div className="flex items-center justify-center gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 text-xs px-3"
                                    onClick={() => resetSession()}
                                >
                                    Reset
                                </Button>
                                <Button
                                    size="sm"
                                    className={cn("h-8 text-xs px-4 font-bold shadow-sm", phaseInfo.bgColor)}
                                    onClick={() => isRunning ? pauseSession() : resumeSession()}
                                >
                                    {isRunning ? "PAUSE" : "START"}
                                </Button>
                            </div>
                            
                            <div className="flex justify-between items-center text-[10px] text-muted-foreground font-medium pt-1">
                                <span>Completed: {sessionCount}</span>
                                <span className="opacity-50">Next: {phase === 'work' ? 'Break' : 'Focus'}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}
