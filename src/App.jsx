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
import SimuladoPlayer from './components/Employee/SimuladoPlayer'; // <-- Importa a tela de jogo

// --- LÓGICA DE MIGRAÇÃO ---
import { initializeDatabase, getDatabase } from '@/data/mockData';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';


const MainApp = () => {
    const { user, logout, isAdmin, loading } = useAuth();
    const [activeTab, setActiveTab] = useState('');
    const [selectedSimulado, setSelectedSimulado] = useState(null); // <-- Guarda o simulado a ser jogado

    useEffect(() => {
        if (user) {
            setActiveTab(isAdmin() ? 'dashboard' : 'meus-treinamentos');
        }
    }, [user, isAdmin]);

    const handleLogout = () => {
        logout();
        setActiveTab('');
    };

    // Função para iniciar o simulado, chamada pela SimuladoList
    const handleStartSimulado = (simulado) => {
        setSelectedSimulado(simulado);
        setActiveTab('fazendo-simulado'); // Muda para a "aba" especial de jogo
    };

    // Função para finalizar o simulado, chamada pelo SimuladoPlayer
    const handleFinishSimulado = () => {
        setSelectedSimulado(null);
        setActiveTab('meus-simulados'); // Volta para a lista de simulados
    };

    const renderContent = () => {
        // Lógica principal: se um simulado está selecionado, mostra a tela de jogo
        if (activeTab === 'fazendo-simulado' && selectedSimulado) {
            return <SimuladoPlayer simulado={selectedSimulado} onFinish={handleFinishSimulado} />;
        }

        // Caso contrário, mostra a aba normal
        switch (activeTab) {
            // Admin
            case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
            case 'usuarios': return <UserManagement />;
            case 'treinamentos': return <TrainingManagement />;
            case 'trilhas': return <LearningPathManagement />;
            case 'categorias': return <CategoryManagement />;
            case 'departamentos': return <DepartmentManagement />;
            case 'relatorios': return <Reports />;
            case 'gerenciar-conhecimento': return <KnowledgeBaseManagement />;
            case 'configuracoes': return <Settings />;
            case 'simulados': return <SimuladoManagement />;
            
            // Employee
            case 'meus-treinamentos': return <TrainingList />;
            case 'minhas-trilhas': return <LearningPathList />;
            case 'meus-simulados': return <SimuladoList onStartSimulado={handleStartSimulado} />;
            case 'progresso': return <Progress />;
            case 'ranking': return <Ranking />;

            // Shared
            case 'base-de-conhecimento': return <KnowledgeBase />;
            
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
