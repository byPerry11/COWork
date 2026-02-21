import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ProjectSettingsDialog } from "@/components/projects/project-settings-dialog"
import { LeaveProjectDialog } from "@/components/projects/leave-project-dialog"
import { AddCheckpointDialog } from "@/components/projects/add-checkpoint-dialog"
import dynamic from 'next/dynamic'

// Dynamically import the client component with DnD logic
const ProjectDetailClient = dynamic(
  () => import('./ProjectDetailClient').then(mod => mod.ProjectDetailClient),
  { ssr: true } // We want SSR for the initial layout
)

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")

  const userId = session.user.id

  // Fetch all project data in one go
  const { data: project, error } = await supabase
    .from("projects")
    .select(`
      *,
      members:project_members(
        user_id, 
        role, 
        status, 
        member_color,
        profile:profiles(
          username,
          display_name,
          avatar_url
        )
      ),
      checkpoints(
        *,
        assignments:checkpoint_assignments(
          user_id,
          profile:profiles(
            id,
            username,
            display_name,
            avatar_url
          )
        )
      )
    `)
    .eq("id", id)
    .single()

  if (error || !project) {
    notFound()
  }

  // Format members and checkpoints for the client component
  const formattedMembers = project.members || []
  const formattedCheckpoints = (project.checkpoints || [])
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    .map((c: any) => ({
      ...c,
      assignments: c.assignments?.map((a: any) => ({
        user_id: a.user_id,
        profile: a.profile
      })) || []
    }))

  const userMember = formattedMembers.find((m: any) => m.user_id === userId)
  const userRole = userMember?.role || null
  const isOwner = userId === project.owner_id

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-background">
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b bg-white px-4 md:px-6 py-4 dark:bg-gray-950 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
                <span className="md:hidden">{project.title.slice(0, 10)}...</span>
                <span className="hidden md:inline truncate">{project.title}</span>
                <span className="text-2xl" role="img" aria-label="icon">
                  {project.project_icon || '📁'}
                </span>
              </h1>
              {project.category && (
                <span className="text-xs text-muted-foreground hidden md:inline-block">
                  {project.category}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isOwner ? (
              // Note: These dialogs might need to be Client Components or we pass actions
              <ProjectSettingsDialog project={project as any} members={formattedMembers} isOwner={isOwner} />
            ) : (
              <LeaveProjectDialog projectId={project.id} projectTitle={project.title} />
            )}
            <AddCheckpointDialog projectId={project.id} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          <ProjectDetailClient
            initialProject={project as any}
            initialMembers={formattedMembers}
            initialCheckpoints={formattedCheckpoints as any}
            currentUserId={userId}
            userRole={userRole}
          />
        </main>
      </div>
    </div>
  )
}
