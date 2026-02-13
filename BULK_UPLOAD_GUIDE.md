# Bulk CSV Upload Feature - Complete Guide

## Overview

The bulk CSV upload feature allows users to import multiple policies at once using a CSV (Comma-Separated Values) file. This feature includes:

- **Template Download**: Pre-formatted CSV template with all available fields
- **Flexible Column Mapping**: Auto-maps CSV columns to database fields
- **Batch Processing**: Upload multiple policies with progress tracking
- **Error Handling**: Detailed error messages for failed rows with data preview
- **Success Tracking**: Shows success count, failure count, and success rate

## Key Features

### 1. **No Mandatory Column Restrictions**
- Users can leave optional fields blank
- Only these fields are required:
  - Policyholder Name
  - Policy Type
  - Policy Number
  - Insurance Company
  - Policy Start Date
  - Policy End Date

### 2. **Auto User Capture**
- User ID is automatically captured from the logged-in account
- **Do NOT include User ID in the CSV** - the system knows who is uploading

### 3. **Automatic Date Format Detection**
- Supports multiple date formats:
  - DD-MM-YYYY (e.g., 01-01-2024)
  - YYYY-MM-DD (e.g., 2024-01-01)
  - Automatically normalizes to YYYY-MM-DD in database

### 4. **Numeric Field Handling**
- Automatically converts numeric strings to numbers
- Falls back to string storage if conversion fails

### 5. **Activity Logging**
- Each uploaded policy is logged in activity history
- Shows who uploaded and when

## CSV Column Reference

### Required Columns
| Column Name | Description | Format | Example |
|---|---|---|---|
| Policyholder Name | Name of the policy holder | Text | John Doe |
| Policy Type | Type of policy | Text (General/Life) | General |
| Policy Number | Unique policy number | Text | POL123456 |
| Insurance Company | Insurance provider name | Text | ICICI Lombard |
| Policy Start Date | Policy beginning date | DD-MM-YYYY | 01-01-2024 |
| Policy End Date | Policy expiration date | DD-MM-YYYY | 31-12-2024 |

### Optional Columns
| Column Name | Description | Format | Example |
|---|---|---|---|
| Contact No | Phone number | Text | 9876543210 |
| Email ID | Email address | Email | john@example.com |
| Address | Physical address | Text | 123 Main St |
| Product Type | Insurance product | Text | Two Wheeler |
| Premium Amount | Premium cost | Number | 5000 |
| Net Premium | Premium before tax | Number | 4500 |
| OD Premium | OD premium for vehicles | Number | 2500 |
| Third Party Premium | TP premium for vehicles | Number | 1500 |
| GST | Tax amount | Number | 500 |
| Total Premium | Total with tax | Number | 5000 |
| IDV | Insured Declared Value | Number | 50000 |
| Commission Percentage | Commission % | Number | 10 |
| Commission Amount | Commission amount | Number | 500 |
| Registration No | Vehicle registration | Text | ABC1234 |
| Engine No | Engine number | Text | EN123456 |
| Chasis No | Chassis number | Text | CH123456 |
| HP | Horsepower | Number | 1000 |
| Risk Location Address | Risk address | Text | 456 Oak Ave |
| Sub Agent ID | Sub-agent identifier | Text | SA001 |
| Sub Agent Commission % | Sub-agent commission % | Number | 5 |
| Sub Agent Commission Amount | Sub-agent commission amount | Number | 250 |
| NCB Percentage | No Claim Bonus % | Number | 10 |
| Business Type | Business category | Text (New/Renewal/Rollover) | New |
| Member Of | Group head member reference | Text | GH001 |
| Remark | Additional notes | Text | Special offer |
| Reference From Name | Reference source | Text | Mr. sharma |
| Payment Frequency | Payment interval | Text | Monthly |
| Nominee Name | Nominee name | Text | Jane Doe |
| Nominee Relationship | Nominee relation | Text | Spouse |
| Repeat Reminder | Life insurance reminder | Text (Monthly/Quarterly/Half-yearly/Yearly) | Monthly |

## How to Use

### Step 1: Download Template
1. Navigate to **Add Policy** page
2. Click on **Bulk Upload (CSV)** tab
3. Click **Download Template** button
4. Template opens in default CSV/Excel application

### Step 2: Fill in Data
1. Keep the header row (first row) unchanged
2. Fill in your policy data starting from row 2
3. For required fields, provide valid data
4. Leave optional fields blank if not needed
5. Ensure dates are in DD-MM-YYYY format
6. Save the file

### Step 3: Upload File
1. Return to **Bulk Upload (CSV)** tab
2. Drag and drop file or click to select
3. Click **Upload Policies** button
4. Wait for processing to complete

### Step 4: Review Results
- **Summary Cards** show total, successful, and failed uploads
- **Success Rate** bar displays percentage
- **Failed Uploads** section shows errors for each failed row
- Click row details to see the problematic data

### Step 5: Handle Failures
1. Review error messages for each failed row
2. Correct the data in your CSV
3. Upload the corrected file again
4. Successfully uploaded policies won't be duplicated

## Error Messages & Solutions

### "Policyholder name is required"
**Solution**: Ensure the "Policyholder Name" column has a value for each row

### "Policy number is required"
**Solution**: Fill in the "Policy Number" column for each policy

### "Insurance company is required"
**Solution**: Ensure "Insurance Company" column is populated

### "Policy type is required"
**Solution**: Set "Policy Type" to "General" or "Life"

### "Policy start date is required"
**Solution**: Provide a valid date in DD-MM-YYYY format

### "Policy end date is required"
**Solution**: Provide a valid expiry date in DD-MM-YYYY format

### "Failed to read file"
**Solution**: Ensure file is a valid CSV format

## CSV File Format Examples

### Minimal Required Fields
```csv
Policyholder Name,Policy Type,Policy Number,Insurance Company,Policy Start Date,Policy End Date
John Doe,General,POL123456,ICICI Lombard,01-01-2024,31-12-2024
Jane Smith,Life,POL789012,HDFC Life,15-03-2024,14-03-2034
```

### Complete Record with Optional Fields
```csv
Policyholder Name,Contact No,Email ID,Policy Type,Policy Number,Insurance Company,Product Type,Policy Start Date,Policy End Date,Net Premium,OD Premium,GST,Commission Percentage,Registration No
John Doe,9876543210,john@example.com,General,POL123456,ICICI Lombard,Two Wheeler,01-01-2024,31-12-2024,4500,2500,500,10,ABC1234
```

## Tips & Best Practices

1. **Validate Before Upload**: Check for typos and ensure all dates are in correct format
2. **Use Correct Insurance Names**: Match existing insurance company names in your system
3. **Date Consistency**: Use DD-MM-YYYY format throughout to avoid parsing errors
4. **Phone Numbers**: Include country code or ensure format consistency
5. **Batch Size**: Upload in batches (50-100 rows) for easier error tracking
6. **Keep Template**: Keep the downloaded template for future uploads
7. **Backup Original**: Keep a backup of your original data

## Technical Details

### Processing Flow
1. Parse CSV file into rows
2. Map CSV columns to database fields
3. Validate each row against required fields
4. Insert valid policies into database
5. Log each insertion in activity history
6. Return results with success/failure details

### Column Auto-Detection
The system auto-maps common column name variations:
- "Policyholder Name", "policyholder_name", "holder_name", "customer_name" → Policyholder Name
- "Start Date", "start_date", "fromDate", "from_date" → Policy Start Date
- "Expiry Date", "expiry_date", "end_date", "toDate" → Policy End Date
- And many more variations...

### Data Validation
- Required fields checked before insertion
- Dates normalized to YYYY-MM-DD format
- Numbers parsed and validated
- Empty optional fields allowed
- Duplicate policy numbers allowed (user's choice)

### Performance
- Processes typically complete in seconds for 50-100 rows
- Progress bar updates in real-time
- Large files (500+ rows) processed efficiently
- No database locks - other users can work simultaneously

## FAQ

**Q: Can I upload duplicate policy numbers?**
A: Yes, the system allows duplicate policy numbers if you need them.

**Q: What if I include the User ID column?**
A: It will be ignored - User ID is always taken from the logged-in account.

**Q: Can I update existing policies with this feature?**
A: No, this feature only adds new policies. Use the Edit function for updates.

**Q: What's the maximum file size?**
A: CSV files are text-based and very small. Practical limit is 10,000+ rows.

**Q: Can I revert an upload?**
A: Failed rows don't insert. For accidental uploads, delete policies from the Policies page.

**Q: Does the system check for duplicate policies?**
A: No, each row is inserted independently. It's your responsibility to avoid duplicates.

**Q: What date formats are supported?**
A: DD-MM-YYYY, YYYY-MM-DD, and MM-DD-YYYY are all supported.

**Q: Can I use Excel files directly?**
A: Excel files can be saved as CSV (.csv) format and then uploaded.

**Q: What if a field has comma in it?**
A: Enclose the field in double quotes: "City, State"

## Support

For issues or questions:
1. Check error messages carefully - they indicate the exact problem
2. Verify date format is DD-MM-YYYY
3. Ensure required fields are populated
4. Test with a small batch first
5. Download the template again if unsure about format
