import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Medal, Star, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// --- MUDANÇA PRINCIPAL ---
// Importamos uma nova função para buscar todos os dados de uma coleção
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebaseConfig';


// Função auxiliar para buscar todos os documentos de uma coleção
const getAllData = async (collectionName) => {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const data = [];
        querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });
        return data;
    } catch (error) {
        console.error(`Erro ao buscar dados de ${collectionName}:`, error);
        return [];
    }
};


const Ranking = () => {
    const { user } = useAuth();
    const [dbData, setDbData] = useState({ usuarios: [], historico: [], departamentos: [] });
    const [isLoading, setIsLoading] = useState(true);
    
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [selectedPeriod, setSelectedPeriod] = useState('all');

    useEffect(() => {
        const loadAllData = async () => {
            setIsLoading(true);
            const usuariosData = await getAllData('usuarios');
            const historicoData = await getAllData('historico');
            const departamentosData = await getAllData('departamentos');
            
            setDbData({
                usuarios: usuariosData,
                historico: historicoData,
                departamentos: departamentosData
            });
            setIsLoading(false);
        };

        loadAllData();
    }, []);

    const rankedUsers = useMemo(() => {
        const { usuarios, historico } = dbData;
        if (!usuarios.length || !historico.length) return [];

        // 1. Filtra o histórico pelo período selecionado
        let historyFilteredByPeriod = historico.filter(h => h.concluido);
        if (selectedPeriod !== 'all') {
            const now = new Date();
            const periodDate = new Date();
            if (selectedPeriod === 'month') {
                periodDate.setMonth(now.getMonth() - 1);
            } else if (selectedPeriod === 'quarter') {
                periodDate.setMonth(now.getMonth() - 3);
            }
            historyFilteredByPeriod = historyFilteredByPeriod.filter(h => h.dataConclusao && new Date(h.dataConclusao) >= periodDate);
        }

        // 2. Filtra os usuários pelo departamento selecionado
        let usersToRank = usuarios.filter(u => u.tipo === 'funcionario' && u.ativo);
        if (selectedDepartment !== 'all') {
            usersToRank = usersToRank.filter(u => u.departamento === selectedDepartment);
        }

        // 3. Calcula os pontos para os usuários filtrados (sua lógica original)
        const userScores = usersToRank.map(u => {
            const userHistory = historyFilteredByPeriod.filter(h => h.usuarioId === u.id);
            
            const bestScoresByTraining = userHistory.reduce((acc, h) => {
                const existing = acc[h.treinamentoId];
                if (!existing || h.notaQuestionario > existing.notaQuestionario) {
                    acc[h.treinamentoId] = h;
                }
                return acc;
            }, {});
            const uniqueBestHistory = Object.values(bestScoresByTraining);
            const completedCount = uniqueBestHistory.length;
            const totalScore = uniqueBestHistory.reduce((acc, h) => acc + (h.notaQuestionario || 0), 0);
            const finalScore = (completedCount * 10) + (completedCount > 0 ? totalScore / completedCount : 0);

            return {
                id: u.id,
                nome: u.nome,
                departamento: u.departamento,
                completedCount,
                finalScore: finalScore.toFixed(2),
            };
        });

        return userScores
            .filter(u => u.completedCount > 0)
            .sort((a, b) => b.finalScore - a.finalScore);

    }, [dbData, selectedDepartment, selectedPeriod]);

    const userRank = useMemo(() => {
        const currentUserIndex = rankedUsers.findIndex(u => u.id === user.id);
        return currentUserIndex !== -1 ? currentUserIndex + 1 : null;
    }, [rankedUsers, user]);

    const getRankIcon = (rank) => {
        if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
        if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
        if (rank === 3) return <Award className="w-6 h-6 text-yellow-600" />;
        return <Star className="w-5 h-5 text-slate-500" />;
    };

    const getRankColor = (rank) => {
        if (rank === 1) return 'border-yellow-400/50';
        if (rank === 2) return 'border-gray-400/50';
        if (rank === 3) return 'border-yellow-600/50';
        return 'border-slate-700';
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold text-white">Ranking de Colaboradores</h1>
                <p className="text-slate-400">Veja quem está se destacando nos treinamentos.</p>
            </motion.div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-600">
                        <SelectValue placeholder="Filtrar por Departamento" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Departamentos</SelectItem>
                        {dbData.departamentos.filter(d => d.nome !== "Todos").map(d => 
                            <SelectItem key={d.id} value={d.nome}>{d.nome}</SelectItem>
                        )}
                    </SelectContent>
                </Select>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-600">
                        <SelectValue placeholder="Filtrar por Período" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Desde o início</SelectItem>
                        <SelectItem value="month">Último Mês</SelectItem>
                        <SelectItem value="quarter">Último Trimestre</SelectItem>
                    </SelectContent>
                </Select>
                {userRank && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="sm:col-span-1">
                        <Card className="glass-effect border-blue-500/50">
                            <CardHeader className="p-2">
                                <CardTitle className="text-white text-center text-sm">Sua Posição</CardTitle>
                            </CardHeader>
                            <CardContent className="p-2 text-center">
                                <p className="text-3xl font-bold text-blue-400">{userRank}º</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="glass-effect border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Top Colaboradores</CardTitle>
                    </CardHeader>
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
                                        className={`flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border-l-4 ${getRankColor(rank)}`}
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
                                            <p className="text-lg font-bold text-white">{player.finalScore}</p>
                                            <p className="text-xs text-slate-400">{player.completedCount} concluídos</p>
                                        </div>
                                    </motion.li>
                                );
                            }) : (
                                <div className="text-center py-10 text-slate-500">
                                    <Trophy className="mx-auto h-10 w-10" />
                                    <p className="mt-2 font-semibold">Nenhum resultado para os filtros selecionados.</p>
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
