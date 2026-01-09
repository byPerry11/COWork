-- Enable RLS on project_members if not already enabled
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict (optional, but safer to start clean for this specific action)
-- Note: You might want to check your existing policies first in the Supabase Dashboard. 
-- This script adds a specific policy for allowing Adds/Invites.

DROP POLICY IF EXISTS "Project owners and admins can invite new members" ON project_members;

-- Policy to allow Project Owners and Admins/Managers to insert new members
CREATE POLICY "Project owners and admins can invite new members"
ON project_members
FOR INSERT
WITH CHECK (
  -- 1. The user is the Owner of the project
  auth.uid() IN (
    SELECT owner_id 
    FROM projects 
    WHERE id = project_members.project_id
  )
  OR
  -- 2. The user is an existing Admin or Manager of the project
  EXISTS (
    SELECT 1 
    FROM project_members pm
    WHERE pm.project_id = project_members.project_id
    AND pm.user_id = auth.uid()
    AND pm.role IN ('admin', 'manager')
    AND pm.status = 'active' -- Only active members can invite
  )
);

-- Ensure the 'status' column exists (redundant if you ran the previous script, but harmless)
ALTER TABLE project_members ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Allow users to view project members (SELECT) logic usually exists, but ensuring it here:
-- Users can view members of projects they belong to.
DROP POLICY IF EXISTS "Users can view members of their projects" ON project_members;
CREATE POLICY "Users can view members of their projects"
ON project_members
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id 
    FROM project_members pm 
    WHERE pm.project_id = project_members.project_id
  )
  OR
  auth.uid() IN (
    SELECT owner_id 
    FROM projects 
    WHERE id = project_members.project_id
  )
);

-- Allow admins/managers/owners to UPDATE members (e.g. change roles, status)
DROP POLICY IF EXISTS "Admins can update member status/role" ON project_members;
CREATE POLICY "Admins can update member status/role"
ON project_members
FOR UPDATE
USING (
   -- Same logic as INSERT: Owner or Admin/Manager
  auth.uid() IN (
    SELECT owner_id 
    FROM projects 
    WHERE id = project_members.project_id
  )
  OR
  EXISTS (
    SELECT 1 
    FROM project_members pm
    WHERE pm.project_id = project_members.project_id
    AND pm.user_id = auth.uid()
    AND pm.role IN ('admin', 'manager')
    AND pm.status = 'active'
  )
);
