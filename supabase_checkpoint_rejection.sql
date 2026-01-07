-- Checkpoint Rejection & Correction System Schema

-- 1. Add rejection_reason column to checkpoints (optional comment for why it was rejected)
ALTER TABLE checkpoints ADD COLUMN IF NOT EXISTS rejection_reason text;

-- 2. Create table to track correction history
CREATE TABLE IF NOT EXISTS checkpoint_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkpoint_id uuid NOT NULL REFERENCES checkpoints(id) ON DELETE CASCADE,
  previous_evidence_id uuid REFERENCES evidences(id) ON DELETE SET NULL,
  rejected_at timestamptz DEFAULT now(),
  rejected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_rating numeric(3,1),
  rejection_comment text,
  created_at timestamptz DEFAULT now()
);

-- 3. Enable RLS on checkpoint_corrections
ALTER TABLE checkpoint_corrections ENABLE ROW LEVEL SECURITY;

-- 4. Allow users to view corrections for their projects
CREATE POLICY "Users can view corrections for their projects"
ON checkpoint_corrections
FOR SELECT
USING (
  checkpoint_id IN (
    SELECT c.id 
    FROM checkpoints c
    JOIN projects p ON c.project_id = p.id
    WHERE p.owner_id = auth.uid()
       OR p.id IN (
         SELECT project_id 
         FROM project_members 
         WHERE user_id = auth.uid()
       )
  )
);

-- 5. Allow admins/managers to insert correction records
CREATE POLICY "Admins can insert correction records"
ON checkpoint_corrections
FOR INSERT
WITH CHECK (
  checkpoint_id IN (
    SELECT c.id 
    FROM checkpoints c
    JOIN projects p ON c.project_id = p.id
    WHERE p.owner_id = auth.uid()
  )
);

-- Summary:
-- - checkpoints.rejection_reason: stores the last rejection comment
-- - checkpoint_corrections: full history of all rejections for a checkpoint
-- - RLS policies allow project members to view and admins to create rejection records
