/*
 * FIX: Invitation Permissions
 * ---------------------------
 * This script enables Project Owners and Admins to invite (insert) new members.
 * Previous RLS policies likely blocked inserting rows for OTHER users.
 */

-- 1. Enable RLS (Ensure it's on)
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive insert policies if any (to avoid conflicts/duplicates)
DROP POLICY IF EXISTS "Project owners and admins can add members" ON project_members;
DROP POLICY IF EXISTS "Project owners can add members" ON project_members;

-- 3. Create Update Policy for Inviting
CREATE POLICY "Project owners can add members"
ON project_members FOR INSERT
WITH CHECK (
  -- Allow if current user is the Project Owner
  auth.uid() IN (
    SELECT owner_id 
    FROM projects 
    WHERE id = project_members.project_id
  )
);

-- 4. Create Policy for Project Admins (if not owner)
CREATE POLICY "Project admins can add members"
ON project_members FOR INSERT
WITH CHECK (
  -- Allow if current user is an Admin in the project
  auth.uid() IN (
    SELECT user_id 
    FROM project_members 
    WHERE project_id = project_members.project_id 
    AND role = 'admin'
  )
);

-- 5. Ensure visibility (Select)
DROP POLICY IF EXISTS "See project members" ON project_members;
CREATE POLICY "See project members"
ON project_members FOR SELECT
USING (
    -- User sees members if they are a member themselves OR project is public (simplified)
    auth.uid() IN (SELECT user_id FROM project_members WHERE project_id = project_members.project_id)
    OR
    EXISTS (SELECT 1 FROM projects WHERE id = project_members.project_id AND owner_id = auth.uid())
);
