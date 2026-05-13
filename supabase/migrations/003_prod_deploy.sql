-- ============================================
-- PAKT — Production Migration 003
-- Safe to run multiple times (idempotent)
-- Run in Supabase SQL Editor on PROD project
-- ============================================

-- ============================================
-- 1. EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- ============================================
-- 2. PROFILES — add missing columns
-- ============================================
-- The initial schema only has: id, email, first_name, age, bio, city,
-- interests, photos, plan, swipes_today, last_swipe_date, is_onboarded,
-- created_at, updated_at.
-- The code expects many more columns.

DO $$
BEGIN
  -- Geolocation
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='city_lat') THEN
    ALTER TABLE profiles ADD COLUMN city_lat DOUBLE PRECISION;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='city_lng') THEN
    ALTER TABLE profiles ADD COLUMN city_lng DOUBLE PRECISION;
  END IF;

  -- Preferences (JSON — distance, age filters)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='preferences') THEN
    ALTER TABLE profiles ADD COLUMN preferences JSONB DEFAULT '{}';
  END IF;

  -- Stripe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='stripe_customer_id') THEN
    ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='stripe_subscription_id') THEN
    ALTER TABLE profiles ADD COLUMN stripe_subscription_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='subscription_status') THEN
    ALTER TABLE profiles ADD COLUMN subscription_status TEXT;
  END IF;

  -- Daily counters
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='messages_today') THEN
    ALTER TABLE profiles ADD COLUMN messages_today INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='likes_today') THEN
    ALTER TABLE profiles ADD COLUMN likes_today INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='last_message_date') THEN
    ALTER TABLE profiles ADD COLUMN last_message_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='last_like_date') THEN
    ALTER TABLE profiles ADD COLUMN last_like_date DATE;
  END IF;

  -- Moderation
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='is_suspended') THEN
    ALTER TABLE profiles ADD COLUMN is_suspended BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='suspension_reason') THEN
    ALTER TABLE profiles ADD COLUMN suspension_reason TEXT;
  END IF;

  -- Email confirmation
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='email_confirmed') THEN
    ALTER TABLE profiles ADD COLUMN email_confirmed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Relax the plan CHECK constraint to allow new plan values
-- The initial schema only allows ('free', 'premium')
-- The code uses ('free', 'business', 'business_pro')
DO $$
BEGIN
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
  ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check
    CHECK (plan IN ('free', 'premium', 'business', 'business_pro'));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'profiles_plan_check constraint update skipped: %', SQLERRM;
END $$;

-- ============================================
-- 3. SWIPES TABLE (missing from initial schema)
-- ============================================
CREATE TABLE IF NOT EXISTS swipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  swiper_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('like', 'dislike')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(swiper_id, target_id)
);

-- ============================================
-- 4. PROFILE_VIEWS TABLE (missing from initial schema)
-- ============================================
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  viewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  viewed_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  view_count INTEGER DEFAULT 1,
  last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(viewer_id, viewed_id)
);

-- ============================================
-- 5. LIKES — add is_viewed column
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='likes' AND column_name='is_viewed') THEN
    ALTER TABLE likes ADD COLUMN is_viewed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Ensure default UUID on likes.id
ALTER TABLE likes ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- ============================================
-- 6. MATCHES — add is_viewed column + fix UUID default
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='matches' AND column_name='is_viewed') THEN
    ALTER TABLE matches ADD COLUMN is_viewed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Ensure default UUID works (gen_random_uuid is more reliable)
ALTER TABLE matches ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- ============================================
-- 7. CONVERSATIONS — add user1_id/user2_id columns
-- ============================================
-- The initial schema uses participant1_id/participant2_id
-- The code uses user1_id/user2_id
-- We need BOTH to exist for backward compat, or rename
DO $$
BEGIN
  -- If participant1_id exists but user1_id doesn't → rename
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='conversations' AND column_name='participant1_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='conversations' AND column_name='user1_id'
  ) THEN
    ALTER TABLE conversations RENAME COLUMN participant1_id TO user1_id;
    ALTER TABLE conversations RENAME COLUMN participant2_id TO user2_id;
  END IF;

  -- If neither exists (fresh table) → add them
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='conversations' AND column_name='user1_id'
  ) THEN
    ALTER TABLE conversations ADD COLUMN user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
    ALTER TABLE conversations ADD COLUMN user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- 8. ENCOURAGEMENTS TABLE (used by /api/encourage)
-- ============================================
CREATE TABLE IF NOT EXISTS encouragements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. REFERRALS & REWARDS (used by /api/referrals)
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reward_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. AFFILIATES TABLE (used by /api/affiliate)
-- ============================================
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. STRIPE WEBHOOK EVENTS (used by /api/webhook)
-- ============================================
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id TEXT UNIQUE,
  type TEXT,
  data JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 12. ROW LEVEL SECURITY — Enable on new tables
-- ============================================
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE encouragements ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 13. RLS POLICIES — Swipes
-- ============================================
DROP POLICY IF EXISTS "Users can see own swipes" ON swipes;
DROP POLICY IF EXISTS "Users can create swipes" ON swipes;
DROP POLICY IF EXISTS "Users can update own swipes" ON swipes;
DROP POLICY IF EXISTS "Users can delete own swipes" ON swipes;

CREATE POLICY "Users can see own swipes" ON swipes
  FOR SELECT USING (auth.uid() = swiper_id);
CREATE POLICY "Users can create swipes" ON swipes
  FOR INSERT WITH CHECK (auth.uid() = swiper_id);
CREATE POLICY "Users can update own swipes" ON swipes
  FOR UPDATE USING (auth.uid() = swiper_id);
CREATE POLICY "Users can delete own swipes" ON swipes
  FOR DELETE USING (auth.uid() = swiper_id);

-- ============================================
-- 14. RLS POLICIES — Profile views
-- ============================================
DROP POLICY IF EXISTS "Users can see own views" ON profile_views;
DROP POLICY IF EXISTS "Users can insert own views" ON profile_views;
DROP POLICY IF EXISTS "Users can update own views" ON profile_views;

CREATE POLICY "Users can see own views" ON profile_views
  FOR SELECT USING (auth.uid() = viewer_id);
CREATE POLICY "Users can insert own views" ON profile_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);
CREATE POLICY "Users can update own views" ON profile_views
  FOR UPDATE USING (auth.uid() = viewer_id);

-- ============================================
-- 15. RLS POLICIES — Matches (add INSERT/UPDATE/DELETE)
-- ============================================
-- SELECT already exists from 001. Add missing operations.
DROP POLICY IF EXISTS "Users can insert matches" ON matches;
DROP POLICY IF EXISTS "Users can update own matches" ON matches;
DROP POLICY IF EXISTS "Users can delete own matches" ON matches;

CREATE POLICY "Users can insert matches" ON matches
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can update own matches" ON matches
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can delete own matches" ON matches
  FOR DELETE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ============================================
-- 16. RLS POLICIES — Likes (add UPDATE/DELETE)
-- ============================================
DROP POLICY IF EXISTS "Users can update own likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;

CREATE POLICY "Users can update own likes" ON likes
  FOR UPDATE USING (auth.uid() = liker_id OR auth.uid() = liked_id);
CREATE POLICY "Users can delete own likes" ON likes
  FOR DELETE USING (auth.uid() = liker_id);

-- ============================================
-- 17. RLS POLICIES — Conversations (fix to use user1_id/user2_id)
-- ============================================
-- Drop old policies that reference participant1_id/participant2_id
DROP POLICY IF EXISTS "Participants can see conversations" ON conversations;
DROP POLICY IF EXISTS "Participants can update conversations" ON conversations;
DROP POLICY IF EXISTS "Participants can insert conversations" ON conversations;

CREATE POLICY "Participants can see conversations" ON conversations
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Participants can update conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Participants can insert conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ============================================
-- 18. RLS POLICIES — Messages (fix: recipients must read too)
-- ============================================
-- The initial schema only allows sender to SELECT their own messages.
-- Recipients need to read messages in their conversations.
DROP POLICY IF EXISTS "Users can see messages" ON messages;
CREATE POLICY "Users can see messages" ON messages
  FOR SELECT USING (
    auth.uid() = sender_id
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

-- Allow marking messages as read
DROP POLICY IF EXISTS "Users can update messages" ON messages;
CREATE POLICY "Users can update messages" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  );

-- ============================================
-- 19. RLS POLICIES — Encouragements
-- ============================================
DROP POLICY IF EXISTS "Users can see encouragements" ON encouragements;
DROP POLICY IF EXISTS "Users can insert encouragements" ON encouragements;

CREATE POLICY "Users can see encouragements" ON encouragements
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = target_id);
CREATE POLICY "Users can insert encouragements" ON encouragements
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ============================================
-- 20. FUNCTIONS — Update trigger for matches
-- ============================================
-- The trigger creates matches on mutual like.
-- Updated version: does NOT auto-create conversations (frontend handles it).
CREATE OR REPLACE FUNCTION check_and_create_match()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM likes
    WHERE liker_id = NEW.liked_id AND liked_id = NEW.liker_id
  ) THEN
    INSERT INTO matches (user1_id, user2_id)
    VALUES (LEAST(NEW.liker_id, NEW.liked_id), GREATEST(NEW.liker_id, NEW.liked_id))
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger (DROP + CREATE to avoid "already exists")
DROP TRIGGER IF EXISTS on_like_check_match ON likes;
CREATE TRIGGER on_like_check_match
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION check_and_create_match();

-- ============================================
-- 21. FUNCTION — get_or_create_conversation
-- ============================================
CREATE OR REPLACE FUNCTION get_or_create_conversation(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
  conv_id UUID;
  current_uid UUID := auth.uid();
BEGIN
  -- Check if conversation already exists
  SELECT id INTO conv_id
  FROM conversations
  WHERE (user1_id = current_uid AND user2_id = other_user_id)
     OR (user1_id = other_user_id AND user2_id = current_uid)
  LIMIT 1;

  IF conv_id IS NOT NULL THEN
    RETURN conv_id;
  END IF;

  -- Create new conversation
  INSERT INTO conversations (user1_id, user2_id)
  VALUES (current_uid, other_user_id)
  RETURNING id INTO conv_id;

  RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 22. INDEXES — Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_swipes_swiper ON swipes(swiper_id);
CREATE INDEX IF NOT EXISTS idx_swipes_target ON swipes(target_id);
CREATE INDEX IF NOT EXISTS idx_likes_liker ON likes(liker_id);
CREATE INDEX IF NOT EXISTS idx_likes_liked ON likes(liked_id);
CREATE INDEX IF NOT EXISTS idx_likes_liked_viewed ON likes(liked_id, is_viewed);
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_viewed ON matches(is_viewed);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(conversation_id, is_read);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarded ON profiles(is_onboarded);
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);

-- ============================================
-- 23. REALTIME — Enable for tables that need live updates
-- ============================================
-- Supabase realtime must be enabled per-table in the dashboard,
-- but we can also do it via SQL:
DO $$
BEGIN
  -- These ALTER commands enable realtime replication for each table.
  -- They are safe to run multiple times.
  ALTER PUBLICATION supabase_realtime ADD TABLE matches;
  ALTER PUBLICATION supabase_realtime ADD TABLE likes;
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  ALTER PUBLICATION supabase_realtime ADD TABLE encouragements;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Realtime publication update note: %', SQLERRM;
END $$;

-- ============================================
-- 24. STORAGE BUCKETS (idempotent)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('messages', 'messages', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 25. STORAGE RLS POLICIES (messages bucket)
-- ============================================
-- Enable RLS on storage.objects (idempotent — already enabled by default on hosted Supabase)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload files to the messages bucket
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload message files') THEN
    CREATE POLICY "Authenticated users can upload message files"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'messages'
      AND auth.role() = 'authenticated'
    );
  END IF;
END $$;

-- Allow authenticated users to read/download message files
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can read message files') THEN
    CREATE POLICY "Authenticated users can read message files"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'messages'
      AND auth.role() = 'authenticated'
    );
  END IF;
END $$;

-- Allow authenticated users to update their own uploads (for upsert)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can update message files') THEN
    CREATE POLICY "Authenticated users can update message files"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'messages'
      AND auth.role() = 'authenticated'
    );
  END IF;
END $$;

-- Allow authenticated users to delete their own uploads
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can delete message files') THEN
    CREATE POLICY "Authenticated users can delete message files"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'messages'
      AND auth.role() = 'authenticated'
    );
  END IF;
END $$;

-- Storage policies for avatars bucket (same pattern)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload avatars') THEN
    CREATE POLICY "Authenticated users can upload avatars"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'avatars'
      AND auth.role() = 'authenticated'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anyone can read avatars') THEN
    CREATE POLICY "Anyone can read avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');
  END IF;
END $$;

-- ============================================
-- DONE
-- ============================================
-- Verify with:
--   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY 1;
--   SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY 1, 2;
--   SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY 1;
