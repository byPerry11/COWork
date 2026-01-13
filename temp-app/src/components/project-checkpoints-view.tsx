"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, CheckCircle2, Circle, Target, ListChecks } from "lucide-react"
import { Checkpoint, CheckpointTask } from "@/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface ProjectWithCheckpoints {
    id: string
    title: string
    checkpointsCount: number
}

interface CheckpointWithTasks extends Checkpoint {
    tasks: CheckpointTask[]
}

export function ProjectCheckpointsView({ userId }: { userId: string }) {
    const [projects, setProjects] = useState<ProjectWithCheckpoints[]>([])
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
    const [checkpoints, setCheckpoints] = useState<CheckpointWithTasks[]>([])
    const [loading, setLoading] = useState(true)
    const [checkpointsLoading, setCheckpointsLoading] = useState(false)

    useEffect(() => {
        loadUserProjects()
    }, [userId])

    useEffect(() => {
        if (selectedProjectId) {
            loadProjectCheckpoints(selectedProjectId)
        }
    }, [selectedProjectId])

    const loadUserProjects = async () => {
        setLoading(true)

        // Obtener proyectos donde el usuario es miembro
        const { data: memberData } = await supabase
            .from('project_members')
            .select('project:projects(id, title)')
            .eq('user_id', userId)
            .eq('status', 'active')

        // Obtener proyectos donde el usuario es dueño
        const { data: ownedData } = await supabase
            .from('projects')
            .select('id, title')
            .eq('owner_id', userId)

        const allProjects: ProjectWithCheckpoints[] = []

        // Procesar proyectos de membresía
        if (memberData) {
            for (const item of memberData) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const proj = (item as any).project
                if (proj) {
                    const { count } = await supabase
                        .from('checkpoints')
                        .select('*', { count: 'exact', head: true })
                        .eq('project_id', proj.id)

                    allProjects.push({
                        id: proj.id,
                        title: proj.title,
                        checkpointsCount: count || 0
                    })
                }
            }
        }

        // Procesar proyectos propios
        if (ownedData) {
            for (const proj of ownedData) {
                // Evitar duplicados
                if (allProjects.find(p => p.id === proj.id)) continue

                const { count } = await supabase
                    .from('checkpoints')
                    .select('*', { count: 'exact', head: true })
                    .eq('project_id', proj.id)

                allProjects.push({
                    id: proj.id,
                    title: proj.title,
                    checkpointsCount: count || 0
                })
            }
        }

        setProjects(allProjects)
        if (allProjects.length > 0 && !selectedProjectId) {
            setSelectedProjectId(allProjects[0].id)
        }
        setLoading(false)
    }

    const loadProjectCheckpoints = async (projectId: string) => {
        setCheckpointsLoading(true)

        const { data: checkpointsData, error: checkpointsError } = await supabase
            .from('checkpoints')
            .select('*')
            .eq('project_id', projectId)
            .order('order', { ascending: true })

        if (checkpointsError) {
            console.error('Error loading checkpoints:', checkpointsError)
            setCheckpointsLoading(false)
            return
        }

        // Para cada checkpoint, obtener sus tareas
        const checkpointsWithTasks: CheckpointWithTasks[] = []

        if (checkpointsData) {
            for (const checkpoint of checkpointsData) {
                const { data: tasksData } = await supabase
                    .from('checkpoint_tasks')
                    .select('*')
                    .eq('checkpoint_id', checkpoint.id)
                    .order('created_at', { ascending: true })

                checkpointsWithTasks.push({
                    ...checkpoint,
                    tasks: tasksData || []
                })
            }
        }

        setCheckpoints(checkpointsWithTasks)
        setCheckpointsLoading(false)
    }

    const calculateCheckpointProgress = (checkpoint: CheckpointWithTasks) => {
        if (checkpoint.tasks.length === 0) {
            return checkpoint.is_completed ? 100 : 0
        }

        const completedTasks = checkpoint.tasks.filter(t => t.is_completed).length
        return Math.round((completedTasks / checkpoint.tasks.length) * 100)
    }

    if (loading) {
        return (
            <Card className="w-full">
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        )
    }

    if (projects.length === 0) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Checkpoints de Proyecto
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm text-center py-8">
                        No participas en ningún proyecto activo.
                    </p>
                </CardContent>
            </Card>
        )
    }

    const selectedProject = projects.find(p => p.id === selectedProjectId)

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Checkpoints de Proyecto
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Selector de proyecto */}
                <Select
                    value={selectedProjectId || undefined}
                    onValueChange={setSelectedProjectId}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Mis Proyectos</SelectLabel>
                            {projects.map(project => (
                                <SelectItem key={project.id} value={project.id}>
                                    <div className="flex items-center justify-between gap-4 w-full">
                                        <span>{project.title}</span>
                                        <Badge variant="secondary" className="ml-2">
                                            {project.checkpointsCount} checkpoints
                                        </Badge>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>

                {/* Lista de checkpoints */}
                {checkpointsLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : checkpoints.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground text-sm">
                            Este proyecto no tiene checkpoints aún.
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                            {checkpoints.map((checkpoint, index) => {
                                const progress = calculateCheckpointProgress(checkpoint)
                                const isCompleted = checkpoint.is_completed

                                return (
                                    <div
                                        key={checkpoint.id}
                                        className={`p-4 rounded-lg border transition-all ${isCompleted
                                                ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
                                                : 'bg-card hover:shadow-md'
                                            }`}
                                    >
                                        {/* Cabecera del checkpoint */}
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="mt-0.5">
                                                {isCompleted ? (
                                                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                                                ) : (
                                                    <Circle className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-semibold text-sm">
                                                        {index + 1}. {checkpoint.title}
                                                    </h4>
                                                    <Badge
                                                        variant={isCompleted ? "default" : "secondary"}
                                                        className="text-xs"
                                                    >
                                                        {progress}%
                                                    </Badge>
                                                </div>

                                                {/* Barra de progreso */}
                                                <div className="w-full bg-muted rounded-full h-1.5 mb-3">
                                                    <div
                                                        className={`h-1.5 rounded-full transition-all ${isCompleted ? 'bg-green-500' : 'bg-primary'
                                                            }`}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>

                                                {/* Tareas del checkpoint */}
                                                {checkpoint.tasks.length > 0 && (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                                            <ListChecks className="h-3 w-3" />
                                                            <span>Verification Points ({checkpoint.tasks.length})</span>
                                                        </div>
                                                        {checkpoint.tasks.map(task => (
                                                            <div
                                                                key={task.id}
                                                                className="flex items-center gap-2 text-sm pl-2"
                                                            >
                                                                <Checkbox
                                                                    checked={task.is_completed}
                                                                    disabled
                                                                    className="pointer-events-none"
                                                                />
                                                                <span
                                                                    className={
                                                                        task.is_completed
                                                                            ? 'line-through text-muted-foreground'
                                                                            : ''
                                                                    }
                                                                >
                                                                    {task.title}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {checkpoint.tasks.length === 0 && (
                                                    <p className="text-xs text-muted-foreground pl-2">
                                                        Sin verification points
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </ScrollArea>
                )}

                {/* Resumen */}
                {checkpoints.length > 0 && !checkpointsLoading && (
                    <div className="pt-4 border-t">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-primary">
                                    {checkpoints.length}
                                </div>
                                <div className="text-xs text-muted-foreground">Checkpoints</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-green-600">
                                    {checkpoints.filter(c => c.is_completed).length}
                                </div>
                                <div className="text-xs text-muted-foreground">Completados</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {checkpoints.reduce((sum, c) => sum + c.tasks.length, 0)}
                                </div>
                                <div className="text-xs text-muted-foreground">V. Points</div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
