-- Add repeat_reminder column for Life Insurance policies
-- This column stores the reminder frequency: Monthly, Quarterly, Half-yearly, or Yearly

ALTER TABLE policies 
ADD COLUMN IF NOT EXISTS repeat_reminder TEXT;

-- Also add to lapsed_policies table for consistency
ALTER TABLE lapsed_policies 
ADD COLUMN IF NOT EXISTS repeat_reminder TEXT;

-- Also add to deleted_policies table for consistency
ALTER TABLE deleted_policies 
ADD COLUMN IF NOT EXISTS repeat_reminder TEXT;
