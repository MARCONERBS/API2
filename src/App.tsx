import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import ApiLandingPage from './pages/ApiLandingPage';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showApiPage, setShowApiPage] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Carregando...</div>
      </div>
    );
  }

  if (!user || !profile) {
    if (showApiPage) {
      return <ApiLandingPage onLogin={() => { setShowApiPage(false); setShowLogin(true); }} />;
    }
    if (!showLogin) {
      return <LandingPage onLogin={() => setShowLogin(true)} onShowApi={() => setShowApiPage(true)} />;
    }
    return <Login />;
  }

  if (profile.role === 'admin') {
    return <AdminDashboard />;
  }

  return <ClientDashboard />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
