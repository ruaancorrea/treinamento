import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, BookOpen, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { getDatabase } from '@/data/mockData';

const Progress = () => {
    const { user } = useAuth();
    const [progressData, setProgressData] = useState(null);

    useEffect(() => {
        if (user) {
            const db = getDatabase();
            if(!db) return;
            
            // Trainings available to the user
            const availableTrainings = db.treinamentos.filter(t => 
                t.ativo && (t.departamento === 'Todos' || t.departamento === user.departamento)
            );

            // User's history
            const userHistory = db.historico.filter(h => h.usuarioId === user.id);
            const completedHistory = userHistory.filter(h => h.concluido);
            
            const completedCount = completedHistory.length;
            const completionRate = availableTrainings.length > 0 ? (completedCount / availableTrainings.length) * 100 : 0;
            const totalTime = userHistory.reduce((acc, h) => acc + (h.tempoAssistido || 0), 0);
            const avgScore = completedHistory.length > 0 
                ? completedHistory.reduce((acc, h) => acc + (h.notaQuestionario || 0), 0) / completedHistory.length
                : 0;
            
            const recentCompletions = completedHistory
                .sort((a, b) => new Date(b.dataConclusao) - new Date(a.dataConclusao))
                .slice(0, 5)
                .map(h => {
                    const training = db.treinamentos.find(t => t.id === h.treinamentoId);
                    return { ...h, trainingTitle: training?.titulo || 'Treinamento desconhecido' };
                });

            setProgressData({
                totalTrainings: availableTrainings.length,
                completedCount,
                completionRate,
                totalTime, // in seconds
                avgScore,
                recentCompletions,
            });
        }
    }, [user]);

    if (!progressData) {
        return <div className="text-center text-slate-400">A carregar o seu progresso...</div>;
    }

    const statCards = [
        { title: "Treinamentos Concluídos", value: progressData.completedCount, icon: CheckCircle, color: "green" },
        { title: "Progresso Geral", value: `${progressData.completionRate.toFixed(0)}%`, icon: TrendingUp, color: "blue" },
        { title: "Tempo de Estudo", value: `${Math.floor(progressData.totalTime / 3600)}h ${Math.floor((progressData.totalTime % 3600) / 60)}m`, icon: Clock, color: "purple" },
        { title: "Nota Média", value: progressData.avgScore.toFixed(1), icon: Award, color: "yellow" },
    ];

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold text-white">Meu Progresso</h1>
                <p className="text-slate-400">Acompanhe a sua jornada de aprendizado.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * (index + 1) }}>
                            <Card className="glass-effect border-slate-700 card-hover">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-200">{stat.title}</CardTitle>
                                    <div className={`p-2 rounded-lg bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600`}>
                                        <Icon className="h-4 w-4 text-white" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                                    <p className="text-xs text-slate-400 mt-1">de {progressData.totalTrainings} disponíveis</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )
                })}
            </div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <Card className="glass-effect border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Últimos Treinamentos Concluídos</CardTitle>
                        <CardDescription>A sua atividade mais recente na plataforma.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {progressData.recentCompletions.length > 0 ? (
                            <ul className="space-y-3">
                                {progressData.recentCompletions.map((item, index) => (
                                    // --- CORREÇÃO AQUI ---
                                    // Adicionada a propriedade key para dar uma identidade única a cada item da lista
                                    <motion.li 
                                      key={`${item.id}-${index}`} // Usar uma combinação para garantir unicidade em caso de repetições
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.1 * index }}
                                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                                                <BookOpen className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{item.trainingTitle}</p>
                                                <p className="text-xs text-slate-400">
                                                    Concluído em: {new Date(item.dataConclusao).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-green-400">Nota: {item.notaQuestionario}/10</p>
                                        </div>
                                    </motion.li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-slate-400 py-8">Você ainda não concluiu nenhum treinamento.</p>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default Progress;
