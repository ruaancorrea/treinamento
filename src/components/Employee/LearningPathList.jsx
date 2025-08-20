import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Lock, Play, GitMerge, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import TrainingDialog from '@/components/Employee/TrainingDialog';
// --- MUDANÇA PRINCIPAL ---
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


const LearningPathList = () => {
    const [paths, setPaths] = useState([]);
    const [trainings, setTrainings] = useState({});
    const [userProgress, setUserProgress] = useState({});
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            setIsLoading(true);

            try {
                // 1. Busca todas as trilhas (geralmente são poucas, não precisa paginar)
                // Filtra no lado do cliente por enquanto, mas o ideal seria um 'where' na query
                const allPaths = await getAllData('trilhas');
                const availablePaths = (allPaths || []).filter(p => 
                    p && p.ativo && (p.departamento === 'Todos' || p.departamento === user?.departamento)
                );
                setPaths(availablePaths);

                // 2. Busca todos os treinamentos para mapeamento
                const allTrainings = await getAllData('treinamentos');
                const trainingsMap = (allTrainings || []).reduce((acc, t) => {
                    if (t && t.id) acc[t.id] = t;
                    return acc;
                }, {});
                setTrainings(trainingsMap);

                // 3. Busca o histórico APENAS do usuário logado
                const historicoQuery = query(collection(db, 'historico'), where('usuarioId', '==', user.id));
                const historicoSnapshot = await getDocs(historicoQuery);
                const progress = {};
                historicoSnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.treinamentoId) progress[data.treinamentoId] = { id: doc.id, ...data };
                });
                setUserProgress(progress);

            } catch (error) {
                console.error("Error loading data in LearningPathList:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [user]);

    const handleTrainingComplete = () => {
        setSelectedTraining(null);
        // A lógica de recarregar os dados precisará ser ajustada no futuro
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
                <h1 className="text-3xl font-bold text-white">Minhas Trilhas de Aprendizagem</h1>
                <p className="text-slate-400">Siga as sequências de treinamento para aprimorar suas habilidades.</p>
            </motion.div>

            {paths.length > 0 ? (
                paths.map((path, index) => {
                    const pathTrainings = Array.isArray(path.treinamentos) ? path.treinamentos : [];
                    const completedInPath = pathTrainings.filter(tid => userProgress[tid]?.concluido).length;
                    const totalInPath = pathTrainings.length;
                    const progressPercentage = totalInPath > 0 ? (completedInPath / totalInPath) * 100 : 0;
                    let isNextStepLocked = false;

                    return (
                        <motion.div key={path.id || index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (index + 1) * 0.1 }}>
                            <Card className="glass-effect border-slate-700">
                                <CardHeader>
                                    <CardTitle className="text-white">{path.titulo || "Trilha sem título"}</CardTitle>
                                    <p className="text-sm text-slate-300">{path.descricao || ''}</p>
                                    <div className="flex items-center gap-4 pt-2">
                                        <div className="w-full bg-slate-700 rounded-full h-2.5">
                                            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                                        </div>
                                        <span className="text-sm font-semibold text-white">{Math.round(progressPercentage)}%</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {pathTrainings.length > 0 ? (
                                        pathTrainings.map((trainingId) => {
                                            const training = trainings[trainingId];
                                            if (!training) return null;
                                            
                                            const progress = userProgress[trainingId];
                                            const isCompleted = progress?.concluido;
                                            const isLocked = isNextStepLocked;
                                            if (!isCompleted) isNextStepLocked = true;

                                            return (
                                                <div key={trainingId} className={`flex items-center justify-between p-3 rounded-lg ${isLocked ? 'bg-slate-800/30 opacity-60' : 'bg-slate-800/60'}`}>
                                                    <div className="flex items-center gap-3">
                                                        {isCompleted ? <CheckCircle className="w-5 h-5 text-green-500" /> : isLocked ? <Lock className="w-5 h-5 text-slate-500" /> : <Clock className="w-5 h-5 text-blue-400" />}
                                                        <div>
                                                            <p className={`font-medium ${isLocked ? 'text-slate-400' : 'text-white'}`}>{training.titulo}</p>
                                                            <p className="text-xs text-slate-400">{(training.descricao || '').substring(0, 50)}...</p>
                                                        </div>
                                                    </div>
                                                    {!isLocked && !isCompleted && (
                                                        <Button size="sm" onClick={() => setSelectedTraining(training)} className="bg-blue-600 hover:bg-blue-700">
                                                            <Play className="w-4 h-4 mr-2" /> Iniciar
                                                        </Button>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-slate-400 text-center text-sm py-4">Nenhum treinamento foi adicionado a esta trilha ainda.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })
            ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                    <GitMerge className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">Nenhuma trilha de aprendizagem foi encontrada para você no momento.</p>
                </motion.div>
            )}

            {selectedTraining && (
                <TrainingDialog
                    training={selectedTraining}
                    isOpen={!!selectedTraining}
                    onClose={() => setSelectedTraining(null)}
                    onComplete={handleTrainingComplete}
                />
            )}
        </div>
    );
};

export default LearningPathList;
