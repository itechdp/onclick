import { supabase } from '../config/supabase';

export interface FeatureRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  description: string;
  status: 'pending' | 'under_review' | 'planned' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFeatureRequestData {
  title: string;
  description: string;
}

export interface UpdateFeatureRequestData {
  status?: 'pending' | 'under_review' | 'planned' | 'completed' | 'rejected';
  priority?: 'low' | 'medium' | 'high';
  adminNotes?: string;
}

export const featureRequestService = {
  /**
   * Create a new feature request
   */
  async createFeatureRequest(data: CreateFeatureRequestData): Promise<FeatureRequest> {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      throw new Error('User not authenticated');
    }

    // Get user profile for name and email
    const { data: userProfile } = await supabase
      .from('users')
      .select('display_name, email')
      .eq('id', authUser.id)
      .single();

    if (!userProfile) {
      throw new Error('User profile not found');
    }

    const { data: newRequest, error } = await supabase
      .from('feature_requests')
      .insert({
        user_id: authUser.id,
        user_name: userProfile.display_name,
        user_email: userProfile.email,
        title: data.title,
        description: data.description,
        status: 'pending',
        priority: 'medium'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating feature request:', error);
      throw error;
    }

    return this.parseFeatureRequest(newRequest);
  },

  /**
   * Get all feature requests for current user
   */
  async getUserFeatureRequests(): Promise<FeatureRequest[]> {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('feature_requests')
      .select('*')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user feature requests:', error);
      throw error;
    }

    return (data || []).map(this.parseFeatureRequest);
  },

  /**
   * Get all feature requests (admin only)
   */
  async getAllFeatureRequests(): Promise<FeatureRequest[]> {
    const { data, error } = await supabase
      .from('feature_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all feature requests:', error);
      throw error;
    }

    return (data || []).map(this.parseFeatureRequest);
  },

  /**
   * Update feature request (admin only)
   */
  async updateFeatureRequest(id: string, updates: UpdateFeatureRequestData): Promise<void> {
    const updateData: any = {};
    
    if (updates.status) updateData.status = updates.status;
    if (updates.priority) updateData.priority = updates.priority;
    if (updates.adminNotes !== undefined) updateData.admin_notes = updates.adminNotes;

    const { error } = await supabase
      .from('feature_requests')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating feature request:', error);
      throw error;
    }
  },

  /**
   * Delete feature request (admin only)
   */
  async deleteFeatureRequest(id: string): Promise<void> {
    const { error } = await supabase
      .from('feature_requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting feature request:', error);
      throw error;
    }
  },

  /**
   * Parse feature request data from database
   */
  parseFeatureRequest(data: any): FeatureRequest {
    return {
      id: data.id,
      userId: data.user_id,
      userName: data.user_name,
      userEmail: data.user_email,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      adminNotes: data.admin_notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
};
