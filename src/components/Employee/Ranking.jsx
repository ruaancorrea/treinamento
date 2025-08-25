import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Medal, Star, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAllData } from '@/lib/firebaseService';

const Ranking = () => {
    const { user } = useAuth();
    const [dbData, setDbData] = useState({ usuarios: [], resultadosSimulados: [], departamentos: [] });
    const [isLoading, setIsLoading] = useState(true);
    
    // Estados para os filtros
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [selectedPeriod, setSelectedPeriod] = useState('all');

    useEffect(() => {
        const loadAllData = async () => {
            setIsLoading(true);
            const [usuariosData, resultadosData, departamentosData] = await Promise.all([
                getAllData('usuarios'),
                getAllData('resultadosSimulados'),
                getAllData('departamentos')
            ]);
            
            setDbData({
                usuarios: usuariosData,
                resultadosSimulados: resultadosData,
                departamentos: departamentosData
            });
            setIsLoading(false);
        };

        loadAllData();
    }, []);

    const rankedUsers = useMemo(() => {
        const { usuarios, resultadosSimulados } = dbData;
        if (!usuarios.length) return [];

        // 1. Filtra os resultados pelo período selecionado
        let resultsFilteredByPeriod = resultadosSimulados;
        if (selectedPeriod !== 'all') {
            const now = new Date();
            const periodDate = new Date();
            if (selectedPeriod === 'month') {
                periodDate.setMonth(now.getMonth() - 1);
            } else if (selectedPeriod === 'quarter') {
                periodDate.setMonth(now.getMonth() - 3);
            }
            resultsFilteredByPeriod = resultsFilteredByPeriod.filter(r => r.dataConclusao && new Date(r.dataConclusao) >= periodDate);
        }

        // 2. Calcula a pontuação média para cada usuário a partir dos resultados filtrados
        const userScores = {};
        resultsFilteredByPeriod.forEach(result => {
            if (!userScores[result.usuarioId]) {
                userScores[result.usuarioId] = { totalScore: 0, count: 0 };
            }
            userScores[result.usuarioId].totalScore += result.pontuacao;
            userScores[result.usuarioId].count += 1;
        });

        // 3. Filtra os usuários pelo departamento e mapeia os dados do ranking
        let usersToRank = usuarios.filter(u => u.tipo === 'funcionario' && u.ativo);
        if (selectedDepartment !== 'all') {
            usersToRank = usersToRank.filter(u => u.departamento === selectedDepartment);
        }

        const finalRanking = usersToRank.map(u => {
            const scoreData = userScores[u.id];
            const averageScore = scoreData ? scoreData.totalScore / scoreData.count : 0;
            return {
                id: u.id,
                nome: u.nome,
                departamento: u.departamento,
                pontuacao: Math.round(averageScore),
                simuladosFeitos: scoreData ? scoreData.count : 0,
            };
        });

        // 4. Ordena e retorna
        return finalRanking
            .filter(u => u.simuladosFeitos > 0) // Mostra apenas quem já fez simulados
            .sort((a, b) => b.pontuacao - a.pontuacao || a.nome.localeCompare(b.nome));

    }, [dbData, selectedDepartment, selectedPeriod]);

    const userRank = useMemo(() => {
        const currentUserIndex = rankedUsers.findIndex(u => u.id === user.id);
        return currentUserIndex !== -1 ? currentUserIndex + 1 : null;
    }, [rankedUsers, user]);

    // Funções de estilo e ícones
    const getRankIcon = (rank) => {
        if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
        if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
        if (rank === 3) return <Award className="w-6 h-6 text-yellow-600" />;
        return <span className="text-slate-400 font-bold">{rank}º</span>;
    };

    const getRankColor = (rank) => {
        if (rank === 1) return 'border-yellow-400/50 bg-yellow-500/10';
        if (rank === 2) return 'border-gray-300/50 bg-gray-500/10';
        if (rank === 3) return 'border-yellow-600/50 bg-yellow-700/10';
        return 'border-slate-700';
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-blue-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold text-white">Ranking de Desempenho</h1>
                <p className="text-slate-400">Veja quem está a destacar-se nos simulados de conhecimento.</p>
            </motion.div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-600"><SelectValue placeholder="Filtrar por Departamento" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Departamentos</SelectItem>
                        {dbData.departamentos.filter(d => d.nome !== "Todos").map(d => 
                            <SelectItem key={d.id} value={d.nome}>{d.nome}</SelectItem>
                        )}
                    </SelectContent>
                </Select>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-600"><SelectValue placeholder="Filtrar por Período" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Desde o início</SelectItem>
                        <SelectItem value="month">Último Mês</SelectItem>
                        <SelectItem value="quarter">Último Trimestre</SelectItem>
                    </SelectContent>
                </Select>
                {userRank && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="sm:col-span-1">
                        <Card className="glass-effect border-blue-500/50 bg-slate-800/50">
                            <CardContent className="p-3 text-center">
                                <p className="text-sm font-medium text-slate-300">A sua Posição</p>
                                <p className="text-3xl font-bold text-blue-400">{userRank}º</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="glass-effect border-slate-700 text-white">
                    <CardHeader><CardTitle>Classificação Geral</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {rankedUsers.length > 0 ? rankedUsers.map((player, index) => {
                                const rank = index + 1;
                                return (
                                    <motion.li 
                                        key={player.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * index }}
                                        className={`flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border-l-4 ${getRankColor(rank)} ${player.id === user.id ? 'border-r-4 border-r-blue-500' : ''}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 flex items-center justify-center text-lg font-bold">
                                                {getRankIcon(rank)}
                                            </div>
                                            <div>
                                                <p className={`font-medium ${player.id === user.id ? 'text-blue-400' : 'text-white'}`}>{player.nome}</p>
                                                <p className="text-xs text-slate-400">{player.departamento}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-white">{player.pontuacao} pts</p>
                                            <p className="text-xs text-slate-400">{player.simuladosFeitos} {player.simuladosFeitos === 1 ? 'simulado' : 'simulados'}</p>
                                        </div>
                                    </motion.li>
                                );
                            }) : (
                                <div className="text-center py-10 text-slate-500">
                                    <Trophy className="mx-auto h-10 w-10" />
                                    <p className="mt-2 font-semibold">Nenhum resultado para os filtros selecionados.</p>
                                    <p className="text-sm">Tente alargar a sua pesquisa ou complete alguns simulados!</p>
                                </div>
                            )}
                        </ul>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default Ranking;
