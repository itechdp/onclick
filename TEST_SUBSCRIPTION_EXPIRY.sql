-- Script to properly test subscription expiry and payment flow
-- This will make Malak's trial expire to test the payment workflow

-- First, check current status
SELECT 
  email,
  display_name,
  subscription_status,
  trial_start_date,
  trial_end_date,
  CASE
    WHEN trial_end_date < NOW() THEN 'EXPIRED'
    WHEN trial_end_date > NOW() THEN 'ACTIVE'
    ELSE 'NO TRIAL DATE'
  END as actual_status,
  CASE
    WHEN trial_end_date IS NOT NULL THEN EXTRACT(DAY FROM (trial_end_date - NOW()))
    ELSE NULL
  END as days_remaining
FROM users
WHERE email = 'malak.bhadgaonkar@gmail.com';

-- Set the trial end date to yesterday (Jan 4, 2026) to make it expired
UPDATE users
SET 
  trial_start_date = '2026-01-01 00:00:00+00',
  trial_end_date = '2026-01-04 23:59:59+00',
  subscription_status = 'expired',
  subscription_start_date = NULL,
  subscription_end_date = NULL
WHERE email = 'malak.bhadgaonkar@gmail.com';

-- Verify the change
SELECT 
  email,
  display_name,
  subscription_status,
  trial_start_date,
  trial_end_date,
  EXTRACT(DAY FROM (NOW() - trial_end_date)) as days_past_expiry
FROM users
WHERE email = 'malak.bhadgaonkar@gmail.com';

-- ==========================================
-- To extend the trial after testing (UNCOMMENT TO USE)
-- ==========================================
-- UPDATE users
-- SET 
--   trial_end_date = NOW() + INTERVAL '30 days',
--   subscription_status = 'trial'
-- WHERE email = 'malak.bhadgaonkar@gmail.com';
--
-- SELECT email, subscription_status, trial_end_date FROM users 
-- WHERE email = 'malak.bhadgaonkar@gmail.com';
