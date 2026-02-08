-- ============================================
-- CREATE SUB AGENTS TABLE & POLICY COLUMNS
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create sub_agents table
CREATE TABLE IF NOT EXISTS sub_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sub_agent_name TEXT NOT NULL,
  contact_no TEXT,
  email_id TEXT,
  login_email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  total_policies INTEGER DEFAULT 0,
  total_premium_amount NUMERIC(12,2) DEFAULT 0,
  total_commission NUMERIC(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create unique index on login_email (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_sub_agents_login_email 
  ON sub_agents (LOWER(login_email));

-- 3. Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_sub_agents_user_id 
  ON sub_agents (user_id);

-- 4. Add sub agent columns to policies table
ALTER TABLE policies 
  ADD COLUMN IF NOT EXISTS sub_agent_id UUID REFERENCES sub_agents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sub_agent_commission_percentage TEXT,
  ADD COLUMN IF NOT EXISTS sub_agent_commission_amount TEXT;

-- 5. Create index on policies.sub_agent_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_policies_sub_agent_id 
  ON policies (sub_agent_id);

-- 6. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_sub_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sub_agents_updated_at ON sub_agents;
CREATE TRIGGER trigger_sub_agents_updated_at
  BEFORE UPDATE ON sub_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_sub_agents_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- 7. Enable RLS on sub_agents
ALTER TABLE sub_agents ENABLE ROW LEVEL SECURITY;

-- 8. Policy: Users can SELECT their own sub agents
CREATE POLICY "Users can view own sub agents"
  ON sub_agents FOR SELECT
  USING (auth.uid() = user_id);

-- 9. Policy: Users can INSERT their own sub agents
CREATE POLICY "Users can create own sub agents"
  ON sub_agents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 10. Policy: Users can UPDATE their own sub agents
CREATE POLICY "Users can update own sub agents"
  ON sub_agents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 11. Policy: Users can DELETE their own sub agents
CREATE POLICY "Users can delete own sub agents"
  ON sub_agents FOR DELETE
  USING (auth.uid() = user_id);

-- 12. Policy: Allow anon/public to SELECT for sub agent login authentication
-- This allows the login flow to find a sub agent by login_email
CREATE POLICY "Allow sub agent login lookup"
  ON sub_agents FOR SELECT
  USING (true);

-- ============================================
-- VERIFY SETUP
-- ============================================

-- Check table exists
SELECT 'sub_agents table' AS check_item, 
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sub_agents') AS exists;

-- Check policy columns on policies table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'policies' 
  AND column_name IN ('sub_agent_id', 'sub_agent_commission_percentage', 'sub_agent_commission_amount');

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'sub_agents';
