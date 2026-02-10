-- Simple AI Upload Counter - Track uploads per user per month
-- This increments ONLY when n8n webhook returns successful data with >= 1 field

-- Add simple tracking columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_uploads_this_month INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_uploads_monthly_limit INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_uploads_reset_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS get_user_ai_limit(UUID);
DROP FUNCTION IF EXISTS increment_user_ai_uploads(UUID);
DROP FUNCTION IF EXISTS get_user_ai_quota(UUID);
DROP FUNCTION IF EXISTS init_ai_uploads_on_user_create();
DROP FUNCTION IF EXISTS reset_monthly_ai_counters();

-- Simple function to get AI limit based on subscription plan
CREATE OR REPLACE FUNCTION get_user_ai_limit(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  v_plan INT;
BEGIN
  SELECT CAST(subscription_plan AS INT) INTO v_plan FROM users WHERE id = p_user_id;
  
  CASE v_plan
    WHEN 199 THEN RETURN 0;    -- Essential: No AI
    WHEN 499 THEN RETURN 25;   -- Starter
    WHEN 799 THEN RETURN 100;  -- Basic
    WHEN 1499 THEN RETURN 300; -- Standard
    WHEN 2499 THEN RETURN 800; -- Premium
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql;

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
BEGIN
  RETURN QUERY
  SELECT 
    u.ai_uploads_this_month,
    get_user_ai_limit(p_user_id),
    GREATEST(0, get_user_ai_limit(p_user_id) - u.ai_uploads_this_month),
    CAST(u.subscription_plan AS INT),
    u.ai_uploads_reset_date
  FROM users u
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-initialize limits and reset monthly
CREATE OR REPLACE FUNCTION init_ai_uploads_on_user_create()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ai_uploads_this_month := 0;
  NEW.ai_uploads_monthly_limit := get_user_ai_limit(NEW.id);
  NEW.ai_uploads_reset_date := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_init_ai_uploads ON users;
CREATE TRIGGER trigger_init_ai_uploads
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION init_ai_uploads_on_user_create();

-- Function to reset monthly counters (run on 1st of month via cron)
CREATE OR REPLACE FUNCTION reset_monthly_ai_counters()
RETURNS TABLE(users_reset INT) AS $$
BEGIN
  UPDATE users 
  SET ai_uploads_this_month = 0,
      ai_uploads_reset_date = CURRENT_TIMESTAMP
  WHERE EXTRACT(DAY FROM ai_uploads_reset_date) != 1
    AND ai_uploads_reset_date < CURRENT_DATE;
  
  RETURN QUERY SELECT COUNT(*)::INT FROM users WHERE ai_uploads_this_month = 0;
END;
$$ LANGUAGE plpgsql;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_ai_uploads ON users(id, ai_uploads_this_month);
