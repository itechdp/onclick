-- Simple AI Upload Counter - Track uploads per user per month
-- This increments ONLY when n8n webhook returns successful data with >= 1 field

-- Remove unused column if exists
ALTER TABLE users DROP COLUMN IF EXISTS ai_uploads_used_this_month;

-- Add simple tracking columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_uploads_this_month INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_uploads_monthly_limit INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_uploads_reset_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Drop existing triggers and functions first to avoid conflicts
DROP TRIGGER IF EXISTS trigger_init_ai_uploads ON users;
DROP TRIGGER IF EXISTS trigger_update_ai_limit ON users;
DROP FUNCTION IF EXISTS get_user_ai_limit(UUID) CASCADE;
DROP FUNCTION IF EXISTS increment_user_ai_uploads(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_user_ai_quota(UUID) CASCADE;
DROP FUNCTION IF EXISTS init_ai_uploads_on_user_create() CASCADE;
DROP FUNCTION IF EXISTS reset_monthly_ai_counters() CASCADE;
DROP FUNCTION IF EXISTS update_user_ai_limit() CASCADE;

-- Simple function to get AI limit based on subscription plan
CREATE OR REPLACE FUNCTION get_user_ai_limit(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  v_plan TEXT;
  v_plan_int INT;
BEGIN
  SELECT subscription_plan INTO v_plan FROM users WHERE id = p_user_id;
  
  -- Try to convert to INT, default to 0 if it fails
  BEGIN
    v_plan_int := CAST(v_plan AS INT);
  EXCEPTION WHEN OTHERS THEN
    v_plan_int := 0;
  END;
  
  CASE v_plan_int
    WHEN 199 THEN RETURN 0;    -- Essential: No AI
    WHEN 499 THEN RETURN 25;   -- Starter
    WHEN 799 THEN RETURN 100;  -- Basic
    WHEN 1499 THEN RETURN 300; -- Standard
    WHEN 2499 THEN RETURN 800; -- Premium
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Update all existing users' monthly limits based on their subscription
UPDATE users 
SET ai_uploads_monthly_limit = CASE 
  WHEN subscription_plan ~ '^\d+$' THEN
    CASE CAST(subscription_plan AS INT)
      WHEN 199 THEN 0
      WHEN 499 THEN 25
      WHEN 799 THEN 100
      WHEN 1499 THEN 300
      WHEN 2499 THEN 800
      ELSE 0
    END
  ELSE 0
END
WHERE subscription_plan IS NOT NULL;

-- Function to increment upload counter - ONLY call when webhook returns success with data
CREATE OR REPLACE FUNCTION increment_user_ai_uploads(p_user_id UUID)
RETURNS TABLE(success BOOLEAN, uploads_used INT, monthly_limit INT, remaining INT) AS $$
DECLARE
  v_limit INT;
  v_current INT;
  v_remaining INT;
BEGIN
  -- Get user's AI limit
  v_limit := get_user_ai_limit(p_user_id);
  
  -- Get current count
  SELECT ai_uploads_this_month INTO v_current FROM users WHERE id = p_user_id;
  
  -- Check if limit reached
  IF v_limit = 0 THEN
    RETURN QUERY SELECT FALSE::BOOLEAN, v_current, v_limit, 0;
    RETURN;
  END IF;
  
  IF v_current >= v_limit THEN
    RETURN QUERY SELECT FALSE::BOOLEAN, v_current, v_limit, 0;
    RETURN;
  END IF;
  
  -- Increment counter
  UPDATE users 
  SET ai_uploads_this_month = ai_uploads_this_month + 1
  WHERE id = p_user_id;
  
  -- Get updated values
  SELECT ai_uploads_this_month INTO v_current FROM users WHERE id = p_user_id;
  v_remaining := v_limit - v_current;
  
  RETURN QUERY SELECT TRUE::BOOLEAN, v_current, v_limit, v_remaining;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's current upload quota
CREATE OR REPLACE FUNCTION get_user_ai_quota(p_user_id UUID)
RETURNS TABLE(
  uploads_used INT,
  monthly_limit INT,
  remaining_uploads INT,
  subscription_plan INT,
  reset_date TIMESTAMP
) AS $$
DECLARE
  v_plan_int INT;
  v_plan_text TEXT;
BEGIN
  -- Get subscription plan as text first
  SELECT u.subscription_plan INTO v_plan_text FROM users u WHERE u.id = p_user_id;
  
  -- Try to convert to INT, default to 0 if it fails
  BEGIN
    v_plan_int := CAST(v_plan_text AS INT);
  EXCEPTION WHEN OTHERS THEN
    v_plan_int := 0;
  END;
  
  RETURN QUERY
  SELECT 
    u.ai_uploads_this_month,
    get_user_ai_limit(p_user_id),
    GREATEST(0, get_user_ai_limit(p_user_id) - u.ai_uploads_this_month),
    v_plan_int,
    u.ai_uploads_reset_date
  FROM users u
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-initialize limits on new user creation
CREATE OR REPLACE FUNCTION init_ai_uploads_on_user_create()
RETURNS TRIGGER AS $$
DECLARE
  v_limit INT;
  v_plan_int INT;
BEGIN
  -- Try to convert subscription_plan to INT, default to 0 if it fails
  BEGIN
    v_plan_int := CAST(NEW.subscription_plan AS INT);
  EXCEPTION WHEN OTHERS THEN
    v_plan_int := 0;
  END;
  
  -- Calculate limit based on plan
  v_limit := CASE v_plan_int
    WHEN 199 THEN 0
    WHEN 499 THEN 25
    WHEN 799 THEN 100
    WHEN 1499 THEN 300
    WHEN 2499 THEN 800
    ELSE 0
  END;
  
  NEW.ai_uploads_this_month := 0;
  NEW.ai_uploads_monthly_limit := v_limit;
  NEW.ai_uploads_reset_date := CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_init_ai_uploads ON users;
CREATE TRIGGER trigger_init_ai_uploads
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION init_ai_uploads_on_user_create();

-- Trigger to auto-update limits when subscription plan changes
CREATE OR REPLACE FUNCTION update_user_ai_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_limit INT;
  v_plan_int INT;
BEGIN
  -- Only update if subscription_plan changed
  IF OLD.subscription_plan IS DISTINCT FROM NEW.subscription_plan THEN
    -- Try to convert subscription_plan to INT, default to 0 if it fails
    BEGIN
      v_plan_int := CAST(NEW.subscription_plan AS INT);
    EXCEPTION WHEN OTHERS THEN
      v_plan_int := 0;
    END;
    
    v_limit := CASE v_plan_int
      WHEN 199 THEN 0
      WHEN 499 THEN 25
      WHEN 799 THEN 100
      WHEN 1499 THEN 300
      WHEN 2499 THEN 800
      ELSE 0
    END;
    
    NEW.ai_uploads_monthly_limit := v_limit;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ai_limit ON users;
CREATE TRIGGER trigger_update_ai_limit
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_user_ai_limit();

-- Function to reset monthly counters on 1st of each month (Asia/Kolkata timezone)
CREATE OR REPLACE FUNCTION reset_monthly_ai_counters()
RETURNS TABLE(users_reset INT) AS $$
DECLARE
  v_kolkata_now TIMESTAMP;
  v_reset_count INT;
BEGIN
  -- Get current time in Asia/Kolkata timezone
  v_kolkata_now := CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata';
  
  -- Reset counters for users whose reset_date is in a previous month
  UPDATE users 
  SET ai_uploads_this_month = 0,
      ai_uploads_reset_date = v_kolkata_now
  WHERE (ai_uploads_reset_date AT TIME ZONE 'Asia/Kolkata')::date < date_trunc('month', v_kolkata_now)::date;
  
  GET DIAGNOSTICS v_reset_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_reset_count;
END;
$$ LANGUAGE plpgsql;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_ai_uploads ON users(id, ai_uploads_this_month);

-- ============================================
-- AUTOMATIC MONTHLY RESET SETUP (OPTIONAL)
-- ============================================
-- To automatically reset counters on 1st of each month, set up a cron job:
-- 
-- Option 1: Supabase Edge Function (Recommended)
-- Create a Supabase Edge Function that runs daily and calls reset_monthly_ai_counters()
--
-- Option 2: pg_cron Extension (if available)
-- SELECT cron.schedule('reset-ai-uploads', '0 0 1 * *', 'SELECT reset_monthly_ai_counters()');
--
-- Option 3: External Cron Job
-- Run this SQL daily at midnight IST:
-- SELECT reset_monthly_ai_counters();
--
-- The function automatically detects if it's a new month and resets accordingly.
