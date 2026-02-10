-- Quick test queries for AI Upload Counter

-- 1. Check all users' AI upload tracking columns
SELECT 
  id,
  email,
  subscription_plan,
  ai_uploads_this_month,
  ai_uploads_monthly_limit,
  ai_uploads_reset_date AT TIME ZONE 'Asia/Kolkata' as reset_date_ist
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- 2. Verify monthly limits are correct based on subscription
SELECT 
  subscription_plan,
  COUNT(*) as user_count,
  ai_uploads_monthly_limit
FROM users
GROUP BY subscription_plan, ai_uploads_monthly_limit
ORDER BY CAST(subscription_plan AS INT);

-- 3. Test getting quota for a specific user (replace with your user_id)
-- SELECT * FROM get_user_ai_quota('your-user-id-here');

-- 4. Manually test reset function
-- SELECT reset_monthly_ai_counters();

-- 5. Check if any users need reset (reset_date in previous month)
SELECT 
  COUNT(*) as users_needing_reset,
  CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata' as current_kolkata_time
FROM users
WHERE (ai_uploads_reset_date AT TIME ZONE 'Asia/Kolkata')::date < date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date;
