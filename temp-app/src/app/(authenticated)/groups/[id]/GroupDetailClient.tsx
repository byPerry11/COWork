"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DndContext, DragOverlay, useSensor, useSensors, MouseSensor, TouchSensor, DragEndEvent } from "@dnd-kit/core"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectCard } from "@/components/projects/project-card"
import { respondToProjectInvitation } from "@/app/actions/members"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GroupSettingsDialog } from "@/components/group-settings-dialog"
import { ManageGroupMembersDialog } from "@/components/manage-group-members-dialog"
import { WorkGroup, WorkGroupMember, Project, Task } from "@/types"
import { TaskBoard } from "@/components/tasks/task-board"
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog"
import { assignMemberToTask } from "@/app/actions/tasks"
import { DraggableMember } from "@/components/tasks/draggable-member"
import { StartGroupChatButton } from "@/components/chat/start-group-chat-button"
import { ArrowLeft } from "lucide-react"

export interface GroupProject extends Project {
    progress: number
    memberCount: number
    role: "admin" | "manager" | "member"
    membershipStatus?: "active" | "pending" | "rejected"
}

export interface GroupDetailClientProps {
    group: WorkGroup
    initialMembers: WorkGroupMember[]
    initialProjects: GroupProject[]
    initialTasks: Task[]
    currentUser: string
}

export function GroupDetailClient({
    group,
    initialMembers,
    initialProjects,
    initialTasks,
    currentUser
}: GroupDetailClientProps) {
    const router = useRouter()
    
    // We keep local state for instant UI updates, but rely on router.refresh() for real data sync
    const [tasks, setTasks] = useState<Task[]>(initialTasks)
    const [activeDragMember, setActiveDragMember] = useState<WorkGroupMember | null>(null)

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    )

    const handleRefresh = useCallback(() => {
        router.refresh()
    }, [router])

    const handleRespond = async (projectId: string, accept: boolean) => {
        try {
            const result = await respondToProjectInvitation({
                project_id: projectId,
                accept
            })

            if (result.success) {
                toast.success(accept ? "Invitación aceptada" : "Invitación rechazada")
                handleRefresh()
            } else {
                toast.error(result.error || "Error al responder a la invitación")
            }
        } catch (error) {
            console.error("Error responding to invitation:", error)
            toast.error("Ocurrió un error inesperado")
        }
    }

    const handleDragStart = (event: any) => {
        if (event.active.data.current?.type === 'Member') {
            setActiveDragMember(event.active.data.current.member)
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveDragMember(null)
        const { active, over } = event

        if (!over || !active) return

        if (active.data.current?.type === 'Member' && over.data.current?.type === 'Task') {
            const member = active.data.current.member as WorkGroupMember
            const task = over.data.current.task as Task

            // Check if already assigned
            if (task.assignments.some(a => a.user_id === member.user_id)) {
                toast.error("El miembro ya está asignado a esta tarea")
                return
            }

            // Client-side optimistic update could go here
            try {
                const result = await assignMemberToTask({
                    task_id: task.id,
                    user_id: member.user_id
                })

                if (!result.success) {
                    toast.error(result.error)
                    return
                }

                toast.success(`${member.profile?.username} asignado a ${task.title}`)
                handleRefresh() 
            } catch (error) {
                console.error(error)
                toast.error("Error al asignar el miembro")
            }
        }
    }

    const isOwner = group.owner_id === currentUser
    const canManageGroup = isOwner || initialMembers.some(m => m.user_id === currentUser && (m.role === 'admin' || m.role === 'manager'))

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex bg-gray-50 dark:bg-background min-h-screen">
                <main className="flex-1 container mx-auto p-4 md:p-6 space-y-6">

                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{group.name}</h1>
                            <p className="text-muted-foreground">{group.description || "No description"}</p>
                        </div>
                        <div className="ml-auto flex gap-2">
                            {canManageGroup && (
                                <GroupSettingsDialog
                                    group={group}
                                    members={initialMembers}
                                    isOwner={isOwner}
                                    onGroupUpdate={handleRefresh}
                                />
                            )}
                        </div>
                    </div>

                    <Tabs defaultValue="projects" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="projects">Projects</TabsTrigger>
                            <TabsTrigger value="tasks">Tasks Board</TabsTrigger>
                            <TabsTrigger value="members">Team ({initialMembers.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="projects" className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold">Projects</h2>
                                <CreateProjectDialog onSuccess={handleRefresh} workGroupId={group.id} />
                            </div>

                            {initialProjects.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                    <p className="text-muted-foreground">No projects in this group yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {initialProjects.map(p => (
                                        <ProjectCard
                                            key={p.id}
                                            {...p}
                                            members={[]}
                                            onRespond={(accept) => handleRespond(p.id, accept)}
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="tasks" className="space-y-4">
                            <div className="flex flex-col-reverse md:flex-row gap-6">
                                {/* Task Board Area */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-lg font-semibold">Active Tasks</h2>
                                        {canManageGroup && (
                                            <CreateTaskDialog
                                                groupId={group.id}
                                                onTaskCreated={handleRefresh}
                                            />
                                        )}
                                    </div>
                                    <TaskBoard
                                        groupId={group.id}
                                        userId={currentUser}
                                        userRole={initialMembers.find(m => m.user_id === currentUser)?.role || null}
                                        tasks={initialTasks}
                                        onTaskUpdate={handleRefresh}
                                    />
                                </div>

                                {/* Drag Source: Team Members */}
                                {canManageGroup && (
                                    <div className="w-full md:w-64 space-y-4">
                                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                                            Assign Members
                                        </h3>
                                        <div className="bg-muted/30 p-4 rounded-xl space-y-3">
                                            {initialMembers.map(member => (
                                                <DraggableMember key={member.user_id} member={{
                                                    user_id: member.user_id,
                                                    profile: {
                                                        username: member.profile?.username || 'Unknown',
                                                        display_name: member.profile?.display_name || undefined,
                                                        avatar_url: member.profile?.avatar_url || undefined
                                                    }
                                                }} />
                                            ))}
                                        </div>
                                        <p className="text-xs text-muted-foreground px-2">
                                            Drag members to tasks to assign them.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="members">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-semibold">Team Members</h2>
                                    {canManageGroup && (
                                        <ManageGroupMembersDialog
                                            groupId={group.id}
                                            groupName={group.name}
                                            currentUserId={currentUser}
                                            onMemberAdded={handleRefresh}
                                        />
                                    )}
                                    {initialMembers.length > 0 && (
                                        <StartGroupChatButton
                                            memberUserIds={initialMembers.map(m => m.user_id)}
                                            chatName={group.name}
                                            sourceType="work_group"
                                            sourceLabel={`grupo "${group.name}"`}
                                            currentUserId={currentUser}
                                            size="sm"
                                        />
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {initialMembers.map(member => (
                                        <div key={member.user_id} className="flex items-center gap-3 p-3 bg-card rounded-lg border shadow-sm">
                                            <Avatar>
                                                <AvatarImage src={member.profile?.avatar_url || undefined} />
                                                <AvatarFallback>{member.profile?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{member.profile?.display_name || member.profile?.username}</p>
                                                <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </main>
                <DragOverlay>
                    {activeDragMember ? (
                        <div className="flex items-center gap-3 p-3 bg-card rounded-lg border shadow-xl w-64 opacity-90 cursor-grabbing">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={activeDragMember.profile?.avatar_url || undefined} />
                                <AvatarFallback>{activeDragMember.profile?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{activeDragMember.profile?.username}</p>
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    )
}
