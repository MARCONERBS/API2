import { useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopBar from '../components/AdminTopBar';
import AdminDashboardTab from '../components/AdminDashboardTab';
import AdminUsersTab from '../components/AdminUsersTab';
import AdminInstancesTab from '../components/AdminInstancesTab';
import AdminPlansTab from '../components/AdminPlansTab';
import ClientApiTab from '../components/ClientApiTab';
import AdminSettingsTab from '../components/AdminSettingsTab';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboardTab />;
      case 'users':
        return <AdminUsersTab />;
      case 'instances':
        return <AdminInstancesTab />;
      case 'plans':
        return <AdminPlansTab />;
      case 'api':
        return <ClientApiTab />;
      case 'settings':
        return <AdminSettingsTab />;
      default:
        return <AdminDashboardTab />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminTopBar />

        <main className={`flex-1 overflow-y-auto ${activeTab === 'api' ? '' : 'p-6'}`}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
