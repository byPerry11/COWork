"use client"

import { useState, useRef, useEffect } from "react"
import { usePomodoro } from "@/contexts/pomodoro-context"
import { Button } from "@/components/ui/button"
import { Play, Pause, X, Maximize2, Brain, Coffee, Moon, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

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

    // Dragging state
    const [position, setPosition] = useState({ x: 0, y: 0 }) // Will be set on mount
    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const timerRef = useRef<HTMLDivElement>(null)
    const isInitialized = useRef(false)

    // Initial position (bottom right)
    useEffect(() => {
        if (!isInitialized.current && typeof window !== 'undefined') {
            setPosition({
                x: window.innerWidth - 320, // Approximate width + padding
                y: window.innerHeight - 150
            })
            isInitialized.current = true
        }
    }, [])

    // Handle resizing to keep in bounds
    useEffect(() => {
        const handleResize = () => {
            if (timerRef.current) {
                const { innerWidth, innerHeight } = window
                setPosition(prev => ({
                    x: Math.min(prev.x, innerWidth - timerRef.current!.offsetWidth),
                    y: Math.min(prev.y, innerHeight - timerRef.current!.offsetHeight)
                }))
            }
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

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
                    label: 'Trabajo',
                    icon: Brain,
                    color: 'text-blue-500',
                    bgColor: 'bg-blue-500',
                    ringColor: 'ring-blue-500/30',
                    total: settings.workDuration
                }
            case 'shortBreak':
                return {
                    label: 'Descanso',
                    icon: Coffee,
                    color: 'text-green-500',
                    bgColor: 'bg-green-500',
                    ringColor: 'ring-green-500/30',
                    total: settings.shortBreakDuration
                }
            case 'longBreak':
                return {
                    label: 'Descanso Largo',
                    icon: Moon,
                    color: 'text-purple-500',
                    bgColor: 'bg-purple-500',
                    ringColor: 'ring-purple-500/30',
                    total: settings.longBreakDuration
                }
        }
    }

    const phaseInfo = getPhaseInfo()
    const PhaseIcon = phaseInfo.icon
    const progress = ((phaseInfo.total - timeLeft) / phaseInfo.total) * 100

    const handleDismiss = () => {
        setIsDismissed(true)
        resetSession()
    }

    // Drag handlers
    const handlePointerDown = (e: React.PointerEvent) => {
        // Prevent dragging if clicking buttons
        if ((e.target as HTMLElement).closest('button')) return

        setIsDragging(true)
        const rect = timerRef.current?.getBoundingClientRect()
        if (rect) {
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            })
        }
        e.preventDefault() // Prevent selection
    }

    const handlePointerMove = (e: PointerEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y
            })
        }
    }

    const handlePointerUp = () => {
        if (isDragging) {
            setIsDragging(false)
            // Snap to edges
            const { innerWidth } = window
            const widgetWidth = timerRef.current?.offsetWidth || 0
            const threshold = innerWidth / 2

            let snapX = 0

            // Snap to Right or Left
            if (position.x + widgetWidth / 2 > threshold) {
                snapX = innerWidth - widgetWidth - 20 // 20px padding right
            } else {
                snapX = 20 // 20px padding left
            }

            // Keep Y in bounds
            const maxY = window.innerHeight - (timerRef.current?.offsetHeight || 0) - 20
            const snapY = Math.max(20, Math.min(position.y, maxY))

            setPosition({ x: snapX, y: snapY })
        }
    }

    // Global drag listeners
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('pointermove', handlePointerMove)
            window.addEventListener('pointerup', handlePointerUp)
        } else {
            window.removeEventListener('pointermove', handlePointerMove)
            window.removeEventListener('pointerup', handlePointerUp)
        }
        return () => {
            window.removeEventListener('pointermove', handlePointerMove)
            window.removeEventListener('pointerup', handlePointerUp)
        }
    }, [isDragging, dragOffset]) // eslint-disable-line react-hooks/exhaustive-deps


    return (
        <div
            ref={timerRef}
            style={{
                left: position.x,
                top: position.y,
                touchAction: 'none' // Important for dragging on mobile
            }}
            onPointerDown={handlePointerDown}
            className={cn(
                "fixed z-[100] transition-shadow duration-300 ease-in-out cursor-grab active:cursor-grabbing",
                // Remove existing positioning classes since we use inline styles
                "transition-all duration-300", // Smooth snapping when not dragging
                isDragging && "transition-none", // Responsive dragging
                isExpanded ? "w-72" : "w-auto"
            )}
        >
            <div
                className={cn(
                    "bg-card/95 backdrop-blur-lg border shadow-2xl rounded-2xl overflow-hidden",
                    "ring-2",
                    phaseInfo.ringColor,
                    isRunning && "animate-pulse-subtle"
                )}
            >
                {/* Mini version (collapsed) */}
                {!isExpanded && (
                    <div
                        className="flex items-center gap-3 p-3 transition-colors relative group"
                    >
                        {/* Drag Handle Overlay */}
                        <div className="absolute inset-0 bg-transparent" />

                        {/* Expand Button (Clickable area needs to be explicit) */}
                        <div
                            className="cursor-pointer z-10"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(true);
                            }}
                        >
                            {/* Circular progress indicator */}
                            <div className="relative">
                                <svg className="w-12 h-12 -rotate-90 pointer-events-none">
                                    <circle
                                        cx="24"
                                        cy="24"
                                        r="20"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                        className="text-muted"
                                    />
                                    <circle
                                        cx="24"
                                        cy="24"
                                        r="20"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                        strokeDasharray={125.6}
                                        strokeDashoffset={125.6 - (progress / 100) * 125.6}
                                        className={phaseInfo.color}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <PhaseIcon className={cn("h-5 w-5", phaseInfo.color)} />
                                </div>
                            </div>
                        </div>

                        {/* Time & Drag trigger */}
                        <div className="flex-1 select-none">
                            <div className="text-xl font-bold tabular-nums pointer-events-none">
                                {formatTime(timeLeft)}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 pointer-events-none">
                                🍅 {sessionCount}
                            </div>
                        </div>

                        {/* Quick controls (z-10 to be clickable) */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 z-10 relative"
                            onClick={(e) => {
                                e.stopPropagation()
                                isRunning ? pauseSession() : resumeSession()
                            }}
                        >
                            {isRunning ? (
                                <Pause className="h-4 w-4" />
                            ) : (
                                <Play className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                )}

                {/* Expanded version */}
                {isExpanded && (
                    <div className="p-4 space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between cursor-default">
                            <div className="flex items-center gap-2">
                                <GripVertical className="h-4 w-4 text-muted-foreground/50 mr-1" />
                                <div className={cn("p-1.5 rounded-full", phaseInfo.bgColor + "/10")}>
                                    <PhaseIcon className={cn("h-4 w-4", phaseInfo.color)} />
                                </div>
                                <span className={cn("text-sm font-medium", phaseInfo.color)}>
                                    {phaseInfo.label}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 z-10 relative">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                                >
                                    <Maximize2 className="h-3.5 w-3.5 rotate-180" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                    onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>

                        {/* Timer display */}
                        <div className="text-center select-none cursor-default">
                            <div className="text-5xl font-bold tabular-nums tracking-tight">
                                {formatTime(timeLeft)}
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-muted rounded-full h-1.5 cursor-default">
                            <div
                                className={cn("h-1.5 rounded-full transition-all", phaseInfo.bgColor)}
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        {/* Controls (z-10) */}
                        <div className="flex items-center justify-center gap-2 z-10 relative">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); resetSession(); }}
                            >
                                Reiniciar
                            </Button>
                            <Button
                                size="sm"
                                className="min-w-[100px]"
                                onClick={(e) => { e.stopPropagation(); isRunning ? pauseSession() : resumeSession(); }}
                            >
                                {isRunning ? (
                                    <>
                                        <Pause className="h-4 w-4 mr-1.5" />
                                        Pausar
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4 mr-1.5" />
                                        Continuar
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Session count */}
                        <div className="text-center text-xs text-muted-foreground cursor-default">
                            Sesiones hoy: 🍅 {sessionCount}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
