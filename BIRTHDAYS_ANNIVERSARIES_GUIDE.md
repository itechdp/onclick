# 🎉 Birthdays & Anniversaries Feature Guide

## Overview

The Birthdays & Anniversaries page is a comprehensive celebration management system that helps you:
- **Never miss important dates**: Track customer birthdays and anniversaries
- **Send personalized wishes**: WhatsApp integration for instant messaging
- **Create custom templates**: Build and manage message templates
- **Stay organized**: View today's events and upcoming celebrations in ascending date order

## Features

### 📊 Dashboard Stats

The page displays four key metrics:
1. **Today's Events**: Number of birthdays/anniversaries happening today
2. **Upcoming Birthdays**: Count of birthdays in the next 90 days
3. **Upcoming Anniversaries**: Count of anniversaries in the next 90 days
4. **Message Templates**: Total number of available templates

### 🎂 Event Display

Events are organized into two sections:

#### Today's Celebrations
- Prominently displayed at the top with "TODAY! 🎉" badge
- Color-coded borders (purple for birthdays, pink for anniversaries)
- Immediate "Send Wishes" button for quick action

#### Upcoming Events
- Sorted in ascending order by date (nearest first)
- Shows days until event (e.g., "Tomorrow", "In 5 days")
- Displays next 90 days of events
- Both birthdays and anniversaries in chronological order

### 💬 WhatsApp Integration

**Instant Messaging**
- Click "Send Wishes" button on any event card
- Opens WhatsApp Web/App with pre-filled message
- Message uses selected template with customer name
- Automatically formats phone numbers for WhatsApp

**Requirements**
- Customer must have a valid contact number
- WhatsApp must be installed or accessible via web

### 📝 Message Templates

#### Default Templates

**Birthday Templates:**
1. **Simple Birthday**
   ```
   🎉 Happy Birthday {name}! 🎂

   Wishing you a wonderful day filled with joy and happiness!

   Best regards,
   {company}
   ```

2. **Warm Birthday**
   ```
   🎈 Dear {name},

   Warmest birthday wishes to you! May this special day bring you 
   endless joy and tons of precious memories!

   Have a fantastic celebration! 🎉

   - {company}
   ```

**Anniversary Templates:**
1. **Simple Anniversary**
   ```
   💐 Happy Anniversary {name}! 💑

   Wishing you both a wonderful day and many more years of love 
   and happiness together!

   Warm regards,
   {company}
   ```

2. **Warm Anniversary**
   ```
   ❤️ Dear {name},

   Wishing you a very Happy Anniversary! May your love continue 
   to grow stronger with each passing year.

   Celebrate this beautiful journey! 💕

   - {company}
   ```

#### Custom Templates

**Creating a New Template:**
1. Click "New Template" button in the header
2. Fill in template details:
   - **Template Name**: Give it a descriptive name (e.g., "Corporate Birthday")
   - **Template Type**: Select Birthday or Anniversary
   - **Message**: Write your message with placeholders
3. See live preview as you type
4. Click "Save Template" to save

**Template Placeholders:**
- `{name}` - Replaced with customer name
- `{company}` - Replaced with your company name

**Example Custom Template:**
```
🎊 Hi {name}!

{company} wishes you a very Happy Birthday!

We hope this year brings you prosperity and success.

Team {company}
```

**Managing Templates:**
- Edit any custom template by clicking on it
- Delete custom templates (default templates cannot be deleted)
- Set a default template for quick sending
- Templates are saved locally in your browser

### ⚙️ Settings

**Company Name Configuration:**
- Set your company/business name in the settings section
- This name will be used in all template messages
- Default: "OnClicks.in"
- Changes are saved automatically

**Default Template Selection:**
- Choose a default template for quick sending
- Applies to all "Send Wishes" buttons
- Can be changed anytime
- Templates are organized by type (birthday/anniversary)

## How to Use

### Step 1: Add Customer Details

Before events appear, ensure customer profiles include:
- **Date of Birth** (for birthdays)
- **Anniversary Date** (for anniversaries)
- **Contact Number** (for WhatsApp messaging)

Go to Customers page → Add/Edit customer → Fill in Personal Details section

### Step 2: Configure Settings

1. Set your company name in the settings panel
2. Create custom message templates (optional)
3. Select a default template for quick sending

### Step 3: View Events

Navigate to **Celebrations** in the sidebar to see:
- Today's events at the top
- Upcoming events in chronological order
- Event cards with customer details and countdown

### Step 4: Send Wishes

**Quick Send (using default template):**
1. Find the event card
2. Click "Send Wishes" button
3. WhatsApp opens with pre-filled message
4. Add any personal touches
5. Send the message

**Send with Specific Template:**
1. Select desired template from dropdown
2. Click "Send Wishes" on event card
3. WhatsApp opens with that template's message

### Step 5: Manage Templates

**Create Custom Template:**
1. Click "New Template" button
2. Enter name and select type
3. Write your message with {name} and {company} placeholders
4. Preview the message
5. Save template

**Edit Template:**
1. Select the template you want to edit
2. Make changes to name, type, or message
3. Save changes

**Delete Template:**
1. Open template for editing
2. Click "Delete Template" button
3. Confirm deletion

## Best Practices

### 📅 Planning Ahead

- Check the page weekly to prepare for upcoming events
- Review events 2-3 days in advance
- Create special templates for VIP customers
- Plan batch messaging for multiple events on same day

### 💡 Template Tips

**Do:**
- Keep messages warm and personal
- Use emojis appropriately 🎉 🎂 💐
- Include your company name for branding
- Keep messages concise (WhatsApp-friendly length)
- Test templates before using them

**Don't:**
- Make messages too long
- Use only uppercase text (appears aggressive)
- Forget to include {name} placeholder
- Use overly formal language for celebrations

### 📱 WhatsApp Integration

**Tips for Success:**
- Ensure phone numbers are in international format
- Test with your own number first
- Have WhatsApp Web logged in for desktop use
- Keep messages professional yet friendly
- Add personal notes before sending

### 🎯 Customer Engagement

**Build Stronger Relationships:**
1. Send wishes early in the day
2. Personalize default templates with additional notes
3. Follow up with a phone call for VIP customers
4. Track responses and engagement
5. Create seasonal templates (e.g., milestone birthdays)

## Technical Details

### Data Source

Events are automatically pulled from:
- **Customers table**: `date_of_birth` and `anniversary_date` fields
- **User isolation**: Only shows your customers (RLS enforced)
- **Active customers**: Only displays active customer records

### Date Calculation

- **Today's events**: Matches current date (day and month)
- **Upcoming events**: Next 90 days from today
- **Year handling**: Automatically calculates next occurrence
- **Sorting**: Ascending by days until event (0 for today, 1 for tomorrow, etc.)

### WhatsApp Format

Phone numbers are automatically formatted:
- Removes all non-numeric characters
- Creates WhatsApp URL: `https://wa.me/{number}?text={message}`
- URL-encodes the message for proper transmission

### Storage

- **Templates**: Stored in browser's localStorage
- **Company name**: Stored in browser's localStorage
- **Default template selection**: Stored in localStorage
- **Customer data**: Fetched from Supabase database

## Troubleshooting

### No Events Showing

**Problem**: Page shows "No upcoming events"

**Solutions:**
1. Check if customers have date_of_birth or anniversary_date filled
2. Verify dates are in correct format (YYYY-MM-DD)
3. Ensure customers are marked as active (is_active = true)
4. Check if events are more than 90 days away

### WhatsApp Not Opening

**Problem**: "Send Wishes" button doesn't open WhatsApp

**Solutions:**
1. Verify customer has valid contact number
2. Check browser allows pop-ups from your site
3. Ensure WhatsApp is installed or use WhatsApp Web
4. Check phone number format (should have country code)

### Template Not Saving

**Problem**: Custom template doesn't save

**Solutions:**
1. Ensure template name is filled
2. Check message field is not empty
3. Verify browser allows localStorage
4. Try clearing browser cache and creating again

### Wrong Company Name in Messages

**Problem**: Messages show incorrect company name

**Solutions:**
1. Update company name in settings panel
2. Check for typos in company name field
3. Refresh page after changing company name
4. Verify template uses {company} placeholder correctly

## Integration with Customers

The Birthdays & Anniversaries page is seamlessly integrated with the Customers module:

- **Auto-sync**: Updates automatically when customer data changes
- **Real-time**: Reflects latest customer information
- **Two-way**: Edit customer from either page
- **Consistent**: Uses same date format and validation

## Future Enhancements

Potential features for future versions:
- Email integration in addition to WhatsApp
- SMS messaging option
- Automated scheduling (send wishes automatically)
- Bulk messaging for multiple events
- Analytics (track sent messages)
- Gift suggestions based on customer preferences
- Integration with calendar apps
- Reminder notifications before events

## Support

If you encounter any issues:
1. Check this guide for troubleshooting steps
2. Verify customer data is correct in Customers page
3. Test WhatsApp with a known working number
4. Contact support through the Support page
5. Report bugs or request features via Feature Requests page

---

## Quick Reference Card

### Navigation
- Access via **Sidebar → Celebrations** (Gift icon)

### Key Actions
- **Send Wishes**: Click button on event card
- **Create Template**: "New Template" button in header
- **Set Company Name**: Update in settings panel
- **Select Default Template**: Dropdown in settings

### Placeholders
- `{name}` → Customer name
- `{company}` → Your company name

### Event Display
- **Purple** = Birthdays 🎂
- **Pink** = Anniversaries 💑
- **Green badge** = Today's events 🎉

### Date Range
- Shows next **90 days** of events
- Sorted in **ascending order** (nearest first)

---

**Version**: 1.0  
**Last Updated**: February 2026  
**Compatible With**: OnClicks.in Customer Management System
