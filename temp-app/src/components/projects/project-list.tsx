"use client"

import { useRouter } from "next/navigation"
import { Project, Role } from "@/types"
import { ProjectCard } from "@/components/projects/project-card"
import { respondToProjectInvitation } from "@/app/actions/members"
import { toast } from "sonner"

export interface ProjectWithRole extends Project {
  user_role: Role
  progress: number
  total_tasks: number
  completed_tasks: number
  members: { avatar_url: string | null }[]
  membershipStatus?: 'active' | 'pending' | 'rejected'
}

interface ProjectListProps {
  projects: ProjectWithRole[]
}

export function ProjectList({ projects }: ProjectListProps) {
  const router = useRouter()

  const handleRespond = async (projectId: string, accept: boolean) => {
    try {
      const result = await respondToProjectInvitation({
        project_id: projectId,
        accept
      })

      if (result.success) {
        toast.success(accept ? "Invitación aceptada" : "Invitación rechazada")
        router.refresh()
      } else {
        toast.error(result.error || "Error al responder a la invitación")
      }
    } catch (error) {
      console.error("Error responding to invitation:", error)
      toast.error("Ocurrió un error inesperado")
    }
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
            membershipStatus={project.membershipStatus}
            onRespond={(accept) => handleRespond(project.id, accept)}
          />
        </div>
      ))}
    </div>
  )
}
