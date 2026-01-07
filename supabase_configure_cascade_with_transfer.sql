-- Automatic Project Ownership Transfer on User Deletion
-- This script creates a trigger that transfers project ownership to another member
-- when the owner's account is deleted, preventing project loss.

-- Strategy:
-- 1. Find the next best member (priority: admin > manager > member)
-- 2. Transfer ownership to that member
-- 3. If no members exist, set owner_id to NULL (orphaned project)

-- First, create a function to handle the transfer
CREATE OR REPLACE FUNCTION transfer_project_ownership()
RETURNS TRIGGER AS $$
DECLARE
    project_record RECORD;
    new_owner_id UUID;
BEGIN
    -- For each project owned by the user being deleted
    FOR project_record IN 
        SELECT id FROM projects WHERE owner_id = OLD.id
    LOOP
        -- Find the next best member to inherit the project
        -- Priority: active admin > active manager > active member > pending admin/manager
        SELECT user_id INTO new_owner_id
        FROM project_members
        WHERE project_id = project_record.id
          AND user_id != OLD.id  -- Don't select the user being deleted
          AND status = 'active'
        ORDER BY 
            CASE role
                WHEN 'admin' THEN 1
                WHEN 'manager' THEN 2
                WHEN 'member' THEN 3
                ELSE 4
            END,
            created_at ASC  -- If multiple with same role, pick the oldest member
        LIMIT 1;

        -- If we found a suitable member, transfer ownership
        IF new_owner_id IS NOT NULL THEN
            -- Update project owner
            UPDATE projects 
            SET owner_id = new_owner_id 
            WHERE id = project_record.id;
            
            -- Ensure the new owner is also set as 'admin' in project_members
            UPDATE project_members
            SET role = 'admin'
            WHERE project_id = project_record.id 
              AND user_id = new_owner_id;
              
            RAISE NOTICE 'Project % transferred to user %', project_record.id, new_owner_id;
        ELSE
            -- No suitable member found, set owner to NULL (orphaned project)
            -- You could also DELETE the project here if preferred
            UPDATE projects 
            SET owner_id = NULL 
            WHERE id = project_record.id;
            
            RAISE NOTICE 'Project % orphaned (no members to transfer to)', project_record.id;
        END IF;
    END LOOP;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
-- This runs BEFORE the user is deleted, so we can still access their data
DROP TRIGGER IF EXISTS transfer_projects_before_user_delete ON auth.users;

CREATE TRIGGER transfer_projects_before_user_delete
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION transfer_project_ownership();

-- Now configure CASCADE with the transfer logic in place
-- When user is deleted, their memberships and personal data cascade
-- But projects are transferred first (via trigger above)

-- Projects: Now can be NULL if orphaned
ALTER TABLE projects 
  DROP CONSTRAINT IF EXISTS projects_owner_id_fkey;

ALTER TABLE projects 
  ADD CONSTRAINT projects_owner_id_fkey 
  FOREIGN KEY (owner_id) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;  -- Set to NULL instead of CASCADE (trigger handles transfer)

-- All other tables use CASCADE as before
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles 
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE project_members 
  DROP CONSTRAINT IF EXISTS project_members_user_id_fkey;
ALTER TABLE project_members 
  ADD CONSTRAINT project_members_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE project_members 
  DROP CONSTRAINT IF EXISTS project_members_project_id_fkey;
ALTER TABLE project_members 
  ADD CONSTRAINT project_members_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES projects(id) 
  ON DELETE CASCADE;

ALTER TABLE checkpoints 
  DROP CONSTRAINT IF EXISTS checkpoints_project_id_fkey;
ALTER TABLE checkpoints 
  ADD CONSTRAINT checkpoints_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES projects(id) 
  ON DELETE CASCADE;

ALTER TABLE evidences 
  DROP CONSTRAINT IF EXISTS evidences_user_id_fkey;
ALTER TABLE evidences 
  ADD CONSTRAINT evidences_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE evidences 
  DROP CONSTRAINT IF EXISTS evidences_checkpoint_id_fkey;
ALTER TABLE evidences 
  ADD CONSTRAINT evidences_checkpoint_id_fkey 
  FOREIGN KEY (checkpoint_id) 
  REFERENCES checkpoints(id) 
  ON DELETE CASCADE;

ALTER TABLE friend_requests 
  DROP CONSTRAINT IF EXISTS friend_requests_sender_id_fkey;
ALTER TABLE friend_requests 
  ADD CONSTRAINT friend_requests_sender_id_fkey 
  FOREIGN KEY (sender_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE friend_requests 
  DROP CONSTRAINT IF EXISTS friend_requests_receiver_id_fkey;
ALTER TABLE friend_requests 
  ADD CONSTRAINT friend_requests_receiver_id_fkey 
  FOREIGN KEY (receiver_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE friendships 
  DROP CONSTRAINT IF EXISTS friendships_user_id_fkey;
ALTER TABLE friendships 
  ADD CONSTRAINT friendships_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE friendships 
  DROP CONSTRAINT IF EXISTS friendships_friend_id_fkey;
ALTER TABLE friendships 
  ADD CONSTRAINT friendships_friend_id_fkey 
  FOREIGN KEY (friend_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Summary:
-- When a user is deleted:
-- 1. Trigger transfers their projects to next best member (admin > manager > member)
-- 2. If no members, project becomes orphaned (owner_id = NULL)
-- 3. All their memberships, friend requests, evidences cascade delete normally
