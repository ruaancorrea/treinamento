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

// --- LÓGICA DE MIGRAÇÃO ---
import { initializeDatabase, getDatabase } from '@/data/mockData'; // Usado APENAS para a migração
import { addData } from '@/lib/firebaseService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';


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
            case 'gerenciar-conhecimento': return <KnowledgeBaseManagement />;
            case 'configuracoes': return <Settings />;
            
            // Employee
            case 'meus-treinamentos': return <TrainingList />;
            case 'minhas-trilhas': return <LearningPathList />;
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

// --- FUNÇÃO DE MIGRAÇÃO ---
const runMigration = async () => {
    // Usamos um documento de controle para garantir que a migração rode só uma vez.
    const migrationControlRef = doc(db, "internal", "migrationStatus");
    const migrationControlSnap = await getDoc(migrationControlRef);

    if (migrationControlSnap.exists() && migrationControlSnap.data().migrated) {
        console.log("Migração de dados já foi executada. Pulando.");
        return;
    }

    console.log("--- INICIANDO MIGRAÇÃO DE DADOS ---");
    // Pega os dados do seu arquivo antigo, que foram carregados em memória
    const oldDb = getDatabase(); 

    // Lista de todas as coleções a serem migradas
    const collectionsToMigrate = [
        'usuarios', 'categorias', 'departamentos', 'treinamentos', 
        'historico', 'trilhas', 'knowledgeBase'
    ];

    for (const collectionName of collectionsToMigrate) {
        if (oldDb[collectionName] && Array.isArray(oldDb[collectionName])) {
            for (const item of oldDb[collectionName]) {
                // --- CORREÇÃO AQUI ---
                // Adicionamos uma verificação para garantir que o item e o item.id existem
                // antes de tentar usá-los. Isso evita o erro.
                if (item && item.id) {
                    // Usamos o ID numérico antigo como ID do documento para manter as relações
                    const docRef = doc(db, collectionName, item.id.toString());
                    await setDoc(docRef, item);
                } else {
                    console.warn(`Item inválido encontrado na coleção "${collectionName}" e foi ignorado:`, item);
                }
            }
            console.log(`${oldDb[collectionName].length} documentos migrados para a coleção "${collectionName}".`);
        }
    }

    // Marca a migração como concluída para não rodar novamente
    await setDoc(migrationControlRef, { migrated: true, date: new Date().toISOString() });
    console.log("--- MIGRAÇÃO CONCLUÍDA COM SUCESSO ---");
};


function App() {
    const [dbLoaded, setDbLoaded] = useState(false);

    useEffect(() => {
        const loadAndMigrate = async () => {
            // 1. Carrega os dados do documento antigo em memória
            await initializeDatabase(); 
            // 2. Executa a migração para a nova estrutura de coleções (só roda na primeira vez)
            await runMigration();       
            // 3. Libera a aplicação para ser renderizada
            setDbLoaded(true);
        };
        loadAndMigrate();
    }, []);

    if (!dbLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
                <p className="text-white ml-4">Inicializando e verificando banco de dados...</p>
            </div>
        );
    }

    return (
        <AuthProvider>
            <Helmet>
                <title>Central de Treinamento NTW</title>
            </Helmet>
            <MainApp />
            <Toaster />
        </AuthProvider>
    );
}

export default App;
