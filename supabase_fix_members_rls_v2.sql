-- Fix: Remove recursive RLS policies that cause infinite recursion
-- This script simplifies the policies to avoid circular references

-- Drop all existing policies on project_members
DROP POLICY IF EXISTS "Project owners and admins can invite new members" ON project_members;
DROP POLICY IF EXISTS "Users can view members of their projects" ON project_members;
DROP POLICY IF EXISTS "Admins can update member status/role" ON project_members;

-- Enable RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- 1. SELECT Policy: Users can view members of projects they OWN or belong to
CREATE POLICY "Users can view project members"
ON project_members
FOR SELECT
USING (
  -- User is the project owner
  auth.uid() IN (
    SELECT owner_id 
    FROM projects 
    WHERE id = project_members.project_id
  )
  OR
  -- User is the member being queried (can see themselves)
  auth.uid() = project_members.user_id
);

-- 2. INSERT Policy: Only project OWNERS can add new members
CREATE POLICY "Project owners can add members"
ON project_members
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT owner_id 
    FROM projects 
    WHERE id = project_members.project_id
  )
);

-- 3. UPDATE Policy: Only project OWNERS can update member status/roles
CREATE POLICY "Project owners can update members"
ON project_members
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT owner_id 
    FROM projects 
    WHERE id = project_members.project_id
  )
);

-- 4. DELETE Policy: Project owners can remove members
CREATE POLICY "Project owners can remove members"
ON project_members
FOR DELETE
USING (
  auth.uid() IN (
    SELECT owner_id 
    FROM projects 
    WHERE id = project_members.project_id
  )
);
