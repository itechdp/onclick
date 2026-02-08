import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { AdminNotificationBanner } from './AdminNotificationBanner';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-64">
        <AdminNotificationBanner />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}