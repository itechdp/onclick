import { useState, useEffect } from 'react';
import { FileText, Search, Filter, Download, UserCheck, Phone, Mail, IndianRupee, Percent, LogOut, Eye, X, FolderOpen } from 'lucide-react';
import { subAgentService } from '../services/subAgentService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export function SubAgentPortal() {
  const { subAgent, logout } = useAuth();
  const navigate = useNavigate();
  const [policies, setPolicies] = useState<any[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [showPolicyDetail, setShowPolicyDetail] = useState(false);

  // Filters
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [filterCompany, setFilterCompany] = useState('');

  useEffect(() => {
    if (subAgent) {
      loadPolicies();
    }
  }, [subAgent]);

  useEffect(() => {
    applyFilters();
  }, [policies, searchTerm, filterMonth, filterYear, filterCompany]);

  const loadPolicies = async () => {
    if (!subAgent) return;
    try {
      setLoading(true);
      const data = await subAgentService.getSubAgentPolicies(subAgent.id);
      setPolicies(data);
      setFilteredPolicies(data);
    } catch (error) {
      console.error('Error loading policies:', error);
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...policies];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.policyholder_name?.toLowerCase().includes(term) ||
        p.policy_number?.toLowerCase().includes(term) ||
        p.insurance_company?.toLowerCase().includes(term) ||
        p.product_type?.toLowerCase().includes(term)
      );
    }

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

    setFilteredPolicies(filtered);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const exportToCSV = () => {
    if (filteredPolicies.length === 0) {
      toast.error('No policies to export');
      return;
    }

    const headers = ['Policyholder', 'Policy Number', 'Product Type', 'Company', 'Start Date', 'End Date', 'Total Premium', 'Commission %', 'Commission Amount'];
    const rows = filteredPolicies.map(p => [
      p.policyholder_name || '',
      p.policy_number || '',
      p.product_type || '',
      p.insurance_company || '',
      p.policy_start_date ? new Date(p.policy_start_date).toLocaleDateString('en-IN') : '',
      p.policy_end_date ? new Date(p.policy_end_date).toLocaleDateString('en-IN') : '',
      p.total_premium || p.premium_amount || '',
      p.sub_agent_commission_percentage || '',
      p.sub_agent_commission_amount || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_policies_${filterMonth || 'all'}_${filterYear || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully!');
  };

  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
    { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
    { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ];

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - 5 + i).toString());
  const uniqueCompanies = [...new Set(policies.map(p => p.insurance_company).filter(Boolean))];

  const totalPremium = filteredPolicies.reduce((sum, p) => sum + parseFloat(p.total_premium || p.premium_amount || '0'), 0);
  const totalCommission = filteredPolicies.reduce((sum, p) => sum + parseFloat(p.sub_agent_commission_amount || '0'), 0);

  if (!subAgent) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Sub agent session not found. Please login again.</p>
          <button onClick={() => navigate('/login')} className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-sharp hover:bg-purple-700">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Sub Agent Portal</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Welcome, {subAgent.subAgentName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                {subAgent.contactNo && (
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{subAgent.contactNo}</span>
                )}
                {subAgent.emailId && (
                  <span className="flex items-center gap-1 ml-3"><Mail className="h-3 w-3" />{subAgent.emailId}</span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-sharp hover:bg-red-700 transition-colors text-sm"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-card shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Policies</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{policies.length}</p>
              </div>
              <FileText className="h-12 w-12 text-purple-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-card shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Filtered Policies</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{filteredPolicies.length}</p>
              </div>
              <Filter className="h-12 w-12 text-blue-600" />
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
                <p className="text-sm text-gray-600 dark:text-gray-400">My Commission</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                  ₹{totalCommission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <Percent className="h-12 w-12 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filters</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by name, policy number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>
            <div>
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
            <div className="flex gap-2">
              <select
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-600"
              >
                <option value="">All Companies</option>
                {uniqueCompanies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                onClick={exportToCSV}
                className="px-3 py-2 bg-green-600 text-white rounded-sharp hover:bg-green-700 transition-colors text-sm"
                title="Export CSV"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
          {(filterMonth || filterYear || filterCompany || searchTerm) && (
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => { setFilterMonth(''); setFilterYear(''); setFilterCompany(''); setSearchTerm(''); }}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Policies Table */}
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your policies...</p>
            </div>
          ) : filteredPolicies.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white">No policies found</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {searchTerm || filterMonth || filterCompany ? 'Try adjusting your filters' : 'No policies have been assigned to you yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Policyholder</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Policy No.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Start Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">End Date</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Premium</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Comm. %</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Commission</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredPolicies.map((policy: any) => (
                    <tr key={policy.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{policy.policyholder_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{policy.policy_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{policy.product_type || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{policy.insurance_company}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {policy.policy_start_date ? new Date(policy.policy_start_date).toLocaleDateString('en-IN') : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {policy.policy_end_date ? new Date(policy.policy_end_date).toLocaleDateString('en-IN') : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                        ₹{parseFloat(policy.total_premium || policy.premium_amount || '0').toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-purple-600 dark:text-purple-400 font-medium">
                        {policy.sub_agent_commission_percentage ? `${policy.sub_agent_commission_percentage}%` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400 font-medium">
                        {policy.sub_agent_commission_amount ? `₹${parseFloat(policy.sub_agent_commission_amount).toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => { setSelectedPolicy(policy); setShowPolicyDetail(true); }}
                          className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                          title="View Policy Details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 dark:bg-gray-900 font-semibold">
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">Totals:</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                      ₹{totalPremium.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-sm text-right"></td>
                    <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400">
                      ₹{totalCommission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Policy Detail Modal - View Only */}
      {showPolicyDetail && selectedPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Policy Details
              </h2>
              <button
                onClick={() => setShowPolicyDetail(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DetailField label="Policyholder Name" value={selectedPolicy.policyholder_name} />
                <DetailField label="Policy Number" value={selectedPolicy.policy_number} />
                <DetailField label="Product Type" value={selectedPolicy.product_type} />
                <DetailField label="Insurance Company" value={selectedPolicy.insurance_company} />
                <DetailField label="Business Type" value={selectedPolicy.business_type} />
                <DetailField label="Contact No." value={selectedPolicy.contact_no} />
                <DetailField label="Email" value={selectedPolicy.email_id} />
                <DetailField label="Start Date" value={selectedPolicy.policy_start_date ? new Date(selectedPolicy.policy_start_date).toLocaleDateString('en-IN') : 'N/A'} />
                <DetailField label="End Date" value={selectedPolicy.policy_end_date ? new Date(selectedPolicy.policy_end_date).toLocaleDateString('en-IN') : 'N/A'} />
                <DetailField label="Registration No." value={selectedPolicy.registration_no} />
                <DetailField label="Engine No." value={selectedPolicy.engine_no} />
                <DetailField label="Chasis No." value={selectedPolicy.chasis_no} />
                <DetailField label="IDV" value={selectedPolicy.idv ? `₹${parseFloat(selectedPolicy.idv).toLocaleString('en-IN')}` : undefined} />
                <DetailField label="Net Premium" value={selectedPolicy.net_premium ? `₹${parseFloat(selectedPolicy.net_premium).toLocaleString('en-IN')}` : undefined} />
                <DetailField label="OD Premium" value={selectedPolicy.od_premium ? `₹${parseFloat(selectedPolicy.od_premium).toLocaleString('en-IN')}` : undefined} />
                <DetailField label="Third Party Premium" value={selectedPolicy.third_party_premium ? `₹${parseFloat(selectedPolicy.third_party_premium).toLocaleString('en-IN')}` : undefined} />
                <DetailField label="GST" value={selectedPolicy.gst ? `₹${parseFloat(selectedPolicy.gst).toLocaleString('en-IN')}` : undefined} />
                <DetailField label="Total Premium" value={selectedPolicy.total_premium ? `₹${parseFloat(selectedPolicy.total_premium).toLocaleString('en-IN')}` : (selectedPolicy.premium_amount ? `₹${parseFloat(selectedPolicy.premium_amount).toLocaleString('en-IN')}` : undefined)} highlight />
                <DetailField label="My Commission %" value={selectedPolicy.sub_agent_commission_percentage ? `${selectedPolicy.sub_agent_commission_percentage}%` : undefined} />
                <DetailField label="My Commission Amount" value={selectedPolicy.sub_agent_commission_amount ? `₹${parseFloat(selectedPolicy.sub_agent_commission_amount).toLocaleString('en-IN')}` : undefined} highlight color="green" />
                <DetailField label="NCB %" value={selectedPolicy.ncb_percentage ? `${selectedPolicy.ncb_percentage}%` : undefined} />
                <DetailField label="Reference From" value={selectedPolicy.reference_from_name} />
                <DetailField label="Remark" value={selectedPolicy.remark} />
              </div>

              {/* Client Documents Link */}
              {selectedPolicy.documents_folder_link && (
                <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-sharp border border-purple-200 dark:border-purple-700">
                  <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Client Documents
                  </h4>
                  <a
                    href={selectedPolicy.documents_folder_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 dark:text-purple-400 hover:underline text-sm"
                  >
                    View Client Documents
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value, highlight, color }: { label: string; value?: string | null; highlight?: boolean; color?: string }) {
  if (!value) return null;
  return (
    <div className={`${highlight ? (color === 'green' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700') : ''} p-3 rounded-sharp`}>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className={`text-sm font-medium ${highlight ? (color === 'green' ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300') : 'text-gray-900 dark:text-white'}`}>
        {value}
      </p>
    </div>
  );
}
