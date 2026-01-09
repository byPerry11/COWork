-- ============================================
-- CHECKPOINT COMPLETION TRACKING
-- ============================================

-- 1. Add completed_by column to checkpoints
ALTER TABLE checkpoints
ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Update toggle function (if exists as database function) or ensure frontend sends it
-- We'll handle the logic in the frontend update call mainly, but this column is needed.

-- ============================================
-- VERIFICATION
-- ============================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'checkpoints' AND column_name = 'completed_by';
