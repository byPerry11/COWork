import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardClient } from "./DashboardClient"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const userId = session.user.id

  // Fetch all data in parallel
  const [profileRes, projectsRes, groupsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, username")
      .eq("id", userId)
      .single(),

    // Optimized query to get projects, their checkpoints (for progress) and members (for avatars)
    supabase
      .from("project_members")
      .select(`
        role,
        status,
        project:project_id (
          id,
          title,
          category,
          description,
          color,
          project_icon,
          status,
          owner_id,
          end_date,
          checkpoints(is_completed),
          members:project_members(
            status,
            profiles(avatar_url)
          )
        )
      `)
      .eq("user_id", userId)
      .in("status", ["active", "pending"]),

    // Fetch groups with member counts
    supabase
      .from('work_groups')
      .select(`
        id,
        name,
        description,
        owner_id,
        members:work_group_members(id)
      `)
      .order('created_at', { ascending: false })
  ])

  const profile = profileRes.data
  const displayName = profile?.display_name || profile?.username || "User"

  // Process projects to calculate progress and format for client
  const projects = (projectsRes.data || []).map((member: any) => {
    const project = member.project
    if (!project) return null

    const checkpoints = project.checkpoints || []
    const total = checkpoints.length
    const completed = checkpoints.filter((c: any) => c.is_completed).length
    const progress = total > 0 ? (completed / total) * 100 : 0

    const activeMembers = (project.members || [])
      .filter((m: any) => m.status === 'active')

    return {
      id: project.id,
      title: project.title,
      description: project.description,
      category: project.category,
      color: project.color,
      project_icon: project.project_icon || "🔒",
      status: project.status || "active",
      owner_id: project.owner_id,
      role: member.role,
      progress,
      memberCount: activeMembers.length,
      members: activeMembers.map((m: any) => ({ avatar_url: m.profiles?.avatar_url })),
      membershipStatus: member.status,
      end_date: project.end_date
    }
  }).filter(Boolean)

  // Process groups
  const workGroups = (groupsRes.data || []).map((group: any) => ({
    id: group.id,
    name: group.name,
    description: group.description,
    owner_id: group.owner_id,
    memberCount: group.members?.length || 0
  }))

  return (
    <DashboardClient
      displayName={displayName}
      initialProjects={projects as any}
      initialWorkGroups={workGroups}
      sessionUserId={userId}
    />
  )
}
