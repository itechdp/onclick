import { supabase } from '../config/supabase';

export interface AIQuotaStatus {
  uploads_used: number;
  monthly_limit: number;
  remaining_uploads: number;
  subscription_plan: number;
  reset_date: string;
}

class AIUploadLimitService {
  /**
   * Get user's current AI upload quota for this month
   */
  async getUserAIQuota(userId: string): Promise<AIQuotaStatus | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_ai_quota', { p_user_id: userId });

      if (error) {
        console.error('Error getting AI quota:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const row = data[0];
      return {
        uploads_used: row.uploads_used || 0,
        monthly_limit: row.monthly_limit || 0,
        remaining_uploads: row.remaining_uploads || 0,
        subscription_plan: row.subscription_plan || 199,
        reset_date: row.reset_date || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching AI quota:', error);
      return null;
    }
  }

  /**
   * Check if user can upload AI policy - CALL BEFORE UPLOAD
   */
  async canUploadAIPolicy(userId: string): Promise<{
    canUpload: boolean;
    reason: string;
    remaining: number;
    limit: number;
  }> {
    try {
      const quota = await this.getUserAIQuota(userId);

      if (!quota) {
        return {
          canUpload: false,
          reason: 'Unable to fetch quota information',
          remaining: 0,
          limit: 0,
        };
      }

      if (quota.monthly_limit === 0) {
        return {
          canUpload: false,
          reason: '⚠️ Your plan does not include AI uploads. Please upgrade.',
          remaining: 0,
          limit: 0,
        };
      }

      if (quota.uploads_used >= quota.monthly_limit) {
        return {
          canUpload: false,
          reason: `🚫 Monthly limit reached (${quota.monthly_limit} uploads). Resets on the 1st.`,
          remaining: 0,
          limit: quota.monthly_limit,
        };
      }

      return {
        canUpload: true,
        reason: `✅ You have ${quota.remaining_uploads} uploads remaining`,
        remaining: quota.remaining_uploads,
        limit: quota.monthly_limit,
      };
    } catch (error) {
      console.error('Error checking AI upload eligibility:', error);
      return {
        canUpload: false,
        reason: 'Error checking upload limit',
        remaining: 0,
        limit: 0,
      };
    }
  }

  /**
   * Record successful AI upload - ONLY CALL WHEN WEBHOOK RETURNS SUCCESS WITH DATA
   * @param userId - User ID
   * @returns success status and updated quota
   */
  async recordSuccessfulAIUpload(userId: string): Promise<{
    success: boolean;
    message: string;
    uploads_used: number;
    remaining: number;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('increment_user_ai_uploads', { p_user_id: userId });

      if (error) {
        console.error('Error incrementing upload count:', error);
        return {
          success: false,
          message: 'Failed to record upload',
          uploads_used: 0,
          remaining: 0,
        };
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          message: 'No response from server',
          uploads_used: 0,
          remaining: 0,
        };
      }

      const row = data[0];
      return {
        success: row.success || false,
        message: row.message || 'Upload recorded',
        uploads_used: row.uploads_used || 0,
        remaining: row.remaining || 0,
      };
    } catch (error) {
      console.error('Error recording AI upload:', error);
      return {
        success: false,
        message: 'Error recording upload',
        uploads_used: 0,
        remaining: 0,
      };
    }
  }

  /**
   * Get AI upload limit based on subscription plan
   */
  getAILimitBySubscription(subscriptionPlan: number | string): number {
    const plan = parseInt(String(subscriptionPlan));
    
    switch (plan) {
      case 199:
        return 0; // No AI
      case 499:
        return 25; // 25/month
      case 799:
        return 100; // 100/month
      case 1499:
        return 300; // 300/month
      case 2499:
        return 800; // 800/month
      default:
        return 0;
    }
  }

  /**
   * Get friendly limit description for pricing page
   */
  getAILimitDescription(subscriptionPlan: number | string): string {
    const plan = parseInt(String(subscriptionPlan));
    
    switch (plan) {
      case 199:
        return '❌ No AI Policy Upload';
      case 499:
        return '✓ AI Upload 25/Month';
      case 799:
        return '✓ AI Upload 100/Month';
      case 1499:
        return '✓ AI Upload 300/Month';
      case 2499:
        return '✓ AI Upload 800/Month';
      default:
        return 'View AI limits';
    }
  }

  /**
   * Format quota display for UI
   */
  formatQuotaDisplay(quota: AIQuotaStatus): string {
    if (quota.monthly_limit === 0) {
      return 'No AI uploads available';
    }
    return `${quota.uploads_used}/${quota.monthly_limit} AI uploads used`;
  }
}

export const aiUploadLimitService = new AIUploadLimitService();
