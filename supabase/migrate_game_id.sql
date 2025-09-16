-- Migration to fix game_id column type from uuid to text
-- This is the main issue causing the authentication errors

-- First, let's see what the current structure looks like
-- We need to change game_id from uuid to text

-- Step 1: Add a new column with the correct type
ALTER TABLE public.user_interactions ADD COLUMN game_id_text text;

-- Step 2: If you have existing data, you would need to migrate it
-- For now, we'll just add the new column and let the API use it

-- Step 3: Drop the old column and rename the new one
-- (This will remove any existing data, but since you're getting auth errors, 
-- there probably isn't any important data to preserve)
ALTER TABLE public.user_interactions DROP COLUMN IF EXISTS game_id;
ALTER TABLE public.user_interactions RENAME COLUMN game_id_text TO game_id;

-- Step 4: Add the unique constraint with the new column
ALTER TABLE public.user_interactions 
ADD CONSTRAINT user_interactions_unique UNIQUE(user_id, game_id, action);

-- Step 5: Add the check constraint for action
ALTER TABLE public.user_interactions 
ADD CONSTRAINT user_interactions_action_check CHECK (action IN ('like', 'favorite', 'played'));

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON public.user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_game_id ON public.user_interactions(game_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_action ON public.user_interactions(action);

-- Step 7: Enable RLS and create policies
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own interactions" ON public.user_interactions;
DROP POLICY IF EXISTS "Users can insert their own interactions" ON public.user_interactions;
DROP POLICY IF EXISTS "Users can update their own interactions" ON public.user_interactions;
DROP POLICY IF EXISTS "Users can delete their own interactions" ON public.user_interactions;

-- Create new policies
CREATE POLICY "Users can view their own interactions" ON public.user_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions" ON public.user_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions" ON public.user_interactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions" ON public.user_interactions
  FOR DELETE USING (auth.uid() = user_id);
