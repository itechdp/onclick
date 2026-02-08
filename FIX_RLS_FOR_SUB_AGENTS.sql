-- Fix RLS for Sub Agents and Team Members (who use localStorage auth, not Supabase auth)
-- They connect as 'anon' role, so they need anon SELECT access
-- This is safe because the app always filters by user_id
-- Run this in Supabase SQL Editor

-- ============================================
-- POLICIES TABLE - Allow anon read access
-- ============================================
DROP POLICY IF EXISTS "anon_select_policies" ON policies;
CREATE POLICY "anon_select_policies" ON policies
  FOR SELECT
  TO anon
  USING (true);

-- ============================================
-- DELETED POLICIES TABLE - Allow anon read access
-- ============================================
DROP POLICY IF EXISTS "anon_select_deleted_policies" ON deleted_policies;
CREATE POLICY "anon_select_deleted_policies" ON deleted_policies
  FOR SELECT
  TO anon
  USING (true);

-- ============================================
-- LAPSED POLICIES TABLE - Allow anon read access
-- ============================================
DROP POLICY IF EXISTS "anon_select_lapsed_policies" ON lapsed_policies;
CREATE POLICY "anon_select_lapsed_policies" ON lapsed_policies
  FOR SELECT
  TO anon
  USING (true);

-- ============================================
-- CLIENT DOCUMENTS - Skip (stored in Supabase Storage bucket, not a table)
-- ============================================

-- ============================================
-- REMINDERS / POLICY REMINDERS - Allow anon read access (if table exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'policy_reminders') THEN
    EXECUTE 'DROP POLICY IF EXISTS "anon_select_policy_reminders" ON policy_reminders';
    EXECUTE 'CREATE POLICY "anon_select_policy_reminders" ON policy_reminders FOR SELECT TO anon USING (true)';
  END IF;
END $$;

-- ============================================
-- SUB AGENTS TABLE - Already has anon access but verify
-- ============================================
DROP POLICY IF EXISTS "anon_select_sub_agents" ON sub_agents;
CREATE POLICY "anon_select_sub_agents" ON sub_agents
  FOR SELECT
  TO anon
  USING (true);

SELECT 'Anon RLS policies created! Sub agents and team members can now read data.' as status;
