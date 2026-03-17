"use client"

import { useState, useMemo } from "react"
import { ProjectCard } from "@/components/projects/project-card"
import { WorkGroupCard } from "@/components/work-group-card"
import { CreationDropdown } from "@/components/creation-dropdown"
import { CalendarWidget } from "@/components/calendar-widget"
import { ToolsWidget } from "@/components/tools-widget"
import { GlobalSearchBar } from "@/components/layout/global-search-bar"
import { getRandomQuote } from "@/lib/motivational-quotes"
import { Workspace } from "@/types"
import { Folder, Heart, School, Grid2x2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { WorkspaceCard } from "@/components/workspaces/workspace-card"
import { MoveToWorkspaceDialog } from "@/components/dashboard/MoveToWorkspaceDialog"
import { EditProjectDialog } from "@/components/dashboard/EditProjectDialog"
import { EditGroupDialog } from "@/components/dashboard/EditGroupDialog"
import { respondToProjectInvitation } from "@/app/actions/members"
import { toast } from "sonner"
interface UserProject {
    id: string
    title: string
    description?: string | null
    category?: string | null
    color?: string | null
    project_icon?: string | null
    status: "active" | "completed" | "archived"
    role: "admin" | "manager" | "member"
    progress: number
    memberCount: number
    max_users: number
    owner_id: string
    members?: { avatar_url: string | null }[]
    membershipStatus?: "active" | "pending" | "rejected"
    end_date?: string | null
}

interface UserWorkGroup {
    id: string
    name: string
    description?: string | null
    owner_id: string
    memberCount: number
}

interface DashboardClientProps {
    displayName: string
    initialProjects: UserProject[]
    initialWorkGroups: UserWorkGroup[]
    sessionUserId: string
    initialWorkspaces: Workspace[]
    activeWorkspaceId: string | null
}


export function DashboardClient({
    displayName,
    initialProjects,
    initialWorkGroups,
    sessionUserId,
    initialWorkspaces,
    activeWorkspaceId
}: DashboardClientProps) {
    // Get random motivational quote (stable per page load)
    const randomQuote = useMemo(() => getRandomQuote(), [])

    // Dialog States
    const [moveToWorkspaceInfo, setMoveToWorkspaceInfo] = useState<{ open: boolean; entityId: string; entityType: 'project' | 'group' } | null>(null)
    const [editProjectData, setEditProjectData] = useState<{
        open: boolean
        id: string
        type: 'project'
        initialData: { title: string; description?: string | null; color?: string; project_icon?: string; max_users?: number }
    }>({ open: false, id: '', type: 'project', initialData: { title: '' } })
    const [editGroupData, setEditGroupData] = useState<{
        open: boolean
        id: string
        initialData: { name: string; description?: string | null }
    }>({ open: false, id: '', initialData: { name: '' } })

    const handleRespond = async (projectId: string, accept: boolean) => {
        try {
            const result = await respondToProjectInvitation({
                project_id: projectId,
                accept
            })

            if (result.success) {
                toast.success(accept ? "Project invitation accepted" : "Project invitation declined")
                window.location.reload()
            } else {
                toast.error(result.error || "Failed to respond to invitation")
            }
        } catch (error) {
            console.error("Error responding to invitation:", error)
            toast.error("An unexpected error occurred")
        }
    }

    // Calculate calendar events from projects
    const calendarEvents = useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const events: any[] = []

        initialProjects.forEach(project => {
            // 1. Project Deadline
            if (project.end_date && project.status === 'active') {
                events.push({
                    id: `deadline-${project.id}`,
                    title: `Deadline: ${project.title}`,
                    date: new Date(project.end_date),
                    color: project.color || '#6366f1',
                    type: 'project-deadline',
                    link: `/projects/${project.id}`
                })
            }
        })

        return events
    }, [initialProjects])

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-background">
            <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto p-4 md:p-6 space-y-8 pb-24 md:pb-6">
                    {/* Header with Search and Avatar */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center justify-between w-full md:w-auto">
                            <div className="flex flex-col gap-0.5 md:gap-1">
                                <h1 className="text-xl md:text-3xl font-bold tracking-tight">
                                    Hello, {displayName} 👋
                                </h1>
                                <p className="text-xs md:text-sm text-muted-foreground italic max-w-[250px] md:max-w-none line-clamp-2 md:line-clamp-none">
                                    "{randomQuote.text}" — <span className="font-medium">{randomQuote.author}</span>
                                </p>
                            </div>
                            <img
                                src="/main-logo.png"
                                alt="COWork"
                                className="h-12 w-12 rounded-xl shadow-md md:hidden object-cover"
                                loading="lazy"
                                decoding="async"
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                            <GlobalSearchBar />
                            <CreationDropdown onSuccess={() => window.location.reload()} />
                        </div>
                    </div>

                    {/* Workspaces Section */}
                    <div className="space-y-4">
                        {!activeWorkspaceId ? (
                            <>
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold">Workspaces</h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {initialWorkspaces.map(workspace => (
                                        <WorkspaceCard
                                            key={workspace.id}
                                            id={workspace.id}
                                            name={workspace.name}
                                            category={workspace.category}
                                        />
                                    ))}
                                    {initialWorkspaces.length === 0 && (
                                        <div className="col-span-full text-center py-6 border-2 border-dashed rounded-lg bg-muted/20">
                                            <p className="text-muted-foreground text-sm">No tienes workspaces. Usa el menú para crear uno.</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link 
                                    href="/dashboard"
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors flexitems-center"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                                <h2 className="text-2xl font-bold">
                                    {initialWorkspaces.find(w => w.id === activeWorkspaceId)?.name || 'Workspace'}
                                </h2>
                            </div>
                        )}
                    </div>

                    <div className="border-t pt-2" />

                    {/* Work Groups Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Work Groups</h2>
                            <span className="text-sm text-muted-foreground">{initialWorkGroups.length}</span>
                        </div>

                        {initialWorkGroups.length === 0 ? (
                            <div className="text-center py-6 border-2 border-dashed rounded-lg bg-muted/20">
                                <p className="text-muted-foreground text-sm">No work groups yet. Create one to organize your teams.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {initialWorkGroups.map(group => (
                                    <WorkGroupCard
                                        key={group.id}
                                        id={group.id}
                                        name={group.name}
                                        description={group.description}
                                        memberCount={group.memberCount}
                                        isOwner={group.owner_id === sessionUserId}
                                        onEdit={() => setEditGroupData({
                                            open: true,
                                            id: group.id,
                                            initialData: { name: group.name, description: group.description }
                                        })}
                                        onMove={(id) => setMoveToWorkspaceInfo({ open: true, entityId: id, entityType: 'group' })}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="border-t pt-2" />

                    {/* Projects Grid + Calendar */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-8">

                            {/* Owned Projects Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold">My Projects</h2>
                                    <span className="text-sm text-muted-foreground">
                                        {initialProjects.filter(p => p.owner_id === sessionUserId).length}
                                    </span>
                                </div>

                                {initialProjects.filter(p => p.owner_id === sessionUserId).length === 0 ? (
                                    <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/20">
                                        <p className="text-muted-foreground">You haven't created any projects yet</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {initialProjects
                                            .filter(p => p.owner_id === sessionUserId)
                                            .map(project => (
                                                <ProjectCard
                                                    key={project.id}
                                                    id={project.id}
                                                    title={project.title}
                                                    description={project.description}
                                                    category={project.category}
                                                    color={project.color}
                                                    project_icon={project.project_icon}
                                                    progress={project.progress}
                                                    role={project.role}
                                                    status={project.status}
                                                    memberCount={project.memberCount}
                                                    members={project.members}
                                                    onEdit={() => setEditProjectData({
                                                        open: true,
                                                        id: project.id,
                                                        type: 'project',
                                                        initialData: { title: project.title, description: project.description, color: project.color || '#6366f1', project_icon: project.project_icon || '📁', max_users: project.max_users }
                                                    })}
                                                    onMove={(id) => setMoveToWorkspaceInfo({ open: true, entityId: id, entityType: 'project' })}
                                                />
                                            ))}
                                    </div>
                                )}
                            </div>

                            {/* Shared Projects Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold">Shared Projects</h2>
                                    <span className="text-sm text-muted-foreground">
                                        {initialProjects.filter(p => p.owner_id !== sessionUserId).length}
                                    </span>
                                </div>

                                {initialProjects.filter(p => p.owner_id !== sessionUserId).length === 0 ? (
                                    <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/20">
                                        <p className="text-muted-foreground">No shared projects yet</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {initialProjects
                                            .filter(p => p.owner_id !== sessionUserId)
                                            .map(project => (
                                                <ProjectCard
                                                    key={project.id}
                                                    id={project.id}
                                                    title={project.title}
                                                    description={project.description}
                                                    category={project.category}
                                                    color={project.color}
                                                    project_icon={project.project_icon}
                                                    progress={project.progress}
                                                    role={project.role}
                                                    status={project.status}
                                                    memberCount={project.memberCount}
                                                    members={project.members}
                                                    membershipStatus={project.membershipStatus}
                                                    onRespond={(accept) => handleRespond(project.id, accept)}
                                                    onEdit={() => setEditProjectData({
                                                        open: true,
                                                        id: project.id,
                                                        type: 'project',
                                                        initialData: { title: project.title, description: project.description, color: project.color || '#6366f1', project_icon: project.project_icon || '📁', max_users: project.max_users }
                                                    })}
                                                    onMove={(id) => setMoveToWorkspaceInfo({ open: true, entityId: id, entityType: 'project' })}
                                                />
                                            ))}
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Calendar & Tools Column */}
                        <div className="lg:col-span-1 space-y-6">
                            <ToolsWidget userId={sessionUserId} />
                            <CalendarWidget events={calendarEvents} />
                        </div>
                    </div>
                </div>
            </main>
            {/* Dialogs */}
            {moveToWorkspaceInfo && (
                <MoveToWorkspaceDialog
                    open={moveToWorkspaceInfo.open}
                    onOpenChange={(op: boolean) => setMoveToWorkspaceInfo({ ...moveToWorkspaceInfo, open: op })}
                    entityId={moveToWorkspaceInfo.entityId}
                    entityType={moveToWorkspaceInfo.entityType}
                />
            )}
            
            <EditProjectDialog
                open={editProjectData.open && editProjectData.type === 'project'}
                onOpenChange={(op: boolean) => setEditProjectData({ ...editProjectData, open: op })}
                projectId={editProjectData.id}
                initialData={editProjectData.initialData}
            />

            <EditGroupDialog
                open={editGroupData.open}
                onOpenChange={(op: boolean) => setEditGroupData({ ...editGroupData, open: op })}
                groupId={editGroupData.id}
                initialData={editGroupData.initialData}
            />

        </div>
    )
}
