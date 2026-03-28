import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProjectList, ProjectWithRole } from "@/components/projects/project-list"
import { StatsCards } from "@/components/projects/stats-cards"
import { ProjectsClientRefresher } from "./ProjectsClientRefresher"

// DB Response Type
interface ProjectDBResponse {
  role: 'admin' | 'manager' | 'member'
  status: 'active' | 'pending' | 'rejected'
  projects: {
    id: string
    title: string
    description: string | null
    category: string | null
    color: string | null
    project_icon: string | null
    status: 'active' | 'completed' | 'archived'
    start_date: string
    owner_id: string
    end_date: string | null
    created_at: string
    max_users: number
    checkpoints: { is_completed: boolean }[]
    project_members: {
      user_id: string
      profiles: { avatar_url: string | null } | null
    }[]
  }
}

export default async function ProjectsPage() {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        redirect("/login")
    }

    const userId = session.user.id

    // Fetch all project associations
    const { data, error } = await supabase
        .from("project_members")
        .select(`
            role,
            status,
            projects:project_id (
                id,
                owner_id,
                title,
                description,
                category,
                color,
                project_icon,
                status,
                start_date,
                end_date,
                max_users,
                created_at,
                checkpoints (
                    is_completed
                ),
                project_members (
                    user_id,
                    profiles (
                        avatar_url
                    )
                )
            )
        `)
        .eq("user_id", userId)

    if (error) {
        console.error("Error fetching projects:", error)
        // Handle error by showing empty or error state, here we'll just fall back to empty
    }

    const dbData = (data || []) as unknown as ProjectDBResponse[]
    
    // Transform data for ProjectList
    const mappedProjects = dbData.map((item) => {
        const checkpoints = item.projects.checkpoints || []
        const total = checkpoints.length
        const completed = checkpoints.filter((c) => c.is_completed).length
        const progress = total > 0 ? (completed / total) * 100 : 0

        // Map members for UI
        const members = item.projects.project_members?.map((pm) => ({
            avatar_url: pm.profiles?.avatar_url || null
        })) || []

        return {
            ...item.projects,
            user_role: item.role,
            progress,
            total_tasks: total,
            completed_tasks: completed,
            members,
            membershipStatus: item.status
        }
    }) as ProjectWithRole[]

    // Calculate Stats
    const totalProjects = mappedProjects.length
    const activeProjects = mappedProjects.filter(p => p.status === 'active').length
    
    let totalTasks = 0
    let completedTasks = 0
    let sumProgress = 0

    mappedProjects.forEach(p => {
        totalTasks += p.total_tasks
        if (p.total_tasks > 0) {
            sumProgress += (p.completed_tasks / p.total_tasks) * 100
        }
        completedTasks += p.completed_tasks
    })

    const avgProgress = totalProjects > 0 ? sumProgress / totalProjects : 0
    const pendingTasks = totalTasks - completedTasks

    const stats = {
        totalProjects,
        activeProjects,
        pendingTasks,
        avgProgress
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-background">
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto p-4 md:p-6 space-y-6 md:space-y-8 pb-24 md:pb-6">
                    <ProjectsClientRefresher />
                    <ProjectList projects={mappedProjects} />

                    <StatsCards {...stats} />
                </div>
            </main>
        </div>
    )
}
