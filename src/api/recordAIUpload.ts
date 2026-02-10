/**
 * API Endpoint: Record Successful AI Policy Upload
 * 
 * This should be called AFTER successful AI extraction/upload only
 * Not on errors - to ensure only successful uploads are counted
 * 
 * Method: POST /api/ai-upload/record
 * Body: { userId: string, policyData: object }
 * 
 * Run: Convert this to your preferred framework (Express, Next.js, etc.)
 */

import { supabase } from '../config/supabase';

interface RecordAIUploadRequest {
  userId: string;
  policyNumber?: string;
  insuranceCompany?: string;
  policyholderName?: string;
  extractionSource: 'file' | 'camera' | 'manual'; // Where the AI data came from
}

interface RecordAIUploadResponse {
  success: boolean;
  message: string;
  remainingUploads?: number;
  quotaExceeded?: boolean;
}

/**
 * Record a successful AI upload for billing/quota purposes
 * 
 * IMPORTANT: This should ONLY be called after:
 * 1. AI extraction completed successfully
 * 2. Data has been processed and verified
 * 3. Policy has been saved to database
 * 
 * DO NOT call this if the AI extraction failed or returned errors
 */
export async function recordAIPolicyUpload(
  request: RecordAIUploadRequest
): Promise<RecordAIUploadResponse> {
  try {
    // 1. Verify user exists and get subscription
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, subscription_plan')
      .eq('id', request.userId)
      .single();

    if (userError || !userData) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // 2. Check if user can upload
    const { data: quotaData, error: quotaError } = await supabase
      .rpc('get_user_ai_quota', { p_user_id: request.userId });

    if (quotaError || !quotaData || quotaData.length === 0) {
      return {
        success: false,
        message: 'Unable to check quota',
      };
    }

    const quota = quotaData[0];

    if (quota.monthly_limit === 0) {
      return {
        success: false,
        message: 'User subscription does not include AI uploads',
        quotaExceeded: true,
      };
    }

    if (quota.uploads_used >= quota.monthly_limit) {
      return {
        success: false,
        message: 'Monthly AI upload quota exceeded',
        quotaExceeded: true,
      };
    }

    // 3. Increment the upload count
    const { data: incrementData, error: incrementError } = await supabase
      .rpc('increment_ai_upload_count', { p_user_id: request.userId });

    if (incrementError || !incrementData || incrementData.length === 0) {
      return {
        success: false,
        message: 'Failed to record upload',
      };
    }

    const result = incrementData[0];

    if (!result.success) {
      return {
        success: false,
        message: result.message,
      };
    }

    // 4. Optional: Log the upload for analytics (create an audit log)
    await logAIUploadActivity({
      userId: request.userId,
      policyNumber: request.policyNumber,
      insuranceCompany: request.insuranceCompany,
      policyholderName: request.policyholderName,
      extractionSource: request.extractionSource,
      subscriptionPlan: userData.subscription_plan,
      remainingQuota: result.remaining_uploads,
    });

    return {
      success: true,
      message: 'AI upload recorded successfully',
      remainingUploads: result.remaining_uploads,
    };
  } catch (error) {
    console.error('Error recording AI upload:', error);
    return {
      success: false,
      message: 'Internal server error',
    };
  }
}

/**
 * Log AI upload activity for analytics and auditing
 */
async function logAIUploadActivity(activity: {
  userId: string;
  policyNumber?: string;
  insuranceCompany?: string;
  policyholderName?: string;
  extractionSource: string;
  subscriptionPlan: string;
  remainingQuota: number;
}) {
  try {
    // Optional: Store in analytics table
    const { error } = await supabase
      .from('ai_upload_logs')
      .insert({
        user_id: activity.userId,
        policy_number: activity.policyNumber,
        insurance_company: activity.insuranceCompany,
        policyholder_name: activity.policyholderName,
        extraction_source: activity.extractionSource,
        subscription_plan: activity.subscriptionPlan,
        remaining_quota: activity.remainingQuota,
        created_at: new Date(),
      });

    if (error) {
      console.warn('Failed to log AI upload activity:', error);
      // Don't throw - this is non-critical for user operation
    }
  } catch (error) {
    console.error('Error logging AI activity:', error);
  }
}

/**
 * Express.js Route Handler Example:
 * 
 * app.post('/api/ai-upload/record', async (req, res) => {
 *   const response = await recordAIPolicyUpload(req.body);
 *   return res.json(response);
 * });
 */

/**
 * Next.js API Route Example (pages/api/ai-upload/record.ts):
 * 
 * import type { NextApiRequest, NextApiResponse } from 'next';
 * 
 * export default async function handler(
 *   req: NextApiRequest,
 *   res: NextApiResponse
 * ) {
 *   if (req.method !== 'POST') {
 *     return res.status(405).json({ error: 'Method not allowed' });
 *   }
 * 
 *   const response = await recordAIPolicyUpload(req.body);
 *   return res.json(response);
 * }
 */

/**
 * Integration in AddPolicy.tsx:
 * 
 * import { recordAIPolicyUpload } from '../api/recordAIUpload';
 * 
 * const handleAIExtraction = async (file: File) => {
 *   try {
 *     // Check quota first
 *     const quotaCheck = await aiUploadLimitService.canUploadAIPolicy(user.id);
 *     if (!quotaCheck.canUpload) {
 *       toast.error(quotaCheck.reason);
 *       return;
 *     }
 * 
 *     // Extract data from PDF
 *     const extractedData = await extractPDFData(file);
 *     
 *     // Save to database
 *     await savePolicyToDatabase(extractedData);
 * 
 *     // ONLY AFTER SUCCESSFUL SAVE, record the upload
 *     const result = await recordAIPolicyUpload({
 *       userId: user.id,
 *       policyNumber: extractedData.policyNumber,
 *       insuranceCompany: extractedData.company,
 *       policyholderName: extractedData.holderName,
 *       extractionSource: 'file',
 *     });
 * 
 *     if (result.success) {
 *       toast.success(`Upload recorded! ${result.remainingUploads} remaining`);
 *     } else {
 *       toast.error(result.message);
 *     }
 *   } catch (error) {
 *     // On error, DO NOT call recordAIPolicyUpload
 *     toast.error('AI extraction failed');
 *   }
 * }
 */
