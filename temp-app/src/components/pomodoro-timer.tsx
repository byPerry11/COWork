"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, SkipForward, RotateCcw, Coffee, Brain, Moon } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak'

interface PomodoroSession {
    id?: string
    user_id: string
    phase: PomodoroPhase
    duration_minutes: number
    completed: boolean
    started_at: string
    ended_at?: string
}

interface PomodoroStats {
    todaySessions: number
    totalSessions: number
    totalMinutes: number
}

const WORK_DURATION = 25 * 60 // 25 minutos en segundos
const SHORT_BREAK = 5 * 60 // 5 minutos
const LONG_BREAK = 15 * 60 // 15 minutos
const SESSIONS_BEFORE_LONG_BREAK = 4

export function PomodoroTimer({ userId }: { userId: string }) {
    const [phase, setPhase] = useState<PomodoroPhase>('work')
    const [timeLeft, setTimeLeft] = useState(WORK_DURATION)
    const [isRunning, setIsRunning] = useState(false)
    const [sessionCount, setSessionCount] = useState(0)
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
    const [stats, setStats] = useState<PomodoroStats>({
        todaySessions: 0,
        totalSessions: 0,
        totalMinutes: 0
    })

    // Cargar estadísticas al montar
    useEffect(() => {
        loadStats()
    }, [userId])

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null

        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handlePhaseComplete()
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isRunning, timeLeft])

    const loadStats = async () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Sesiones de hoy
        const { count: todayCount } = await supabase
            .from('pomodoro_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('completed', true)
            .gte('started_at', today.toISOString())

        // Sesiones totales
        const { count: totalCount } = await supabase
            .from('pomodoro_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('completed', true)

        // Total de minutos
        const { data: sessions } = await supabase
            .from('pomodoro_sessions')
            .select('duration_minutes')
            .eq('user_id', userId)
            .eq('completed', true)

        const totalMinutes = sessions?.reduce((sum, s) => sum + s.duration_minutes, 0) || 0

        setStats({
            todaySessions: todayCount || 0,
            totalSessions: totalCount || 0,
            totalMinutes
        })
    }

    const startSession = async () => {
        const duration = phase === 'work' ? 25 : phase === 'shortBreak' ? 5 : 15

        const { data, error } = await supabase
            .from('pomodoro_sessions')
            .insert({
                user_id: userId,
                phase,
                duration_minutes: duration,
                completed: false,
                started_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) {
            toast.error("Error al iniciar sesión")
            console.error(error)
            return
        }

        setCurrentSessionId(data.id)
        setIsRunning(true)
    }

    const completeSession = async () => {
        if (!currentSessionId) return

        const { error } = await supabase
            .from('pomodoro_sessions')
            .update({
                completed: true,
                ended_at: new Date().toISOString()
            })
            .eq('id', currentSessionId)

        if (error) {
            console.error("Error al completar sesión:", error)
            return
        }

        loadStats()
    }

    const handlePhaseComplete = async () => {
        setIsRunning(false)
        await completeSession()

        // Determinar siguiente fase
        if (phase === 'work') {
            const newCount = sessionCount + 1
            setSessionCount(newCount)

            if (newCount % SESSIONS_BEFORE_LONG_BREAK === 0) {
                setPhase('longBreak')
                setTimeLeft(LONG_BREAK)
                toast.success("¡Tiempo de descanso largo! 🎉")
            } else {
                setPhase('shortBreak')
                setTimeLeft(SHORT_BREAK)
                toast.success("¡Tiempo de descanso corto! ☕")
            }
        } else {
            setPhase('work')
            setTimeLeft(WORK_DURATION)
            toast.success("¡Tiempo de concentración! 🧠")
        }

        setCurrentSessionId(null)
    }

    const handleSkip = async () => {
        if (currentSessionId) {
            // Marcar como no completada pero con ended_at
            await supabase
                .from('pomodoro_sessions')
                .update({
                    completed: false,
                    ended_at: new Date().toISOString()
                })
                .eq('id', currentSessionId)
        }

        setIsRunning(false)
        handlePhaseComplete()
    }

    const handleReset = () => {
        setIsRunning(false)
        setCurrentSessionId(null)
        const duration = phase === 'work' ? WORK_DURATION : phase === 'shortBreak' ? SHORT_BREAK : LONG_BREAK
        setTimeLeft(duration)
    }

    const handlePlayPause = () => {
        if (isRunning) {
            setIsRunning(false)
        } else {
            if (!currentSessionId) {
                startSession()
            } else {
                setIsRunning(true)
            }
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const getPhaseInfo = () => {
        switch (phase) {
            case 'work':
                return {
                    label: 'Concentración',
                    icon: Brain,
                    color: 'text-blue-500',
                    bgColor: 'bg-blue-500/10',
                    total: WORK_DURATION
                }
            case 'shortBreak':
                return {
                    label: 'Descanso Corto',
                    icon: Coffee,
                    color: 'text-green-500',
                    bgColor: 'bg-green-500/10',
                    total: SHORT_BREAK
                }
            case 'longBreak':
                return {
                    label: 'Descanso Largo',
                    icon: Moon,
                    color: 'text-purple-500',
                    bgColor: 'bg-purple-500/10',
                    total: LONG_BREAK
                }
        }
    }

    const phaseInfo = getPhaseInfo()
    const PhaseIcon = phaseInfo.icon
    const progress = ((phaseInfo.total - timeLeft) / phaseInfo.total) * 100

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <PhaseIcon className={`h-5 w-5 ${phaseInfo.color}`} />
                        Pomodoro Timer
                    </CardTitle>
                    <Badge variant="secondary" className="flex items-center gap-1">
                        🍅 {sessionCount}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Fase actual */}
                <div className="text-center space-y-2">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${phaseInfo.bgColor}`}>
                        <PhaseIcon className={`h-4 w-4 ${phaseInfo.color}`} />
                        <span className={`font-medium ${phaseInfo.color}`}>{phaseInfo.label}</span>
                    </div>
                </div>

                {/* Display del tiempo */}
                <div className="text-center">
                    <div className="text-7xl font-bold tabular-nums tracking-tight">
                        {formatTime(timeLeft)}
                    </div>
                </div>

                {/* Barra de progreso */}
                <Progress value={progress} className="h-2" />

                {/* Controles */}
                <div className="flex items-center justify-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleReset}
                        disabled={!currentSessionId && timeLeft === phaseInfo.total}
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>

                    <Button
                        size="lg"
                        onClick={handlePlayPause}
                        className="w-32"
                    >
                        {isRunning ? (
                            <>
                                <Pause className="h-5 w-5 mr-2" />
                                Pausar
                            </>
                        ) : (
                            <>
                                <Play className="h-5 w-5 mr-2" />
                                {currentSessionId ? 'Continuar' : 'Iniciar'}
                            </>
                        )}
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleSkip}
                        disabled={!isRunning && !currentSessionId}
                    >
                        <SkipForward className="h-4 w-4" />
                    </Button>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{stats.todaySessions}</div>
                        <div className="text-xs text-muted-foreground">Hoy</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{stats.totalSessions}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{stats.totalMinutes}</div>
                        <div className="text-xs text-muted-foreground">Minutos</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
