import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zmdkhrzomzzxsjcxmyqo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZGtocnpvbXp6eHNqY3hteXFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxODU5MzksImV4cCI6MjA4Mjc2MTkzOX0.com-qM5kphHzeKVjfPCi0DmHxJKgO6-HtTsnxeWG0s4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database table names
export const TABLES = {
  USERS: 'users',
  POLICIES: 'policies',
  ACTIVITY_LOGS: 'activity_logs',
  DELETED_POLICIES: 'deleted_policies',
  LAPSED_POLICIES: 'lapsed_policies',
  TASKS: 'tasks',
};

export default supabase;
