-- Create customers table to manage customer information
-- This table stores comprehensive customer details including personal info, business details, and important dates
-- Customers can be created manually or automatically from policies

CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Information
  customer_name TEXT NOT NULL,
  contact_no TEXT,
  email_id TEXT,
  address TEXT,
  
  -- Personal Details
  date_of_birth DATE,
  anniversary_date DATE,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other', NULL)),
  
  -- Professional Details
  profession TEXT, -- e.g., 'Salaried', 'Business Owner', 'Self-Employed', 'Professional', etc.
  occupation TEXT, -- Specific occupation/job title
  company_name TEXT, -- For salaried employees
  
  -- Business Details (for business owners)
  is_business_owner BOOLEAN DEFAULT false,
  business_name TEXT,
  business_type TEXT, -- e.g., 'Retail', 'Manufacturing', 'Services', etc.
  business_address TEXT,
  gst_number TEXT,
  pan_number TEXT,
  business_established_date DATE,
  
  -- Additional Information
  reference_by TEXT, -- Who referred this customer
  customer_type TEXT DEFAULT 'Individual' CHECK (customer_type IN ('Individual', 'Corporate', 'Family')),
  notes TEXT,
  tags TEXT[], -- Array of tags for categorization
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create unique index that allows NULL contact numbers
CREATE UNIQUE INDEX IF NOT EXISTS unique_customer_contact_per_user 
  ON customers(user_id, contact_no) 
  WHERE contact_no IS NOT NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_contact_no ON customers(contact_no);
CREATE INDEX IF NOT EXISTS idx_customers_email_id ON customers(email_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(customer_name);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_dob ON customers(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_customers_anniversary ON customers(anniversary_date);
CREATE INDEX IF NOT EXISTS idx_customers_profession ON customers(profession);
CREATE INDEX IF NOT EXISTS idx_customers_is_business_owner ON customers(is_business_owner);

-- Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own customers" ON customers;
DROP POLICY IF EXISTS "Users can insert their own customers" ON customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON customers;

-- Create RLS policies
CREATE POLICY "Users can view their own customers"
  ON customers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own customers"
  ON customers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customers"
  ON customers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customers"
  ON customers FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS customers_updated_at_trigger ON customers;
CREATE TRIGGER customers_updated_at_trigger
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();

-- Add helpful comments
COMMENT ON TABLE customers IS 'Stores comprehensive customer information including personal, professional, and business details';
COMMENT ON COLUMN customers.customer_name IS 'Full name of the customer';
COMMENT ON COLUMN customers.contact_no IS 'Primary contact number';
COMMENT ON COLUMN customers.profession IS 'Professional category (Salaried, Business Owner, etc.)';
COMMENT ON COLUMN customers.is_business_owner IS 'Whether the customer owns a business';
COMMENT ON COLUMN customers.business_name IS 'Name of the business if customer is business owner';
COMMENT ON COLUMN customers.customer_type IS 'Type of customer (Individual, Corporate, Family)';
COMMENT ON COLUMN customers.reference_by IS 'Who referred this customer';
COMMENT ON COLUMN customers.tags IS 'Array of tags for flexible categorization';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Customers table created successfully!';
  RAISE NOTICE 'You can now manage customer information with personal, professional, and business details.';
  RAISE NOTICE 'Customers will be automatically created when adding policies and can also be added manually.';
END $$;
