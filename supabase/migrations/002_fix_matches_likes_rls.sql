-- ============================================
-- FIX: matches/likes/swipes - defaults, RLS, trigger
-- Run this in Supabase SQL Editor on pakt-dev project
-- ============================================

-- 1. Ensure matches.id has a default UUID
ALTER TABLE matches ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. Ensure is_viewed column exists on matches
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'is_viewed'
  ) THEN
    ALTER TABLE matches ADD COLUMN is_viewed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 3. Add missing RLS policies for matches (INSERT + DELETE)
-- DROP existing if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can insert matches" ON matches;
DROP POLICY IF EXISTS "Users can delete own matches" ON matches;

CREATE POLICY "Users can insert matches" ON matches
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can delete own matches" ON matches
  FOR DELETE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Also allow UPDATE for is_viewed
DROP POLICY IF EXISTS "Users can update own matches" ON matches;
CREATE POLICY "Users can update own matches" ON matches
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 4. Add DELETE policy for likes (needed for undo)
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;
CREATE POLICY "Users can delete own likes" ON likes
  FOR DELETE USING (auth.uid() = liker_id);

-- 5. Add DELETE policy for swipes (needed for undo)
-- First check if RLS is enabled
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see own swipes" ON swipes;
DROP POLICY IF EXISTS "Users can create swipes" ON swipes;
DROP POLICY IF EXISTS "Users can delete own swipes" ON swipes;

CREATE POLICY "Users can see own swipes" ON swipes
  FOR SELECT USING (auth.uid() = swiper_id);

CREATE POLICY "Users can create swipes" ON swipes
  FOR INSERT WITH CHECK (auth.uid() = swiper_id);

-- Allow upsert (update existing swipe)
DROP POLICY IF EXISTS "Users can update own swipes" ON swipes;
CREATE POLICY "Users can update own swipes" ON swipes
  FOR UPDATE USING (auth.uid() = swiper_id);

CREATE POLICY "Users can delete own swipes" ON swipes
  FOR DELETE USING (auth.uid() = swiper_id);

-- 6. Update the trigger to NOT auto-create conversations
-- (Conversations are now created in frontend based on plan logic)
CREATE OR REPLACE FUNCTION check_and_create_match()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if reverse like exists (mutual like = match)
  IF EXISTS (
    SELECT 1 FROM likes
    WHERE liker_id = NEW.liked_id AND liked_id = NEW.liker_id
  ) THEN
    -- Create match (avoid duplicates)
    INSERT INTO matches (user1_id, user2_id)
    VALUES (LEAST(NEW.liker_id, NEW.liked_id), GREATEST(NEW.liker_id, NEW.liked_id))
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Fix conversations table - ensure it uses user1_id/user2_id
-- (The code queries user1_id/user2_id, not participant1_id/participant2_id)
-- Check if the columns already exist or need renaming
DO $$
BEGIN
  -- If participant1_id exists but user1_id doesn't, rename
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'participant1_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'user1_id'
  ) THEN
    ALTER TABLE conversations RENAME COLUMN participant1_id TO user1_id;
    ALTER TABLE conversations RENAME COLUMN participant2_id TO user2_id;
  END IF;
END $$;

-- 8. Ensure get_or_create_conversation function exists
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

-- 9. Fix conversations RLS to use user1_id/user2_id
DROP POLICY IF EXISTS "Participants can see conversations" ON conversations;
DROP POLICY IF EXISTS "Participants can update conversations" ON conversations;
DROP POLICY IF EXISTS "Participants can insert conversations" ON conversations;

CREATE POLICY "Participants can see conversations" ON conversations
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Participants can update conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Participants can insert conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 10. Fix messages policy so recipients can also read messages
DROP POLICY IF EXISTS "Users can see messages" ON messages;
CREATE POLICY "Users can see messages" ON messages
  FOR SELECT USING (
    EXISTS (
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
