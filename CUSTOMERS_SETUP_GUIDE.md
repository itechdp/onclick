# Customers Management Feature - Setup Guide

## Overview
A comprehensive customer management system has been added to your OnClicks Policy Manager. This allows you to:
- Manually add and manage customers
- Automatically create customers when adding policies
- Track customer personal and professional details
- Manage business owner information
- Track birthdays and anniversaries
- Filter and search customers

## Files Created

### 1. Database Schema
**File:** `CREATE_CUSTOMERS_TABLE.sql`
- Run this SQL file in your Supabase SQL Editor to create the customers table
- Includes all necessary fields for personal, professional, and business details
- Has Row Level Security (RLS) enabled for data isolation
- Includes indexes for better query performance

### 2. TypeScript Types
**File:** `src/types/customer.ts`
- `Customer` interface: Complete customer data structure
- `CustomerFormData` interface: Form submission data structure

### 3. Service Layer
**File:** `src/services/customerService.ts`
Functions available:
- `fetchCustomers()` - Get all customers for current user
- `createCustomer(data)` - Add a new customer
- `updateCustomer(id, data)` - Update customer details
- `deleteCustomer(id)` - Soft delete a customer
- `findOrCreateCustomerFromPolicy(name, contact, email)` - Auto-create from policy
- `getUpcomingBirthdays()` - Get customers with birthdays in next 30 days
- `getUpcomingAnniversaries()` - Get customers with anniversaries in next 30 days

### 4. UI Component
**File:** `src/pages/Customers.tsx`
Features:
- Grid view of all customers
- Search and filter functionality
- Add/Edit customer modal with comprehensive form
- Delete customers
- Stats cards showing total customers, business owners, upcoming events
- Responsive design with dark mode support

### 5. Integration
- Added to `src/App.tsx` - Route: `/customers`
- Added to `src/components/Sidebar.tsx` - Navigation item
- Exported from `src/services/index.ts`

## Setup Instructions

### Step 1: Create Database Table
1. Open your Supabase project
2. Go to SQL Editor
3. Copy and paste the content of `CREATE_CUSTOMERS_TABLE.sql`
4. Click "Run" to execute the SQL
5. Verify the `customers` table is created in your database

### Step 2: Test the Feature
1. Navigate to the Customers page from the sidebar
2. Click "Add Customer" button
3. Fill in customer details (minimum: customer name)
4. Save the customer
5. Verify the customer appears in the list

### Step 3: Verify Auto-Creation from Policies (Optional)
The `findOrCreateCustomerFromPolicy()` function can be integrated with your policy creation flow to automatically create customers when policies are added. 

To integrate this:
1. In your `AddPolicy` component (or wherever policies are created)
2. After successful policy creation, call:
```typescript
import { findOrCreateCustomerFromPolicy } from '../services/customerService';

// After policy is created
await findOrCreateCustomerFromPolicy(
  policyholderName,
  contactNo,
  emailId
);
```

## Customer Fields

### Basic Information
- Customer Name (required)
- Contact Number
- Email ID
- Address
- Customer Type (Individual/Corporate/Family)

### Personal Details
- Date of Birth
- Anniversary Date
- Gender (Male/Female/Other)

### Professional Details
- Profession (Salaried/Business Owner/Self-Employed/Professional/Retired/Student/Other)
- Occupation (Job title)
- Company Name (for salaried employees)

### Business Details (for Business Owners)
- Is Business Owner (checkbox)
- Business Name
- Business Type (Retail/Manufacturing/Services/etc.)
- Business Address
- GST Number
- PAN Number
- Business Established Date

### Additional Information
- Referred By
- Notes
- Tags (for categorization)

## Features

### 1. Customer List View
- Shows all customers in a grid layout
- Each card displays key information
- Quick edit and delete actions
- Responsive design

### 2. Search & Filter
- Search by name, contact, email, or business name
- Filter by profession
- Filter by customer type
- Clear all filters option

### 3. Stats Dashboard
- Total Customers count
- Business Owners count
- Upcoming Birthdays (next 30 days)
- Upcoming Anniversaries (next 30 days)

### 4. Add/Edit Customer
- Comprehensive form with all fields
- Organized into sections:
  - Basic Information
  - Personal Details
  - Professional Details
  - Business Details (conditional based on "Is Business Owner")
  - Additional Information
- Form validation
- Success/error toast notifications

### 5. Delete Customer
- Soft delete (sets is_active to false)
- Confirmation dialog before deletion
- Data preserved in database

## Integration with Policies

When adding a new policy, you can automatically create or link to a customer:

```typescript
// In your AddPolicy component
import { findOrCreateCustomerFromPolicy } from '../services';

const handlePolicySubmit = async (policyData) => {
  // Create or find customer
  const customerId = await findOrCreateCustomerFromPolicy(
    policyData.policyholderName,
    policyData.contactNo,
    policyData.emailId
  );
  
  // If needed, add customerId to your policy data
  // ...rest of policy creation logic
};
```

This will:
- Check if a customer exists with the same contact number
- If found, return the existing customer ID
- If not found, create a new customer record
- Return the customer ID for linking

## Database Schema Details

### Table: `customers`
- Primary Key: `id` (UUID)
- Foreign Key: `user_id` references `auth.users(id)`
- Unique Constraint: `(user_id, contact_no)` - Prevents duplicate customers with same contact for a user
- RLS Enabled: Users can only see/edit their own customers
- Timestamps: Auto-updated `created_at` and `updated_at`

### Indexes
- `user_id` - Fast user-based queries
- `contact_no` - Fast contact lookup
- `email_id` - Fast email lookup
- `customer_name` - Fast name search
- `is_active` - Filter active customers
- `date_of_birth` - Birthday reminders
- `anniversary_date` - Anniversary reminders
- `profession` - Filter by profession
- `is_business_owner` - Filter business owners

## Security
- Row Level Security (RLS) enabled
- Users can only access their own customers
- Policies enforce user isolation
- Soft delete preserves data integrity

## Future Enhancements (Optional)

1. **Customer-Policy Linking**
   - Add `customer_id` field to policies table
   - Show all policies for a customer
   - Customer lifetime value calculation

2. **Birthday/Anniversary Reminders**
   - Dashboard widget for upcoming events
   - Email/SMS notifications
   - Greeting message templates

3. **Customer Segments**
   - Tag-based segmentation
   - Custom reports by segment
   - Bulk actions on segments

4. **Customer Notes & History**
   - Timeline of interactions
   - Follow-up reminders
   - Communication history

5. **Import/Export**
   - Bulk import customers from CSV/Excel
   - Export customer database
   - Sync with other systems

## Troubleshooting

### Table Creation Issues
- Ensure you have proper permissions in Supabase
- Check if RLS policies are created correctly
- Verify auth.users table exists (Supabase default)

### Customer Not Appearing
- Check RLS is enabled and working
- Verify user is authenticated
- Check browser console for errors

### Auto-Creation Not Working
- Verify the function is being called
- Check if customer already exists with that contact
- Verify user_id is being passed correctly

## Support
If you encounter any issues:
1. Check the browser console for errors
2. Verify the database table was created correctly
3. Ensure RLS policies are active
4. Check that user is properly authenticated

## Summary
You now have a complete customer management system that:
✅ Stores comprehensive customer information
✅ Supports manual customer entry
✅ Can auto-create customers from policies
✅ Tracks personal and business details
✅ Provides birthday and anniversary reminders
✅ Includes search and filter capabilities
✅ Has secure data isolation with RLS
✅ Integrates seamlessly with your existing app
