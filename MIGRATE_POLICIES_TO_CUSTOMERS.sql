-- Migration Script: Create customers from existing policies
-- This script will analyze your existing policies and create customer records automatically
-- Run this AFTER creating the customers table

-- Insert customers from existing policies (avoiding duplicates)
INSERT INTO customers (
  user_id,
  customer_name,
  contact_no,
  email_id,
  address,
  reference_by,
  customer_type,
  is_active,
  notes
)
SELECT DISTINCT ON (user_id, COALESCE(contact_no, ''))
  user_id,
  policyholder_name as customer_name,
  contact_no,
  email_id,
  address,
  reference_from_name as reference_by,
  'Individual' as customer_type,
  true as is_active,
  'Auto-created from policy: ' || policy_number as notes
FROM policies
WHERE policyholder_name IS NOT NULL
  AND policyholder_name != ''
  -- Only insert if customer doesn't already exist
  AND NOT EXISTS (
    SELECT 1 FROM customers c 
    WHERE c.user_id = policies.user_id 
    AND (
      c.contact_no = policies.contact_no 
      OR (c.contact_no IS NULL AND policies.contact_no IS NULL)
    )
  )
ORDER BY user_id, COALESCE(contact_no, ''), created_at DESC;

-- Show results
DO $$
DECLARE
  customer_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO customer_count FROM customers;
  RAISE NOTICE '✅ Migration completed!';
  RAISE NOTICE 'Total customers created: %', customer_count;
  RAISE NOTICE 'Note: Customers are deduplicated by contact number per user.';
  RAISE NOTICE 'You can now view your customers in the Customers page.';
END $$;
