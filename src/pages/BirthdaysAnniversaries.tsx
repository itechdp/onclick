import { useState, useEffect } from 'react';
import { 
  Gift, Heart, Calendar, MessageCircle, Plus, 
  Save, X, Sparkles, Clock, Copy, ChevronDown
} from 'lucide-react';
import { Customer } from '../types/customer';
import { fetchCustomers } from '../services/customerService';
import toast from 'react-hot-toast';
import { format, differenceInDays, setYear } from 'date-fns';

interface EventCustomer extends Customer {
  eventType: 'birthday' | 'anniversary';
  eventDate: Date;
  daysUntil: number;
  isToday: boolean;
}

interface MessageTemplate {
  id: string;
  type: 'birthday' | 'anniversary';
  name: string;
  message: string;
  isDefault: boolean;
}

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'bday1',
    type: 'birthday',
    name: 'Simple Birthday',
    message: '🎉 Happy Birthday {name}! 🎂\n\nWishing you a wonderful day filled with joy and happiness!\n\nBest regards,\n{company}',
    isDefault: true
  },
  {
    id: 'bday2',
    type: 'birthday',
    name: 'Warm Birthday',
    message: '🎈 Dear {name},\n\nWarmest birthday wishes to you! May this special day bring you endless joy and tons of precious memories!\n\nHave a fantastic celebration! 🎉\n\n- {company}',
    isDefault: true
  },
  {
    id: 'anni1',
    type: 'anniversary',
    name: 'Simple Anniversary',
    message: '💐 Happy Anniversary {name}! 💑\n\nWishing you both a wonderful day and many more years of love and happiness together!\n\nWarm regards,\n{company}',
    isDefault: true
  },
  {
    id: 'anni2',
    type: 'anniversary',
    name: 'Warm Anniversary',
    message: '❤️ Dear {name},\n\nWishing you a very Happy Anniversary! May your love continue to grow stronger with each passing year.\n\nCelebrate this beautiful journey! 💕\n\n- {company}',
    isDefault: true
  }
];

export function BirthdaysAnniversaries() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [events, setEvents] = useState<EventCustomer[]>([]);
  const [todayEvents, setTodayEvents] = useState<EventCustomer[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<MessageTemplate[]>(DEFAULT_TEMPLATES);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [companyName, setCompanyName] = useState('OnClicks.in');
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  useEffect(() => {
    loadCustomers();
    loadTemplatesFromStorage();
    loadCompanyName();
  }, []);

  useEffect(() => {
    if (customers.length > 0) {
      processEvents();
    }
  }, [customers]);

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

  const loadTemplatesFromStorage = () => {
    const stored = localStorage.getItem('messageTemplates');
    if (stored) {
      try {
        const customTemplates = JSON.parse(stored);
        setTemplates([...DEFAULT_TEMPLATES, ...customTemplates]);
      } catch (error) {
        console.error('Error loading templates:', error);
      }
    }
  };

  const loadCompanyName = () => {
    const stored = localStorage.getItem('companyName');
    if (stored) {
      setCompanyName(stored);
    }
  };

  const saveTemplates = (newTemplates: MessageTemplate[]) => {
    const customTemplates = newTemplates.filter(t => !t.isDefault);
    localStorage.setItem('messageTemplates', JSON.stringify(customTemplates));
  };

  const saveCompanyName = (name: string) => {
    localStorage.setItem('companyName', name);
    setCompanyName(name);
  };

  const processEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const allEvents: EventCustomer[] = [];

    customers.forEach(customer => {
      // Process birthdays
      if (customer.dateOfBirth) {
        const dob = new Date(customer.dateOfBirth);
        const thisYearBirthday = setYear(dob, today.getFullYear());
        const nextYearBirthday = setYear(dob, today.getFullYear() + 1);
        
        const birthdayThisYear = thisYearBirthday >= today ? thisYearBirthday : nextYearBirthday;
        const daysUntil = differenceInDays(birthdayThisYear, today);

        if (daysUntil <= 90) { // Show next 90 days
          allEvents.push({
            ...customer,
            eventType: 'birthday',
            eventDate: birthdayThisYear,
            daysUntil,
            isToday: daysUntil === 0
          });
        }
      }

      // Process anniversaries
      if (customer.anniversaryDate) {
        const anniversary = new Date(customer.anniversaryDate);
        const thisYearAnniversary = setYear(anniversary, today.getFullYear());
        const nextYearAnniversary = setYear(anniversary, today.getFullYear() + 1);
        
        const anniversaryThisYear = thisYearAnniversary >= today ? thisYearAnniversary : nextYearAnniversary;
        const daysUntil = differenceInDays(anniversaryThisYear, today);

        if (daysUntil <= 90) { // Show next 90 days
          allEvents.push({
            ...customer,
            eventType: 'anniversary',
            eventDate: anniversaryThisYear,
            daysUntil,
            isToday: daysUntil === 0
          });
        }
      }
    });

    // Sort by date (ascending)
    allEvents.sort((a, b) => a.daysUntil - b.daysUntil);

    setEvents(allEvents);
    setTodayEvents(allEvents.filter(e => e.isToday));
    setUpcomingEvents(allEvents.filter(e => !e.isToday));
  };

  const handleSendWhatsApp = (event: EventCustomer, template?: MessageTemplate) => {
    if (!event.contactNo) {
      toast.error('No contact number available for this customer');
      return;
    }

    const templateToUse = template || selectedTemplate || templates.find(t => t.type === event.eventType && t.isDefault);
    
    if (!templateToUse) {
      toast.error('Please select a message template');
      return;
    }

    const message = templateToUse.message
      .replace(/{name}/g, event.customerName)
      .replace(/{company}/g, companyName);

    const phoneNumber = event.contactNo.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success(`Opening WhatsApp to send ${event.eventType} wishes!`);
  };

  const handleCopyMessage = (event: EventCustomer, template?: MessageTemplate) => {
    const templateToUse = template || selectedTemplate || templates.find(t => t.type === event.eventType && t.isDefault);
    
    if (!templateToUse) {
      toast.error('Please select a message template');
      return;
    }

    const message = templateToUse.message
      .replace(/{name}/g, event.customerName)
      .replace(/{company}/g, companyName);

    navigator.clipboard.writeText(message)
      .then(() => {
        toast.success('Message copied to clipboard!');
      })
      .catch(() => {
        toast.error('Failed to copy message');
      });
  };

  const handleAddTemplate = () => {
    setEditingTemplate({
      id: `custom_${Date.now()}`,
      type: 'birthday',
      name: '',
      message: '',
      isDefault: false
    });
    setShowTemplateModal(true);
  };

  const handleEditTemplate = (template: MessageTemplate) => {
    if (template.isDefault) {
      toast.error('Cannot edit default templates. Create a new custom template instead.');
      return;
    }
    setEditingTemplate(template);
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;

    if (!editingTemplate.name.trim() || !editingTemplate.message.trim()) {
      toast.error('Template name and message are required');
      return;
    }

    const existingIndex = templates.findIndex(t => t.id === editingTemplate.id);
    let newTemplates;

    if (existingIndex >= 0) {
      newTemplates = [...templates];
      newTemplates[existingIndex] = editingTemplate;
    } else {
      newTemplates = [...templates, editingTemplate];
    }

    setTemplates(newTemplates);
    saveTemplates(newTemplates);
    setShowTemplateModal(false);
    setEditingTemplate(null);
    toast.success('Template saved successfully!');
  };

  const handleDeleteTemplate = (id: string) => {
    const template = templates.find(t => t.id === id);
    if (template?.isDefault) {
      toast.error('Cannot delete default templates');
      return;
    }

    if (!confirm('Are you sure you want to delete this template?')) return;

    const newTemplates = templates.filter(t => t.id !== id);
    setTemplates(newTemplates);
    saveTemplates(newTemplates);
    toast.success('Template deleted successfully');
  };

  const EventCard = ({ event }: { event: EventCustomer }) => {
    const eventIcon = event.eventType === 'birthday' ? Gift : Heart;
    const EventIcon = eventIcon;

    return (
      <div className={`bg-white dark:bg-gray-800 rounded-sharp shadow-sm border-t-4 ${
        event.isToday 
          ? event.eventType === 'birthday' ? 'border-purple-600' : 'border-pink-600'
          : 'border-gray-300 dark:border-gray-600'
      } p-5 hover:shadow-lg transition-shadow flex flex-col h-full`}>
        {/* Icon and Days Until Badge */}
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            event.eventType === 'birthday' 
              ? 'bg-purple-100 dark:bg-purple-900/30' 
              : 'bg-pink-100 dark:bg-pink-900/30'
          }`}>
            <EventIcon className={event.eventType === 'birthday' ? 'text-purple-600' : 'text-pink-600'} size={20} />
          </div>
          {event.isToday ? (
            <span className={`px-2 py-1 text-xs font-bold rounded-full whitespace-nowrap ${
              event.eventType === 'birthday'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                : 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300'
            }`}>
              TODAY 🎉
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full whitespace-nowrap">
              {event.daysUntil === 1 ? 'Tomorrow' : `${event.daysUntil}d`}
            </span>
          )}
        </div>

        {/* Customer Name */}
        <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1 line-clamp-2">
          {event.customerName}
        </h3>

        {/* Event Type */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {event.eventType === 'birthday' ? '🎂 Birthday' : '💑 Anniversary'}
        </p>

        {/* Date */}
        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-2">
          {format(event.eventDate, 'MMM dd, yyyy')}
        </p>

        {/* Contact Number */}
        {event.contactNo && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-1">
            📞 {event.contactNo}
          </p>
        )}

        {/* Buttons */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => handleCopyMessage(event)}
            title="Copy Message"
            className="flex-1 flex items-center justify-center px-2 py-1.5 rounded-sharp bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 text-white transition-colors"
          >
            <Copy size={14} />
          </button>
          {event.contactNo && (
            <button
              onClick={() => handleSendWhatsApp(event)}
              title="Send WhatsApp"
              className={`flex-1 flex items-center justify-center px-2 py-1.5 rounded-sharp text-white transition-colors ${
                event.eventType === 'birthday'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-pink-600 hover:bg-pink-700'
              }`}
            >
              <MessageCircle size={14} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Sparkles className="mr-3 text-pink-600" size={28} />
              Birthdays & Anniversaries
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Never miss an important celebration
            </p>
          </div>
          <button
            onClick={handleAddTemplate}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-sharp hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
          >
            <Plus size={20} className="mr-2" />
            New Template
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-sharp">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">Today's Events</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{todayEvents.length}</p>
              </div>
              <Calendar className="text-purple-600" size={32} />
            </div>
          </div>
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 p-4 rounded-sharp">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-pink-700 dark:text-pink-300 font-medium">Upcoming Birthdays</p>
                <p className="text-2xl font-bold text-pink-900 dark:text-pink-100">
                  {upcomingEvents.filter(e => e.eventType === 'birthday').length}
                </p>
              </div>
              <Gift className="text-pink-600" size={32} />
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-sharp">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">Upcoming Anniversaries</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {upcomingEvents.filter(e => e.eventType === 'anniversary').length}
                </p>
              </div>
              <Heart className="text-red-600" size={32} />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-sharp">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Message Templates</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{templates.length}</p>
              </div>
              <MessageCircle className="text-blue-600" size={32} />
            </div>
          </div>
        </div>

        {/* Template Settings - Collapsible Dropdown */}
        <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-sharp overflow-hidden border border-gray-200 dark:border-gray-600">
          <button
            onClick={() => setSettingsExpanded(!settingsExpanded)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
              <MessageCircle size={20} className="mr-2 text-blue-600" />
              Message Settings & Templates
            </h3>
            <ChevronDown 
              size={20} 
              className={`text-gray-600 dark:text-gray-400 transition-transform duration-200 ${
                settingsExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Expanded Content */}
          {settingsExpanded && (
            <div className="border-t border-gray-200 dark:border-gray-600 p-4 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company/Business Name (for messages)
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => saveCompanyName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your company name"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Template
                  </label>
                  <select
                    value={selectedTemplate?.id || ''}
                    onChange={(e) => {
                      const template = templates.find(t => t.id === e.target.value);
                      setSelectedTemplate(template || null);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select default template...</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Quick Template Management */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Your Templates (Click to edit custom templates)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {templates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => !template.isDefault && handleEditTemplate(template)}
                      className={`text-left p-3 rounded-sharp border transition-colors ${
                        template.isDefault
                          ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 cursor-default'
                          : 'border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {template.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {template.type === 'birthday' ? '🎂 Birthday' : '💑 Anniversary'}
                            {template.isDefault && ' • Default Template'}
                          </p>
                        </div>
                        {!template.isDefault && (
                          <span className="text-xs text-purple-600 dark:text-purple-400 ml-2">
                            Click to edit
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading events...</p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-xl text-gray-600 dark:text-gray-400">No upcoming events</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Add birthdays and anniversaries to customer profiles to see them here
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Today's Events */}
            {todayEvents.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Clock className="mr-2 text-green-600" size={24} />
                  Today's Celebrations 🎉
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {todayEvents.map(event => (
                    <EventCard key={`${event.id}-${event.eventType}`} event={event} />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Calendar className="mr-2 text-blue-600" size={24} />
                  Upcoming Events
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {upcomingEvents.map(event => (
                    <EventCard key={`${event.id}-${event.eventType}`} event={event} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Template Modal */}
      {showTemplateModal && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-sharp shadow-xl max-w-2xl w-full">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingTemplate.id.startsWith('custom_') && !templates.find(t => t.id === editingTemplate.id)
                    ? 'Create Message Template'
                    : 'Edit Message Template'}
                </h2>
                <button
                  onClick={() => {
                    setShowTemplateModal(false);
                    setEditingTemplate(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Warm Birthday Wishes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Type *
                </label>
                <select
                  value={editingTemplate.type}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, type: e.target.value as 'birthday' | 'anniversary' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="birthday">Birthday</option>
                  <option value="anniversary">Anniversary</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message Template *
                </label>
                <textarea
                  value={editingTemplate.message}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, message: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                  placeholder="Type your message here..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Use <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">{'{name}'}</code> for customer name and <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">{'{company}'}</code> for your company name
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-sharp">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Preview:</h4>
                <pre className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap font-sans">
                  {editingTemplate.message
                    .replace(/{name}/g, 'John Doe')
                    .replace(/{company}/g, companyName)}
                </pre>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between">
              {editingTemplate.id.startsWith('custom_') && templates.find(t => t.id === editingTemplate.id) && (
                <button
                  onClick={() => handleDeleteTemplate(editingTemplate.id)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-sharp transition-colors"
                >
                  Delete Template
                </button>
              )}
              <div className="flex space-x-3 ml-auto">
                <button
                  onClick={() => {
                    setShowTemplateModal(false);
                    setEditingTemplate(null);
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-sharp text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-sharp hover:from-purple-700 hover:to-pink-700 transition-all flex items-center"
                >
                  <Save size={20} className="mr-2" />
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
