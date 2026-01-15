"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Loader2, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectCard } from "@/components/project-card"
import { CreateProjectDialog } from "@/components/create-project-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GroupSettingsDialog } from "@/components/group-settings-dialog"
import { ManageGroupMembersDialog } from "@/components/manage-group-members-dialog"
import { WorkGroup, WorkGroupMember, Project } from "@/types"

interface GroupProject extends Project {
    progress: number
    memberCount: number
    role: "admin" | "manager" | "member" // Derived role
}

export default function WorkGroupPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [group, setGroup] = useState<WorkGroup | null>(null)
    const [members, setMembers] = useState<WorkGroupMember[]>([])
    const [projects, setProjects] = useState<GroupProject[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<string>("")

    const fetchData = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push("/login")
                return
            }
            setCurrentUser(session.user.id)

            // 1. Fetch Group Details
            const { data: groupData, error: groupError } = await supabase
                .from('work_groups')
                .select('*')
                .eq('id', id)
                .single()

            if (groupError) throw groupError
            setGroup(groupData)

            // 2. Fetch Group Members
            const { data: membersData, error: membersError } = await supabase
                .from('work_group_members')
                .select(`
                    *,
                    profile:profiles(username, display_name, avatar_url)
                `)
                .eq('work_group_id', id)

            if (membersError) console.error(membersError)

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setMembers((membersData as any[])?.map(m => ({
                ...m,
                profile: m.profile
            })) || [])

            // 3. Fetch Projects in Group
            const { data: projectsData, error: projectsError } = await supabase
                .from('projects')
                .select(`
                    *,
                    checkpoints(is_completed),
                    project_members(count)
                `)
                .eq('work_group_id', id)
                .order('created_at', { ascending: false })

            if (projectsError) console.error(projectsError)

            // Transform projects
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const formattedProjects: GroupProject[] = (projectsData as any[])?.map(p => {
                const total = p.checkpoints?.length || 0
                const completed = p.checkpoints?.filter((c: any) => c.is_completed).length || 0
                const progress = total > 0 ? (completed / total) * 100 : 0

                return {
                    ...p,
                    progress,
                    memberCount: p.project_members?.[0]?.count || 0,
                    role: 'member' // Default role for display purposes
                }
            }) || []

            setProjects(formattedProjects)

        } catch (error) {
            console.error("Error fetching group:", error)
            router.push("/dashboard")
        } finally {
            setLoading(false)
        }
    }, [id, router])

    useEffect(() => {
        if (id) fetchData()
    }, [id, fetchData])

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>
    }

    if (!group) return null

    const isOwner = group.owner_id === currentUser
    // Check if current user is admin in the group or owner
    const canManageGroup = isOwner || members.some(m => m.user_id === currentUser && m.role === 'admin')

    return (
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
                                members={members}
                                isOwner={isOwner} // Only owner can delete/transfer, admins can rename/manage members (logic inside dialog handles this? Dialog checks isOwner for full access. Let's pass isOwner logic carefully. ProjectSettings required isOwner. Let's assume for now only Owner can fully manage settings.)
                                onGroupUpdate={fetchData}
                            />
                        )}
                    </div>
                </div>

                <Tabs defaultValue="projects" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="projects">Projects</TabsTrigger>
                        <TabsTrigger value="members">Team Members ({members.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="projects" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Projects</h2>
                            <CreateProjectDialog onSuccess={fetchData} workGroupId={id} />
                        </div>

                        {projects.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                <p className="text-muted-foreground">No projects in this group yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {projects.map(p => (
                                    <ProjectCard
                                        key={p.id}
                                        {...p}
                                        members={[]}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="members">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold">Team Members</h2>
                                <ManageGroupMembersDialog
                                    groupId={id}
                                    onMemberAdded={fetchData}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {members.map(member => (
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
        </div>
    )
}
