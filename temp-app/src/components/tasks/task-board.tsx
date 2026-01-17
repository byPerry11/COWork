"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useDroppable } from "@dnd-kit/core"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { Task } from "@/types"

interface TaskBoardProps {
    groupId: string
    userId: string
    tasks: Task[]
    onTaskUpdate: () => void
}

export function TaskBoard({ groupId, userId, tasks, onTaskUpdate }: TaskBoardProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
                <TaskCard
                    key={task.id}
                    task={task}
                    currentUserId={userId}
                    onUpdate={onTaskUpdate}
                />
            ))}
        </div>
    )
}

function TaskCard({ task, currentUserId, onUpdate }: { task: Task, currentUserId: string, onUpdate: () => void }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `task-${task.id}`,
        data: {
            type: 'Task',
            task: task,
        },
    })

    const handleJoin = async () => {
        try {
            const { error } = await supabase
                .from('task_assignments')
                .insert({
                    task_id: task.id,
                    user_id: currentUserId
                })

            if (error) throw error
            toast.success("Joined task successfully")
            onUpdate()
        } catch (error) {
            console.error(error)
            toast.error("Failed to join task")
        }
    }

    const isAssigned = task.assignments.some(a => a.user_id === currentUserId)
    const isFull = task.is_free && task.member_limit ? task.assignments.length >= task.member_limit : false

    return (
        <Card
            ref={setNodeRef}
            className={cn(
                "transition-colors",
                isOver ? "border-primary bg-primary/5" : ""
            )}
        >
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-semibold line-clamp-1">{task.title}</CardTitle>
                    {task.is_free && (
                        <Badge variant="secondary" className="text-xs">
                            Free ({task.assignments.length}/{task.member_limit})
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                    {task.description || "No description"}
                </p>

                {/* Assigned Members */}
                <div className="flex -space-x-2 overflow-hidden">
                    {task.assignments.length > 0 ? (
                        task.assignments.map((assignment) => (
                            <Avatar key={assignment.user_id} className="inline-block border-2 border-background w-8 h-8">
                                <AvatarImage src={assignment.user.avatar_url} />
                                <AvatarFallback>{assignment.user.username[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                        ))
                    ) : (
                        <span className="text-xs text-muted-foreground italic h-8 flex items-center">No members assigned</span>
                    )}
                </div>

                {/* Actions */}
                {task.is_free && !isAssigned && !isFull && (
                    <Button size="sm" variant="outline" className="w-full" onClick={handleJoin}>
                        Join Task
                    </Button>
                )}
                {task.is_free && isAssigned && (
                    <Button size="sm" variant="secondary" className="w-full" disabled>
                        Joined
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
