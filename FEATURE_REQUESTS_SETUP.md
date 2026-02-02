# Feature Requests Setup Guide

## Overview
This feature allows users to submit feature requests and admins to manage them from the admin panel.

## Setup Steps

### 1. Create Database Table
Run the SQL script to create the `feature_requests` table:

```bash
# Execute in Supabase SQL Editor
CREATE_FEATURE_REQUESTS_TABLE.sql
```

This will create:
- `feature_requests` table with proper columns
- RLS policies for user and admin access
- Indexes for performance
- Trigger for auto-updating `updated_at`

### 2. Features

#### For Users:
- **Access**: Navigate to "Feature Requests" in the sidebar (lightbulb icon)
- **Submit Request**: Click "New Request" button
  - Enter a title (max 200 chars)
  - Provide detailed description
  - Automatically tracks user info
- **View Status**: See all your submitted requests with:
  - Current status (Pending, Under Review, Planned, Completed, Rejected)
  - Priority level
  - Admin notes/responses
  - Submission date

#### For Admins:
- **Access**: View all feature requests in the Admin Panel (bottom section)
- **Manage Requests**:
  - Update status (Pending → Under Review → Planned → Completed/Rejected)
  - Set priority (Low, Medium, High)
  - Add notes visible to users
  - Delete requests if needed

### 3. Status Workflow

```
Pending → Under Review → Planned → Completed
                              ↓
                         Rejected
```

### 4. Testing

1. **As User**:
   - Login as regular user
   - Go to Feature Requests
   - Submit a new request
   - Verify it appears in your list

2. **As Admin**:
   - Login as admin
   - Go to Admin Panel
   - Scroll to Feature Requests section
   - Update status and add notes
   - Verify user sees the updates

## Files Created

- `CREATE_FEATURE_REQUESTS_TABLE.sql` - Database schema
- `src/services/featureRequestService.ts` - API service
- `src/pages/FeatureRequests.tsx` - User page
- `src/components/FeatureRequestsManager.tsx` - Admin component

## Routes Added

- `/feature-requests` - User feature request page

## Database Schema

```sql
feature_requests (
  id              UUID PRIMARY KEY
  user_id         UUID (FK to users)
  user_name       TEXT
  user_email      TEXT
  title           TEXT
  description     TEXT
  status          TEXT (pending/under_review/planned/completed/rejected)
  priority        TEXT (low/medium/high)
  admin_notes     TEXT
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ
)
```

## Security

- RLS enabled
- Users can only view/create their own requests
- Admins can view/update all requests
- Automatic user info tracking
