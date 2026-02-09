import React, { useState, useEffect } from 'react';
import { 
  User, UserPlus, Edit2, Trash2, Search, Calendar, Briefcase, 
  Building, Phone, Mail, Gift, Heart, Users, Filter,
  X, Save, FileText
} from 'lucide-react';
import { Customer, CustomerFormData } from '../types/customer';
import { 
  fetchCustomers, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer,
  getUpcomingBirthdays,
  getUpcomingAnniversaries
} from '../services/customerService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfession, setSelectedProfession] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<Customer[]>([]);
  const [upcomingAnniversaries, setUpcomingAnniversaries] = useState<Customer[]>([]);

  // Form state
  const [formData, setFormData] = useState<CustomerFormData>({
    customerName: '',
    contactNo: '',
    emailId: '',
    address: '',
    dateOfBirth: '',
    anniversaryDate: '',
    gender: undefined,
    profession: '',
    occupation: '',
    companyName: '',
    isBusinessOwner: false,
    businessName: '',
    businessType: '',
    businessAddress: '',
    gstNumber: '',
    panNumber: '',
    businessEstablishedDate: '',
    referenceBy: '',
    customerType: 'Individual',
    notes: '',
    tags: []
  });

  useEffect(() => {
    loadCustomers();
    loadUpcomingEvents();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchQuery, selectedProfession, selectedType]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const loadUpcomingEvents = async () => {
    try {
      const [birthdays, anniversaries] = await Promise.all([
        getUpcomingBirthdays(),
        getUpcomingAnniversaries()
      ]);
      setUpcomingBirthdays(birthdays);
      setUpcomingAnniversaries(anniversaries);
    } catch (error) {
      console.error('Error loading upcoming events:', error);
    }
  };

  const filterCustomers = () => {
    let filtered = [...customers];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.customerName.toLowerCase().includes(query) ||
        customer.contactNo?.toLowerCase().includes(query) ||
        customer.emailId?.toLowerCase().includes(query) ||
        customer.businessName?.toLowerCase().includes(query)
      );
    }

    // Profession filter
    if (selectedProfession !== 'all') {
      filtered = filtered.filter(customer => customer.profession === selectedProfession);
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(customer => customer.customerType === selectedType);
    }

    setFilteredCustomers(filtered);
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setFormData({
      customerName: '',
      contactNo: '',
      emailId: '',
      address: '',
      dateOfBirth: '',
      anniversaryDate: '',
      gender: undefined,
      profession: '',
      occupation: '',
      companyName: '',
      isBusinessOwner: false,
      businessName: '',
      businessType: '',
      businessAddress: '',
      gstNumber: '',
      panNumber: '',
      businessEstablishedDate: '',
      referenceBy: '',
      customerType: 'Individual',
      notes: '',
      tags: []
    });
    setShowAddModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      customerName: customer.customerName,
      contactNo: customer.contactNo || '',
      emailId: customer.emailId || '',
      address: customer.address || '',
      dateOfBirth: customer.dateOfBirth ? format(new Date(customer.dateOfBirth), 'yyyy-MM-dd') : '',
      anniversaryDate: customer.anniversaryDate ? format(new Date(customer.anniversaryDate), 'yyyy-MM-dd') : '',
      gender: customer.gender,
      profession: customer.profession || '',
      occupation: customer.occupation || '',
      companyName: customer.companyName || '',
      isBusinessOwner: customer.isBusinessOwner || false,
      businessName: customer.businessName || '',
      businessType: customer.businessType || '',
      businessAddress: customer.businessAddress || '',
      gstNumber: customer.gstNumber || '',
      panNumber: customer.panNumber || '',
      businessEstablishedDate: customer.businessEstablishedDate ? format(new Date(customer.businessEstablishedDate), 'yyyy-MM-dd') : '',
      referenceBy: customer.referenceBy || '',
      customerType: customer.customerType || 'Individual',
      notes: customer.notes || '',
      tags: customer.tags || []
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }

    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, formData);
        toast.success('Customer updated successfully');
      } else {
        await createCustomer(formData);
        toast.success('Customer added successfully');
      }
      setShowAddModal(false);
      loadCustomers();
      loadUpcomingEvents();
    } catch (error: any) {
      console.error('Customer operation error:', error);
      
      // Check for specific error messages
      let errorMessage = editingCustomer ? 'Failed to update customer' : 'Failed to add customer';
      
      if (error?.message) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          errorMessage = 'A customer with this contact number already exists';
        } else if (error.message.includes('contact_no')) {
          errorMessage = 'Invalid contact number format';
        } else if (error.message.includes('email')) {
          errorMessage = 'Invalid email format';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      await deleteCustomer(id);
      toast.success('Customer deleted successfully');
      loadCustomers();
    } catch (error) {
      toast.error('Failed to delete customer');
    }
  };

  const uniqueProfessions = Array.from(new Set(customers.map(c => c.profession).filter(Boolean)));

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Users className="mr-3 text-blue-600" size={28} />
              Customers
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage your customer database
            </p>
          </div>
          <button
            onClick={handleAddCustomer}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-sharp hover:bg-blue-700 transition-colors duration-200"
          >
            <UserPlus size={20} className="mr-2" />
            Add Customer
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-sharp">
            <div className="flex items-center">
              <Users className="text-blue-600 mr-2" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{customers.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-sharp">
            <div className="flex items-center">
              <Building className="text-green-600 mr-2" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Business Owners</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {customers.filter(c => c.isBusinessOwner).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-sharp">
            <div className="flex items-center">
              <Gift className="text-purple-600 mr-2" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming Birthdays</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{upcomingBirthdays.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-sharp">
            <div className="flex items-center">
              <Heart className="text-pink-600 mr-2" size={20} />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming Anniversaries</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{upcomingAnniversaries.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <Filter size={20} className="mr-2" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-sharp">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Profession
              </label>
              <select
                value={selectedProfession}
                onChange={(e) => setSelectedProfession(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Professions</option>
                {uniqueProfessions.map(prof => (
                  <option key={prof} value={prof}>{prof}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Customer Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="Individual">Individual</option>
                <option value="Corporate">Corporate</option>
                <option value="Family">Family</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedProfession('all');
                  setSelectedType('all');
                }}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-sharp hover:bg-gray-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer List */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading customers...</p>
            </div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Users size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-xl text-gray-600 dark:text-gray-400">No customers found</p>
              <button
                onClick={handleAddCustomer}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-sharp hover:bg-blue-700 transition-colors"
              >
                Add Your First Customer
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="bg-white dark:bg-gray-800 rounded-sharp shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3">
                      <User className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {customer.customerName}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {customer.customerType}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditCustomer(customer)}
                      className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id, customer.customerName)}
                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {customer.contactNo && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Phone size={14} className="mr-2" />
                      {customer.contactNo}
                    </div>
                  )}
                  {customer.emailId && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Mail size={14} className="mr-2" />
                      {customer.emailId}
                    </div>
                  )}
                  {customer.profession && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Briefcase size={14} className="mr-2" />
                      {customer.profession}
                    </div>
                  )}
                  {customer.isBusinessOwner && customer.businessName && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Building size={14} className="mr-2" />
                      {customer.businessName}
                    </div>
                  )}
                  {customer.dateOfBirth && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Gift size={14} className="mr-2" />
                      DOB: {format(new Date(customer.dateOfBirth), 'dd MMM yyyy')}
                    </div>
                  )}
                  {customer.anniversaryDate && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Heart size={14} className="mr-2" />
                      Anniversary: {format(new Date(customer.anniversaryDate), 'dd MMM yyyy')}
                    </div>
                  )}
                </div>

                {customer.tags && customer.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {customer.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-sharp shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* Basic Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <User size={20} className="mr-2" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      value={formData.contactNo}
                      onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email ID
                    </label>
                    <input
                      type="email"
                      value={formData.emailId}
                      onChange={(e) => setFormData({ ...formData, emailId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Customer Type
                    </label>
                    <select
                      value={formData.customerType}
                      onChange={(e) => setFormData({ ...formData, customerType: e.target.value as 'Individual' | 'Corporate' | 'Family' })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Individual">Individual</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Family">Family</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Address
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Calendar size={20} className="mr-2" />
                  Personal Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Anniversary Date
                    </label>
                    <input
                      type="date"
                      value={formData.anniversaryDate}
                      onChange={(e) => setFormData({ ...formData, anniversaryDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gender
                    </label>
                    <select
                      value={formData.gender || ''}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' | 'Other' | undefined })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Professional Details */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Briefcase size={20} className="mr-2" />
                  Professional Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Profession
                    </label>
                    <select
                      value={formData.profession}
                      onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Profession</option>
                      <option value="Salaried">Salaried</option>
                      <option value="Business Owner">Business Owner</option>
                      <option value="Self-Employed">Self-Employed</option>
                      <option value="Professional">Professional</option>
                      <option value="Retired">Retired</option>
                      <option value="Student">Student</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Occupation / Job Title
                    </label>
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Software Engineer, Doctor"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company Name (for salaried)
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Business Details */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Building size={20} className="mr-2" />
                  Business Details
                </h3>
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isBusinessOwner}
                      onChange={(e) => setFormData({ ...formData, isBusinessOwner: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      This customer is a business owner
                    </span>
                  </label>
                </div>
                
                {formData.isBusinessOwner && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Business Name
                      </label>
                      <input
                        type="text"
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Business Type
                      </label>
                      <input
                        type="text"
                        value={formData.businessType}
                        onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Retail, Manufacturing, Services"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Business Address
                      </label>
                      <textarea
                        value={formData.businessAddress}
                        onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        GST Number
                      </label>
                      <input
                        type="text"
                        value={formData.gstNumber}
                        onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        PAN Number
                      </label>
                      <input
                        type="text"
                        value={formData.panNumber}
                        onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Business Established Date
                      </label>
                      <input
                        type="date"
                        value={formData.businessEstablishedDate}
                        onChange={(e) => setFormData({ ...formData, businessEstablishedDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FileText size={20} className="mr-2" />
                  Additional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Referred By
                    </label>
                    <input
                      type="text"
                      value={formData.referenceBy}
                      onChange={(e) => setFormData({ ...formData, referenceBy: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Who referred this customer?"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Any additional notes about the customer"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-sharp hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Save size={20} className="mr-2" />
                  {editingCustomer ? 'Update Customer' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
