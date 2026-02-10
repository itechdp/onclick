# AI Upload Quota System - Quick Setup

## Status
✅ **Frontend**: Progress bar now visible with loading & fallback states  
⏳ **Database**: Needs initialization in Supabase  
⏳ **Integration**: Needs to be called during AI extraction  

---

## Step 1: Execute SQL in Supabase (5 minutes)

### How to Execute the SQL Script:

1. **Open Supabase Dashboard**: https://app.supabase.com
2. **Go to SQL Editor**
3. **Create New Query** button
4. **Copy ALL content** from `CREATE_AI_POLICY_LIMIT_TABLE.sql` (175 lines)
5. **Paste** into the query editor
6. **Press RUN** (green play button)
7. **Wait** for execution to complete

### What This Does:
- ✅ Creates `ai_policy_uploads` table
- ✅ Creates 5 Supabase Functions:
  - `get_ai_upload_limit()` - Returns limit by plan
  - `initialize_user_monthly_ai_limit()` - Creates monthly record
  - `increment_ai_upload_count()` - Increments counter
  - `get_user_ai_quota()` - Gets current month status
  - `reset_monthly_ai_limits()` - Resets all users' limits

---

## Step 2: Verify in Frontend (Automatic)

Once SQL is executed, the progress bar will:
1. 🔄 Stop showing "Loading..." state
2. 📊 Display actual quota: `0 / 25` (or your limit)
3. ✓ Show remaining uploads

**No code changes needed** - it works automatically!

---

## Step 3: Integrate with AI Extraction (Optional but Recommended)

To record uploads when AI extracts policies:

### File: `src/pages/AddPolicy.tsx` - Around line 1063

**After successful AI extraction**, add:

```typescript
// After "AI extraction completed" message
if (user && aiQuota?.monthly_limit > 0) {
  try {
    const recordResult = await aiUploadLimitService.recordSuccessfulAIUpload(user.id);
    if (recordResult.success) {
      toast.success(`✓ Upload recorded. ${recordResult.remaining_uploads} remaining`);
      refreshAIQuota(); // Update progress bar
    }
  } catch (error) {
    console.error('Error recording upload:', error);
  }
}
```

---

## Step 4: Setup Monthly Reset (Optional)

Choose ONE option to reset quotas on 1st of each month:

### Option A: Supabase Edge Function (Recommended)
- Create a Supabase Function
- Call: `SELECT reset_monthly_ai_limits();`
- Schedule via HTTP trigger

### Option B: Your Backend (Node.js)
```bash
# Run this daily (cron job)
node -e "const {supabase} = require('./config'); supabase.rpc('reset_monthly_ai_limits');"
```

### Option C: Manual
Execute this SQL query monthly:
```sql
SELECT reset_monthly_ai_limits();
```

---

## Troubleshooting

### Progress bar still shows "Loading"?
- Verify SQL executed without errors in Supabase
- Check browser console for error messages
- Refresh the page after SQL execution

### Getting 401/403 errors?
- RPC functions need proper permissions
- Go to Supabase Dashboard → RLS → Enable public access for functions
- Or ask Supabase support to enable RPC calls

### Want to test manually?
Run this in Supabase SQL Editor:
```sql
-- Replace with your actual user ID
SELECT * FROM ai_policy_uploads WHERE user_id = 'your-user-id';

-- Initialize quota for user
SELECT initialize_user_monthly_ai_limit('your-user-id');

-- Check quota
SELECT * FROM get_user_ai_quota('your-user-id');
```

---

## What Each Plan Gets

| Plan | Price | Monthly Uploads |
|------|-------|-----------------|
| Essential | ₹199 | ❌ No AI (0) |
| Starter | ₹499 | 25 uploads |
| Basic | ₹799 | 100 uploads |
| Standard | ₹1499 | 300 uploads |
| Premium | ₹2499 | 800 uploads |

---

## Summary

- **Frontend Progress Bar**: ✅ Done (visible now with loading states)
- **SQL Setup**: 📋 Do this first
- **AI Integration**: 📋 Optional but recommended
- **Monthly Reset**: 📋 Optional (can do manually or automate)

**Start with Step 1** - Execute the SQL script. Everything else will work automatically!
