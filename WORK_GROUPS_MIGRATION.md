# Work Groups & Enhanced Tasks Migration

Run the following SQL in the Supabase SQL Editor.

```sql
-- 1. Create Work Groups Table
CREATE TABLE IF NOT EXISTS public.work_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create Work Group Members Table
CREATE TABLE IF NOT EXISTS public.work_group_members (
    work_group_id UUID REFERENCES public.work_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'member', -- Reusing app_role enum (admin, manager, member)
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (work_group_id, user_id)
);

-- 3. Update Projects Table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'work_group_id'
    ) THEN
        ALTER TABLE public.projects 
        ADD COLUMN work_group_id UUID REFERENCES public.work_groups(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Update Checkpoints Table (Enhanced Tasks)
DO $$
BEGIN
    -- Add description
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'checkpoints' AND column_name = 'description'
    ) THEN
        ALTER TABLE public.checkpoints ADD COLUMN description TEXT;
    END IF;

    -- Add image_url
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'checkpoints' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE public.checkpoints ADD COLUMN image_url TEXT;
    END IF;

    -- Add is_vacant
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'checkpoints' AND column_name = 'is_vacant'
    ) THEN
        ALTER TABLE public.checkpoints ADD COLUMN is_vacant BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add claimed_by (FK to users)
    -- Note: We already have checkpoint_assignments table, but 'claimed_by' might be useful 
    -- to track WHO claimed it if we want 1 person responsibility. 
    -- However, the requirement says "tasks can be taken by team members".
    -- Let's assume using the existing `checkpoint_assignments` is better, but 
    -- we need a way to mark it as "Vacant" vs "Assigned". 
    -- If is_vacant is TRUE, then assignments should be empty ideally.
    -- When someone claims it, is_vacant becomes FALSE and we add entry to checkpoint_assignments.
    
    -- We'll skip adding 'claimed_by' column and use existing relation, relying on is_vacant flag.
END $$;


-- =================================================================
-- RLS POLICIES
-- =================================================================

-- Enable RLS
ALTER TABLE public.work_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_group_members ENABLE ROW LEVEL SECURITY;

-- Work Groups Policies
-- View: Members of the group OR Owner
CREATE POLICY "Work Groups viewable by members" ON public.work_groups 
FOR SELECT USING (
    auth.uid() = owner_id OR
    EXISTS (
        SELECT 1 FROM public.work_group_members 
        WHERE work_group_id = work_groups.id AND user_id = auth.uid()
    )
);

-- Create: Authenticated users
CREATE POLICY "Users can create work groups" ON public.work_groups 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Update: Owner or Admin of the group
CREATE POLICY "Owners/Admins can update work groups" ON public.work_groups 
FOR UPDATE USING (
    auth.uid() = owner_id OR
    EXISTS (
        SELECT 1 FROM public.work_group_members 
        WHERE work_group_id = work_groups.id 
        AND user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Work Group Members Policies
-- View: Members of the group
CREATE POLICY "Members viewable by group access" ON public.work_group_members 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.work_groups 
        WHERE id = work_group_members.work_group_id 
        AND (
            owner_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.work_group_members as wgm
                WHERE wgm.work_group_id = work_groups.id AND wgm.user_id = auth.uid()
            )
        )
    )
);

-- Insert/Delete: Admins of the group
CREATE POLICY "Admins can manage members" ON public.work_group_members 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.work_groups 
        WHERE id = work_group_members.work_group_id 
        AND (
            owner_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.work_group_members as wgm
                WHERE wgm.work_group_id = work_groups.id 
                AND wgm.user_id = auth.uid() 
                AND wgm.role IN ('admin', 'manager')
            )
        )
    )
);

-- Update Projects RLS to include Work Group access
-- Users should see projects if they are in the work group, EVEN IF not strictly in project_members yet?
-- Or does being in Work Group just allow you to SEE the project exists, but you still need to join?
-- "al entrar a la pantalla de proyectos ademas de proyectos debes poder ver lo grupos... y al seleccionar uno se abre una vista nueva... donde se muestran los usuarios en el grupo"
-- Let's stick to explicit membership for now, BUT maybe allow Work Group admins to see all projects within.

CREATE POLICY "Work Group admins see all group projects" ON public.projects
FOR SELECT USING (
    work_group_id IS NOT NULL AND
    EXISTS (
        SELECT 1 FROM public.work_group_members
        WHERE work_group_id = projects.work_group_id
        AND user_id = auth.uid()
        AND role IN ('admin', 'manager')
    )
);

```
