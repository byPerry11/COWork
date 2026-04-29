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
  } | null
}

export default async function ProjectsPage() {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        redirect("/login")
    }

    const userId = session.user.id

    try {
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
        }

        const dbData = (data || []) as unknown as ProjectDBResponse[]
        
        // Transform data for ProjectList — skip rows where `projects` is null
        const mappedProjects = dbData
            .filter((item) => item.projects !== null)
            .map((item) => {
                const project = item.projects!
                const checkpoints = project.checkpoints || []
                const total = checkpoints.length
                const completed = checkpoints.filter((c) => c.is_completed).length
                const progress = total > 0 ? (completed / total) * 100 : 0

                // Map members for UI
                const members = project.project_members?.map((pm) => ({
                    avatar_url: pm.profiles?.avatar_url || null
                })) || []

                return {
                    ...project,
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
                        <StatsCards {...stats} />
                        <ProjectList projects={mappedProjects} />
                    </div>
                </main>
            </div>
        )
    } catch (error) {
        console.error("Projects Page Critical Error:", error)
        return (
            <div className="flex flex-col items-center justify-center h-screen space-y-4 p-4 text-center">
                <h2 className="text-2xl font-bold text-red-600">Error al cargar Proyectos</h2>
                <p className="text-muted-foreground">
                    Ocurrió un error al cargar tus proyectos. Intenta de nuevo.
                </p>
                <a 
                    href="/dashboard/projects"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                    Reintentar
                </a>
            </div>
        )
    }
}
