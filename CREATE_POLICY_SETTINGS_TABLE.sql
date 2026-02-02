-- Create policy_settings table for managing dropdown options
CREATE TABLE IF NOT EXISTS policy_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('insurance_company', 'product_type', 'lob')),
    value TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, category, value)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_policy_settings_user_id ON policy_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_policy_settings_category ON policy_settings(category);
CREATE INDEX IF NOT EXISTS idx_policy_settings_active ON policy_settings(is_active);

-- Enable RLS
ALTER TABLE policy_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own settings" ON policy_settings;
DROP POLICY IF EXISTS "Users can create settings" ON policy_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON policy_settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON policy_settings;

-- Policy: Users can view their own settings
CREATE POLICY "Users can view own settings"
    ON policy_settings
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own settings
CREATE POLICY "Users can create settings"
    ON policy_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own settings
CREATE POLICY "Users can update own settings"
    ON policy_settings
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own settings
CREATE POLICY "Users can delete own settings"
    ON policy_settings
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_policy_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_policy_settings_updated_at ON policy_settings;

CREATE TRIGGER update_policy_settings_updated_at
    BEFORE UPDATE ON policy_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_policy_settings_updated_at();
