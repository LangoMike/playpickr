-- Fix the user_interactions table structure
-- Drop the existing table and recreate it with the correct structure

DROP TABLE IF EXISTS public.user_interactions CASCADE;

-- Recreate user_interactions table with correct structure
CREATE TABLE public.user_interactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id text NOT NULL, -- Using game slug as identifier (not UUID)
  action text NOT NULL CHECK (action IN ('like', 'favorite', 'played')),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_interactions_pkey PRIMARY KEY (id),
  CONSTRAINT user_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(user_id, game_id, action) -- Add unique constraint
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON public.user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_game_id ON public.user_interactions(game_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_action ON public.user_interactions(action);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_interactions table
CREATE POLICY "Users can view their own interactions" ON public.user_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions" ON public.user_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions" ON public.user_interactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions" ON public.user_interactions
  FOR DELETE USING (auth.uid() = user_id);

-- Ensure games table has proper RLS policies (only if not already enabled)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'games' AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for games table (public read access)
        CREATE POLICY "Games are viewable by everyone" ON public.games
          FOR SELECT USING (true);
    END IF;
END $$;
