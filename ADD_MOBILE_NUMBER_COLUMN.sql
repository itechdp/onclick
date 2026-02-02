-- =============================================
-- ADD MOBILE NUMBER COLUMN TO USERS TABLE
-- =============================================

-- Add mobile_number column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS mobile_number TEXT;

-- Create index for faster searching
CREATE INDEX IF NOT EXISTS idx_users_mobile_number ON users(mobile_number);

-- Verify the column was added
SELECT 'Mobile number column added successfully!' as status;

-- Show current table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
