import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Medal, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { getDatabase } from '@/data/mockData';

const Ranking = () => {
    const { user } = useAuth();
    const [ranking, setRanking] = useState([]);
    const [userRank, setUserRank] = useState(null);

    useEffect(() => {
        const db = getDatabase();
        if (!db || !db.usuarios || !db.historico) return;

        const users = db.usuarios.filter(u => u.tipo === 'funcionario' && u.ativo);
        const history = db.historico.filter(h => h.concluido);
        
        const userScores = users.map(u => {
            const userHistory = history.filter(h => h.usuarioId === u.id);
            
            // --- INÍCIO DA LÓGICA CORRIGIDA ---

            // 1. Agrupa o histórico por treinamento, guardando a melhor nota para cada um.
            const bestScoresByTraining = userHistory.reduce((acc, h) => {
                const existing = acc[h.treinamentoId];
                if (!existing || h.notaQuestionario > existing.notaQuestionario) {
                    acc[h.treinamentoId] = h;
                }
                return acc;
            }, {});

            // 2. Converte o objeto de melhores notas num array.
            const uniqueBestHistory = Object.values(bestScoresByTraining);

            // 3. Calcula os novos totais com base nos treinamentos únicos e melhores notas.
            const completedCount = uniqueBestHistory.length;
            const totalScore = uniqueBestHistory.reduce((acc, h) => acc + (h.notaQuestionario || 0), 0);
            
            // Lógica de pontuação: 10 pontos por treinamento único concluído + média das melhores notas.
            const finalScore = (completedCount * 10) + (completedCount > 0 ? totalScore / completedCount : 0);

            // --- FIM DA LÓGICA CORRIGIDA ---

            return {
                id: u.id,
                nome: u.nome,
                departamento: u.departamento,
                completedCount, // Agora conta treinamentos únicos
                finalScore: finalScore.toFixed(2),
            };
        });

        const sortedRanking = userScores.sort((a, b) => b.finalScore - a.finalScore);
        setRanking(sortedRanking);

        const currentUserRank = sortedRanking.findIndex(u => u.id === user.id) + 1;
        setUserRank(currentUserRank > 0 ? currentUserRank : null);

    }, [user, getDatabase()]); // Adicionado getDatabase() para reatividade

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

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold text-white">Ranking de Colaboradores</h1>
                <p className="text-slate-400">Veja quem está se destacando nos treinamentos.</p>
            </motion.div>
            
            {userRank && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="glass-effect border-blue-500/50">
                        <CardHeader>
                            <CardTitle className="text-white text-center">Sua Posição</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-5xl font-bold text-blue-400">{userRank}º</p>
                            <p className="text-slate-300 mt-1">Continue assim!</p>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="glass-effect border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Top Colaboradores</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {ranking.map((player, index) => {
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
                            })}
                        </ul>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default Ranking;
