# Settings Page - User Guide

## Overview
The Settings page allows you to customize dropdown options used in the Add Policy form. You can manage Insurance Companies, Product Types, and Line of Business (LOB) options.

## Features

### 1. **Tab Navigation**
- Switch between three categories:
  - Insurance Company
  - Product Type  
  - Line of Business (LOB)

### 2. **Search Functionality**
- Search bar at the top to filter existing items
- Real-time filtering as you type
- Shows count of filtered results

### 3. **Statistics Display**
- **Total**: Number of items you've added
- **Available defaults**: Number of default values not yet added
- **Filtered**: Number of results matching your search (when searching)

### 4. **Managing Items**

#### Add New Item (Manual)
1. Click "Add New" button
2. Enter the value in the modal
3. Click "Add" to save

#### Edit Existing Item
1. Click the edit icon (pencil) next to any item
2. Modify the text
3. Click the save icon (checkmark) to save or X to cancel

#### Delete Item
1. Click the delete icon (trash) next to any item
2. Confirm the deletion

### 5. **Load Default Values**

#### Load Category Defaults
- Click "Load Defaults" in the page header
- Loads all default values for the current category
- System comes with pre-configured defaults:
  - **56 Insurance Companies** (Life Insurance Corporation, HDFC Life, ICICI Prudential, etc.)
  - **136 Product Types** (Term Insurance, Endowment Plans, ULIPs, etc.)
  - **11 LOBs** (Life, Health, Motor, etc.)

#### Load All Categories at Once
- Click "Load All Categories" button
- Bulk imports defaults for all three categories
- Useful for initial setup

### 6. **Quick Add from Defaults**
- When viewing a category, available defaults are shown at the bottom
- Click on any default value to quickly add it
- Hover to see the + icon
- Click "Add All" to import all available defaults for that category

### 7. **Empty State**
- When no items exist, you'll see helpful options:
  - Load defaults
  - Add manually

## Database Setup Required

Before using this feature, you need to execute this SQL script in Supabase:

```sql
-- Run: CREATE_POLICY_SETTINGS_TABLE.sql
```

This creates the `policy_settings` table with Row Level Security (RLS) policies.

## How It Works

1. **User-Specific Settings**: Each user has their own set of dropdown options
2. **Default Values**: System provides comprehensive defaults based on Indian insurance market
3. **Customization**: Users can add, edit, or delete options as needed
4. **Search & Filter**: Easy to find and manage options even with large lists

## Integration with Add Policy

The dropdown options you configure here will automatically appear in the Add Policy form's dropdowns:
- Insurance Company dropdown
- Product Type dropdown
- LOB dropdown

## Tips

- **Initial Setup**: Use "Load All Categories" to quickly populate with defaults
- **Customization**: Add company-specific or custom options as needed
- **Search**: Use search when managing large lists (e.g., 100+ product types)
- **Quick Add**: Use the "Available Defaults" section to selectively add popular options
- **Cleanup**: Remove unused options to keep dropdowns manageable

## Color Coding

- **Blue**: Available default values (not yet added)
- **White/Gray**: Your added values
- **Green**: Success actions (save, add)
- **Red**: Delete actions

## Keyboard Shortcuts

- **Enter**: Save when editing an item
- **Escape**: Cancel editing

## Technical Notes

- Changes are saved in real-time to Supabase
- RLS ensures data isolation between users
- Duplicate prevention: Can't add the same value twice
- Soft delete: Items are marked inactive, not permanently deleted
