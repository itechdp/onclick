import { supabase } from '../config/supabase';

export interface AdminNotification {
  id: string;
  userId: string;
  message: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const adminNotificationService = {
  // Get active notification (global broadcast to all users)
  async getActiveNotification(): Promise<AdminNotification | null> {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching admin notification:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      message: data.message,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  // Set/update the admin notification (upsert - replaces any existing active one)
  async setNotification(adminUserId: string, message: string): Promise<AdminNotification | null> {
    // First deactivate any existing active notifications
    await supabase
      .from('admin_notifications')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', adminUserId)
      .eq('is_active', true);

    // Insert new active notification
    const { data, error } = await supabase
      .from('admin_notifications')
      .insert({
        user_id: adminUserId,
        message: message.trim(),
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error setting admin notification:', error);
      throw error;
    }

    return {
      id: data.id,
      userId: data.user_id,
      message: data.message,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  // Remove (deactivate) the admin notification
  async clearNotification(adminUserId: string): Promise<void> {
    const { error } = await supabase
      .from('admin_notifications')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', adminUserId)
      .eq('is_active', true);

    if (error) {
      console.error('Error clearing admin notification:', error);
      throw error;
    }
  },
};
