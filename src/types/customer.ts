export interface Customer {
  id: string;
  userId: string;
  user_id?: string;
  
  // Basic Information
  customerName: string;
  customer_name?: string;
  contactNo?: string;
  contact_no?: string;
  emailId?: string;
  email_id?: string;
  address?: string;
  
  // Personal Details
  dateOfBirth?: Date | string;
  date_of_birth?: Date | string;
  anniversaryDate?: Date | string;
  anniversary_date?: Date | string;
  gender?: 'Male' | 'Female' | 'Other';
  
  // Professional Details
  profession?: string;
  occupation?: string;
  companyName?: string;
  company_name?: string;
  
  // Business Details
  isBusinessOwner?: boolean;
  is_business_owner?: boolean;
  businessName?: string;
  business_name?: string;
  businessType?: string;
  business_type?: string;
  businessAddress?: string;
  business_address?: string;
  gstNumber?: string;
  gst_number?: string;
  panNumber?: string;
  pan_number?: string;
  businessEstablishedDate?: Date | string;
  business_established_date?: Date | string;
  
  // Additional Information
  referenceBy?: string;
  reference_by?: string;
  customerType?: 'Individual' | 'Corporate' | 'Family';
  customer_type?: 'Individual' | 'Corporate' | 'Family';
  notes?: string;
  tags?: string[];
  
  // Status
  isActive?: boolean;
  is_active?: boolean;
  
  // Metadata
  createdAt: Date | string;
  created_at?: Date | string;
  updatedAt: Date | string;
  updated_at?: Date | string;
}

export interface CustomerFormData {
  customerName: string;
  contactNo?: string;
  emailId?: string;
  address?: string;
  dateOfBirth?: string;
  anniversaryDate?: string;
  gender?: 'Male' | 'Female' | 'Other';
  profession?: string;
  occupation?: string;
  companyName?: string;
  isBusinessOwner?: boolean;
  businessName?: string;
  businessType?: string;
  businessAddress?: string;
  gstNumber?: string;
  panNumber?: string;
  businessEstablishedDate?: string;
  referenceBy?: string;
  customerType?: 'Individual' | 'Corporate' | 'Family';
  notes?: string;
  tags?: string[];
}
