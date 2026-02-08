import { supabase } from '../config/supabase';

export interface SubAgent {
  id: string;
  userId: string;
  subAgentName: string;
  contactNo?: string;
  emailId?: string;
  loginEmail?: string;
  passwordHash?: string;
  address?: string;
  notes?: string;
  totalPolicies?: number;
  totalPremiumAmount?: number;
  totalCommission?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Simple SHA-256 hash function for browser
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const subAgentService = {
  // Get all sub agents for a user
  getSubAgents: async (userId: string): Promise<SubAgent[]> => {
    try {
      const { data, error } = await supabase
        .from('sub_agents')
        .select('*')
        .eq('user_id', userId)
        .order('sub_agent_name', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        subAgentName: row.sub_agent_name,
        contactNo: row.contact_no,
        emailId: row.email_id,
        loginEmail: row.login_email,
        passwordHash: row.password_hash,
        address: row.address,
        notes: row.notes,
        totalPolicies: row.total_policies || 0,
        totalPremiumAmount: parseFloat(row.total_premium_amount || '0'),
        totalCommission: parseFloat(row.total_commission || '0'),
        isActive: row.is_active ?? true,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));
    } catch (error) {
      console.error('Error getting sub agents:', error);
      throw error;
    }
  },

  // Get a single sub agent by ID
  getSubAgentById: async (id: string): Promise<SubAgent | null> => {
    try {
      const { data, error } = await supabase
        .from('sub_agents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      if (!data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        subAgentName: data.sub_agent_name,
        contactNo: data.contact_no,
        emailId: data.email_id,
        loginEmail: data.login_email,
        passwordHash: data.password_hash,
        address: data.address,
        notes: data.notes,
        totalPolicies: data.total_policies || 0,
        totalPremiumAmount: parseFloat(data.total_premium_amount || '0'),
        totalCommission: parseFloat(data.total_commission || '0'),
        isActive: data.is_active ?? true,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error getting sub agent:', error);
      throw error;
    }
  },

  // Add a new sub agent
  addSubAgent: async (subAgentData: {
    userId: string;
    subAgentName: string;
    contactNo?: string;
    emailId?: string;
    loginEmail?: string;
    password?: string;
    address?: string;
    notes?: string;
  }): Promise<string> => {
    try {
      const insertData: Record<string, unknown> = {
        user_id: subAgentData.userId,
        sub_agent_name: subAgentData.subAgentName,
        contact_no: subAgentData.contactNo,
        email_id: subAgentData.emailId,
        address: subAgentData.address,
        notes: subAgentData.notes,
        is_active: true,
      };

      // If login credentials are provided, hash the password
      if (subAgentData.loginEmail && subAgentData.password) {
        insertData.login_email = subAgentData.loginEmail;
        insertData.password_hash = await hashPassword(subAgentData.password);
      }

      const { data, error } = await supabase
        .from('sub_agents')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      return data.id;
    } catch (error) {
      console.error('Error adding sub agent:', error);
      throw error;
    }
  },

  // Update a sub agent
  updateSubAgent: async (id: string, updates: Partial<SubAgent> & { password?: string }): Promise<void> => {
    try {
      const dbUpdates: Record<string, unknown> = {};

      if (updates.subAgentName !== undefined) dbUpdates.sub_agent_name = updates.subAgentName;
      if (updates.contactNo !== undefined) dbUpdates.contact_no = updates.contactNo;
      if (updates.emailId !== undefined) dbUpdates.email_id = updates.emailId;
      if (updates.loginEmail !== undefined) dbUpdates.login_email = updates.loginEmail;
      if (updates.address !== undefined) dbUpdates.address = updates.address;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

      // If password is being updated, hash it
      if (updates.password) {
        dbUpdates.password_hash = await hashPassword(updates.password);
      }

      const { error } = await supabase
        .from('sub_agents')
        .update(dbUpdates)
        .eq('id', id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error updating sub agent:', error);
      throw error;
    }
  },

  // Delete a sub agent
  deleteSubAgent: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('sub_agents')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting sub agent:', error);
      throw error;
    }
  },

  // Get policies for a specific sub agent
  getSubAgentPolicies: async (subAgentId: string) => {
    try {
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .eq('sub_agent_id', subAgentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting sub agent policies:', error);
      throw error;
    }
  },

  // Update sub agent statistics (total policies, premium and commission)
  updateSubAgentStats: async (subAgentId: string): Promise<void> => {
    try {
      const { data: policies, error: policiesError } = await supabase
        .from('policies')
        .select('premium_amount, net_premium, total_premium, sub_agent_commission_amount')
        .eq('sub_agent_id', subAgentId);

      if (policiesError) throw policiesError;

      const totalPolicies = policies?.length || 0;
      const totalPremiumAmount = policies?.reduce((sum, policy) => {
        const amount = parseFloat(policy.total_premium || policy.net_premium || policy.premium_amount || '0');
        return sum + amount;
      }, 0) || 0;
      const totalCommission = policies?.reduce((sum, policy) => {
        const commission = parseFloat(policy.sub_agent_commission_amount || '0');
        return sum + commission;
      }, 0) || 0;

      const { error: updateError } = await supabase
        .from('sub_agents')
        .update({
          total_policies: totalPolicies,
          total_premium_amount: totalPremiumAmount,
          total_commission: totalCommission,
        })
        .eq('id', subAgentId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error updating sub agent stats:', error);
      throw error;
    }
  },

  // Authenticate sub agent login
  authenticateSubAgent: async (email: string, password: string): Promise<SubAgent | null> => {
    try {
      const passwordHash = await hashPassword(password);

      const { data, error } = await supabase
        .from('sub_agents')
        .select('*')
        .eq('login_email', email)
        .eq('password_hash', passwordHash)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No match found
        throw error;
      }

      if (!data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        subAgentName: data.sub_agent_name,
        contactNo: data.contact_no,
        emailId: data.email_id,
        loginEmail: data.login_email,
        passwordHash: data.password_hash,
        address: data.address,
        notes: data.notes,
        totalPolicies: data.total_policies || 0,
        totalPremiumAmount: parseFloat(data.total_premium_amount || '0'),
        totalCommission: parseFloat(data.total_commission || '0'),
        isActive: data.is_active ?? true,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error authenticating sub agent:', error);
      return null;
    }
  },

  // Get sub agent policies with filters
  getSubAgentPoliciesFiltered: async (subAgentId: string, filters?: {
    month?: number;
    year?: number;
    insuranceCompany?: string;
    productType?: string;
  }) => {
    try {
      let query = supabase
        .from('policies')
        .select('*')
        .eq('sub_agent_id', subAgentId)
        .order('created_at', { ascending: false });

      if (filters?.insuranceCompany) {
        query = query.eq('insurance_company', filters.insuranceCompany);
      }

      if (filters?.productType) {
        query = query.eq('product_type', filters.productType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      let filteredData = data || [];

      // Filter by month/year on the client side (since dates are stored as strings)
      if (filters?.month !== undefined && filters?.year !== undefined) {
        filteredData = filteredData.filter(policy => {
          const startDate = policy.policy_start_date ? new Date(policy.policy_start_date) : null;
          if (!startDate) return false;
          return startDate.getMonth() === filters.month! && startDate.getFullYear() === filters.year!;
        });
      } else if (filters?.year !== undefined) {
        filteredData = filteredData.filter(policy => {
          const startDate = policy.policy_start_date ? new Date(policy.policy_start_date) : null;
          if (!startDate) return false;
          return startDate.getFullYear() === filters.year!;
        });
      }

      return filteredData;
    } catch (error) {
      console.error('Error getting filtered sub agent policies:', error);
      throw error;
    }
  },
};
