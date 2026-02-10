-- Create AI Policy Upload Limit Tracking Table
CREATE TABLE IF NOT EXISTS ai_policy_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: 'YYYY-MM' (e.g., '2026-02')
  upload_count INT DEFAULT 0, -- Count of successful AI uploads this month
  monthly_limit INT DEFAULT 0, -- Limit for this month (based on subscription_plan)
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

-- Create function to initialize monthly limit for a user
CREATE OR REPLACE FUNCTION initialize_user_monthly_ai_limit(p_user_id UUID)
RETURNS TABLE(user_id UUID, month_year TEXT, monthly_limit INT, upload_count INT) AS $$
DECLARE
  v_subscription_plan INT;
  v_monthly_limit INT;
  v_month_year TEXT;
BEGIN
  -- Get user's subscription plan
  SELECT CAST(subscription_plan AS INT) INTO v_subscription_plan
  FROM users
  WHERE id = p_user_id;

  -- Get monthly limit based on subscription plan
  v_monthly_limit := get_ai_upload_limit(v_subscription_plan);
  
  -- Get current month in YYYY-MM format
  v_month_year := TO_CHAR(CURRENT_DATE, 'YYYY-MM');

  -- Insert or update the monthly record
  INSERT INTO ai_policy_uploads (user_id, month_year, monthly_limit, upload_count, subscription_plan)
  VALUES (p_user_id, v_month_year, v_monthly_limit, 0, v_subscription_plan)
  ON CONFLICT (user_id, month_year) 
  DO UPDATE SET monthly_limit = v_monthly_limit
  RETURNING user_id, month_year, monthly_limit, upload_count;
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

  -- Determine limit type
  CASE v_subscription_plan
    WHEN 199 THEN v_limit_type := 'No AI';
    WHEN 499 THEN v_limit_type := '25/Month';
    WHEN 799 THEN v_limit_type := '100/Month';
    WHEN 1499 THEN v_limit_type := '300/Month';
    WHEN 2499 THEN v_limit_type := '800/Month';
    ELSE v_limit_type := 'Unknown';
  END CASE;

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

-- Make sure to call reset_monthly_ai_limits() on the 1st of each month via a backend cron job
-- Example in Node.js with node-cron
