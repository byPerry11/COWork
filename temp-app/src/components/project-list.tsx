"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Skeleton } from "@/components/ui/skeleton"
import { Project, Role } from "@/types"
import { ProjectCard } from "@/components/project-card"

interface ProjectListProps {
  userId: string
}

// DB Response Type
interface ProjectDBResponse {
  role: Role
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

interface ProjectWithRole extends Project {
  user_role: Role
  progress: number
  total_tasks: number
  completed_tasks: number
  members: { avatar_url: string | null }[]
}

export function ProjectList({ userId }: ProjectListProps) {
  const [projects, setProjects] = useState<ProjectWithRole[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from("project_members")
          .select(`
            role,
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
          return
        }

        // Transform data
        const dbData = data as unknown as ProjectDBResponse[]
        const mappedProjects = dbData?.map((item) => {
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
            members
          }
        }) as ProjectWithRole[]

        setProjects(mappedProjects || [])
      } catch (err) {
        console.error("Unexpected error:", err)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchProjects()
    }
  }, [userId])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">No hay proyectos</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            No tienes proyectos asignados actualmente.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <div key={project.id} className="h-full">
          <ProjectCard
            id={project.id}
            title={project.title}
            description={project.description}
            category={project.category}
            color={project.color}
            project_icon={project.project_icon}
            status={project.status}
            role={project.user_role}
            progress={project.progress}
            memberCount={project.members.length}
            members={project.members}
          />
        </div>
      ))}
    </div>
  )
}
