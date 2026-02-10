# AI Policy Upload Limit System - Integration Guide

## Overview
This system tracks and limits AI Policy uploads based on user's subscription plan. Limits reset automatically on the 1st of each month.

## Subscription Plan Limits
- **₹199 (Essential)** → 0 AI uploads (No AI access)
- **₹499 (Starter)** → 25 AI uploads/month
- **₹799 (Basic)** → 100 AI uploads/month
- **₹1499 (Standard)** → 300 AI uploads/month
- **₹2499 (Premium)** → 800 AI uploads/month

## Database Setup

### 1. Run the SQL migration
Execute the SQL from `CREATE_AI_POLICY_LIMIT_TABLE.sql` in Supabase:
```sql
-- This creates:
-- - ai_policy_uploads table
-- - get_ai_upload_limit() function
-- - initialize_user_monthly_ai_limit() function
-- - increment_ai_upload_count() function
-- - get_user_ai_quota() function
```

### 2. Enable RPC functions in Supabase
Make sure these functions are callable from the client:
- `get_user_ai_quota`
- `increment_ai_upload_count`

## Frontend Integration

### In AddPolicy.tsx (AI Upload Section)

```typescript
import { aiUploadLimitService } from '../services/aiUploadLimitService';

// Before starting AI extraction
const handleAIExtraction = async (files: File[]) => {
  // 1. Check quota FIRST
  const quotaCheck = await aiUploadLimitService.canUploadAIPolicy(user.id);
  
  if (!quotaCheck.canUpload) {
    toast.error(quotaCheck.reason);
    if (quotaCheck.limit === 0) {
      // Show upgrade modal for ₹199 users
      setShowUpgradeModal(true);
    }
    return;
  }

  // Show remaining uploads
  toast.info(`Remaining: ${quotaCheck.remaining} AI uploads this month`);

  // 2. Proceed with AI extraction...
  try {
    // ... your AI extraction logic ...
    
    // 3. On SUCCESSFUL extraction ONLY, increment counter
    const result = await aiUploadLimitService.recordSuccessfulAIUpload(user.id);
    
    if (result.success) {
      toast.success(`Upload recorded. ${result.remaining_uploads} remaining`);
    }
    
    // 4. If limit reached, notify user
    if (result.remaining_uploads === 0) {
      toast.warning('You\'ve reached your monthly AI upload limit!');
    }
  } catch (error) {
    // On ERROR, do NOT increment counter
    toast.error('AI extraction failed. Limit not used.');
  }
};
```

### Display Quota in UI

```typescript
// Get quota to show in UI
const [quota, setQuota] = useState<AIQuotaStatus | null>(null);

useEffect(() => {
  if (user) {
    aiUploadLimitService.getUserAIQuota(user.id).then(setQuota);
  }
}, [user]);

// In JSX
{quota && (
  <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg mb-4">
    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
      {aiUploadLimitService.formatQuotaDisplay(quota)}
    </p>
    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
      Resets on the 1st of next month
    </p>
  </div>
)}
```

## Backend Integration (Monthly Reset)

### Option 1: Supabase Edge Function
Create a scheduled function that runs on the 1st of each month:

```typescript
import { createClient } from '@supabase/supabase-js';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Not allowed', { status: 405 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Call reset function
  const { error } = await supabase.rpc('reset_monthly_ai_limits');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
```

### Option 2: Node.js Cron Job
In your backend (e.g., razorpay-webhook-server.ts):

```typescript
import cron from 'node-cron';
import { supabase } from './config/supabase';

// Run at 00:05 on the 1st of every month
cron.schedule('5 0 1 * *', async () => {
  console.log('🔄 Running monthly AI limit reset...');
  
  // Delete old records (keeping archive)
  const { error } = await supabase
    .from('ai_policy_uploads')
    .delete()
    .lt('month_year', new Date().toISOString().slice(0, 7)); // Delete previous months

  if (error) {
    console.error('Error resetting AI limits:', error);
  } else {
    console.log('✅ Monthly AI limits reset complete');
  }
});
```

### Option 3: n8n Webhook
Create an n8n workflow that runs on the 1st of month:
1. Trigger: Cron (1st day of month at 00:01)
2. Action: Call Supabase RPC `reset_monthly_ai_limits`

## Key Points

✅ **Only count successful uploads** - Don't call `recordSuccessfulAIUpload()` if extraction fails
✅ **Check quota before AI** - Always call `canUploadAIPolicy()` before starting extraction
✅ **Monthly auto-reset** - No manual reset needed, just ensure the scheduled job runs
✅ **User-friendly messages** - Show clear error messages for quota limits
✅ **Subscription validation** - ₹199 plan users get "No AI" message

## Error Messages to Show

1. **No AI Access** (₹199 plan):
   ```
   "Your subscription plan does not include AI Policy Upload. 
    Please upgrade to access AI features."
   ```

2. **Quota Exceeded**:
   ```
   "Monthly AI upload limit reached (X/X uploads). 
    Limit resets on the 1st of next month."
   ```

3. **Subscription Expired**:
   ```
   "Your subscription has expired. Please renew to continue 
    using AI Policy Upload features."
   ```

## Testing

1. Test quota calculation:
   ```typescript
   const quota = await aiUploadLimitService.getUserAIQuota(userId);
   console.log(quota); // Should show current month usage
   ```

2. Test successful increment:
   ```typescript
   const result = await aiUploadLimitService.recordSuccessfulAIUpload(userId);
   console.log(result); // Should increment upload_count
   ```

3. Test limit enforcement:
   ```typescript
   const check = await aiUploadLimitService.canUploadAIPolicy(userId);
   console.log(check.canUpload, check.reason);
   ```

## Performance Optimization

- Add Redis caching for `get_user_ai_quota()` to reduce DB calls
- Cache quota for 1 hour, invalidate on upload
- Consider background job to pre-calculate limits for all users

## Future Enhancements

- [ ] Show countdown timer until limit resets
- [ ] Email notification when approaching limit
- [ ] Quota upgrade without changing subscription
- [ ] Per-document AI extraction limits
- [ ] Bulk upload queue with auto-retry
