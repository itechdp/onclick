import { useState, useEffect, type ChangeEvent } from 'react';
import { Settings as SettingsIcon, Plus, Edit2, Trash2, Save, X, Building2, FileText, Package, Search, Download, Megaphone, Send, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { policySettingsService, PolicySetting } from '../services/policySettingsService';
import { adminNotificationService } from '../services/adminNotificationService';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_INSURANCE_COMPANIES, DEFAULT_PRODUCT_TYPES, DEFAULT_LOBS } from '../constants/policyDropdowns';
import { logoService } from '../services/logoService';

type Category = 'insurance_company' | 'product_type' | 'lob';

const CATEGORY_LABELS = {
  insurance_company: 'Insurance Companies',
  product_type: 'Product Types',
  lob: 'Line of Business (LOB)'
};

const CATEGORY_ICONS = {
  insurance_company: Building2,
  product_type: FileText,
  lob: Package
};

export function Settings() {
  const { user, effectiveUserId } = useAuth();
  const [settings, setSettings] = useState<Record<Category, PolicySetting[]>>({
    insurance_company: [],
    product_type: [],
    lob: []
  });
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>('insurance_company');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [adding, setAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoRemoving, setLogoRemoving] = useState(false);

  // Admin broadcast notification
  const [notificationText, setNotificationText] = useState('');
  const [currentNotification, setCurrentNotification] = useState<string | null>(null);
  const [savingNotification, setSavingNotification] = useState(false);
  const isAdmin = user?.role === 'admin';

  const DEFAULT_VALUES = {
    insurance_company: DEFAULT_INSURANCE_COMPANIES,
    product_type: DEFAULT_PRODUCT_TYPES,
    lob: DEFAULT_LOBS
  };

  useEffect(() => {
    loadSettings();
    if (isAdmin && effectiveUserId) {
      loadNotification();
    }
  }, []);

  useEffect(() => {
    if (!effectiveUserId) return;
    logoService.getUserLogoUrl(effectiveUserId)
      .then(url => setLogoUrl(url))
      .catch(() => setLogoUrl(null));
  }, [effectiveUserId]);

  const loadNotification = async () => {
    if (!effectiveUserId) return;
    try {
      const notification = await adminNotificationService.getActiveNotification();
      if (notification) {
        setCurrentNotification(notification.message);
        setNotificationText(notification.message);
      }
    } catch (error) {
      console.error('Error loading notification:', error);
    }
  };

  const handleSaveNotification = async () => {
    if (!effectiveUserId) return;
    try {
      setSavingNotification(true);
      if (notificationText.trim()) {
        await adminNotificationService.setNotification(effectiveUserId, notificationText.trim());
        setCurrentNotification(notificationText.trim());
        toast.success('Notification sent to all users!');
      } else {
        await adminNotificationService.clearNotification(effectiveUserId);
        setCurrentNotification(null);
        setNotificationText('');
        toast.success('Notification cleared');
      }
    } catch (error) {
      console.error('Error saving notification:', error);
      toast.error('Failed to save notification');
    } finally {
      setSavingNotification(false);
    }
  };

  const handleClearNotification = async () => {
    if (!effectiveUserId) return;
    try {
      setSavingNotification(true);
      await adminNotificationService.clearNotification(effectiveUserId);
      setCurrentNotification(null);
      setNotificationText('');
      toast.success('Notification cleared');
    } catch (error) {
      console.error('Error clearing notification:', error);
      toast.error('Failed to clear notification');
    } finally {
      setSavingNotification(false);
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await policySettingsService.getAllSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newValue.trim()) {
      toast.error('Please enter a value');
      return;
    }

    try {
      setAdding(true);
      const newSetting = await policySettingsService.createSetting({
        category: activeCategory,
        value: newValue.trim()
      });
      
      setSettings(prev => ({
        ...prev,
        [activeCategory]: [...prev[activeCategory], newSetting].sort((a, b) => a.value.localeCompare(b.value))
      }));
      
      setNewValue('');
      setShowAddModal(false);
      toast.success('Added successfully');
    } catch (error: any) {
      console.error('Error adding setting:', error);
      if (error.message?.includes('duplicate')) {
        toast.error('This value already exists');
      } else {
        toast.error('Failed to add item');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleEdit = (setting: PolicySetting) => {
    setEditingId(setting.id);
    setEditValue(setting.value);
  };

  const handleSave = async (id: string) => {
    if (!editValue.trim()) {
      toast.error('Value cannot be empty');
      return;
    }

    try {
      await policySettingsService.updateSetting(id, editValue.trim());
      
      setSettings(prev => ({
        ...prev,
        [activeCategory]: prev[activeCategory]
          .map(s => s.id === id ? { ...s, value: editValue.trim() } : s)
          .sort((a, b) => a.value.localeCompare(b.value))
      }));
      
      setEditingId(null);
      toast.success('Updated successfully');
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update item');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await policySettingsService.deleteSetting(id);
      
      setSettings(prev => ({
        ...prev,
        [activeCategory]: prev[activeCategory].filter(s => s.id !== id)
      }));
      
      toast.success('Deleted successfully');
    } catch (error) {
      console.error('Error deleting setting:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleQuickAdd = async (value: string) => {
    try {
      const newSetting = await policySettingsService.createSetting({
        category: activeCategory,
        value
      });

      setSettings(prev => ({
        ...prev,
        [activeCategory]: [...prev[activeCategory], newSetting]
      }));

      toast.success(`"${value}" added successfully`);
    } catch (error: any) {
      if (error.message?.includes('duplicate')) {
        toast.error('This item already exists');
      } else {
        console.error('Error adding setting:', error);
        toast.error('Failed to add item');
      }
    }
  };

  const handleInitializeDefaults = async () => {
    if (!confirm('This will load all default dropdown values from the system. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      const defaultValues = DEFAULT_VALUES[activeCategory];
      
      // Add all default values for the current category
      const promises = defaultValues.map(value => 
        policySettingsService.createSetting({
          category: activeCategory,
          value
        }).catch(err => {
          // Ignore duplicate errors
          if (!err.message?.includes('duplicate')) {
            console.error('Error adding:', value, err);
          }
        })
      );

      await Promise.all(promises);
      await loadSettings();
      toast.success(`${defaultValues.length} default values loaded for ${CATEGORY_LABELS[activeCategory]}`);
    } catch (error) {
      console.error('Error initializing defaults:', error);
      toast.error('Failed to initialize defaults');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadAllDefaults = async () => {
    if (!confirm('This will load ALL default values for Insurance Companies, Product Types, and LOBs. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      
      const allPromises = [];
      for (const [category, values] of Object.entries(DEFAULT_VALUES)) {
        for (const value of values) {
          allPromises.push(
            policySettingsService.createSetting({
              category: category as Category,
              value
            }).catch(err => {
              // Ignore duplicate errors
              if (!err.message?.includes('duplicate')) {
                console.error('Error adding:', value, err);
              }
            })
          );
        }
      }

      await Promise.all(allPromises);
      await loadSettings();
      toast.success('All default values loaded successfully!');
    } catch (error) {
      console.error('Error loading all defaults:', error);
      toast.error('Failed to load defaults');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentSettings = settings[activeCategory];
  const defaultValues = DEFAULT_VALUES[activeCategory];
  
  // Filter settings based on search term
  const filteredSettings = currentSettings.filter(setting =>
    setting.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get available default values that are not yet added
  const availableDefaults = defaultValues.filter(
    defaultValue => !currentSettings.some(s => s.value === defaultValue)
  );

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!effectiveUserId) return;
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLogoUploading(true);
      const result = await logoService.uploadUserLogo(file, effectiveUserId);
      if (result) {
        setLogoUrl(result.url);
        toast.success('Logo uploaded successfully');
      }
    } finally {
      setLogoUploading(false);
      event.currentTarget.value = '';
    }
  };

  const handleLogoRemove = async () => {
    if (!effectiveUserId) return;
    if (!confirm('Remove your logo?')) return;

    try {
      setLogoRemoving(true);
      const ok = await logoService.deleteUserLogos(effectiveUserId);
      if (ok) {
        setLogoUrl(null);
        toast.success('Logo removed');
      } else {
        toast.error('Failed to remove logo');
      }
    } finally {
      setLogoRemoving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <SettingsIcon className="w-7 h-7 text-blue-600" />
              Policy Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Customize dropdown options for policy forms. Default options are always available in Add Policy form.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleInitializeDefaults}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title={`Load ${defaultValues.length} default ${CATEGORY_LABELS[activeCategory].toLowerCase()}`}
            >
              <Download className="w-4 h-4 inline mr-2" />
              Load Defaults ({defaultValues.length})
            </button>
            <button
              onClick={handleLoadAllDefaults}
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 border border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              Load All Categories
            </button>
          </div>
        </div>

        {/* Admin Broadcast Notification */}
        {isAdmin && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Megaphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Broadcast Notification</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">— shown to all your users at the top of the portal</span>
            </div>
            {currentNotification && (
              <div className="mb-3 p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-sm text-blue-800 dark:text-blue-200 flex items-center justify-between">
                <span><strong>Current:</strong> {currentNotification}</span>
                <button
                  onClick={handleClearNotification}
                  disabled={savingNotification}
                  className="ml-3 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs font-medium"
                >
                  Remove
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={notificationText}
                onChange={(e) => setNotificationText(e.target.value)}
                placeholder="Type a message to broadcast to all users..."
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                maxLength={300}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveNotification()}
              />
              <button
                onClick={handleSaveNotification}
                disabled={savingNotification || (!notificationText.trim() && !currentNotification)}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Send className="w-4 h-4" />
                {savingNotification ? 'Saving...' : currentNotification ? 'Update' : 'Send'}
              </button>
            </div>
          </div>
        )}

        {/* Branding - User Logo */}
        <div className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Branding</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">— add your logo for print headers</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-28 h-20 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="User Logo" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-gray-500">No logo</span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Logo (PNG/JPG/SVG/WEBP)
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                  onChange={handleLogoUpload}
                  disabled={logoUploading}
                  className="block text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:py-2 file:px-4 file:border-0 file:rounded-md file:bg-purple-600 file:text-white hover:file:bg-purple-700 disabled:opacity-60"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Max size 2MB. Stored in Supabase bucket: logos.</p>
              </div>
            </div>
            <div className="md:ml-auto">
              <button
                onClick={handleLogoRemove}
                disabled={!logoUrl || logoRemoving}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {logoRemoving ? 'Removing...' : 'Remove Logo'}
              </button>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((category) => {
            const Icon = CATEGORY_ICONS[category];
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                  activeCategory === category
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {CATEGORY_LABELS[category]}
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700">
                  {settings[category].length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${CATEGORY_LABELS[activeCategory].toLowerCase()}...`}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="ml-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>

        {/* Stats */}
        <div className="mb-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>Total: <strong className="text-gray-900 dark:text-white">{currentSettings.length}</strong></span>
          <span>•</span>
          <span>Available defaults: <strong className="text-gray-900 dark:text-white">{availableDefaults.length}</strong></span>
          {searchTerm && (
            <>
              <span>•</span>
              <span>Filtered: <strong className="text-gray-900 dark:text-white">{filteredSettings.length}</strong></span>
            </>
          )}
        </div>

        {currentSettings.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              <strong>Note:</strong> Default options ({defaultValues.length} items) are automatically available in the Add Policy form.
            </p>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              You can customize by adding your own options or loading all defaults here to modify them.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleInitializeDefaults}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Load {defaultValues.length} Defaults
              </button>
              <span className="text-gray-400">or</span>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add Manually
              </button>
            </div>
          </div>
        ) : filteredSettings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No results found for "{searchTerm}"
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-2">
              {filteredSettings.map((setting) => (
                <div
                  key={setting.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {editingId === setting.id ? (
                    <>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSave(setting.id)}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                        title="Save"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-gray-900 dark:text-white">
                        {setting.value}
                      </span>
                      <button
                        onClick={() => handleEdit(setting)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(setting.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Available Defaults Section */}
            {availableDefaults.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Available Defaults ({availableDefaults.length})
                  </h3>
                  <button
                    onClick={handleInitializeDefaults}
                    className="text-sm text-green-600 dark:text-green-400 hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Add All
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {availableDefaults.map((value, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickAdd(value)}
                        className="text-left px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-between group"
                      >
                        <span className="truncate">{value}</span>
                        <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Add {CATEGORY_LABELS[activeCategory]}
            </h2>

            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Enter value..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewValue('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                disabled={adding}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={adding || !newValue.trim()}
              >
                {adding ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
