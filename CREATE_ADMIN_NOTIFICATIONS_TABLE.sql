-- Create admin_notifications table for broadcast messages
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_admin_notifications_user_id ON admin_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_active ON admin_notifications(is_active);

-- Enable RLS
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read notifications (team members, sub agents use anon key)
DROP POLICY IF EXISTS "Users can read admin notifications" ON admin_notifications;
CREATE POLICY "Users can read admin notifications"
ON admin_notifications FOR SELECT
USING (true);

-- Policy: Only the admin (owner) can insert their notifications
DROP POLICY IF EXISTS "Admins can insert notifications" ON admin_notifications;
CREATE POLICY "Admins can insert notifications"
ON admin_notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Only the admin (owner) can update their notifications
DROP POLICY IF EXISTS "Admins can update notifications" ON admin_notifications;
CREATE POLICY "Admins can update notifications"
ON admin_notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Only the admin (owner) can delete their notifications
DROP POLICY IF EXISTS "Admins can delete notifications" ON admin_notifications;
CREATE POLICY "Admins can delete notifications"
ON admin_notifications FOR DELETE
USING (auth.uid() = user_id);

-- Remove old ALL policy if it exists
DROP POLICY IF EXISTS "Admins can manage their notifications" ON admin_notifications;

-- Only keep one active notification per admin (upsert pattern)
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_notifications_unique_active 
ON admin_notifications(user_id) WHERE is_active = true;
