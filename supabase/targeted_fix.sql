-- Targeted fix for user_interactions table
-- Only fix the specific issues without recreating existing constraints

-- First, let's check what we're working with
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own interactions" ON public.user_interactions;
DROP POLICY IF EXISTS "Users can insert their own interactions" ON public.user_interactions;
DROP POLICY IF EXISTS "Users can update their own interactions" ON public.user_interactions;
DROP POLICY IF EXISTS "Users can delete their own interactions" ON public.user_interactions;

-- Add the unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_interactions_unique' 
        AND conrelid = 'public.user_interactions'::regclass
    ) THEN
        ALTER TABLE public.user_interactions 
        ADD CONSTRAINT user_interactions_unique UNIQUE(user_id, game_id, action);
    END IF;
END $$;

-- Ensure the action column has the correct check constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_interactions_action_check' 
        AND conrelid = 'public.user_interactions'::regclass
    ) THEN
        ALTER TABLE public.user_interactions 
        ADD CONSTRAINT user_interactions_action_check CHECK (action IN ('like', 'favorite', 'played'));
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON public.user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_game_id ON public.user_interactions(game_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_action ON public.user_interactions(action);

-- Enable Row Level Security (RLS) if not already enabled
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own interactions" ON public.user_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions" ON public.user_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions" ON public.user_interactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions" ON public.user_interactions
  FOR DELETE USING (auth.uid() = user_id);
