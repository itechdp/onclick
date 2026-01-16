-- COMPLETE FIX FOR SUBSCRIPTION TESTING
-- Run this entire script in Supabase SQL Editor

-- ==================================================
-- STEP 1: Check all users current status
-- ==================================================
SELECT 
  email,
  display_name,
  role,
  subscription_status,
  trial_start_date,
  trial_end_date,
  subscription_start_date,
  subscription_end_date,
  CASE
    WHEN role = 'admin' THEN '∞ (Admin)'
    WHEN trial_end_date IS NOT NULL AND trial_end_date > NOW() THEN 
      CONCAT(EXTRACT(DAY FROM (trial_end_date - NOW())), ' days (Trial)')
    WHEN subscription_end_date IS NOT NULL AND subscription_end_date > NOW() THEN 
      CONCAT(EXTRACT(DAY FROM (subscription_end_date - NOW())), ' days (Paid)')
    WHEN trial_end_date IS NOT NULL AND trial_end_date < NOW() THEN 
      'EXPIRED (' || EXTRACT(DAY FROM (NOW() - trial_end_date)) || ' days ago)'
    ELSE 'No dates set'
  END as status_summary
FROM users
ORDER BY role DESC, email;

-- ==================================================
-- STEP 2: Fix Malak's account - SET AS EXPIRED for testing
-- ==================================================
UPDATE users
SET 
  trial_start_date = '2025-12-21 00:00:00+00'::timestamptz,
  trial_end_date = '2026-01-04 23:59:59+00'::timestamptz,
  subscription_status = 'expired',
  subscription_start_date = NULL,
  subscription_end_date = NULL
WHERE email = 'malak.bhadgaonkar@gmail.com';

-- ==================================================
-- STEP 3: Ensure admin account is properly set
-- ==================================================
UPDATE users
SET 
  subscription_status = 'active',
  trial_start_date = NULL,
  trial_end_date = NULL,
  subscription_start_date = NULL,
  subscription_end_date = NULL
WHERE email = 'tanishak1305@gmail.com' AND role = 'admin';

-- ==================================================
-- STEP 4: Verify the changes
-- ==================================================
SELECT 
  email,
  role,
  subscription_status,
  trial_end_date,
  subscription_end_date,
  CASE
    WHEN role = 'admin' THEN '✅ Admin - No restrictions'
    WHEN subscription_status = 'expired' THEN '❌ EXPIRED - Should be blocked'
    WHEN subscription_status = 'trial' AND trial_end_date > NOW() THEN '✅ Trial Active'
    WHEN subscription_status = 'active' AND subscription_end_date > NOW() THEN '✅ Subscription Active'
    ELSE '⚠️ Unknown status'
  END as access_status
FROM users
ORDER BY role DESC, email;

-- ==================================================
-- EXPECTED RESULTS:
-- ==================================================
-- Admin (tanishak1305@gmail.com): ✅ Admin - No restrictions
-- Malak (malak.bhadgaonkar@gmail.com): ❌ EXPIRED - Should be blocked
-- ==================================================
