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
import KnowledgeBase from '@/components/Shared/KnowledgeBase';
import KnowledgeBaseManagement from '@/components/Admin/KnowledgeBaseManagement';
import SimuladoManagement from './components/Admin/SimuladoManagement';
import SimuladoList from './components/Employee/SimuladoList';
import SimuladoPlayer from './components/Employee/SimuladoPlayer';
import CertificateView from './components/Shared/CertificateView';
import PdiManagement from './components/Admin/PdiManagement';
import PdiView from './components/Employee/PdiView'; // <-- Importado aqui

// --- LÓGICA DE MIGRAÇÃO ---
import { initializeDatabase, getDatabase } from '@/data/mockData';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';


const MainApp = () => {
    const { user, logout, isAdmin, loading } = useAuth();
    const [activeTab, setActiveTab] = useState('');
    const [selectedSimulado, setSelectedSimulado] = useState(null);
    const [certificateData, setCertificateData] = useState(null);

    useEffect(() => {
        if (user) {
            // Define a página inicial do funcionário como "Meu PDI"
            setActiveTab(isAdmin() ? 'dashboard' : 'meu-pdi');
        }
    }, [user, isAdmin]);

    useEffect(() => {
        const savedTheme = localStorage.getItem('customTheme');
        if (savedTheme) {
            // ... (código do tema que já tem)
        }
    }, []);

    const handleLogout = () => {
        logout();
        setActiveTab('');
    };

    const handleStartSimulado = (simulado) => {
        setSelectedSimulado(simulado);
        setActiveTab('fazendo-simulado');
    };

    const handleFinishSimulado = () => {
        setSelectedSimulado(null);
        setActiveTab('meus-simulados');
    };

    const handleViewCertificate = (learningPath) => {
        setCertificateData({ user, learningPath, completionDate: new Date() });
        setActiveTab('ver-certificado');
    };

    const handleBackFromCertificate = () => {
        setCertificateData(null);
        setActiveTab('minhas-trilhas');
    };

    const renderContent = () => {
        if (activeTab === 'ver-certificado' && certificateData) {
            return <CertificateView certificateData={certificateData} onBack={handleBackFromCertificate} />;
        }
        if (activeTab === 'fazendo-simulado' && selectedSimulado) {
            return <SimuladoPlayer simulado={selectedSimulado} onFinish={handleFinishSimulado} />;
        }

        switch (activeTab) {
            // Admin
            case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
            case 'usuarios': return <UserManagement />;
            case 'pdi': return <PdiManagement />;
            case 'treinamentos': return <TrainingManagement />;
            case 'trilhas': return <LearningPathManagement />;
            case 'categorias': return <CategoryManagement />;
            case 'departamentos': return <DepartmentManagement />;
            case 'relatorios': return <Reports />;
            case 'gerenciar-conhecimento': return <KnowledgeBaseManagement />;
            case 'configuracoes': return <Settings />;
            case 'simulados': return <SimuladoManagement />;
            
            // Employee
            // V V V V V V V V V V V V V V V V V V V V V V V V V V V V V V V V V V V
            case 'meu-pdi': return <PdiView />; // <-- MUDANÇA IMPORTANTE AQUI
            // ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ 
            case 'meus-treinamentos': return <TrainingList />;
            case 'minhas-trilhas': return <LearningPathList onViewCertificate={handleViewCertificate} />;
            case 'meus-simulados': return <SimuladoList onStartSimulado={handleStartSimulado} />;
            case 'progresso': return <Progress />;
            case 'ranking': return <Ranking />;

            // Shared
            case 'base-de-conhecimento': return <KnowledgeBase />;
            
            default: return isAdmin() ? <Dashboard setActiveTab={setActiveTab} /> : <PdiView />;
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

// --- FUNÇÃO DE MIGRAÇÃO E APP PRINCIPAL (sem alterações) ---
const runMigration = async () => {
    const migrationControlRef = doc(db, "internal", "migrationStatus");
    const migrationControlSnap = await getDoc(migrationControlRef);
    if (migrationControlSnap.exists() && migrationControlSnap.data().migrated) { return; }
    console.log("--- INICIANDO MIGRAÇÃO DE DADOS ---");
    const oldDb = getDatabase(); 
    const collectionsToMigrate = ['usuarios', 'categorias', 'departamentos', 'treinamentos', 'historico', 'trilhas', 'knowledgeBase'];
    for (const collectionName of collectionsToMigrate) {
        if (oldDb[collectionName] && Array.isArray(oldDb[collectionName])) {
            for (const item of oldDb[collectionName]) {
                if (item && item.id) { await setDoc(doc(db, collectionName, item.id.toString()), item); }
            }
        }
    }
    await setDoc(migrationControlRef, { migrated: true, date: new Date().toISOString() });
    console.log("--- MIGRAÇÃO CONCLUÍDA COM SUCESSO ---");
};

function App() {
    const [dbLoaded, setDbLoaded] = useState(false);
    useEffect(() => {
        const loadAndMigrate = async () => {
            await initializeDatabase(); 
            await runMigration();      
            setDbLoaded(true);
        };
        loadAndMigrate();
    }, []);
    if (!dbLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
                <p className="text-white ml-4">Inicializando...</p>
            </div>
        );
    }
    return (
        <AuthProvider>
            <Helmet><title>Central de Treinamento</title></Helmet>
            <MainApp />
            <Toaster />
        </AuthProvider>
    );
}

export default App;
