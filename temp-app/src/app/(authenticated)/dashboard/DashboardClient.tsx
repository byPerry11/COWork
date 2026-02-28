"use client"

import { useMemo } from "react"
import { ProjectCard } from "@/components/projects/project-card"
import { WorkGroupCard } from "@/components/work-group-card"
import { CreateGroupDialog } from "@/components/create-group-dialog"
import { CalendarWidget } from "@/components/calendar-widget"
import { ToolsWidget } from "@/components/tools-widget"
import { GlobalSearchBar } from "@/components/layout/global-search-bar"
import { getRandomQuote } from "@/lib/motivational-quotes"

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
}

export function DashboardClient({
    displayName,
    initialProjects,
    initialWorkGroups,
    sessionUserId
}: DashboardClientProps) {
    // Get random motivational quote (stable per page load)
    const randomQuote = useMemo(() => getRandomQuote(), [])

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
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                            <GlobalSearchBar />
                            <CreateGroupDialog onSuccess={() => window.location.reload()} />
                        </div>
                    </div>

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
                                                    onRespond={() => window.location.reload()}
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
        </div>
    )
}
