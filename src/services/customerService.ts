import { supabase } from '../config/supabase';
import { Customer, CustomerFormData } from '../types/customer';

/**
 * Fetch all customers for the current user
 */
export async function fetchCustomers(): Promise<Customer[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('customer_name');

    if (error) throw error;

    return (data || []).map(normalizeCustomer);
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
}

/**
 * Create a new customer
 */
export async function createCustomer(customerData: CustomerFormData): Promise<Customer> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const dbCustomer = {
      user_id: user.id,
      customer_name: customerData.customerName,
      contact_no: customerData.contactNo || null,
      email_id: customerData.emailId || null,
      address: customerData.address || null,
      date_of_birth: customerData.dateOfBirth || null,
      anniversary_date: customerData.anniversaryDate || null,
      gender: customerData.gender || null,
      profession: customerData.profession || null,
      occupation: customerData.occupation || null,
      company_name: customerData.companyName || null,
      is_business_owner: customerData.isBusinessOwner || false,
      business_name: customerData.businessName || null,
      business_type: customerData.businessType || null,
      business_address: customerData.businessAddress || null,
      gst_number: customerData.gstNumber || null,
      pan_number: customerData.panNumber || null,
      business_established_date: customerData.businessEstablishedDate || null,
      reference_by: customerData.referenceBy || null,
      customer_type: customerData.customerType || 'Individual',
      notes: customerData.notes || null,
      tags: customerData.tags || [],
      is_active: true
    };

    const { data, error } = await supabase
      .from('customers')
      .insert([dbCustomer])
      .select()
      .single();

    if (error) throw error;

    return normalizeCustomer(data);
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}

/**
 * Update an existing customer
 */
export async function updateCustomer(id: string, customerData: Partial<CustomerFormData>): Promise<Customer> {
  try {
    const dbCustomer: any = {};

    if (customerData.customerName !== undefined) dbCustomer.customer_name = customerData.customerName;
    if (customerData.contactNo !== undefined) dbCustomer.contact_no = customerData.contactNo || null;
    if (customerData.emailId !== undefined) dbCustomer.email_id = customerData.emailId || null;
    if (customerData.address !== undefined) dbCustomer.address = customerData.address || null;
    if (customerData.dateOfBirth !== undefined) dbCustomer.date_of_birth = customerData.dateOfBirth || null;
    if (customerData.anniversaryDate !== undefined) dbCustomer.anniversary_date = customerData.anniversaryDate || null;
    if (customerData.gender !== undefined) dbCustomer.gender = customerData.gender || null;
    if (customerData.profession !== undefined) dbCustomer.profession = customerData.profession || null;
    if (customerData.occupation !== undefined) dbCustomer.occupation = customerData.occupation || null;
    if (customerData.companyName !== undefined) dbCustomer.company_name = customerData.companyName || null;
    if (customerData.isBusinessOwner !== undefined) dbCustomer.is_business_owner = customerData.isBusinessOwner || false;
    if (customerData.businessName !== undefined) dbCustomer.business_name = customerData.businessName || null;
    if (customerData.businessType !== undefined) dbCustomer.business_type = customerData.businessType || null;
    if (customerData.businessAddress !== undefined) dbCustomer.business_address = customerData.businessAddress || null;
    if (customerData.gstNumber !== undefined) dbCustomer.gst_number = customerData.gstNumber || null;
    if (customerData.panNumber !== undefined) dbCustomer.pan_number = customerData.panNumber || null;
    if (customerData.businessEstablishedDate !== undefined) dbCustomer.business_established_date = customerData.businessEstablishedDate || null;
    if (customerData.referenceBy !== undefined) dbCustomer.reference_by = customerData.referenceBy || null;
    if (customerData.customerType !== undefined) dbCustomer.customer_type = customerData.customerType;
    if (customerData.notes !== undefined) dbCustomer.notes = customerData.notes || null;
    if (customerData.tags !== undefined) dbCustomer.tags = customerData.tags;

    const { data, error } = await supabase
      .from('customers')
      .update(dbCustomer)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

    return normalizeCustomer(data);
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
}

/**
 * Delete a customer (soft delete)
 */
export async function deleteCustomer(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('customers')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
}

/**
 * Find or create customer from policy data
 */
export async function findOrCreateCustomerFromPolicy(policyholderName: string, contactNo?: string, emailId?: string): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // Try to find existing customer by name and contact (if provided)
    if (contactNo) {
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .eq('contact_no', contactNo)
        .eq('is_active', true)
        .single();

      if (existing) return existing.id;
    }

    // Create new customer
    const { data, error } = await supabase
      .from('customers')
      .insert([{
        user_id: user.id,
        customer_name: policyholderName,
        contact_no: contactNo || null,
        email_id: emailId || null,
        customer_type: 'Individual',
        is_active: true
      }])
      .select('id')
      .single();

    if (error) throw error;

    return data.id;
  } catch (error) {
    console.error('Error finding/creating customer from policy:', error);
    return null;
  }
}

/**
 * Get customers with upcoming birthdays (within next 30 days)
 */
export async function getUpcomingBirthdays(): Promise<Customer[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .not('date_of_birth', 'is', null)
      .order('date_of_birth');

    if (error) throw error;

    // Filter by upcoming birthdays in JavaScript since Supabase doesn't handle date comparisons well for birthdays
    const upcoming = (data || []).filter(customer => {
      if (!customer.date_of_birth) return false;
      const dob = new Date(customer.date_of_birth);
      const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      return thisYearBirthday >= today && thisYearBirthday <= thirtyDaysLater;
    });

    return upcoming.map(normalizeCustomer);
  } catch (error) {
    console.error('Error fetching upcoming birthdays:', error);
    return [];
  }
}

/**
 * Get customers with upcoming anniversaries (within next 30 days)
 */
export async function getUpcomingAnniversaries(): Promise<Customer[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .not('anniversary_date', 'is', null)
      .order('anniversary_date');

    if (error) throw error;

    // Filter by upcoming anniversaries
    const upcoming = (data || []).filter(customer => {
      if (!customer.anniversary_date) return false;
      const anniversary = new Date(customer.anniversary_date);
      const thisYearAnniversary = new Date(today.getFullYear(), anniversary.getMonth(), anniversary.getDate());
      return thisYearAnniversary >= today && thisYearAnniversary <= thirtyDaysLater;
    });

    return upcoming.map(normalizeCustomer);
  } catch (error) {
    console.error('Error fetching upcoming anniversaries:', error);
    return [];
  }
}

/**
 * Normalize database customer object to camelCase
 */
function normalizeCustomer(dbCustomer: any): Customer {
  return {
    id: dbCustomer.id,
    userId: dbCustomer.user_id,
    customerName: dbCustomer.customer_name,
    contactNo: dbCustomer.contact_no,
    emailId: dbCustomer.email_id,
    address: dbCustomer.address,
    dateOfBirth: dbCustomer.date_of_birth,
    anniversaryDate: dbCustomer.anniversary_date,
    gender: dbCustomer.gender,
    profession: dbCustomer.profession,
    occupation: dbCustomer.occupation,
    companyName: dbCustomer.company_name,
    isBusinessOwner: dbCustomer.is_business_owner,
    businessName: dbCustomer.business_name,
    businessType: dbCustomer.business_type,
    businessAddress: dbCustomer.business_address,
    gstNumber: dbCustomer.gst_number,
    panNumber: dbCustomer.pan_number,
    businessEstablishedDate: dbCustomer.business_established_date,
    referenceBy: dbCustomer.reference_by,
    customerType: dbCustomer.customer_type,
    notes: dbCustomer.notes,
    tags: dbCustomer.tags || [],
    isActive: dbCustomer.is_active,
    createdAt: dbCustomer.created_at,
    updatedAt: dbCustomer.updated_at
  };
}
