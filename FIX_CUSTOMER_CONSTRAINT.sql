-- Fix unique constraint to allow multiple customers without contact numbers
-- Run this if you already created the customers table

-- Drop the old constraint
ALTER TABLE customers DROP CONSTRAINT IF EXISTS unique_customer_per_user;

-- Create a partial unique index that allows NULL contact numbers
CREATE UNIQUE INDEX IF NOT EXISTS unique_customer_contact_per_user 
  ON customers(user_id, contact_no) 
  WHERE contact_no IS NOT NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Unique constraint fixed!';
  RAISE NOTICE 'Customers can now have NULL or empty contact numbers without conflicts.';
  RAISE NOTICE 'Only customers with actual contact numbers will be checked for duplicates.';
END $$;
