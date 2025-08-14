import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import LoginForm from '@/components/Auth/LoginForm';
import Sidebar from '@/components/Layout/Sidebar';
import Dashboard from '@/components/Admin/Dashboard';
import UserManagement from '@/components/Admin/UserManagement';
import TrainingManagement from '@/components/Admin/TrainingManagement';
import CategoryManagement from '@/components/Admin/CategoryManagement';
import Reports from '@/components/Admin/Reports';
import Settings from '@/components/Admin/Settings';
import TrainingList from '@/components/Employee/TrainingList';
import Progress from '@/components/Employee/Progress';
import Ranking from '@/components/Employee/Ranking';
import { initializeDatabase } from '@/data/mockData';

const MainApp = () => {
  const { user, logout, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    if (user) {
      if (isAdmin()) {
        setActiveTab('dashboard');
      } else {
        setActiveTab('meus-treinamentos');
      }
    }
  }, [user, isAdmin]);

  const handleLogout = () => {
    logout();
    setActiveTab('');
  };

  const renderContent = () => {
    switch (activeTab) {
      // Admin tabs
      case 'dashboard':
        return <Dashboard />;
      case 'usuarios':
        return <UserManagement />;
      case 'treinamentos':
        return <TrainingManagement />;
      case 'categorias':
        return <CategoryManagement />;
      case 'relatorios':
        return <Reports />;
      case 'configuracoes':
        return <Settings />;
      
      // Employee tabs
      case 'meus-treinamentos':
        return <TrainingList />;
      case 'progresso':
        return <Progress />;
      case 'ranking':
        return <Ranking />;
      
      default:
        return isAdmin() ? <Dashboard /> : <TrainingList />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        {renderContent()}
      </main>
    </div>
  );
};

function App() {
  useEffect(() => {
    initializeDatabase();
  }, []);

  return (
    <AuthProvider>
      <Helmet>
        <title>Central de Treinamento para Contabilidade</title>
        <meta name="description" content="Plataforma completa de treinamento online para área contábil com controle de usuários, treinamentos e relatórios de progresso." />
        <meta property="og:title" content="Central de Treinamento para Contabilidade" />
        <meta property="og:description" content="Plataforma completa de treinamento online para área contábil com controle de usuários, treinamentos e relatórios de progresso." />
      </Helmet>
      <MainApp />
      <Toaster />
    </AuthProvider>
  );
}

export default App;