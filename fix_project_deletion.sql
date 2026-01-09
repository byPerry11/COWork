-- Fix Project Deletion Issues

-- 1. Ensure RLS Policy for DELETE exists and works
DROP POLICY IF EXISTS "Enable delete for owners" ON "public"."projects";
DROP POLICY IF EXISTS "Users can delete their own projects" ON "public"."projects";

CREATE POLICY "Users can delete their own projects"
ON "public"."projects"
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- 2. Ensure ON DELETE CASCADE for project_members
ALTER TABLE "public"."project_members"
DROP CONSTRAINT IF EXISTS "project_members_project_id_fkey";

ALTER TABLE "public"."project_members"
ADD CONSTRAINT "project_members_project_id_fkey"
FOREIGN KEY (project_id)
REFERENCES "public"."projects"(id)
ON DELETE CASCADE;

-- 3. Ensure ON DELETE CASCADE for checkpoints
ALTER TABLE "public"."checkpoints"
DROP CONSTRAINT IF EXISTS "checkpoints_project_id_fkey";

ALTER TABLE "public"."checkpoints"
ADD CONSTRAINT "checkpoints_project_id_fkey"
FOREIGN KEY (project_id)
REFERENCES "public"."projects"(id)
ON DELETE CASCADE;

-- 4. Ensure ON DELETE CASCADE for evidences (via checkpoints)
ALTER TABLE "public"."evidences"
DROP CONSTRAINT IF EXISTS "evidences_checkpoint_id_fkey";

ALTER TABLE "public"."evidences"
ADD CONSTRAINT "evidences_checkpoint_id_fkey"
FOREIGN KEY (checkpoint_id)
REFERENCES "public"."checkpoints"(id)
ON DELETE CASCADE;
