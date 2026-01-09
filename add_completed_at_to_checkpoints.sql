-- Add completed_at column to checkpoints table
ALTER TABLE "public"."checkpoints"
ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMPTZ DEFAULT NULL;

-- Optional: Update existing completed checkpoints to have a date (e.g. now or their creation date as fallback)
-- UPDATE "public"."checkpoints" SET "completed_at" = created_at WHERE is_completed = true AND completed_at IS NULL;
