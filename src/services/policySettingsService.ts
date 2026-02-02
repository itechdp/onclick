import { supabase } from '../config/supabase';

export interface PolicySetting {
  id: string;
  userId: string;
  category: 'insurance_company' | 'product_type' | 'lob';
  value: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePolicySettingData {
  category: 'insurance_company' | 'product_type' | 'lob';
  value: string;
}

export const policySettingsService = {
  /**
   * Get all settings for a category
   */
  async getSettings(category: 'insurance_company' | 'product_type' | 'lob'): Promise<PolicySetting[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('policy_settings')
      .select('*')
      .eq('user_id', user.id)
      .eq('category', category)
      .eq('is_active', true)
      .order('value');

    if (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }

    return (data || []).map(this.parseSetting);
  },

  /**
   * Get all settings grouped by category
   */
  async getAllSettings(): Promise<Record<string, PolicySetting[]>> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('policy_settings')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('category')
      .order('value');

    if (error) {
      console.error('Error fetching all settings:', error);
      throw error;
    }

    const settings = (data || []).map(this.parseSetting);
    
    // Group by category
    const grouped: Record<string, PolicySetting[]> = {
      insurance_company: [],
      product_type: [],
      lob: []
    };

    settings.forEach(setting => {
      grouped[setting.category].push(setting);
    });

    return grouped;
  },

  /**
   * Create a new setting
   */
  async createSetting(data: CreatePolicySettingData): Promise<PolicySetting> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: newSetting, error } = await supabase
      .from('policy_settings')
      .insert({
        user_id: user.id,
        category: data.category,
        value: data.value.trim(),
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating setting:', error);
      throw error;
    }

    return this.parseSetting(newSetting);
  },

  /**
   * Update a setting
   */
  async updateSetting(id: string, value: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('policy_settings')
      .update({ value: value.trim() })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  },

  /**
   * Delete a setting (soft delete by setting is_active to false)
   */
  async deleteSetting(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('policy_settings')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting setting:', error);
      throw error;
    }
  },

  /**
   * Permanently delete a setting
   */
  async permanentlyDeleteSetting(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('policy_settings')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error permanently deleting setting:', error);
      throw error;
    }
  },

  /**
   * Initialize default settings for a new user
   */
  async initializeDefaultSettings(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user already has settings
    const { data: existing } = await supabase
      .from('policy_settings')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (existing && existing.length > 0) {
      return; // User already has settings
    }

    // Default insurance companies
    const defaultCompanies = [
      'Life Insurance Corporation of India',
      'HDFC Life Insurance Company Limited',
      'ICICI Prudential Life Insurance Co. Ltd.',
      'SBI Life Insurance Co. Ltd.',
      'HDFC ERGO General Insurance Co. Ltd.',
      'ICICI Lombard General Insurance Co. Ltd.',
      'Bajaj Allianz Life Insurance Co. Ltd.',
      'Tata AIA Life Insurance Co. Ltd.',
    ];

    // Default product types
    const defaultProductTypes = [
      'Term Insurance',
      'Health Insurance',
      'Motor Insurance',
      'Home Insurance',
      'Travel Insurance',
    ];

    // Default LOBs
    const defaultLOBs = [
      'Life Insurance',
      'Health Insurance',
      'Motor Insurance',
      'Fire Insurance',
      'Marine Insurance',
    ];

    const settingsToInsert = [
      ...defaultCompanies.map(value => ({
        user_id: user.id,
        category: 'insurance_company',
        value,
        is_active: true
      })),
      ...defaultProductTypes.map(value => ({
        user_id: user.id,
        category: 'product_type',
        value,
        is_active: true
      })),
      ...defaultLOBs.map(value => ({
        user_id: user.id,
        category: 'lob',
        value,
        is_active: true
      }))
    ];

    const { error } = await supabase
      .from('policy_settings')
      .insert(settingsToInsert);

    if (error) {
      console.error('Error initializing default settings:', error);
      throw error;
    }
  },

  /**
   * Parse setting data from database
   */
  parseSetting(data: any): PolicySetting {
    return {
      id: data.id,
      userId: data.user_id,
      category: data.category,
      value: data.value,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
};
