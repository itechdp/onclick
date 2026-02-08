import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, FileText, Phone, Mail, IndianRupee, Printer, Percent, Filter, Download, UserCheck, X, Eye as EyeIcon, EyeOff } from 'lucide-react';
import { subAgentService, SubAgent } from '../services/subAgentService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export function SubAgents() {
  const { user } = useAuth();
  const [subAgents, setSubAgents] = useState<SubAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSubAgent, setSelectedSubAgent] = useState<SubAgent | null>(null);
  const [subAgentPolicies, setSubAgentPolicies] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    subAgentName: '',
    contactNo: '',
    emailId: '',
    loginEmail: '',
    password: '',
    address: '',
    notes: '',
  });

  // Filter states for details modal
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterCompany, setFilterCompany] = useState('');
  const [allPolicies, setAllPolicies] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadSubAgents();
    }
  }, [user]);

  const loadSubAgents = async () => {
    try {
      setLoading(true);
      const data = await subAgentService.getSubAgents(user!.id);
      setSubAgents(data);
    } catch (error) {
      console.error('Error loading sub agents:', error);
      toast.error('Failed to load sub agents');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await subAgentService.addSubAgent({
        userId: user!.id,
        subAgentName: formData.subAgentName,
        contactNo: formData.contactNo,
        emailId: formData.emailId,
        loginEmail: formData.loginEmail,
        password: formData.password,
        address: formData.address,
        notes: formData.notes,
      });
      toast.success('Sub Agent added successfully!');
      setShowAddModal(false);
      resetForm();
      loadSubAgents();
    } catch (error) {
      console.error('Error adding sub agent:', error);
      toast.error('Failed to add sub agent');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubAgent) return;

    try {
      await subAgentService.updateSubAgent(selectedSubAgent.id, {
        subAgentName: formData.subAgentName,
        contactNo: formData.contactNo,
        emailId: formData.emailId,
        loginEmail: formData.loginEmail,
        password: formData.password || undefined,
        address: formData.address,
        notes: formData.notes,
      });
      toast.success('Sub Agent updated successfully!');
      setShowEditModal(false);
      resetForm();
      loadSubAgents();
    } catch (error) {
      console.error('Error updating sub agent:', error);
      toast.error('Failed to update sub agent');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete sub agent "${name}"? This will not delete the policies, but will remove the sub agent association.`)) {
      return;
    }

    try {
      await subAgentService.deleteSubAgent(id);
      toast.success('Sub Agent deleted successfully!');
      loadSubAgents();
    } catch (error) {
      console.error('Error deleting sub agent:', error);
      toast.error('Failed to delete sub agent');
    }
  };

  const handleViewDetails = async (subAgent: SubAgent) => {
    setSelectedSubAgent(subAgent);
    try {
      const policies = await subAgentService.getSubAgentPolicies(subAgent.id);
      setAllPolicies(policies);
      setSubAgentPolicies(policies);
      setFilterMonth('');
      setFilterYear(new Date().getFullYear().toString());
      setFilterCompany('');
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error loading sub agent policies:', error);
      toast.error('Failed to load sub agent policies');
    }
  };

  const applyFilters = () => {
    let filtered = [...allPolicies];

    if (filterMonth) {
      filtered = filtered.filter(policy => {
        const startDate = policy.policy_start_date ? new Date(policy.policy_start_date) : null;
        if (!startDate) return false;
        return (startDate.getMonth() + 1).toString() === filterMonth;
      });
    }

    if (filterYear) {
      filtered = filtered.filter(policy => {
        const startDate = policy.policy_start_date ? new Date(policy.policy_start_date) : null;
        if (!startDate) return false;
        return startDate.getFullYear().toString() === filterYear;
      });
    }

    if (filterCompany) {
      filtered = filtered.filter(policy =>
        policy.insurance_company?.toLowerCase().includes(filterCompany.toLowerCase())
      );
    }

    setSubAgentPolicies(filtered);
  };

  useEffect(() => {
    if (showDetailsModal) {
      applyFilters();
    }
  }, [filterMonth, filterYear, filterCompany]);

  const openEditModal = (subAgent: SubAgent) => {
    setSelectedSubAgent(subAgent);
    setFormData({
      subAgentName: subAgent.subAgentName,
      contactNo: subAgent.contactNo || '',
      emailId: subAgent.emailId || '',
      loginEmail: subAgent.loginEmail || '',
      password: '',
      address: subAgent.address || '',
      notes: subAgent.notes || '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      subAgentName: '',
      contactNo: '',
      emailId: '',
      loginEmail: '',
      password: '',
      address: '',
      notes: '',
    });
    setSelectedSubAgent(null);
    setShowPassword(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const exportToCSV = () => {
    if (subAgentPolicies.length === 0) {
      toast.error('No policies to export');
      return;
    }

    const headers = ['Policyholder', 'Policy Number', 'Product Type', 'Company', 'Start Date', 'End Date', 'Net Premium', 'OD Premium', 'Total Premium', 'Commission %', 'Commission Amount'];
    const rows = subAgentPolicies.map(p => [
      p.policyholder_name || '',
      p.policy_number || '',
      p.product_type || '',
      p.insurance_company || '',
      p.policy_start_date ? new Date(p.policy_start_date).toLocaleDateString('en-IN') : '',
      p.policy_end_date ? new Date(p.policy_end_date).toLocaleDateString('en-IN') : '',
      p.net_premium || '',
      p.od_premium || '',
      p.total_premium || p.premium_amount || '',
      p.sub_agent_commission_percentage || '',
      p.sub_agent_commission_amount || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSubAgent?.subAgentName || 'sub-agent'}_policies_${filterMonth || 'all'}_${filterYear || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully!');
  };

  const filteredSubAgents = subAgents.filter(sa =>
    sa.subAgentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sa.contactNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sa.emailId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPolicies = subAgents.reduce((sum, sa) => sum + (sa.totalPolicies || 0), 0);
  const totalPremium = subAgents.reduce((sum, sa) => sum + (sa.totalPremiumAmount || 0), 0);
  const totalCommission = subAgents.reduce((sum, sa) => sum + (sa.totalCommission || 0), 0);

  // Calculate monthly commission in details modal
  const monthlyCommission = subAgentPolicies.reduce((sum, p) => {
    return sum + parseFloat(p.sub_agent_commission_amount || '0');
  }, 0);

  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
    { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
    { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ];

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - 5 + i).toString());

  // Get unique companies from policies for filter
  const uniqueCompanies = [...new Set(allPolicies.map(p => p.insurance_company).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserCheck className="h-8 w-8 text-purple-600" />
                Sub Agents Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage sub agents, track policies and commissions
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-sharp hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="h-5 w-5" />
              Add Sub Agent
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-card shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Sub Agents</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{subAgents.length}</p>
              </div>
              <UserCheck className="h-12 w-12 text-purple-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-card shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Policies</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalPolicies}</p>
              </div>
              <FileText className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-card shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Premium</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  ₹{totalPremium.toLocaleString('en-IN')}
                </p>
              </div>
              <IndianRupee className="h-12 w-12 text-amber-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-card shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Commission</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  ₹{totalCommission.toLocaleString('en-IN')}
                </p>
              </div>
              <Percent className="h-12 w-12 text-red-600" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by name, contact, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
            />
          </div>
        </div>

        {/* Sub Agents Table */}
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading sub agents...</p>
            </div>
          ) : filteredSubAgents.length === 0 ? (
            <div className="p-12 text-center">
              <UserCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white">No sub agents found</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {searchTerm ? 'Try adjusting your search' : 'Click "Add Sub Agent" to create your first sub agent'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Sub Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Login Email
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Policies
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Premium
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Commission
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredSubAgents.map((subAgent) => (
                    <tr key={subAgent.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewDetails(subAgent)}
                          className="text-sm font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 hover:underline transition-colors text-left"
                        >
                          {subAgent.subAgentName}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {subAgent.contactNo && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {subAgent.contactNo}
                            </div>
                          )}
                          {subAgent.emailId && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {subAgent.emailId}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {subAgent.loginEmail || 'Not set'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {subAgent.totalPolicies || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          ₹{(subAgent.totalPremiumAmount || 0).toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-green-600 dark:text-green-400">
                          ₹{(subAgent.totalCommission || 0).toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewDetails(subAgent)}
                            className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                            title="View Details & Policies"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openEditModal(subAgent)}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                            title="Edit"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(subAgent.id, subAgent.subAgentName)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Sub Agent Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Sub Agent</h2>
                <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAdd} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sub Agent Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subAgentName}
                    onChange={(e) => setFormData(prev => ({ ...prev, subAgentName: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600"
                    placeholder="Enter sub agent name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contact Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.contactNo}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactNo: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600"
                      placeholder="Phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email ID
                    </label>
                    <input
                      type="email"
                      value={formData.emailId}
                      onChange={(e) => setFormData(prev => ({ ...prev, emailId: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600"
                      placeholder="Email address"
                    />
                  </div>
                </div>

                {/* Login Credentials Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-purple-600" />
                    Login Credentials (for sub agent portal access)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Login Email / ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.loginEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, loginEmail: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600"
                        placeholder="Login email or ID"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600"
                          placeholder="Password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600"
                    rows={2}
                    placeholder="Full address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600"
                    rows={2}
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-sharp hover:bg-purple-700 transition-colors"
                  >
                    Add Sub Agent
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddModal(false); resetForm(); }}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-sharp hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Sub Agent Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Sub Agent</h2>
                <button onClick={() => { setShowEditModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleEdit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sub Agent Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subAgentName}
                    onChange={(e) => setFormData(prev => ({ ...prev, subAgentName: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      value={formData.contactNo}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactNo: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email ID
                    </label>
                    <input
                      type="email"
                      value={formData.emailId}
                      onChange={(e) => setFormData(prev => ({ ...prev, emailId: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                </div>

                {/* Login Credentials Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-purple-600" />
                    Login Credentials
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Login Email / ID
                      </label>
                      <input
                        type="text"
                        value={formData.loginEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, loginEmail: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Password (leave blank to keep current)
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600"
                          placeholder="Leave blank to keep current"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600"
                    rows={2}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-sharp hover:bg-purple-700 transition-colors"
                  >
                    Update Sub Agent
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowEditModal(false); resetForm(); }}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-sharp hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Details Modal showing policies with filters */}
        {showDetailsModal && selectedSubAgent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:block print:relative print:bg-transparent print:p-0">
            <div className="bg-white dark:bg-gray-800 rounded-card max-w-7xl w-full max-h-[90vh] overflow-y-auto printable-section print:max-h-none print:max-w-none print:shadow-none">
              {/* Print Header */}
              <div className="hidden print:block mb-3 pt-0">
                <div className="flex justify-between items-center border-b-2 border-gray-800 pb-1">
                  <h1 className="text-base font-bold text-gray-900">{selectedSubAgent.subAgentName} - Sub Agent Report</h1>
                  <p className="text-xs text-gray-600">Generated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                </div>
              </div>

              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center no-print print:hidden">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedSubAgent.subAgentName} - Sub Agent Details
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-sharp hover:bg-green-700 transition-colors"
                    title="Export to CSV"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-sharp hover:bg-blue-700 transition-colors"
                    title="Print"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl px-2"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6 print:p-4">
                {/* Sub Agent Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-sharp">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Contact</p>
                    <p className="text-gray-900 dark:text-white font-medium">{selectedSubAgent.contactNo || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="text-gray-900 dark:text-white font-medium">{selectedSubAgent.emailId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Policies</p>
                    <p className="text-gray-900 dark:text-white font-medium">{allPolicies.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Login Email</p>
                    <p className="text-gray-900 dark:text-white font-medium">{selectedSubAgent.loginEmail || 'Not set'}</p>
                  </div>
                </div>

                {/* Commission Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-sharp border border-purple-200 dark:border-purple-700">
                    <p className="text-sm text-purple-600 dark:text-purple-400">Filtered Policies</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">{subAgentPolicies.length}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-sharp border border-green-200 dark:border-green-700">
                    <p className="text-sm text-green-600 dark:text-green-400">Total Premium (Filtered)</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                      ₹{subAgentPolicies.reduce((sum, p) => sum + parseFloat(p.total_premium || p.premium_amount || '0'), 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-sharp border border-amber-200 dark:border-amber-700">
                    <p className="text-sm text-amber-600 dark:text-amber-400">Commission to Pay {filterMonth ? `(${months.find(m => m.value === filterMonth)?.label || ''} ${filterYear})` : '(Filtered)'}</p>
                    <p className="text-2xl font-bold text-amber-900 dark:text-amber-300">
                      ₹{monthlyCommission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Filters */}
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-sharp print:hidden">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filters</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Month</label>
                      <select
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-600"
                      >
                        <option value="">All Months</option>
                        {months.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Year</label>
                      <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-600"
                      >
                        <option value="">All Years</option>
                        {years.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Insurance Company</label>
                      <select
                        value={filterCompany}
                        onChange={(e) => setFilterCompany(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-600"
                      >
                        <option value="">All Companies</option>
                        {uniqueCompanies.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => { setFilterMonth(''); setFilterYear(''); setFilterCompany(''); }}
                        className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-sharp hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>

                {/* Policies Table */}
                <div className="print:mt-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 print:text-sm print:mb-2 print:font-bold print:border-b-2 print:border-gray-800 print:pb-1">
                    Policies ({subAgentPolicies.length})
                  </h3>
                  {subAgentPolicies.length === 0 ? (
                    <p className="text-center py-8 text-gray-600 dark:text-gray-400 print:py-4 print:text-sm">
                      No policies found {filterMonth || filterYear || filterCompany ? 'for the selected filters' : 'for this sub agent'}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-b">Policyholder</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-b">Policy No.</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-b">Product</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-b">Company</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-b">Start Date</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 border-b">End Date</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 border-b">Net/OD Premium</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 border-b">Total Premium</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 border-b">Comm. %</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 border-b">Commission</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {subAgentPolicies.map((policy: any) => (
                            <tr key={policy.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-3 py-3 text-sm text-gray-900 dark:text-white border-b">{policy.policyholder_name}</td>
                              <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400 border-b">{policy.policy_number}</td>
                              <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400 border-b">{policy.product_type || '-'}</td>
                              <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400 border-b">{policy.insurance_company}</td>
                              <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400 border-b">
                                {policy.policy_start_date ? new Date(policy.policy_start_date).toLocaleDateString('en-IN') : 'N/A'}
                              </td>
                              <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400 border-b">
                                {policy.policy_end_date ? new Date(policy.policy_end_date).toLocaleDateString('en-IN') : 'N/A'}
                              </td>
                              <td className="px-3 py-3 text-sm text-right text-gray-900 dark:text-white border-b">
                                ₹{parseFloat(policy.od_premium || policy.net_premium || '0').toLocaleString('en-IN')}
                              </td>
                              <td className="px-3 py-3 text-sm text-right text-gray-900 dark:text-white border-b">
                                ₹{parseFloat(policy.total_premium || policy.premium_amount || '0').toLocaleString('en-IN')}
                              </td>
                              <td className="px-3 py-3 text-sm text-right text-purple-600 dark:text-purple-400 border-b font-medium">
                                {policy.sub_agent_commission_percentage ? `${policy.sub_agent_commission_percentage}%` : '-'}
                              </td>
                              <td className="px-3 py-3 text-sm text-right text-green-600 dark:text-green-400 border-b font-medium">
                                {policy.sub_agent_commission_amount ? `₹${parseFloat(policy.sub_agent_commission_amount).toLocaleString('en-IN')}` : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-100 dark:bg-gray-900 font-semibold">
                          <tr>
                            <td colSpan={7} className="px-3 py-3 text-sm text-right text-gray-900 dark:text-white border-t-2">Totals:</td>
                            <td className="px-3 py-3 text-sm text-right text-gray-900 dark:text-white border-t-2">
                              ₹{subAgentPolicies.reduce((sum, p) => sum + parseFloat(p.total_premium || p.premium_amount || '0'), 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-3 py-3 text-sm text-right border-t-2"></td>
                            <td className="px-3 py-3 text-sm text-right text-green-600 dark:text-green-400 border-t-2">
                              ₹{monthlyCommission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            margin: 0.8cm 0.5cm;
            size: A4 landscape;
          }
          body * { visibility: hidden !important; }
          .printable-section, .printable-section * { visibility: visible !important; }
          .printable-section {
            position: fixed !important; left: 0 !important; top: 0 !important;
            width: 100% !important; max-width: 100% !important;
            box-shadow: none !important; border-radius: 0 !important;
            margin: 0 !important; padding: 0 !important;
            background: white !important;
          }
          .no-print, .print\\:hidden { display: none !important; }
          .printable-section table { font-size: 11px !important; }
          .printable-section th, .printable-section td {
            padding: 4px 6px !important;
            border: 1px solid #6b7280 !important;
            color: #000 !important;
          }
          .printable-section thead { background-color: #e5e7eb !important; }
          .printable-section th { font-weight: 700 !important; }
        }
      `}</style>
    </div>
  );
}
