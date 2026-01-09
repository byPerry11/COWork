-- ============================================
-- FIX: Remaining Function Search Path Mutable Warnings
-- ============================================
-- This script fixes the remaining "Function Search Path Mutable" warnings
-- by adding explicit search_path to all SECURITY DEFINER functions.
--
-- This is a continuation of supabase_fix_search_path.sql
-- 
-- Remaining functions to fix:
--   1. set_random_member_color (from supabase_project_members_update.sql)
--   2. transfer_project_ownership (trigger version, from supabase_configure_cascade_with_transfer.sql)
--
-- Issue: Functions without search_path are vulnerable to search path
-- injection attacks, where malicious users could create objects
-- in their schema to hijack function calls.
--
-- Solution: Set search_path explicitly to prevent this attack vector.
-- ============================================

-- ============================================
-- FIX 1: set_random_member_color
-- ============================================
-- Assigns a random hex color to new project members
-- Used by trigger: trigger_set_member_color

CREATE OR REPLACE FUNCTION public.set_random_member_color()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Values: md5 of random gives hex, substring 6 chars, prefix #
    NEW.member_color := (
        SELECT '#' || substring(md5(random()::text) from 1 for 6)
    );
    RETURN NEW;
END;
$$;

-- ============================================
-- FIX 2: transfer_project_ownership (Trigger Version)
-- ============================================
-- Automatically transfers project ownership when a user is deleted
-- Used by trigger: transfer_projects_before_user_delete on auth.users

CREATE OR REPLACE FUNCTION public.transfer_project_ownership()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    project_record RECORD;
    new_owner_id UUID;
BEGIN
    -- For each project owned by the user being deleted
    FOR project_record IN 
        SELECT id FROM projects WHERE owner_id = OLD.id
    LOOP
        -- Find the next best member to inherit the project
        -- Priority: active admin > active manager > active member
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
            joined_at ASC  -- If multiple with same role, pick the oldest member
        LIMIT 1;

        -- If we found a suitable member, transfer ownership
        IF new_owner_id IS NOT NULL THEN
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
            UPDATE projects 
            SET owner_id = NULL 
            WHERE id = project_record.id;
            
            RAISE NOTICE 'Project % orphaned (no members to transfer to)', project_record.id;
        END IF;
    END LOOP;

    RETURN OLD;
END;
$$;

-- ============================================
-- VERIFICATION
-- ============================================
-- Check that all functions now have search_path set

SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type,
  CASE 
    WHEN prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security,
  proconfig as settings
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'set_random_member_color',
    'transfer_project_ownership'
  )
ORDER BY p.proname;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Remaining Search Path Warnings Fixed!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Fixed functions:';
  RAISE NOTICE '  ✓ set_random_member_color';
  RAISE NOTICE '  ✓ transfer_project_ownership (trigger version)';
  RAISE NOTICE '';
  RAISE NOTICE 'All functions now have:';
  RAISE NOTICE '  • SET search_path = public, pg_temp';
  RAISE NOTICE '  • Protection against search path injection';
  RAISE NOTICE '';
  RAISE NOTICE 'Combined with supabase_fix_search_path.sql:';
  RAISE NOTICE '  Total functions secured: 7';
  RAISE NOTICE '';
  RAISE NOTICE 'Remaining manual action:';
  RAISE NOTICE '  ⚠ Leaked Password Protection';
  RAISE NOTICE '    Dashboard → Authentication → Policies';
  RAISE NOTICE '    Enable: "Leaked Password Protection"';
  RAISE NOTICE '============================================';
END $$;
