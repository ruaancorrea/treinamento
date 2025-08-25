import React from 'react';
import { motion } from 'framer-motion';
import { 
    Users, 
    BookOpen,
    FolderOpen, 
    BarChart3, 
    Settings, 
    LogOut,
    GraduationCap,
    Trophy,
    Home,
    Building,
    GitMerge,
    FileCog,
    CheckSquare 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const Sidebar = ({ activeTab, setActiveTab, onLogout }) => {
    const { user, isAdmin } = useAuth();

    const adminMenuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'usuarios', label: 'Usuários', icon: Users },
        { id: 'treinamentos', label: 'Treinamentos', icon: GraduationCap },
        { id: 'trilhas', label: 'Trilhas', icon: GitMerge }, 
        { id: 'simulados', label: 'Simulados (Admin)', icon: CheckSquare }, 
        { id: 'categorias', label: 'Categorias', icon: FolderOpen },
        { id: 'departamentos', label: 'Departamentos', icon: Building },
        { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
        { id: 'base-de-conhecimento', label: 'Conhecimento', icon: BookOpen },
        { id: 'gerenciar-conhecimento', label: 'Gerenciar Conhecimento', icon: FileCog },
        { id: 'configuracoes', label: 'Configurações', icon: Settings }
    ];

    const funcionarioMenuItems = [
        { id: 'meus-treinamentos', label: 'Meus Treinamentos', icon: GraduationCap },
        // V V V V V V V V V V V V V V V V V V V V V V V V V V V V V V V V V V V
        { id: 'meus-simulados', label: 'Meus Simulados', icon: CheckSquare }, // <-- MUDANÇA IMPORTANTE AQUI: ESTA LINHA FAZ O BOTÃO APARECER
        // ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ ^ 
        { id: 'minhas-trilhas', label: 'Minhas Trilhas', icon: GitMerge },
        { id: 'progresso', label: 'Meu Progresso', icon: BarChart3 },
        { id: 'ranking', label: 'Ranking', icon: Trophy },
        { id: 'base-de-conhecimento', label: 'Conhecimento', icon: BookOpen }
    ];

    const menuItems = isAdmin() ? adminMenuItems : funcionarioMenuItems;

    return (
        <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            className="w-64 bg-slate-800/50 backdrop-blur-lg border-r border-slate-700 h-screen flex flex-col"
        >
            <div className="p-6 border-b border-slate-700">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <span className="text-lg font-bold text-white">Central de</span>
                        <p className="text-sm text-slate-300">Treinamento</p>
                    </div>
                </div>
            </div>
            <div className="p-4 border-b border-slate-700">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-white">{user?.nome?.charAt(0) || 'U'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.nome}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.tipo === 'admin' ? 'Administrador' : 'Funcionário'}</p>
                    </div>
                </div>
            </div>
            
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <motion.button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                                isActive
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </motion.button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-700 mt-auto">
                <Button onClick={onLogout} variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-red-500/20">
                    <LogOut className="w-5 h-5 mr-3" />
                    Sair
                </Button>
            </div>
        </motion.div>
    );
};

export default Sidebar;