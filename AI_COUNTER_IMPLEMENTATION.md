# AI Upload Counter - Simple Implementation

## 🎯 What Changed

**Much simpler approach:** Counter increments ONLY when n8n webhook returns successful data with ≥ 1 field.

---

## ✅ What Was Done

### 1. **Beautiful Progress Bar UI** ✓
- Large, prominent display with gradient background
- Shows: `12 of 25` (big numbers)
- Visual white progress bar
- Clear status messages
- Loading skeleton animation

### 2. **Simple SQL Schema** ✓
New file: `SIMPLE_AI_UPLOAD_COUNTER.sql` - Create this in Supabase

Only adds 3 columns to `users` table:
- `ai_uploads_this_month` (INT) - Counter
- `ai_uploads_monthly_limit` (INT) - User's limit
- `ai_uploads_reset_date` (TIMESTAMP) - Reset tracking

### 3. **Automatic Counter Logic** ✓
In AddPolicy.tsx:
- When AI webhook returns data → counts how many fields have values
- If ≥ 1 field has data → increment counter by 1
- Shows toast: "✓ Upload recorded. 24 remaining"
- Refreshes progress bar automatically

**Important:** Counter ONLY increments on successful webhook response with data!

---

## 📋 Setup Steps (5 minutes)

### Step 1: Execute SQL in Supabase
1. Open https://app.supabase.com
2. SQL Editor → New Query
3. Copy ALL content from `SIMPLE_AI_UPLOAD_COUNTER.sql`
4. Paste & **RUN**
5. Wait for success ✓

### Step 2: That's It!
The progress bar will immediately:
- Show actual quota (e.g., `0 / 25`)
- Update in real-time as user extracts policies
- Reset automatically on 1st of each month

---

## 🧪 Test It

### Upload a Policy
1. Go to Add Policy page
2. Upload a PDF via AI Analysis button
3. Watch progress bar update automatically

### Expected Behavior
```
Before upload: 0 / 25
After successful extraction: 1 / 25
Shows: "✓ 24 uploads remaining"
```

---

## 📊 Quota Limits by Plan

| Plan | Price | Monthly Uploads |
|------|-------|-----------------|
| Essential | ₹199 | 0 (No AI) |
| Starter | ₹499 | 25 |
| Basic | ₹799 | 100 |
| Standard | ₹1499 | 300 |
| Premium | ₹2499 | 800 |

---

## 🔧 Key Functions

### `increment_user_ai_uploads()`
- Called in AddPolicy.tsx after webhook succeeds with data
- Returns: `{success, uploads_used, monthly_limit, remaining}`
- Checks if user reached limit before incrementing

### `get_user_ai_quota()`
- Called on page load and after each upload
- Returns current month's status
- Auto-creates monthly record if needed

### `reset_monthly_ai_counters()`
- Resets all users' counters on 1st of month
- Called via backend cron job (setup optional)

---

## ⚙️ Monthly Reset Options

### Option 1: Automatic (via Cron Job)
Create a backend scheduled task to run daily at midnight:
```bash
# Run this daily
supabase rpc reset_monthly_ai_counters
```

### Option 2: Manual (Once a Month)
Execute in SQL Editor on the 1st:
```sql
SELECT reset_monthly_ai_counters();
```

### Option 3: Application Startup
Add to your app's init function:
```typescript
// Check and reset if needed
const quota = await aiUploadLimitService.getUserAIQuota(userId);
if (new Date(quota.reset_date).getDate() < 1) {
  await supabase.rpc('reset_monthly_ai_counters');
}
```

---

## 🐛 Troubleshooting

### Progress bar shows "Your AI Quota System" message?
- SQL script hasn't been executed yet
- Go to Supabase and run `SIMPLE_AI_UPLOAD_COUNTER.sql`
- Refresh page afterward

### Uploads not being recorded?
- Check browser console for errors
- Verify webhook is returning data with ≥ 1 field
- Try uploading a different PDF

### Quota shows 0 / 0 for Premium plan?
- Verify subscription_plan column in users table has correct value (2499)
- Check column is INT not TEXT
- May need to update user record manually

---

## 📝 Files Modified

1. **AddPolicy.tsx**
   - Added progress bar UI (beautiful new design)
   - Added increment logic after webhook success
   - Auto-refresh quota after upload

2. **aiUploadLimitService.ts**
   - Updated `getUserAIQuota()` for simple schema
   - Updated `recordSuccessfulAIUpload()` function

3. **SIMPLE_AI_UPLOAD_COUNTER.sql** (NEW)
   - Simple SQL schema (3 columns in users table)
   - 3 Supabase functions for quota management
   - Auto-reset trigger for monthly

---

## ✨ Summary

✅ **UI:** Beautiful, large progress bar visible in Add Policy page
✅ **Logic:** Counter increments ONLY on successful webhook with data
✅ **Database:** Simple implementation using users table columns
✅ **Monthly Reset:** Auto-handled by trigger function
✅ **Zero Config:** Works immediately after SQL execution

**Start with Step 1 → SQL Execution → Done!** 🚀
