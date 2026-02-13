-- Create AI Policy Upload Limit Tracking Table
CREATE TABLE IF NOT EXISTS ai_policy_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: 'YYYY-MM' (e.g., '2026-02')
  upload_count INT DEFAULT 0, -- Count of successful AI uploads this month
  monthly_limit INT DEFAULT 10, -- Limit for this month (default 10 for all)
  subscription_plan INT DEFAULT 199, -- Store the subscription plan value (199, 499, 799, 1499, 2499)
  reset_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, month_year)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_policy_user_month ON ai_policy_uploads(user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_ai_policy_user_date ON ai_policy_uploads(user_id, created_at);

-- Add column to users table to track current monthly AI uploads (optional, for quick access)
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_uploads_used_this_month INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_uploads_reset_date TIMESTAMP;

-- Drop existing functions first
DROP FUNCTION IF EXISTS initialize_user_monthly_ai_limit(UUID);
DROP FUNCTION IF EXISTS get_user_ai_quota(UUID);

-- Create function to get AI upload limit based on subscription_plan price value
CREATE OR REPLACE FUNCTION get_ai_upload_limit(plan_value INT)
RETURNS INT AS $$
BEGIN
  CASE plan_value
    WHEN 199 THEN RETURN 0;  -- No AI uploads
    WHEN 499 THEN RETURN 25;  -- 25 per month
    WHEN 799 THEN RETURN 100;  -- 100 per month
    WHEN 1499 THEN RETURN 300;  -- 300 per month
    WHEN 2499 THEN RETURN 800;  -- 800 per month
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get AI upload limit based on subscription_plan text value
CREATE OR REPLACE FUNCTION get_ai_upload_limit_text(plan_value TEXT)
RETURNS INT AS $$
BEGIN
  CASE plan_value
    WHEN 'monthly' THEN RETURN 10;  -- 10 per month for default monthly plan
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create function to initialize monthly limit for a user
CREATE OR REPLACE FUNCTION initialize_user_monthly_ai_limit(p_user_id UUID)
RETURNS TABLE(user_id UUID, month_year TEXT, monthly_limit INT, upload_count INT) AS $$
DECLARE
  v_subscription_plan TEXT;
  v_monthly_limit INT;
  v_month_year TEXT;
  v_plan_int INT;
BEGIN
  -- Get user's subscription plan
  SELECT subscription_plan::TEXT INTO v_subscription_plan
  FROM users
  WHERE id = p_user_id;

  -- Get monthly limit based on subscription plan (default 10 for all)
  v_monthly_limit := 10;
  
  IF v_subscription_plan = 'monthly' THEN
    v_monthly_limit := 10;
    v_plan_int := 0;
  ELSE
    v_plan_int := (v_subscription_plan::INT);
    v_monthly_limit := get_ai_upload_limit(v_plan_int);
    -- If plan returns 0, keep the default of 10
    IF v_monthly_limit = 0 THEN
      v_monthly_limit := 10;
    END IF;
  END IF;
  
  -- Get current month in YYYY-MM format
  v_month_year := TO_CHAR(CURRENT_DATE, 'YYYY-MM');

  -- Insert or update the monthly record
  INSERT INTO ai_policy_uploads (user_id, month_year, monthly_limit, upload_count, subscription_plan)
  VALUES (p_user_id, v_month_year, v_monthly_limit, 0, v_plan_int)
  ON CONFLICT (user_id, month_year) 
  DO UPDATE SET monthly_limit = v_monthly_limit
  RETURNING ai_policy_uploads.user_id, ai_policy_uploads.month_year, ai_policy_uploads.monthly_limit, ai_policy_uploads.upload_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment AI upload count (called when upload is successful)
CREATE OR REPLACE FUNCTION increment_ai_upload_count(p_user_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT, remaining_uploads INT) AS $$
DECLARE
  v_month_year TEXT;
  v_current_count INT;
  v_monthly_limit INT;
  v_remaining INT;
BEGIN
  v_month_year := TO_CHAR(CURRENT_DATE, 'YYYY-MM');

  -- Initialize if record doesn't exist for this month
  PERFORM initialize_user_monthly_ai_limit(p_user_id);

  -- Get current usage
  SELECT upload_count, monthly_limit INTO v_current_count, v_monthly_limit
  FROM ai_policy_uploads
  WHERE user_id = p_user_id AND month_year = v_month_year;

  -- Check if limit exceeded
  IF v_current_count >= v_monthly_limit THEN
    RETURN QUERY SELECT FALSE, 'Monthly AI upload limit reached', 0;
    RETURN;
  END IF;

  -- Increment counter
  UPDATE ai_policy_uploads
  SET upload_count = upload_count + 1
  WHERE user_id = p_user_id AND month_year = v_month_year;

  -- Get remaining uploads
  v_remaining := v_monthly_limit - (v_current_count + 1);

  RETURN QUERY SELECT TRUE, 'AI upload recorded successfully', v_remaining;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's current monthly status
CREATE OR REPLACE FUNCTION get_user_ai_quota(p_user_id UUID)
RETURNS TABLE(
  month_year TEXT,
  uploads_used INT,
  monthly_limit INT,
  remaining_uploads INT,
  subscription_plan INT,
  limit_type TEXT
) AS $$
DECLARE
  v_month_year TEXT;
  v_uploads_used INT;
  v_monthly_limit INT;
  v_subscription_plan INT;
  v_subscription_plan_text TEXT;
  v_limit_type TEXT;
BEGIN
  v_month_year := TO_CHAR(CURRENT_DATE, 'YYYY-MM');

  -- Initialize if record doesn't exist
  PERFORM initialize_user_monthly_ai_limit(p_user_id);

  -- Get the data
  SELECT 
    apu.month_year,
    apu.upload_count,
    apu.monthly_limit,
    apu.subscription_plan
  INTO 
    v_month_year,
    v_uploads_used,
    v_monthly_limit,
    v_subscription_plan
  FROM ai_policy_uploads apu
  WHERE apu.user_id = p_user_id AND apu.month_year = v_month_year;

  -- Get the text subscription plan
  SELECT subscription_plan::TEXT INTO v_subscription_plan_text
  FROM users
  WHERE id = p_user_id;

  -- Determine limit type
  IF v_subscription_plan_text = 'monthly' THEN
    v_limit_type := '10/Month';
  ELSE
    CASE v_subscription_plan
      WHEN 199 THEN v_limit_type := 'No AI';
      WHEN 499 THEN v_limit_type := '25/Month';
      WHEN 799 THEN v_limit_type := '100/Month';
      WHEN 1499 THEN v_limit_type := '300/Month';
      WHEN 2499 THEN v_limit_type := '800/Month';
      ELSE v_limit_type := 'Unknown';
    END CASE;
  END IF;

  RETURN QUERY SELECT 
    v_month_year,
    v_uploads_used,
    v_monthly_limit,
    (v_monthly_limit - v_uploads_used),
    v_subscription_plan,
    v_limit_type;
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job to reset limits on the 1st of each month (via n8n or scheduled task)
-- This would be run via a backend cron job to reset all monthly counters on the 1st of each month
CREATE OR REPLACE FUNCTION reset_monthly_ai_limits()
RETURNS TABLE(users_reset INT) AS $$
BEGIN
  -- Mark old records for the previous month as complete
  -- New records will be auto-created when users try to upload next month
  RETURN QUERY 
  SELECT COUNT(*)::INT
  FROM ai_policy_uploads
  WHERE month_year < TO_CHAR(CURRENT_DATE, 'YYYY-MM');
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically initialize AI limit when user is created
CREATE OR REPLACE FUNCTION trigger_initialize_ai_limit_on_user_create()
RETURNS TRIGGER AS $$
BEGIN
  -- Default all new users to 10 uploads per month in users table
  UPDATE users SET ai_uploads_monthly_limit = 10 WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update AI limit when subscription_plan is changed
CREATE OR REPLACE FUNCTION trigger_update_ai_limit_on_subscription_change()
RETURNS TRIGGER AS $$
DECLARE
  v_monthly_limit INT;
  v_plan_int INT;
  v_month_year TEXT;
BEGIN
  -- Only process if subscription_plan changed
  IF NEW.subscription_plan::TEXT != OLD.subscription_plan::TEXT THEN
    v_month_year := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
    
    -- Determine the new monthly limit based on plan
    IF NEW.subscription_plan::TEXT = 'monthly' THEN
      v_monthly_limit := 10;
      v_plan_int := 0;
    ELSE
      v_plan_int := (NEW.subscription_plan::INT);
      v_monthly_limit := get_ai_upload_limit(v_plan_int);
      -- If plan returns 0 (like 199), keep default of 10
      IF v_monthly_limit = 0 THEN
        v_monthly_limit := 10;
      END IF;
    END IF;
    
    -- Update the users table ai_uploads_monthly_limit
    UPDATE users SET ai_uploads_monthly_limit = v_monthly_limit WHERE id = NEW.id;
    
    -- Update or insert the record for current month in ai_policy_uploads
    INSERT INTO ai_policy_uploads (user_id, month_year, monthly_limit, upload_count, subscription_plan)
    VALUES (NEW.id, v_month_year, v_monthly_limit, 0, v_plan_int)
    ON CONFLICT (user_id, month_year) 
    DO UPDATE SET monthly_limit = v_monthly_limit, subscription_plan = v_plan_int;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS initialize_ai_limit_on_user_create ON users;
DROP TRIGGER IF EXISTS update_ai_limit_on_subscription_change ON users;

-- Create trigger for INSERT
CREATE TRIGGER initialize_ai_limit_on_user_create
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_initialize_ai_limit_on_user_create();

-- Create trigger for UPDATE
CREATE TRIGGER update_ai_limit_on_subscription_change
AFTER UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_update_ai_limit_on_subscription_change();

-- Fix: Update all existing records with ai_uploads_monthly_limit = 0 to 10
UPDATE users
SET ai_uploads_monthly_limit = 10
WHERE ai_uploads_monthly_limit = 0;

-- Fix: Update ai_policy_uploads table monthly_limit to match
UPDATE ai_policy_uploads
SET monthly_limit = 10
WHERE monthly_limit = 0;

-- Make sure to call reset_monthly_ai_limits() on the 1st of each month via a backend cron job
-- Example in Node.js with node-cron
