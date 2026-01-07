-- Configure CASCADE delete for all user-related foreign keys
-- This ensures that when a user is deleted, all their related data is also deleted

-- IMPORTANT: This will delete data! Make sure you understand the implications.
-- When you delete a user from auth.users, this will:
-- 1. Delete their profile
-- 2. Delete all projects they own
-- 3. Delete all their memberships
-- 4. Delete all their friend requests
-- 5. Delete all evidences they submitted

-- First, drop existing foreign key constraints and recreate them with CASCADE

-- 1. PROFILES (usually already has CASCADE from Supabase trigger)
-- The profiles.id -> auth.users.id is typically set by the trigger, but we verify it:
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE profiles 
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- 2. PROJECTS - when user is deleted, delete their owned projects
ALTER TABLE projects 
  DROP CONSTRAINT IF EXISTS projects_owner_id_fkey;

ALTER TABLE projects 
  ADD CONSTRAINT projects_owner_id_fkey 
  FOREIGN KEY (owner_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- 3. PROJECT_MEMBERS - when user is deleted, remove their memberships
ALTER TABLE project_members 
  DROP CONSTRAINT IF EXISTS project_members_user_id_fkey;

ALTER TABLE project_members 
  ADD CONSTRAINT project_members_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Also cascade when project is deleted (delete all memberships)
ALTER TABLE project_members 
  DROP CONSTRAINT IF EXISTS project_members_project_id_fkey;

ALTER TABLE project_members 
  ADD CONSTRAINT project_members_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES projects(id) 
  ON DELETE CASCADE;

-- 4. CHECKPOINTS - when project is deleted, delete all checkpoints
ALTER TABLE checkpoints 
  DROP CONSTRAINT IF EXISTS checkpoints_project_id_fkey;

ALTER TABLE checkpoints 
  ADD CONSTRAINT checkpoints_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES projects(id) 
  ON DELETE CASCADE;

-- 5. EVIDENCES - when user is deleted, delete their evidences
ALTER TABLE evidences 
  DROP CONSTRAINT IF EXISTS evidences_user_id_fkey;

ALTER TABLE evidences 
  ADD CONSTRAINT evidences_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Also cascade when checkpoint is deleted
ALTER TABLE evidences 
  DROP CONSTRAINT IF EXISTS evidences_checkpoint_id_fkey;

ALTER TABLE evidences 
  ADD CONSTRAINT evidences_checkpoint_id_fkey 
  FOREIGN KEY (checkpoint_id) 
  REFERENCES checkpoints(id) 
  ON DELETE CASCADE;

-- 6. FRIEND_REQUESTS - when user is deleted, delete their friend requests
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

-- 7. FRIENDSHIPS - when user is deleted, delete their friendships
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

-- Summary of CASCADE behavior:
-- Delete User → Deletes: Profile, Projects (owned), Memberships, Checkpoints (via project), Evidences, Friend Requests, Friendships
