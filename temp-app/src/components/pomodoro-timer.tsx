"use client"

import { useEffect } from "react"
import { usePomodoro, SESSIONS_BEFORE_LONG_BREAK } from "@/contexts/pomodoro-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, SkipForward, RotateCcw, Coffee, Brain, Moon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function PomodoroTimer({ userId }: { userId: string }) {
    const {
        phase,
        timeLeft,
        isRunning,
        sessionCount,
        currentSessionId,
        stats,
        settings,
        setUserId,
        startSession,
        pauseSession,
        resumeSession,
        resetSession,
        skipPhase,
        loadStats
    } = usePomodoro()

    // Setear el userId cuando el componente se monta
    useEffect(() => {
        setUserId(userId)
    }, [userId, setUserId])

    // Recargar stats cuando se monta
    useEffect(() => {
        loadStats()
    }, [loadStats])

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
                    total: settings.workDuration
                }
            case 'shortBreak':
                return {
                    label: 'Descanso Corto',
                    icon: Coffee,
                    color: 'text-green-500',
                    bgColor: 'bg-green-500/10',
                    total: settings.shortBreakDuration
                }
            case 'longBreak':
                return {
                    label: 'Descanso Largo',
                    icon: Moon,
                    color: 'text-purple-500',
                    bgColor: 'bg-purple-500/10',
                    total: settings.longBreakDuration
                }
        }
    }

    const phaseInfo = getPhaseInfo()
    const PhaseIcon = phaseInfo.icon
    const progress = ((phaseInfo.total - timeLeft) / phaseInfo.total) * 100

    const handlePlayPause = () => {
        if (isRunning) {
            pauseSession()
        } else {
            if (!currentSessionId) {
                startSession()
            } else {
                resumeSession()
            }
        }
    }

    return (
        <Card className="w-full relative">
            <div className="absolute top-4 right-4">
                <PomodoroSettingsDialog />
            </div>
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

                {/* Info de sesión activa */}
                {currentSessionId && (
                    <div className="text-center">
                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                            ✨ Sesión activa - El timer seguirá corriendo mientras navegas
                        </Badge>
                    </div>
                )}

                {/* Controles */}
                <div className="flex items-center justify-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={resetSession}
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
                        onClick={skipPhase}
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

import { Settings } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

function PomodoroSettingsDialog() {
    const { settings, updateSettings } = usePomodoro()

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Configuración del Pomodoro</DialogTitle>
                    <DialogDescription>
                        Ajusta la duración de los ciclos y el comportamiento automático.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="work" className="text-right col-span-2">
                            Concentración (min)
                        </Label>
                        <Input
                            id="work"
                            type="number"
                            value={settings.workDuration / 60}
                            onChange={(e) => updateSettings({ workDuration: Number(e.target.value) * 60 })}
                            className="col-span-2"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="shortBreak" className="text-right col-span-2">
                            Descanso Corto (min)
                        </Label>
                        <Input
                            id="shortBreak"
                            type="number"
                            value={settings.shortBreakDuration / 60}
                            onChange={(e) => updateSettings({ shortBreakDuration: Number(e.target.value) * 60 })}
                            className="col-span-2"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="longBreak" className="text-right col-span-2">
                            Descanso Largo (min)
                        </Label>
                        <Input
                            id="longBreak"
                            type="number"
                            value={settings.longBreakDuration / 60}
                            onChange={(e) => updateSettings({ longBreakDuration: Number(e.target.value) * 60 })}
                            className="col-span-2"
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="autoBreaks" className="flex flex-col space-y-1">
                            <span>Auto-iniciar Descansos</span>
                            <span className="font-normal text-xs text-muted-foreground">Iniciar descanso automáticamente al terminar trabajo</span>
                        </Label>
                        <Switch
                            id="autoBreaks"
                            checked={settings.autoStartBreaks}
                            onCheckedChange={(checked) => updateSettings({ autoStartBreaks: checked })}
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="autoWork" className="flex flex-col space-y-1">
                            <span>Auto-iniciar Trabajo</span>
                            <span className="font-normal text-xs text-muted-foreground">Iniciar trabajo automáticamente al terminar descanso</span>
                        </Label>
                        <Switch
                            id="autoWork"
                            checked={settings.autoStartWork}
                            onCheckedChange={(checked) => updateSettings({ autoStartWork: checked })}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
