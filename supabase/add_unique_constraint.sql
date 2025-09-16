-- Add the missing unique constraint to user_interactions table
-- This is the main issue causing the authentication errors

-- Add the unique constraint
ALTER TABLE public.user_interactions 
ADD CONSTRAINT user_interactions_unique UNIQUE(user_id, game_id, action);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON public.user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_game_id ON public.user_interactions(game_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_action ON public.user_interactions(action);

-- Ensure RLS is enabled
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own interactions" ON public.user_interactions;
DROP POLICY IF EXISTS "Users can insert their own interactions" ON public.user_interactions;
DROP POLICY IF EXISTS "Users can update their own interactions" ON public.user_interactions;
DROP POLICY IF EXISTS "Users can delete their own interactions" ON public.user_interactions;

-- Create RLS policies
CREATE POLICY "Users can view their own interactions" ON public.user_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions" ON public.user_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions" ON public.user_interactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions" ON public.user_interactions
  FOR DELETE USING (auth.uid() = user_id);
