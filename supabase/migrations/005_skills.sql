-- 005_skills.sql
-- Add skills system to profiles (JSONB array approach)
-- Each skill: { "name": "Marketing", "level": 7, "comment": "3 ans d'expérience" }

-- Add skills column to profiles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'skills'
  ) THEN
    ALTER TABLE profiles ADD COLUMN skills JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Index for future filtering on skills
CREATE INDEX IF NOT EXISTS idx_profiles_skills ON profiles USING gin (skills);
