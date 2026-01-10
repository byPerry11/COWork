/*
 * FIX: Cross-Table Infinite Recursion
 * -----------------------------------
 * Issue: 
 * 1. projects RLS checks project_members (Am I a member?)
 * 2. project_members RLS checks projects (Am I the owner?)
 * 3. projects RLS checks project_members... -> LOOP
 *
 * SOLUTION:
 * Use a SECURITY DEFINER function `is_project_owner` to check ownership 
 * without triggering RLS on the `projects` table.
 */

-- 1. Create Helper Function (Bypass RLS)
CREATE OR REPLACE FUNCTION is_project_owner(_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects 
    WHERE id = _project_id 
    AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Policies on project_members to use the function

-- Update "See project members"
DROP POLICY IF EXISTS "See project members" ON project_members;
CREATE POLICY "See project members"
ON project_members FOR SELECT
USING (
    is_project_member(project_id)
    OR
    is_project_owner(project_id) -- <--- Uses function instead of raw query
);

-- Update "Project owners can add members"
DROP POLICY IF EXISTS "Project owners can add members" ON project_members;
CREATE POLICY "Project owners can add members"
ON project_members FOR INSERT
WITH CHECK (
    is_project_owner(project_id) -- <--- Uses function
);
