"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"

type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak'

interface PomodoroSession {
    id: string
    phase: PomodoroPhase
    duration_minutes: number
}

interface PomodoroStats {
    todaySessions: number
    totalSessions: number
    totalMinutes: number
}

interface PomodoroSettings {
    workDuration: number
    shortBreakDuration: number
    longBreakDuration: number
    autoStartBreaks: boolean
    autoStartWork: boolean
}

interface PomodoroContextType {
    // Estado del timer
    phase: PomodoroPhase
    timeLeft: number
    isRunning: boolean
    sessionCount: number
    currentSessionId: string | null
    stats: PomodoroStats
    userId: string | null
    settings: PomodoroSettings

    // Acciones
    setUserId: (id: string) => void
    startSession: () => Promise<void>
    pauseSession: () => void
    resumeSession: () => void
    resetSession: () => void
    skipPhase: () => Promise<void>
    loadStats: () => Promise<void>
    updateSettings: (newSettings: Partial<PomodoroSettings>) => void
}

const DEFAULT_SETTINGS: PomodoroSettings = {
    workDuration: 25 * 60,
    shortBreakDuration: 5 * 60,
    longBreakDuration: 15 * 60,
    autoStartBreaks: false,
    autoStartWork: false
}

const SESSIONS_BEFORE_LONG_BREAK = 4

const PomodoroContext = createContext<PomodoroContextType | null>(null)

export function PomodoroProvider({ children }: { children: ReactNode }) {
    const [userId, setUserId] = useState<string | null>(null)
    const [phase, setPhase] = useState<PomodoroPhase>('work')
    const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS)
    const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.workDuration)
    const [isRunning, setIsRunning] = useState(false)
    const [sessionCount, setSessionCount] = useState(0)
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
    const [stats, setStats] = useState<PomodoroStats>({
        todaySessions: 0,
        totalSessions: 0,
        totalMinutes: 0
    })

    const loadStats = useCallback(async () => {
        if (!userId) return

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const { count: todayCount } = await supabase
            .from('pomodoro_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('completed', true)
            .gte('started_at', today.toISOString())

        const { count: totalCount } = await supabase
            .from('pomodoro_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('completed', true)

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
    }, [userId])

    const updateSettings = (newSettings: Partial<PomodoroSettings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings }
            // If timer is not running, update current time left to match new setting for current phase
            if (!isRunning) {
                if (phase === 'work') setTimeLeft(updated.workDuration)
                else if (phase === 'shortBreak') setTimeLeft(updated.shortBreakDuration)
                else if (phase === 'longBreak') setTimeLeft(updated.longBreakDuration)
            }
            return updated
        })
    }

    const completeSession = useCallback(async () => {
        if (!currentSessionId) return

        await supabase
            .from('pomodoro_sessions')
            .update({
                completed: true,
                ended_at: new Date().toISOString()
            })
            .eq('id', currentSessionId)

        loadStats()
    }, [currentSessionId, loadStats])

    const startSession = useCallback(async () => {
        if (!userId) {
            toast.error("Usuario no identificado")
            return
        }

        const duration = phase === 'work' ? settings.workDuration / 60 :
            phase === 'shortBreak' ? settings.shortBreakDuration / 60 :
                settings.longBreakDuration / 60

        const { data, error } = await supabase
            .from('pomodoro_sessions')
            .insert({
                user_id: userId,
                phase,
                duration_minutes: Math.round(duration),
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
    }, [userId, phase, settings])

    const handlePhaseComplete = useCallback(async () => {
        setIsRunning(false)
        await completeSession()

        let nextPhase: PomodoroPhase = 'work'
        let shouldAutoStart = false

        if (phase === 'work') {
            const newCount = sessionCount + 1
            setSessionCount(newCount)

            if (newCount % SESSIONS_BEFORE_LONG_BREAK === 0) {
                nextPhase = 'longBreak'
                setPhase('longBreak')
                setTimeLeft(settings.longBreakDuration)
                toast.success("¡Tiempo de descanso largo! 🎉")
            } else {
                nextPhase = 'shortBreak'
                setPhase('shortBreak')
                setTimeLeft(settings.shortBreakDuration)
                toast.success("¡Tiempo de descanso corto! ☕")
            }
            shouldAutoStart = settings.autoStartBreaks
        } else {
            nextPhase = 'work'
            setPhase('work')
            setTimeLeft(settings.workDuration)
            toast.success("¡Tiempo de concentración! 🧠")
            shouldAutoStart = settings.autoStartWork
        }

        setCurrentSessionId(null)

        if (shouldAutoStart) {
            // Need to wait a tick for state updates or ensure startSession uses latest state
            // Passing nextPhase explicitly or using ref would be better, but for simplicity
            // we'll rely on effect or just call startSession with a small delay if needed.
            // However, startSession depends on 'phase' state.
            // A safer way is to trigger it via an effect or timeout.
            setTimeout(() => {
                // We need to fetch the fresh 'phase' state or pass it. 
                // Since startSession uses state, we rely on the state update above being batched/processed.
                // But in React 18, automatic batching might make this tricky if not careful.
                // Let's manually invoke internal logic or use a ref for 'autoStartNext'.
                // For now, let's try calling the public startSession from inside here, 
                // but we need to be careful about the 'phase' it sees.
                // Actually, due to closure, 'phase' here is old. 
                // We should NOT call startSession here directly if it depends on 'phase'.
                // Instead, we can set a flag "shouldStart" and handle it in an effect.
            }, 0)
        }
    }, [phase, sessionCount, completeSession, settings])

    // Auto-start mechanic
    useEffect(() => {
        // This is a bit tricky with the closure issue in handlePhaseComplete.
        // Let's keep it simple: handlePhaseComplete stops timer.
        // We can check if we just finished a phase and need to restart.
        // Alternatively, use a separate effect for auto-start.
    }, [])

    // Refactored handlePhaseComplete to be more robust
    useEffect(() => {
        if (timeLeft === 0 && isRunning) {
            const transition = async () => {
                setIsRunning(false)
                await completeSession()

                let nextPhase: PomodoroPhase = 'work'
                let nextTime = 0
                let shouldAutoStart = false

                if (phase === 'work') {
                    const newCount = sessionCount + 1
                    setSessionCount(newCount)

                    if (newCount % SESSIONS_BEFORE_LONG_BREAK === 0) {
                        nextPhase = 'longBreak'
                        nextTime = settings.longBreakDuration
                        toast.success("¡Tiempo de descanso largo! 🎉")
                    } else {
                        nextPhase = 'shortBreak'
                        nextTime = settings.shortBreakDuration
                        toast.success("¡Tiempo de descanso corto! ☕")
                    }
                    shouldAutoStart = settings.autoStartBreaks
                } else {
                    nextPhase = 'work'
                    nextTime = settings.workDuration
                    toast.success("¡Tiempo de concentración! 🧠")
                    shouldAutoStart = settings.autoStartWork
                }

                setPhase(nextPhase)
                setTimeLeft(nextTime)
                setCurrentSessionId(null)

                if (shouldAutoStart) {
                    // We need to start the NEW session. 
                    // We can't call startSession immediately because 'phase' state update might not be reflected yet?
                    // actually, we can pass params to a helper if we want, or just trigger a state that effect picks up.
                    // Or simply:
                    setTimeout(() => {
                        // startSession reads 'phase' from state. 
                        // With setTimeout(..., 0), we hope state is updated.
                        document.getElementById('pomodoro-auto-start-trigger')?.click()
                    }, 100)
                }
            }
            transition()
        }
    }, [timeLeft, isRunning]) // Removed handlePhaseComplete from dependency to avoid loop, handled inline.

    // Helper to trigger start from outside (hacky but reliable for auto-start after state update)
    // Better: Helper function that accepts phase

    // Let's fix the Timer Effect
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null

        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1)
            }, 1000)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isRunning, timeLeft])

    // Special effect to handle auto-start after phase change
    useEffect(() => {
        const handleAutoStart = async () => {
            // This logic needs to be triggered explicitly. 
            // Let's stick to the separation in transition logic.
            // If we want simple auto-start:
            // We can have a specific state `autoStarting`
        }
    }, [])

    // We need a way to reliably start the NEXT session after state update.
    // Let's use a Ref to track if we should auto-start
    const autoStartRef = useState(false) // actually valid state 
    // Scratch that, let's just make startSession accept an optional phase argument? 
    // No, context interface is fixed.

    // Simplified Clean approach:
    // 1. Timer hits 0 -> stop, complete, calculate next phase.
    // 2. Set next phase and time.
    // 3. IF auto-start is true: setIsRunning(true) AND create new session record.
    // wait, create new session record needs 'phase' to be correct.

    // Let's create an internal helper `startSessionInternal(phaseOverride?)`

    const startSessionInternal = async (phaseOverride?: PomodoroPhase) => {
        const currentPhase = phaseOverride || phase
        if (!userId) return

        const duration = currentPhase === 'work' ? settings.workDuration / 60 :
            currentPhase === 'shortBreak' ? settings.shortBreakDuration / 60 :
                settings.longBreakDuration / 60

        const { data, error } = await supabase
            .from('pomodoro_sessions')
            .insert({
                user_id: userId,
                phase: currentPhase,
                duration_minutes: Math.round(duration),
                completed: false,
                started_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) {
            toast.error("Error al iniciar sesión")
            return
        }

        setCurrentSessionId(data.id)
        setIsRunning(true)
    }

    // Overwrite startSession to use internal
    const startSessionPublic = async () => startSessionInternal(phase)

    const pauseSession = () => setIsRunning(false)
    const resumeSession = () => setIsRunning(true)

    const resetSession = () => {
        setIsRunning(false)
        setCurrentSessionId(null)
        const duration = phase === 'work' ? settings.workDuration :
            phase === 'shortBreak' ? settings.shortBreakDuration :
                settings.longBreakDuration
        setTimeLeft(duration)
    }

    const skipPhase = async () => {
        if (currentSessionId) {
            await supabase
                .from('pomodoro_sessions')
                .update({
                    completed: false,
                    ended_at: new Date().toISOString()
                })
                .eq('id', currentSessionId)
        }

        // Trigger completion logic manually
        // We can just set timeLeft to 0 to trigger the effect? 
        // Or refactor transition logic to a function.
        // Let's refactor transition logic:
        transitionPhase()
    }

    const transitionPhase = async () => {
        setIsRunning(false)
        // If there was a session, we assume it's handled (skipped or completed) before calling this
        // But completeSession() checks currentSessionId.
        await completeSession()

        let nextPhase: PomodoroPhase = 'work'
        let nextTime = 0
        let shouldAutoStart = false

        // Current phase logic
        if (phase === 'work') {
            const newCount = sessionCount + 1
            setSessionCount(newCount)

            if (newCount % SESSIONS_BEFORE_LONG_BREAK === 0) {
                nextPhase = 'longBreak'
                nextTime = settings.longBreakDuration
                toast.success("¡Tiempo de descanso largo! 🎉")
            } else {
                nextPhase = 'shortBreak'
                nextTime = settings.shortBreakDuration
                toast.success("¡Tiempo de descanso corto! ☕")
            }
            shouldAutoStart = settings.autoStartBreaks
        } else {
            nextPhase = 'work'
            nextTime = settings.workDuration
            toast.success("¡Tiempo de concentración! 🧠")
            shouldAutoStart = settings.autoStartWork
        }

        setPhase(nextPhase)
        setTimeLeft(nextTime)
        setCurrentSessionId(null)

        if (shouldAutoStart) {
            // Call internal start with NEW phase
            // We use setTimeout to ensure state setPhase has processed if any derived state relies on it, 
            // but essentially we just need to pass the new phase to insert.
            setTimeout(() => startSessionInternal(nextPhase), 100)
        }
    }

    // Effect for Timer 0
    useEffect(() => {
        if (timeLeft === 0 && isRunning) {
            transitionPhase()
        }
    }, [timeLeft, isRunning]) // eslint-disable-line react-hooks/exhaustive-deps

    const value: PomodoroContextType = {
        phase,
        timeLeft,
        isRunning,
        sessionCount,
        currentSessionId,
        stats,
        userId,
        settings,
        setUserId,
        startSession: startSessionPublic,
        pauseSession,
        resumeSession,
        resetSession,
        skipPhase,
        loadStats,
        updateSettings
    }

    return (
        <PomodoroContext.Provider value={value}>
            {children}
        </PomodoroContext.Provider>
    )
}

export function usePomodoro() {
    const context = useContext(PomodoroContext)
    if (!context) {
        throw new Error('usePomodoro must be used within a PomodoroProvider')
    }
    return context
}

export { SESSIONS_BEFORE_LONG_BREAK }
export type { PomodoroPhase, PomodoroStats, PomodoroSettings }
