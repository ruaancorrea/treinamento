import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, Loader2, GraduationCap, CheckSquare, Filter, Percent, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAllData } from '@/lib/firebaseService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Importando as abas

const Reports = () => {
    const [dbData, setDbData] = useState({ 
        users: [], 
        historico: [], 
        resultados: [], 
        trainings: [] 
    });
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedTrainingId, setSelectedTrainingId] = useState('all');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            const [usersData, historicoData, resultadosData, trainingsData] = await Promise.all([
                getAllData('usuarios'),
                getAllData('historico'),
                getAllData('resultadosSimulados'),
                getAllData('treinamentos')
            ]);
            setDbData({
                users: usersData.filter(u => u.tipo === 'funcionario' && u.ativo),
                historico: historicoData,
                resultados: resultadosData,
                trainings: trainingsData
            });
            setIsLoading(false);
        };
        loadInitialData();
    }, []);

    // Memoization para o Relatório Individual
    const individualReportData = useMemo(() => {
        if (!selectedUserId) return null;
        const user = dbData.users.find(u => u.id === selectedUserId);
        if (!user) return null;

        const userHistorico = dbData.historico
            .filter(h => h.usuarioId === selectedUserId && h.concluido)
            .map(h => {
                const training = dbData.trainings.find(t => t.id === h.treinamentoId);
                return { ...h, trainingTitle: training?.titulo || 'Treinamento não encontrado' };
            })
            .sort((a, b) => new Date(b.dataConclusao) - new Date(a.dataConclusao));

        const userResultados = dbData.resultados
            .filter(r => r.usuarioId === selectedUserId)
            .sort((a, b) => new Date(b.dataConclusao) - new Date(a.dataConclusao));

        return { ...user, historico: userHistorico, resultados: userResultados };
    }, [selectedUserId, dbData]);

    // Memoization para o Relatório Geral
    const generalReportData = useMemo(() => {
        const { trainings, users, historico } = dbData;
        if (users.length === 0) return null;

        const targetTrainings = selectedTrainingId === 'all' ? trainings : trainings.filter(t => t.id === selectedTrainingId);
        
        const totalCompletions = historico.filter(h => h.concluido && (selectedTrainingId === 'all' || h.treinamentoId === selectedTrainingId)).length;
        const possibleCompletions = users.length * targetTrainings.length;
        const completionRate = possibleCompletions > 0 ? (totalCompletions / possibleCompletions) * 100 : 0;
        
        return {
            totalCompletions,
            completionRate,
            totalUsers: users.length
        };
    }, [dbData, selectedTrainingId]);


    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-blue-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold text-white">Relatórios de Desempenho</h1>
                <p className="text-slate-400">Analise o progresso da sua equipa.</p>
            </motion.div>

            <Tabs defaultValue="geral" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="geral">Relatório Geral</TabsTrigger>
                    <TabsTrigger value="individual">Relatório Individual</TabsTrigger>
                </TabsList>

                {/* Aba de Relatório Geral */}
                <TabsContent value="geral" className="mt-6 space-y-6">
                    <Card className="glass-effect border-slate-700">
                        <CardHeader>
                            <CardTitle>Visão Geral</CardTitle>
                            <CardDescription>Filtre por treinamento para ver o desempenho geral.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Select value={selectedTrainingId} onValueChange={setSelectedTrainingId}>
                                <SelectTrigger className="bg-slate-800/50 border-slate-600">
                                    <Filter className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="Filtrar por treinamento" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Treinamentos</SelectItem>
                                    {dbData.trainings.map(t => <SelectItem key={t.id} value={t.id}>{t.titulo}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
                    {generalReportData && (
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="glass-effect border-slate-700"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-200">Total de Conclusões</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-white">{generalReportData.totalCompletions}</div></CardContent></Card>
                            <Card className="glass-effect border-slate-700"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-200">Taxa de Conclusão Geral</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-white">{generalReportData.completionRate.toFixed(1)}%</div></CardContent></Card>
                            <Card className="glass-effect border-slate-700"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-200">Total de Funcionários</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-white">{generalReportData.totalUsers}</div></CardContent></Card>
                         </div>
                    )}
                </TabsContent>

                {/* Aba de Relatório Individual */}
                <TabsContent value="individual" className="mt-6 space-y-6">
                    <Card className="glass-effect border-slate-700">
                        <CardHeader>
                            <CardTitle>Relatório por Utilizador</CardTitle>
                            <CardDescription>Selecione um funcionário para ver o seu histórico detalhado.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                <SelectTrigger className="bg-slate-800/50 border-slate-600">
                                    <User className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="Selecione um funcionário..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {dbData.users.map(user => (
                                        <SelectItem key={user.id} value={user.id}>{user.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {individualReportData && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            <Card className="glass-effect border-slate-700 text-white">
                                <CardHeader>
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl font-bold">{individualReportData.nome.charAt(0)}</div>
                                        <div>
                                            <CardTitle className="text-2xl">{individualReportData.nome}</CardTitle>
                                            <CardDescription>{individualReportData.departamento} | Título: <span className="font-semibold text-purple-400">{individualReportData.titulo || 'Iniciante'}</span></CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                            <Card className="glass-effect border-slate-700 text-white">
                                <CardHeader><CardTitle className="flex items-center"><CheckSquare className="w-5 h-5 mr-2 text-blue-400" />Histórico de Simulados</CardTitle></CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Simulado</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Pontuação</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {individualReportData.resultados.length > 0 ? individualReportData.resultados.map(r => (
                                                <TableRow key={r.id}><TableCell className="font-medium">{r.simuladoTitulo}</TableCell><TableCell>{new Date(r.dataConclusao).toLocaleDateString('pt-BR')}</TableCell><TableCell className="text-right font-bold">{r.pontuacao.toFixed(0)}%</TableCell></TableRow>
                                            )) : <TableRow><TableCell colSpan={3} className="text-center text-slate-400">Nenhum simulado realizado.</TableCell></TableRow>}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                            <Card className="glass-effect border-slate-700 text-white">
                                <CardHeader><CardTitle className="flex items-center"><GraduationCap className="w-5 h-5 mr-2 text-green-400" />Histórico de Treinamentos</CardTitle></CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Treinamento</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Pontos Ganhos</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {individualReportData.historico.length > 0 ? individualReportData.historico.map(h => (
                                                <TableRow key={h.id}><TableCell className="font-medium">{h.trainingTitle}</TableCell><TableCell>{new Date(h.dataConclusao).toLocaleDateString('pt-BR')}</TableCell><TableCell className="text-right font-bold">{h.pontosGanhos || h.notaQuestionario || 0}</TableCell></TableRow>
                                            )) : <TableRow><TableCell colSpan={3} className="text-center text-slate-400">Nenhum treinamento concluído.</TableCell></TableRow>}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Reports;
