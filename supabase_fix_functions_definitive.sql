/*
 * FIX: Definitive RLS Recursion Fix & Access Control
 * --------------------------------------------------
 * Problem: Raw queries in RLS policies trigger other tables' RLS, causing infinite loops.
 * Solution: Encapsulate ALL cross-table logic in SECURITY DEFINER functions.
 *           These functions run as superuser/owner, bypassing RLS to break loops.
 *
 * UPDATE: Added DROP statements to ensure idempotency.
 */

-- =========================================================
-- 1. Helper Functions (SECURITY DEFINER = Bypass RLS)
-- =========================================================

-- Check if user is a member (Active or Pending)
CREATE OR REPLACE FUNCTION check_is_member(_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_id = _project_id 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is the Owner
CREATE OR REPLACE FUNCTION check_is_owner(_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects 
    WHERE id = _project_id 
    AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is an Admin Member
CREATE OR REPLACE FUNCTION check_is_admin(_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_id = _project_id 
    AND user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Master Project Visibility Check (Used by projects table)
CREATE OR REPLACE FUNCTION can_view_project(_project_id UUID, _is_public BOOLEAN)
RETURNS BOOLEAN AS $$
BEGIN
  -- 1. Public projects are visible
  IF _is_public THEN RETURN TRUE; END IF;
  
  -- 2. Owner can view
  -- (We can query projects directly safely here because we are SECURITY DEFINER)
  IF EXISTS (SELECT 1 FROM projects WHERE id = _project_id AND owner_id = auth.uid()) THEN RETURN TRUE; END IF;

  -- 3. Members can view
  IF EXISTS (SELECT 1 FROM project_members WHERE project_id = _project_id AND user_id = auth.uid()) THEN RETURN TRUE; END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =========================================================
-- 2. Apply Start-of-the-Art Policies (PROJECTS)
-- =========================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop old potentially recursive policies
DROP POLICY IF EXISTS "Members can view project" ON projects;
DROP POLICY IF EXISTS "Public projects are visible to everyone" ON projects;
DROP POLICY IF EXISTS "Owners can view project" ON projects;
DROP POLICY IF EXISTS "View Projects Policy" ON projects;

-- Create Single Consolidated SELECT Policy
CREATE POLICY "View Projects Policy"
ON projects FOR SELECT
USING (
  can_view_project(id, is_public)
);

-- Owners can Insert/Update/Delete
-- Ensure we drop existing ones first to avoid "already exists" error
DROP POLICY IF EXISTS "Owners can insert projects" ON projects;
CREATE POLICY "Owners can insert projects"
ON projects FOR INSERT
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update projects" ON projects;
CREATE POLICY "Owners can update projects"
ON projects FOR UPDATE
USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete projects" ON projects;
CREATE POLICY "Owners can delete projects"
ON projects FOR DELETE
USING (auth.uid() = owner_id);


-- =========================================================
-- 3. Apply Start-of-the-Art Policies (PROJECT MEMBERS)
-- =========================================================
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "See project members" ON project_members;
DROP POLICY IF EXISTS "Project owners can add members" ON project_members;
DROP POLICY IF EXISTS "Project admins can add members" ON project_members;
DROP POLICY IF EXISTS "View Members Policy" ON project_members;
DROP POLICY IF EXISTS "Manage Members Policy" ON project_members;
DROP POLICY IF EXISTS "Modify Members Policy" ON project_members;
DROP POLICY IF EXISTS "Update Members Policy" ON project_members;

-- SELECT: Members can see other members, Owners can see members
CREATE POLICY "View Members Policy"
ON project_members FOR SELECT
USING (
  check_is_member(project_id) 
  OR 
  check_is_owner(project_id)
);

-- INSERT: Owners or Admins can add members
CREATE POLICY "Manage Members Policy"
ON project_members FOR INSERT
WITH CHECK (
  check_is_owner(project_id) 
  OR 
  check_is_admin(project_id)
);

-- UPDATE/DELETE: Owners or Admins
CREATE POLICY "Modify Members Policy"
ON project_members FOR DELETE
USING (
  check_is_owner(project_id) 
  OR 
  check_is_admin(project_id) 
  OR 
  auth.uid() = user_id -- Allow leaving (self-delete)
);

CREATE POLICY "Update Members Policy"
ON project_members FOR UPDATE
USING (
  check_is_owner(project_id) OR check_is_admin(project_id)
);
