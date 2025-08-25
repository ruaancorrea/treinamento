import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Award, BookOpen, CheckCircle, TrendingUp, Loader2, Medal, Star, Target, Diamond, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { getAllData } from '@/lib/firebaseService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';

// Definição de todas as medalhas possíveis
const allMedals = {
    "Primeiro Simulado": { icon: Star, description: "Concluiu o seu primeiro simulado." },
    "Perfeccionista": { icon: Target, description: "Obteve 100% de acertos num simulado." },
    "Maratonista": { icon: Medal, description: "Concluiu 5 simulados." },
    "Dedicado": { icon: Award, description: "Concluiu 10 simulados." },
};

const Progress = () => {
    const { user } = useAuth();
    const [userData, setUserData] = useState(null);
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        if (!user || !user.id) {
            setIsLoading(false);
            return;
        };
        
        // Define o estado de loading apropriado
        if (!isRefreshing) setIsLoading(true);

        const [treinamentosData, historicoData, userSnap, resultadosData] = await Promise.all([
            getAllData('treinamentos'),
            getAllData('historico'),
            getDoc(doc(db, 'usuarios', String(user.id))),
            getAllData('resultadosSimulados')
        ]);

        if (userSnap.exists()) {
            setUserData(userSnap.data());
        }

        const userHistory = historicoData.filter(h => h.usuarioId === user.id);
        const userResultados = resultadosData.filter(r => r.usuarioId === user.id);
        
        const availableTrainings = treinamentosData.filter(t => 
            t.ativo && (t.departamento === 'Todos' || t.departamento === user.departamento)
        );
        const completedHistory = userHistory.filter(h => h.concluido);

        const trainingPoints = completedHistory.reduce((acc, h) => acc + (h.pontosGanhos || h.notaQuestionario || 0), 0);
        const simuladoPoints = userResultados.reduce((acc, r) => acc + Math.round(r.pontuacao / 10), 0);
        const totalPoints = trainingPoints + simuladoPoints;

        const completedCount = completedHistory.length;
        const completionRate = availableTrainings.length > 0 ? (completedCount / availableTrainings.length) * 100 : 0;
        const avgScore = completedHistory.length > 0 
            ? completedHistory.reduce((acc, h) => acc + (h.notaQuestionario || 0), 0) / completedHistory.length
            : 0;
        const recentCompletions = completedHistory
            .sort((a, b) => new Date(b.dataConclusao) - new Date(a.dataConclusao))
            .slice(0, 5)
            .map(h => {
                const training = treinamentosData.find(t => t.id === h.treinamentoId);
                return { ...h, trainingTitle: training?.titulo || 'Treinamento desconhecido' };
            });

        setStats({
            totalTrainings: availableTrainings.length,
            completedCount,
            completionRate,
            totalPoints,
            avgScore,
            recentCompletions,
        });

        setIsLoading(false);
        setIsRefreshing(false);
    }, [user, isRefreshing]); // Adiciona isRefreshing como dependência

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        // A alteração no estado 'isRefreshing' vai acionar o 'loadData'
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-blue-500" /></div>;
    }

    if (!stats) {
        return <div className="text-center text-slate-400">Não foi possível carregar o seu progresso.</div>;
    }

    const statCards = [
        { title: "Treinamentos Concluídos", value: stats.completedCount, icon: CheckCircle, color: "green" },
        { title: "Progresso Geral", value: `${stats.completionRate.toFixed(0)}%`, icon: TrendingUp, color: "blue" },
        { title: "Pontos Acumulados", value: stats.totalPoints, icon: Diamond, color: "purple" },
        { title: "Nota Média", value: stats.avgScore.toFixed(1), icon: Award, color: "yellow" },
    ];

    const earnedMedals = userData?.medalhas || [];

    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white">Meu Progresso</h1>
                    <p className="text-slate-400">A sua jornada de conhecimento e conquistas.</p>
                </div>
                <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" className="bg-slate-800/50 border-slate-600 hover:bg-slate-700">
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Atualizar
                </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="glass-effect border-purple-500/50 bg-slate-800/50 text-white">
                    <CardHeader className="text-center">
                        <p className="text-sm font-medium text-slate-400">O SEU TÍTULO ATUAL</p>
                        <CardTitle className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mt-2">
                            {userData?.titulo || 'Iniciante'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <TooltipProvider>
                            <div className="flex justify-center flex-wrap gap-4">
                                {Object.entries(allMedals).map(([name, { icon: Icon, description }]) => {
                                    const isEarned = earnedMedals.includes(name);
                                    return (
                                        <Tooltip key={name}>
                                            <TooltipTrigger asChild>
                                                <div className={`p-3 border rounded-lg flex flex-col items-center justify-center w-28 h-28 transition-all ${isEarned ? 'border-yellow-400/50 bg-yellow-500/10 text-yellow-300' : 'border-slate-700 bg-slate-800/50 text-slate-500'}`}>
                                                    <Icon className={`w-8 h-8 mb-2 ${isEarned ? '' : 'opacity-50'}`} />
                                                    <p className="font-semibold text-center text-xs">{name}</p>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{description}</p></TooltipContent>
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        </TooltipProvider>
                    </CardContent>
                </Card>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + 0.1 * index }}>
                            <Card className="glass-effect border-slate-700 card-hover h-full">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-200">{stat.title}</CardTitle>
                                    <Icon className={`h-5 w-5 text-${stat.color}-400`} />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-white">{stat.value}</div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )
                })}
            </div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <Card className="glass-effect border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Últimos Treinamentos Concluídos</CardTitle>
                        <CardDescription>A sua atividade mais recente na plataforma.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats.recentCompletions.length > 0 ? (
                            <ul className="space-y-3">
                                {stats.recentCompletions.map((item, index) => (
                                    <motion.li 
                                        key={`${item.id}-${index}`}
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
                                                <p className="text-xs text-slate-400">Concluído em: {new Date(item.dataConclusao).toLocaleDateString('pt-BR')}</p>
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
