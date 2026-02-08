import { useState, useEffect } from 'react';
import { X, Megaphone } from 'lucide-react';
import { adminNotificationService } from '../services/adminNotificationService';

export function AdminNotificationBanner() {
  const [message, setMessage] = useState<string | null>(null);
  const [notificationId, setNotificationId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    loadNotification();
  }, []);

  const loadNotification = async () => {
    try {
      const notification = await adminNotificationService.getActiveNotification();
      if (notification) {
        setNotificationId(notification.id);
        setMessage(notification.message);

        // Check if user already dismissed this specific notification
        const dismissedKey = `dismissed_notification_${notification.id}`;
        if (localStorage.getItem(dismissedKey) === 'true') {
          setDismissed(true);
        } else {
          setDismissed(false);
        }
      } else {
        setMessage(null);
        setNotificationId(null);
      }
    } catch (error) {
      console.error('Error loading admin notification:', error);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (notificationId) {
      localStorage.setItem(`dismissed_notification_${notificationId}`, 'true');
    }
  };

  // Don't show if admin is viewing their own notification (they manage it from Settings)
  // Actually, admin should also see their own notification as a preview
  if (!message || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Megaphone className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium truncate">{message}</p>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
