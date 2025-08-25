import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Users, 
    BookOpen, 
    TrendingUp, 
    Award,
    CheckCircle,
    AlertCircle,
    BarChart3,
    Loader2,
    Zap,
    CheckSquare,
    GraduationCap // <-- CORREÇÃO AQUI
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllData } from '@/lib/firebaseService';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = ({ setActiveTab }) => { 
    const [stats, setStats] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [titleDistribution, setTitleDistribution] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            setIsLoading(true);
            try {
                const [usuariosData, treinamentosData, historicoData, simuladosData, resultadosData, trilhasData] = await Promise.all([
                    getAllData('usuarios'),
                    getAllData('treinamentos'),
                    getAllData('historico'),
                    getAllData('simulados'),
                    getAllData('resultadosSimulados'),
                    getAllData('trilhas')
                ]);

                // --- CÁLCULO DE ESTATÍSTICAS UNIFICADO ---

                // Stats de Treinamentos (do seu código original)
                const totalUsuarios = usuariosData.filter(u => u.tipo === 'funcionario').length;
                const totalTreinamentos = treinamentosData.length;
                const totalConclusoes = historicoData.filter(h => h.concluido).length;
                
                // Stats de Simulados (do nosso novo código)
                let averageScore = 0;
                let hardestSimulado = { title: 'N/A', score: 101 };
                let easiestSimulado = { title: 'N/A', score: -1 };
                const simuladoScores = {};

                if (resultadosData.length > 0) {
                    averageScore = resultadosData.reduce((acc, r) => acc + r.pontuacao, 0) / resultadosData.length;
                    resultadosData.forEach(r => {
                        if (!simuladoScores[r.simuladoId]) {
                            simuladoScores[r.simuladoId] = { total: 0, count: 0, title: r.simuladoTitulo };
                        }
                        simuladoScores[r.simuladoId].total += r.pontuacao;
                        simuladoScores[r.simuladoId].count += 1;
                    });
                    Object.values(simuladoScores).forEach(s => {
                        const avg = s.total / s.count;
                        if (avg < hardestSimulado.score) hardestSimulado = { title: s.title, score: avg };
                        if (avg > easiestSimulado.score) easiestSimulado = { title: s.title, score: avg };
                    });
                }

                setStats({
                    totalUsuarios,
                    totalTreinamentos,
                    totalConclusoes,
                    totalSimulados: simuladosData.length,
                    totalTrilhas: trilhasData.length,
                    averageScore: averageScore.toFixed(1),
                    hardestSimulado: hardestSimulado.title,
                    easiestSimulado: easiestSimulado.title
                });

                // Gráfico de Distribuição de Títulos
                const titles = { 'Iniciante': 0, 'Aprendiz': 0, 'Conhecedor': 0, 'Especialista': 0, 'Mestre do Conhecimento': 0 };
                usuariosData.forEach(u => {
                    if (u.titulo && titles.hasOwnProperty(u.titulo)) {
                        titles[u.titulo]++;
                    } else if (u.tipo === 'funcionario') {
                        titles['Iniciante']++;
                    }
                });
                setTitleDistribution({
                    labels: Object.keys(titles),
                    datasets: [{
                        label: 'Nº de Funcionários',
                        data: Object.values(titles),
                        backgroundColor: 'rgba(79, 70, 229, 0.8)',
                    }]
                });

                // Atividade Recente (do seu código original)
                const recent = historicoData
                    .filter(h => h.concluido)
                    .sort((a, b) => new Date(b.dataConclusao) - new Date(a.dataConclusao))
                    .slice(0, 5)
                    .map(h => {
                        const usuario = usuariosData.find(u => u.id === h.usuarioId);
                        const treinamento = treinamentosData.find(t => t.id === h.treinamentoId);
                        return {
                            ...h,
                            nomeUsuario: usuario?.nome || 'Usuário desconhecido',
                            tituloTreinamento: treinamento?.titulo || 'Treinamento desconhecido'
                        };
                    });
                setRecentActivity(recent);

            } catch (error) {
                console.error("Erro ao carregar dados do dashboard:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-blue-500" /></div>;
    }
    
    if (!stats) {
        return <div className="text-center text-slate-400">Não foi possível carregar os dados do dashboard.</div>;
    }

    const statCards = [
        { title: "Total de Usuários", value: stats.totalUsuarios, icon: Users, tab: 'usuarios' },
        { title: "Treinamentos", value: stats.totalTreinamentos, icon: GraduationCap, tab: 'treinamentos' },
        { title: "Trilhas", value: stats.totalTrilhas, icon: Zap, tab: 'trilhas' },
        { title: "Simulados", value: stats.totalSimulados, icon: CheckSquare, tab: 'simulados' },
    ];

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <h1 className="text-3xl font-bold text-white">Dashboard Administrativo</h1>
                <p className="text-slate-400">Visão geral da Central de Treinamento</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                            <Card onClick={() => setActiveTab(stat.tab)} className="glass-effect border-slate-700 card-hover cursor-pointer">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-200">{stat.title}</CardTitle>
                                    <Icon className="h-5 w-5 text-slate-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-white">{stat.value}</div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-3">
                    <Card className="glass-effect border-slate-700 text-white h-full">
                        <CardHeader>
                            <CardTitle>Distribuição de Títulos</CardTitle>
                            <CardDescription>Nº de funcionários por cada nível de conhecimento.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {titleDistribution && <Bar data={titleDistribution} options={{ responsive: true, maintainAspectRatio: false }} />}
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-2">
                    <Card className="glass-effect border-slate-700 h-full">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-green-500" />Atividade Recente</CardTitle>
                            <CardDescription className="text-slate-400">Últimos treinamentos concluídos</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((activity, index) => (
                                    <div key={`${activity.id}-${index}`} className="flex items-center space-x-3 p-2 rounded-lg bg-slate-800/50">
                                        <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center"><Award className="w-4 h-4 text-white" /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{activity.nomeUsuario}</p>
                                            <p className="text-xs text-slate-400 truncate">{activity.tituloTreinamento}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-400 text-center py-4">Nenhuma atividade recente</p>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                    <Card className="glass-effect border-slate-700 text-white">
                         <CardHeader><CardTitle className="text-sm font-medium text-slate-200">Desempenho Médio Geral</CardTitle></CardHeader>
                         <CardContent><p className="text-3xl font-bold">{stats.averageScore}%</p></CardContent>
                    </Card>
                 </motion.div>
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                    <Card className="glass-effect border-slate-700 text-white">
                         <CardHeader><CardTitle className="text-sm font-medium text-slate-200">Simulado Mais Difícil</CardTitle></CardHeader>
                         <CardContent><p className="text-lg font-bold truncate">{stats.hardestSimulado}</p></CardContent>
                    </Card>
                 </motion.div>
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                    <Card className="glass-effect border-slate-700 text-white">
                         <CardHeader><CardTitle className="text-sm font-medium text-slate-200">Simulado Mais Fácil</CardTitle></CardHeader>
                         <CardContent><p className="text-lg font-bold truncate">{stats.easiestSimulado}</p></CardContent>
                    </Card>
                 </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;
