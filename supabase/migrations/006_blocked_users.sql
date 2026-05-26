-- Create blocked_users table for blocking functionality
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure a user can only block another user once
  UNIQUE(blocker_id, blocked_id),

  -- Prevent a user from blocking themselves
  CONSTRAINT no_self_block CHECK (blocker_id != blocked_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id ON blocked_users(blocked_id);

-- Enable RLS
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view blocks where they are the blocker
CREATE POLICY "Users can view their blocks"
  ON blocked_users
  FOR SELECT
  USING (auth.uid() = blocker_id);

-- RLS Policy: Users can insert blocks
CREATE POLICY "Users can block others"
  ON blocked_users
  FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- RLS Policy: Users can delete blocks they created
CREATE POLICY "Users can unblock"
  ON blocked_users
  FOR DELETE
  USING (auth.uid() = blocker_id);

-- RLS Policy: Allow reading blocks where current user is blocked (for checking if we've been blocked)
CREATE POLICY "Users can check if they've been blocked"
  ON blocked_users
  FOR SELECT
  USING (auth.uid() = blocked_id);
