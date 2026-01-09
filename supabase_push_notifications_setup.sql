-- ============================================
-- PUSH NOTIFICATIONS SETUP
-- ============================================
-- This script sets up the database infrastructure for Web Push Notifications
-- including tables, functions, triggers, and RLS policies.
-- ============================================

-- 1. CREATE PUSH SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, endpoint)
);

-- 2. CREATE NOTIFICATION QUEUE TABLE (for retry logic)
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('friend_request', 'project_invite', 'checkpoint_rejected')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}'::JSONB,
    sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    sent_at TIMESTAMP WITH TIME ZONE
);

-- 3. ENABLE RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES FOR PUSH_SUBSCRIPTIONS

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" 
ON public.push_subscriptions FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions" 
ON public.push_subscriptions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions" 
ON public.push_subscriptions FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions" 
ON public.push_subscriptions FOR DELETE 
USING (auth.uid() = user_id);

-- 5. RLS POLICIES FOR NOTIFICATION_QUEUE

-- Only authenticated users can view their notifications
CREATE POLICY "Users can view own notifications" 
ON public.notification_queue FOR SELECT 
USING (auth.uid() = user_id);

-- 6. FUNCTION TO QUEUE NOTIFICATION
CREATE OR REPLACE FUNCTION public.queue_push_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_body TEXT,
    p_data JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    notification_id UUID;
BEGIN
    -- Insert into notification queue
    INSERT INTO public.notification_queue (user_id, notification_type, title, body, data)
    VALUES (p_user_id, p_type, p_title, p_body, p_data)
    RETURNING id INTO notification_id;
    
    -- Note: Actual push sending will be handled by Next.js API route
    -- The frontend will poll this table or use realtime subscriptions
    
    RETURN notification_id;
END;
$$;

-- 7. TRIGGER FUNCTION: Friend Request Notification
CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    sender_name TEXT;
BEGIN
    -- Only send notification for pending requests
    IF NEW.status = 'pending' THEN
        -- Get sender's display name
        SELECT COALESCE(display_name, username) INTO sender_name
        FROM profiles
        WHERE id = NEW.sender_id;
        
        -- Queue notification
        PERFORM queue_push_notification(
            NEW.receiver_id,
            'friend_request',
            '👤 New Friend Request',
            sender_name || ' sent you a friend request',
            jsonb_build_object(
                'request_id', NEW.id,
                'sender_id', NEW.sender_id,
                'url', '/dashboard/notifications'
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- 8. TRIGGER FUNCTION: Project Invitation Notification
CREATE OR REPLACE FUNCTION public.notify_project_invite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    project_title TEXT;
BEGIN
    -- Only send notification for pending invites
    IF NEW.status = 'pending' THEN
        -- Get project title
        SELECT title INTO project_title
        FROM projects
        WHERE id = NEW.project_id;
        
        -- Queue notification
        PERFORM queue_push_notification(
            NEW.user_id,
            'project_invite',
            '📁 Project Invitation',
            'You''ve been invited to join ' || project_title,
            jsonb_build_object(
                'project_id', NEW.project_id,
                'role', NEW.role,
                'url', '/dashboard/notifications'
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- 9. TRIGGER FUNCTION: Checkpoint Rejected Notification
CREATE OR REPLACE FUNCTION public.notify_checkpoint_rejected()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    project_title TEXT;
    submitter_id UUID;
BEGIN
    -- Only notify when checkpoint is marked with rejection_reason and not completed
    IF NEW.rejection_reason IS NOT NULL AND NEW.is_completed = FALSE AND 
       (OLD.rejection_reason IS NULL OR OLD.rejection_reason != NEW.rejection_reason) THEN
        
        -- Get project title
        SELECT title INTO project_title
        FROM projects
        WHERE id = NEW.project_id;
        
        -- Find who submitted the last evidence (completed_by)
        -- If no completed_by, we can't notify anyone specific
        IF NEW.completed_by IS NOT NULL THEN
            -- Queue notification to the person who submitted
            PERFORM queue_push_notification(
                NEW.completed_by,
                'checkpoint_rejected',
                '❌ Checkpoint Rejected',
                'Your checkpoint "' || NEW.title || '" in ' || project_title || ' was rejected',
                jsonb_build_object(
                    'checkpoint_id', NEW.id,
                    'project_id', NEW.project_id,
                    'rating', NEW.rating,
                    'reason', NEW.rejection_reason,
                    'url', '/projects/' || NEW.project_id
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 10. CREATE TRIGGERS

-- Friend request trigger
DROP TRIGGER IF EXISTS trigger_notify_friend_request ON friend_requests;
CREATE TRIGGER trigger_notify_friend_request
    AFTER INSERT ON friend_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_friend_request();

-- Project invitation trigger
DROP TRIGGER IF EXISTS trigger_notify_project_invite ON project_members;
CREATE TRIGGER trigger_notify_project_invite
    AFTER INSERT ON project_members
    FOR EACH ROW
    EXECUTE FUNCTION notify_project_invite();

-- Checkpoint rejection trigger
DROP TRIGGER IF EXISTS trigger_notify_checkpoint_rejected ON checkpoints;
CREATE TRIGGER trigger_notify_checkpoint_rejected
    AFTER UPDATE ON checkpoints
    FOR EACH ROW
    EXECUTE FUNCTION notify_checkpoint_rejected();

-- 11. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_sent ON notification_queue(sent);
CREATE INDEX IF NOT EXISTS idx_notification_queue_created_at ON notification_queue(created_at DESC);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('push_subscriptions', 'notification_queue');

-- Check triggers were created
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE 'trigger_notify%';

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Push Notifications Setup Complete!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  ✓ push_subscriptions';
    RAISE NOTICE '  ✓ notification_queue';
    RAISE NOTICE '';
    RAISE NOTICE 'Triggers created:';
    RAISE NOTICE '  ✓ trigger_notify_friend_request';
    RAISE NOTICE '  ✓ trigger_notify_project_invite';
    RAISE NOTICE '  ✓ trigger_notify_checkpoint_rejected';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions created:';
    RAISE NOTICE '  ✓ queue_push_notification()';
    RAISE NOTICE '  ✓ notify_friend_request()';
    RAISE NOTICE '  ✓ notify_project_invite()';
    RAISE NOTICE '  ✓ notify_checkpoint_rejected()';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Generate VAPID keys';
    RAISE NOTICE '  2. Create Service Worker';
    RAISE NOTICE '  3. Implement push subscription API';
    RAISE NOTICE '============================================';
END $$;
