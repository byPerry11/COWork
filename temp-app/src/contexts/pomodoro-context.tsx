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

    // Sync userId with session automatically
    useEffect(() => {
        const syncUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user?.id) {
                setUserId(session.user.id)
                loadStats()
            }
        }
        syncUser()
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user?.id) {
                setUserId(session.user.id)
            } else {
                setUserId(null)
            }
        })
        
        return () => subscription.unsubscribe()
    }, [loadStats])

    const updateSettings = (newSettings: Partial<PomodoroSettings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings }
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

        try {
            await supabase
                .from('pomodoro_sessions')
                .update({
                    completed: true,
                    ended_at: new Date().toISOString()
                })
                .eq('id', currentSessionId)
            
            await loadStats()
        } catch (error) {
            console.error("Error completing session:", error)
        }
    }, [currentSessionId, loadStats])

    const startSessionInternal = async (phaseOverride?: PomodoroPhase) => {
        const currentPhase = phaseOverride || phase
        if (!userId) {
            // Re-attempt to get session if userId is missing
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user?.id) return
            setUserId(session.user.id)
        }

        const duration = currentPhase === 'work' ? settings.workDuration / 60 :
            currentPhase === 'shortBreak' ? settings.shortBreakDuration / 60 :
                settings.longBreakDuration / 60

        try {
            const { data, error } = await supabase
                .from('pomodoro_sessions')
                .insert({
                    user_id: userId || (await supabase.auth.getSession()).data.session?.user.id,
                    phase: currentPhase,
                    duration_minutes: Math.max(1, Math.round(duration)),
                    completed: false,
                    started_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) throw error
            setCurrentSessionId(data.id)
            setIsRunning(true)
        } catch (error) {
            console.error("Failed to start pomodoro session:", error)
            // Fallback for offline or error: start timer locally anyway
            setIsRunning(true)
        }
    }

    const startSessionPublic = async () => startSessionInternal(phase)

    const transitionPhase = useCallback(async () => {
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
                toast.success("¡Descanso largo! 🎉")
            } else {
                nextPhase = 'shortBreak'
                nextTime = settings.shortBreakDuration
                toast.success("¡Descanso corto! ☕")
            }
            shouldAutoStart = settings.autoStartBreaks
        } else {
            nextPhase = 'work'
            nextTime = settings.workDuration
            toast.success("¡A trabajar! 🧠")
            shouldAutoStart = settings.autoStartWork
        }

        setPhase(nextPhase)
        setTimeLeft(nextTime)
        setCurrentSessionId(null)

        if (shouldAutoStart) {
            setTimeout(() => startSessionInternal(nextPhase), 500)
        }
    }, [phase, sessionCount, completeSession, settings, userId])

    useEffect(() => {
        if (timeLeft <= 0 && isRunning) {
            transitionPhase()
        }
    }, [timeLeft, isRunning, transitionPhase])

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null

        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => Math.max(0, prev - 1))
            }, 1000)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isRunning, timeLeft])

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
