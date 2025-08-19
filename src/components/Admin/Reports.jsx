import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle, Percent, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getDatabase } from '@/data/mockData';

const Reports = () => {
    const [trainings, setTrainings] = useState([]);
    const [users, setUsers] = useState([]);
    const [history, setHistory] = useState([]);
    const [selectedTraining, setSelectedTraining] = useState('all');

    useEffect(() => {
        const db = getDatabase();
        setTrainings(db.treinamentos);
        setUsers(db.usuarios.filter(u => u.tipo === 'funcionario'));
        setHistory(db.historico);
    }, []);

    const reportData = useMemo(() => {
        // Só executa o cálculo se já tivermos os dados dos usuários.
        if (users.length === 0) {
            return null;
        }

        const targetTrainings = selectedTraining === 'all'
            ? trainings
            : trainings.filter(t => t.id === parseInt(selectedTraining));

        const totalCompletions = history.filter(h => h.concluido && (selectedTraining === 'all' || h.treinamentoId === parseInt(selectedTraining))).length;
        const possibleCompletions = users.length * targetTrainings.length;
        const completionRate = possibleCompletions > 0 ? (totalCompletions / possibleCompletions) * 100 : 0;
        
        const userProgress = users.map(user => {
            const userHistory = history.filter(h => h.usuarioId === user.id && (selectedTraining === 'all' || h.treinamentoId === parseInt(selectedTraining)));
            const completed = userHistory.filter(h => h.concluido).length;
            const avgScore = userHistory.reduce((acc, h) => acc + (h.notaQuestionario || 0), 0) / (userHistory.length || 1);
            return {
                ...user,
                completedCount: completed,
                progress: targetTrainings.length > 0 ? (completed / targetTrainings.length) * 100 : 0,
                avgScore: avgScore,
            };
        }).sort((a,b) => b.completedCount - a.completedCount);

        const trainingStats = trainings.map(training => {
            const completions = history.filter(h => h.treinamentoId === training.id && h.concluido).length;
            const participants = new Set(history.filter(h => h.treinamentoId === training.id).map(h => h.usuarioId)).size;
            return {
                ...training,
                completions,
                completionRate: users.length > 0 ? (completions / users.length) * 100 : 0,
                participants,
            };
        }).sort((a, b) => b.completions - a.completions);
        
        return {
            totalCompletions,
            completionRate,
            userProgress,
            trainingStats
        };
    // As dependências do useMemo: o cálculo só será refeito se um desses valores mudar.
    }, [users, history, trainings, selectedTraining]);
    
    if (!reportData) {
        return <div className="text-center text-slate-400">Gerando relatórios...</div>;
    }

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Relatórios</h1>
                        <p className="text-slate-400">Analise o desempenho e progresso dos treinamentos.</p>
                    </div>
                    <div className="w-full sm:w-64">
                        <Select value={selectedTraining} onValueChange={setSelectedTraining}>
                            <SelectTrigger className="bg-slate-800/50 border-slate-600">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Filtrar por treinamento" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Treinamentos</SelectItem>
                                {trainings.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.titulo}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="glass-effect border-slate-700">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-200">Total de Conclusões</CardTitle>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold text-white">{reportData.totalCompletions}</div></CardContent>
                    </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="glass-effect border-slate-700">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-200">Taxa de Conclusão Geral</CardTitle>
                            <Percent className="h-5 w-5 text-blue-500" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold text-white">{reportData.completionRate.toFixed(1)}%</div></CardContent>
                    </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="glass-effect border-slate-700">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-200">Total de Funcionários</CardTitle>
                            <Users className="h-5 w-5 text-purple-500" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold text-white">{users.length}</div></CardContent>
                    </Card>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                    <Card className="glass-effect border-slate-700">
                        <CardHeader><CardTitle className="text-white">Progresso por Usuário</CardTitle></CardHeader>
                        <CardContent className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
                            {reportData.userProgress.map(user => (
                                <div key={user.id} className="p-3 bg-slate-800/50 rounded-lg">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-white">{user.nome}</span>
                                        <span className="text-sm font-semibold text-blue-400">{user.progress.toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-700 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${user.progress}%` }}></div></div>
                                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                                        <span>{user.completedCount} concluído(s)</span>
                                        <span>Nota Média: {user.avgScore.toFixed(1)}</span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                    <Card className="glass-effect border-slate-700">
                        <CardHeader><CardTitle className="text-white">Desempenho por Treinamento</CardTitle></CardHeader>
                        <CardContent className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
                            {reportData.trainingStats.map(training => (
                                <div key={training.id} className="p-3 bg-slate-800/50 rounded-lg">
                                    <p className="text-sm font-medium text-white truncate">{training.titulo}</p>
                                    <div className="flex justify-between items-center text-xs text-slate-400 mt-1">
                                        <span>{training.completions} conclusões</span>
                                        <span>{training.participants} participantes</span>
                                        <span className="font-semibold text-green-400">{training.completionRate.toFixed(0)}%</span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

export default Reports;