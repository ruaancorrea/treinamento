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
import DepartmentManagement from '@/components/Admin/DepartmentManagement';
import LearningPathManagement from '@/components/Admin/LearningPathManagement';
import Reports from '@/components/Admin/Reports';
import Settings from '@/components/Admin/Settings';
import TrainingList from '@/components/Employee/TrainingList';
import LearningPathList from '@/components/Employee/LearningPathList';
import Progress from '@/components/Employee/Progress';
import Ranking from '@/components/Employee/Ranking';
import { initializeDatabase } from '@/data/mockData';

const MainApp = () => {
  const { user, logout, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    if (user) {
      setActiveTab(isAdmin() ? 'dashboard' : 'meus-treinamentos');
    }
  }, [user, isAdmin]);

  const handleLogout = () => {
    logout();
    setActiveTab('');
  };

  const renderContent = () => {
    switch (activeTab) {
      // Admin
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
      case 'usuarios': return <UserManagement />;
      case 'treinamentos': return <TrainingManagement />;
      case 'trilhas': return <LearningPathManagement />;
      case 'categorias': return <CategoryManagement />;
      case 'departamentos': return <DepartmentManagement />;
      case 'relatorios': return <Reports />;
      case 'configuracoes': return <Settings />;
      
      // Employee
      case 'meus-treinamentos': return <TrainingList />;
      case 'minhas-trilhas': return <LearningPathList />;
      case 'progresso': return <Progress />;
      case 'ranking': return <Ranking />;
      
      default: return isAdmin() ? <Dashboard setActiveTab={setActiveTab} /> : <TrainingList />;
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
  const [dbLoaded, setDbLoaded] = useState(false);

  useEffect(() => {
    const loadDb = async () => {
      await initializeDatabase();
      setDbLoaded(true);
    };
    loadDb();
  }, []);

  // Mostra um loading enquanto o banco de dados carrega
  if (!dbLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        <p className="text-white ml-4">Carregando banco de dados...</p>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Helmet>
        <title>Central de Treinamento</title>
      </Helmet>
      <MainApp />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
