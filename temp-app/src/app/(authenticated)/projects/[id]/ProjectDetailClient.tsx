"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Pencil, Check, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CheckpointList } from "@/components/projects/checkpoint-list"
import { ProjectMembersList } from "@/components/projects/project-members-list"
import { ProjectCalendar } from "@/components/projects/project-calendar"
import { Project, Checkpoint } from "@/types"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DropAnimation
} from "@dnd-kit/core";
import {
    arrayMove,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ProjectDetailClientProps {
    initialProject: Project
    initialMembers: any[]
    initialCheckpoints: Checkpoint[]
    currentUserId: string
    userRole: string | null
}

export function ProjectDetailClient({
    initialProject,
    initialMembers,
    initialCheckpoints,
    currentUserId,
    userRole
}: ProjectDetailClientProps) {
    const router = useRouter()
    const [project, setProject] = useState<Project>(initialProject)
    const [members, setMembers] = useState<any[]>(initialMembers)
    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(initialCheckpoints)

    const [isEditingDescription, setIsEditingDescription] = useState(false)
    const [tempDescription, setTempDescription] = useState(project.description || "")
    const [savingDescription, setSavingDescription] = useState(false)
    const [activeDragMember, setActiveDragMember] = useState<any>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleSaveDescription = async () => {
        setSavingDescription(true)
        try {
            const { error } = await supabase
                .from('projects')
                .update({ description: tempDescription })
                .eq('id', project.id)

            if (error) throw error
            setProject({ ...project, description: tempDescription })
            setIsEditingDescription(false)
            toast.success("Description updated")
        } catch (error) {
            toast.error("Failed to update description")
        } finally {
            setSavingDescription(false)
        }
    }

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        if (active.data.current?.type === 'member') {
            setActiveDragMember(active.data.current)
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragMember(null)
        if (!over) return

        if (active.data.current?.type === 'checkpoint' && over.data.current?.type === 'checkpoint' && active.id !== over.id) {
            // ... (reorder logic remains same as original)
            const oldIndex = checkpoints.findIndex((i) => i.id === active.id);
            const newIndex = checkpoints.findIndex((i) => i.id === over.id);
            const newItems = arrayMove(checkpoints, oldIndex, newIndex);
            setCheckpoints(newItems);

            const updates = newItems.map((item, index) => ({ id: item.id, order: index + 1 }));
            Promise.all(updates.map((u) => supabase.from("checkpoints").update({ order: u.order }).eq("id", u.id)))
                .catch(() => toast.error("Failed to save order"));
        }

        if (active.data.current?.type === 'member' && over.data.current?.type === 'checkpoint') {
            const memberId = active.data.current.memberId
            const checkpointId = over.data.current.checkpointId
            const memberProfile = active.data.current.memberProfile

            if (checkpoints.find(c => c.id === checkpointId)?.assignments?.some(a => a.user_id === memberId)) {
                toast.info("User already assigned")
                return
            }

            setCheckpoints(prev => prev.map(c =>
                c.id === checkpointId ? {
                    ...c,
                    assignments: [...(c.assignments || []), { user_id: memberId, profile: memberProfile }],
                    is_vacant: false
                } : c
            ))

            try {
                await supabase.from('checkpoint_assignments').insert({ checkpoint_id: checkpointId, user_id: memberId })
                await supabase.from('checkpoints').update({ is_vacant: false }).eq('id', checkpointId)
                toast.success("Member assigned!")
            } catch {
                toast.error("Failed to assign member")
            }
        }
    };

    const isOwner = currentUserId === project.owner_id
    const projectStatus = {
        completed: checkpoints.filter(c => c.is_completed).length,
        total: checkpoints.length
    }

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }),
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
                <div className="lg:col-span-3 space-y-6">
                    <div className="mb-6 p-4 bg-white dark:bg-card rounded-lg border shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-primary">About Project</h3>
                            {isOwner && !isEditingDescription && (
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditingDescription(true)}>
                                    <Pencil className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                        {isEditingDescription ? (
                            <div className="space-y-3">
                                <Textarea value={tempDescription} onChange={(e) => setTempDescription(e.target.value)} className="min-h-[100px]" />
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => setIsEditingDescription(false)}>Cancel</Button>
                                    <Button size="sm" onClick={handleSaveDescription} disabled={savingDescription}>
                                        {savingDescription ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description || "No description."}</p>
                        )}
                    </div>

                    <CheckpointList
                        checkpoints={checkpoints}
                        projectId={project.id}
                        userRole={userRole as any}
                        currentUserId={currentUserId}
                        members={members}
                        onRefresh={() => window.location.reload()}
                    />
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <ProjectMembersList members={members} currentUserId={currentUserId} projectId={project.id} userRole={userRole as any} />
                    <ProjectCalendar projectId={project.id} startDate={new Date(project.start_date)} endDate={project.end_date ? new Date(project.end_date) : undefined} members={members} />
                </div>
            </div>

            <DragOverlay dropAnimation={dropAnimation}>
                {activeDragMember ? (
                    <div className="bg-background border rounded-md p-2 shadow-lg flex items-center gap-2 w-[200px]">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={activeDragMember.memberProfile?.avatar_url} />
                            <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{activeDragMember.memberProfile?.display_name || "User"}</span>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
