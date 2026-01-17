export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Profile {
  id: string
  username: string | null
  color_hex: string
  badges: string[]
  avatar_url: string | null
  display_name: string | null
  updated_at: string
}


export interface WorkGroup {
  id: string
  name: string
  description?: string | null
  owner_id: string
  created_at: string
  updated_at: string
}

export interface WorkGroupMember {
  work_group_id: string
  user_id: string
  role: Role
  joined_at: string
  profile?: Profile
}

export interface Task {
  id: string
  work_group_id: string
  title: string
  description?: string | null
  status: 'pending' | 'in_progress' | 'completed'
  is_free: boolean
  member_limit?: number
  created_by: string
  created_at: string
  assignments: TaskAssignment[]
}

export interface TaskAssignment {
  task_id: string
  user_id: string
  assigned_at: string
  user: {
    username: string
    avatar_url?: string
  }
}

export interface Project {
  id: string
  work_group_id?: string | null // New field
  owner_id: string
  title: string
  description?: string | null
  category?: string | null
  color?: string | null
  project_icon?: string | null
  tags?: string[]
  is_public?: boolean
  start_date: string
  end_date: string | null
  max_users: number
  status: 'active' | 'completed' | 'archived'
  created_at: string
  work_group?: WorkGroup // For joins
}

export type Role = 'admin' | 'manager' | 'member'
export type MemberStatus = 'pending' | 'active' | 'rejected' | 'left'

export interface ProjectMember {
  project_id: string
  user_id: string
  role: Role
  status: MemberStatus
  member_color?: string
  joined_at: string
}

export interface Checkpoint {
  id: string
  project_id: string
  title: string
  description?: string | null // New field
  image_url?: string | null // New field
  is_vacant?: boolean // New field
  is_completed: boolean
  completed_by?: string | null

  assignments?: {
    user_id: string
    profile: Profile
  }[]
  order: number
  created_at: string
}

export interface CheckpointTask {
  id: string
  checkpoint_id: string
  title: string
  is_completed: boolean
  completed_by?: string | null
  completed_at?: string | null
  created_at: string
}

export interface Evidence {
  id: string
  checkpoint_id: string
  user_id: string
  note: string | null
  image_url: string | null
  created_at: string
}

// Achievement system types
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface Achievement {
  id: string
  name: string
  description: string | null
  icon: string | null
  tier: AchievementTier
  requirement_type: string | null
  requirement_value: number | null
  created_at: string
}

export interface UserAchievement {
  user_id: string
  achievement_id: string
  earned_at: string
  achievements: Achievement
}

export interface AchievementWithStatus extends Achievement {
  is_earned: boolean
  earned_at: string | null
}

