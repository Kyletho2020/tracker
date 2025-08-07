import React from 'react';
import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthForm } from './components/AuthForm';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { FocusTimer } from './components/FocusTimer';
import { Activities } from './components/Activities';

function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard userId={user.id} />;
      case 'timer':
        return <FocusTimer userId={user.id} />;
      case 'activities':
        return <Activities userId={user.id} />;
      case 'goals':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Goals</h1>
            <p className="text-gray-600">Goal tracking feature coming soon...</p>
          </div>
        );
      case 'analytics':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h1>
            <p className="text-gray-600">Advanced analytics coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Settings</h1>
            <p className="text-gray-600">Settings panel coming soon...</p>
          </div>
        );
      default:
        return <Dashboard userId={user.id} />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
