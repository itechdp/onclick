import { policyService } from './policyService';
import { Policy } from '../types';

export interface CSVColumnMapping {
  [key: string]: string; // CSV header -> database field mapping
}

export interface BulkUploadResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  results: Array<{
    rowIndex: number;
    success: boolean;
    policyId?: string;
    error?: string;
    data?: Record<string, any>;
  }>;
}

// Define column mapping from CSV headers to Policy fields
const DEFAULT_COLUMN_MAPPING: CSVColumnMapping = {
  'Policyholder Name': 'policyholderName',
  'Contact No': 'contactNo',
  'Email ID': 'emailId',
  'Policy Type': 'policyType', // General, Life, etc.
  'Policy Number': 'policyNumber',
  'Insurance Company': 'insuranceCompany',
  'Product Type': 'productType',
  'Policy Start Date': 'policyStartDate', // DD-MM-YYYY or YYYY-MM-DD
  'Policy End Date': 'policyEndDate', // DD-MM-YYYY or YYYY-MM-DD
  'Premium Amount': 'premiumAmount',
  'Net Premium': 'netPremium',
  'OD Premium': 'odPremium',
  'Third Party Premium': 'thirdPartyPremium',
  'GST': 'gst',
  'Total Premium': 'totalPremium',
  'Registration No': 'registrationNo',
  'Engine No': 'engineNo',
  'Chasis No': 'chasisNo',
  'HP': 'hp',
  'Risk Location Address': 'riskLocationAddress',
  'IDV': 'idv',
  'Commission Percentage': 'commissionPercentage',
  'Commission Amount': 'commissionAmount',
  'Sub Agent ID': 'subAgentId',
  'Sub Agent Commission %': 'subAgentCommissionPercentage',
  'Sub Agent Commission Amount': 'subAgentCommissionAmount',
  'NCB Percentage': 'ncbPercentage',
  'Business Type': 'businessType',
  'Member Of': 'memberOf',
  'Remark': 'remark',
  'Reference From Name': 'referenceFromName',
  'Address': 'address',
  'Payment Frequency': 'paymentFrequency',
  'Nominee Name': 'nomineeName',
  'Nominee Relationship': 'nomineeRelationship',
  'Repeat Reminder': 'repeatReminder',
};

// Helper function to parse CSV
export const parseCSV = (csvText: string): Array<Record<string, string>> => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have header row and at least one data row');
  }

  // Parse headers
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  // Parse data rows
  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    // Handle quoted fields with commas
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
};

// Helper function to normalize date format
const normalizeDate = (dateStr: string | null | undefined): string | null => {
  if (!dateStr) return null;
  
  dateStr = dateStr.trim();
  if (!dateStr) return null;

  // Try to detect format and convert to YYYY-MM-DD
  const parts = dateStr.split(/[-\/]/);
  
  if (parts.length !== 3) return null;

  let year, month, day;

  // Try DD-MM-YYYY format first
  if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
    day = parts[0];
    month = parts[1];
    year = parts[2];
  }
  // Try YYYY-MM-DD format
  else if (parts[2].length === 4) {
    year = parts[2];
    month = parts[1];
    day = parts[0];
  }
  // Try MM-DD-YYYY format
  else if (parts[0].length === 4) {
    year = parts[0];
    month = parts[1];
    day = parts[2];
  }
  else {
    return null;
  }

  // Validate month and day
  const monthNum = parseInt(month);
  const dayNum = parseInt(day);
  
  if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
    return null;
  }

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

// Map CSV row to Policy object
const mapRowToPolicy = (row: Record<string, string>): Record<string, any> => {
  const mappedData: Record<string, any> = {
    policyholderName: '',
    policyNumber: '',
    insuranceCompany: '',
    policyType: 'General',
  };

  // Map each column from the CSV
  Object.entries(DEFAULT_COLUMN_MAPPING).forEach(([csvHeader, policyField]) => {
    const value = row[csvHeader];

    if (!value || value.trim() === '') {
      return;
    }

    const trimmedValue = value.trim();

    // Handle date fields
    if (policyField === 'policyStartDate' || policyField === 'policyEndDate') {
      const normalizedDate = normalizeDate(trimmedValue);
      if (normalizedDate) {
        mappedData[policyField] = normalizedDate;
      }
      return;
    }

    // Handle numeric fields
    if (
      policyField === 'premiumAmount' ||
      policyField === 'netPremium' ||
      policyField === 'odPremium' ||
      policyField === 'thirdPartyPremium' ||
      policyField === 'gst' ||
      policyField === 'totalPremium' ||
      policyField === 'commissionPercentage' ||
      policyField === 'commissionAmount' ||
      policyField === 'subAgentCommissionPercentage' ||
      policyField === 'subAgentCommissionAmount' ||
      policyField === 'ncbPercentage' ||
      policyField === 'idv' ||
      policyField === 'hp'
    ) {
      const numValue = parseFloat(trimmedValue);
      if (!isNaN(numValue)) {
        mappedData[policyField] = numValue;
      } else {
        mappedData[policyField] = trimmedValue; // Store as string if not a valid number
      }
      return;
    }

    // Handle boolean field
    if (policyField === 'isOneTimePolicy') {
      mappedData[policyField] = 
        trimmedValue.toLowerCase() === 'yes' || 
        trimmedValue.toLowerCase() === 'true' || 
        trimmedValue === '1';
      return;
    }

    // All other fields stored as strings
    mappedData[policyField] = trimmedValue;
  });

  return mappedData;
};

// Validate mapped policy data
const validatePolicyData = (policy: Record<string, any>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate required fields (based on previous form validation)
  if (!policy.policyholderName || !policy.policyholderName.toString().trim()) {
    errors.push('Policyholder name is required');
  }

  if (!policy.policyNumber || !policy.policyNumber.toString().trim()) {
    errors.push('Policy number is required');
  }

  if (!policy.insuranceCompany || !policy.insuranceCompany.toString().trim()) {
    errors.push('Insurance company is required');
  }

  if (!policy.policyType || !policy.policyType.toString().trim()) {
    errors.push('Policy type is required');
  }

  if (!policy.policyStartDate) {
    errors.push('Policy start date is required');
  }

  if (!policy.policyEndDate) {
    errors.push('Policy end date is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Main bulk upload function
export const bulkUploadService = {
  parseCSVFile: async (file: File): Promise<Array<Record<string, string>>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvText = e.target?.result as string;
          const rows = parseCSV(csvText);
          resolve(rows);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    });
  },

  bulkUploadPolicies: async (
    csvFile: File,
    userId: string,
    userDisplayName?: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<BulkUploadResult> => {
    const result: BulkUploadResult = {
      totalRows: 0,
      successCount: 0,
      failureCount: 0,
      results: [],
    };

    try {
      // Parse CSV file
      const rows = await bulkUploadService.parseCSVFile(csvFile);
      result.totalRows = rows.length;

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        try {
          // Map CSV row to Policy object
          const mappedPolicy = mapRowToPolicy(row);

          // Validate policy data
          const validation = validatePolicyData(mappedPolicy);
          if (!validation.valid) {
            result.failureCount++;
            result.results.push({
              rowIndex: i + 2, // +1 for header, +1 for 1-based indexing
              success: false,
              error: validation.errors.join('; '),
              data: row,
            });
            onProgress?.(i + 1, rows.length);
            continue;
          }

          // Prepare policy data for insertion
          const repeatReminderValue = mappedPolicy.repeatReminder || '';
          const isValidRepeatReminder = ['Monthly', 'Quarterly', 'Half-yearly', 'Yearly', ''].includes(repeatReminderValue);
          
          const policyData: Omit<Policy, 'id' | 'createdAt' | 'updatedAt'> = {
            policyholderName: mappedPolicy.policyholderName || '',
            policyNumber: mappedPolicy.policyNumber || '',
            insuranceCompany: mappedPolicy.insuranceCompany || '',
            policyType: mappedPolicy.policyType || 'General',
            contactNo: mappedPolicy.contactNo || undefined,
            emailId: mappedPolicy.emailId || undefined,
            address: mappedPolicy.address || undefined,
            premiumAmount: mappedPolicy.premiumAmount !== undefined && !isNaN(mappedPolicy.premiumAmount) ? mappedPolicy.premiumAmount : undefined,
            coverageAmount: mappedPolicy.coverageAmount !== undefined && !isNaN(mappedPolicy.coverageAmount) ? mappedPolicy.coverageAmount : undefined,
            policyStartDate: mappedPolicy.policyStartDate,
            policyEndDate: mappedPolicy.policyEndDate,
            premiumDueDate: mappedPolicy.premiumDueDate || undefined,
            status: 'active',
            paymentFrequency: mappedPolicy.paymentFrequency || undefined,
            nomineeName: mappedPolicy.nomineeName || undefined,
            nomineeRelationship: mappedPolicy.nomineeRelationship || undefined,
            notes: mappedPolicy.notes || undefined,
            documents: [],
            businessType: mappedPolicy.businessType || 'New',
            memberOf: mappedPolicy.memberOf || undefined,
            registrationNo: mappedPolicy.registrationNo || undefined,
            engineNo: mappedPolicy.engineNo || undefined,
            chasisNo: mappedPolicy.chasisNo || undefined,
            hp: mappedPolicy.hp || undefined,
            riskLocationAddress: mappedPolicy.riskLocationAddress || undefined,
            idv: mappedPolicy.idv?.toString() || undefined,
            netPremium: mappedPolicy.netPremium?.toString() || undefined,
            odPremium: mappedPolicy.odPremium?.toString() || undefined,
            thirdPartyPremium: mappedPolicy.thirdPartyPremium?.toString() || undefined,
            gst: mappedPolicy.gst?.toString() || undefined,
            totalPremium: mappedPolicy.totalPremium?.toString() || undefined,
            commissionPercentage: mappedPolicy.commissionPercentage?.toString() || undefined,
            commissionAmount: mappedPolicy.commissionAmount?.toString() || undefined,
            subAgentId: mappedPolicy.subAgentId || undefined,
            subAgentCommissionPercentage: mappedPolicy.subAgentCommissionPercentage?.toString() || undefined,
            subAgentCommissionAmount: mappedPolicy.subAgentCommissionAmount?.toString() || undefined,
            remark: mappedPolicy.remark || undefined,
            productType: mappedPolicy.productType || undefined,
            referenceFromName: mappedPolicy.referenceFromName || undefined,
            isOneTimePolicy: mappedPolicy.isOneTimePolicy || false,
            ncbPercentage: mappedPolicy.ncbPercentage?.toString() || undefined,
            repeatReminder: (isValidRepeatReminder ? repeatReminderValue : '') as any,
          };

          // Insert policy
          const policyId = await policyService.addPolicy(policyData, userId, userDisplayName);

          result.successCount++;
          result.results.push({
            rowIndex: i + 2, // +1 for header, +1 for 1-based indexing
            success: true,
            policyId,
            data: row,
          });
        } catch (error) {
          result.failureCount++;
          result.results.push({
            rowIndex: i + 2,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            data: row,
          });
        }

        onProgress?.(i + 1, rows.length);
      }
    } catch (error) {
      throw error;
    }

    return result;
  },

  generateCSVTemplate: (): string => {
    const headers = Object.keys(DEFAULT_COLUMN_MAPPING);
    const requiredFields = [
      'Policyholder Name',
      'Policy Type',
      'Policy Number',
      'Insurance Company',
      'Policy Start Date',
      'Policy End Date',
    ];

    // Create header row
    const headerRow = headers.map(h => `"${h}"`).join(',');

    // Create example row
    const exampleRow = headers.map(h => {
      if (h === 'Policyholder Name') return '"John Doe"';
      if (h === 'Contact No') return '"9876543210"';
      if (h === 'Email ID') return '"john@example.com"';
      if (h === 'Policy Type') return '"General"';
      if (h === 'Policy Number') return '"POL123456"';
      if (h === 'Insurance Company') return '"ICICI Lombard"';
      if (h === 'Product Type') return '"Two Wheeler"';
      if (h === 'Policy Start Date') return '"01-01-2024"';
      if (h === 'Policy End Date') return '"31-12-2024"';
      if (h === 'Premium Amount') return '5000';
      if (h === 'Net Premium') return '4500';
      if (h === 'GST') return '500';
      if (h === 'Total Premium') return '5000';
      if (h === 'Commission Percentage') return '10';
      if (h === 'Commission Amount') return '500';
      if (h === 'Business Type') return '"New"';
      if (h === 'Registration No') return '"ABC1234"';
      return '""';
    }).join(',');

    // Create info row (for reference)
    const infoRow = headers.map(h => {
      if (requiredFields.includes(h)) return '"[REQUIRED]"';
      return '"[Optional]"';
    }).join(',');

    return `${headerRow}\n${infoRow}\n${exampleRow}`;
  },

  downloadTemplate: (): void => {
    const csv = bulkUploadService.generateCSVTemplate();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `policies_template_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  generateExcelTemplate: (): void => {
    // This creates a CSV file that can be opened in Excel
    // For a true .xlsx file, you'd need a library like exceljs or xlsxdoc
    bulkUploadService.downloadTemplate();
  }
};
