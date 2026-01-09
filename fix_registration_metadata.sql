-- ============================================
-- FIX: Registration Metadata Not Being Saved
-- ============================================
-- Issue: handle_new_user() function is not reading username and display_name
-- from signup metadata (raw_user_meta_data).
--
-- This script updates the function to:
-- 1. Read username and display_name from metadata
-- 2. Add SET search_path for security
-- 3. Handle conflicts gracefully
-- ============================================

-- Update the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, color_hex)
  VALUES (
    new.id, 
    -- Use metadata username or fallback to email part before @
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), 
    -- Use metadata display_name or fallback to username or email part
    COALESCE(
      new.raw_user_meta_data->>'display_name', 
      new.raw_user_meta_data->>'username', 
      split_part(new.email, '@', 1)
    ),
    '#3b82f6'
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name;
    
  RETURN new;
END;
$$;

-- ============================================
-- VERIFICATION
-- ============================================
-- Check that the function is updated
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'handle_new_user';

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Registration Metadata Fix Applied!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Updated function:';
  RAISE NOTICE '  ✓ handle_new_user';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  • Now reads username from raw_user_meta_data';
  RAISE NOTICE '  • Now reads display_name from raw_user_meta_data';
  RAISE NOTICE '  • Added fallback to email if metadata missing';
  RAISE NOTICE '  • Added SET search_path = public, pg_temp';
  RAISE NOTICE '  • Added ON CONFLICT handling';
  RAISE NOTICE '';
  RAISE NOTICE 'Test by creating a new user with:';
  RAISE NOTICE '  - Username: testuser';
  RAISE NOTICE '  - Display Name: Test User';
  RAISE NOTICE '  - Email: test@example.com';
  RAISE NOTICE '';
  RAISE NOTICE 'Then verify in profiles table:';
  RAISE NOTICE '  SELECT id, username, display_name, color_hex';
  RAISE NOTICE '  FROM profiles WHERE username = ''testuser'';';
  RAISE NOTICE '============================================';
END $$;
