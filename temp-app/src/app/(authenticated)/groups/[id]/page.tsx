import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GroupDetailClient, GroupProject } from "./GroupDetailClient"
import { WorkGroupMember, Task } from "@/types"

export default async function WorkGroupPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
        redirect("/login")
    }

    const currentUserId = session.user.id

    // 1. Fetch Group Details
    const { data: groupData, error: groupError } = await supabase
        .from('work_groups')
        .select('*')
        .eq('id', id)
        .single()

    if (groupError || !groupData) {
        notFound()
    }

    // 2. Fetch Group Members
    const { data: membersData } = await supabase
        .from('work_group_members')
        .select(`
            *,
            profile:profiles(username, display_name, avatar_url)
        `)
        .eq('work_group_id', id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const members = (membersData as any[])?.map(m => ({
        ...m,
        profile: m.profile
    })) || []

    // 3. Fetch Projects in Group
    const { data: projectsData } = await supabase
        .from('projects')
        .select(`
            *,
            checkpoints(is_completed),
            project_members(role, status, user_id)
        `)
        .eq('work_group_id', id)
        .order('created_at', { ascending: false })

    // Transform projects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projects: GroupProject[] = (projectsData as any[])?.map(p => {
        const checkpoints = p.checkpoints || []
        const total = checkpoints.length
        const completed = checkpoints.filter((c: any) => c.is_completed).length
        const progress = total > 0 ? (completed / total) * 100 : 0
        
        const myMember = (p.project_members as any[])?.find(m => m.user_id === currentUserId)

        return {
            ...p,
            progress,
            memberCount: p.project_members?.length || 0,
            role: myMember?.role || 'member',
            membershipStatus: myMember?.status
        }
    }) || []

    // 4. Fetch Tasks
    const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('work_group_id', id)
        .order('created_at', { ascending: false })

    let tasksWithAssignments: Task[] = []

    if (tasksData && tasksData.length > 0) {
        const taskIds = tasksData.map(t => t.id)
        const { data: assignmentsData } = await supabase
            .from('task_assignments')
            .select('task_id, user_id, assigned_at')
            .in('task_id', taskIds)

        const userIds = [...new Set(assignmentsData?.map(a => a.user_id) || [])]
        
        let profilesData: any[] | null = null;
        if (userIds.length > 0) {
           const { data } = await supabase
               .from('profiles')
               .select('id, username, avatar_url')
               .in('id', userIds)
           profilesData = data;
        }

        const profilesMap = new Map(
            profilesData?.map(p => [p.id, p]) || []
        )

        tasksWithAssignments = tasksData.map(task => ({
            ...task,
            assignments: (assignmentsData || [])
                .filter(a => a.task_id === task.id)
                .map(a => ({
                    user_id: a.user_id,
                    assigned_at: a.assigned_at,
                    user: profilesMap.get(a.user_id) || { username: 'Unknown', avatar_url: null }
                }))
        })) as Task[]
    }

    return (
        <GroupDetailClient 
            group={groupData}
            initialMembers={members}
            initialProjects={projects}
            initialTasks={tasksWithAssignments}
            currentUser={currentUserId}
        />
    )
}
