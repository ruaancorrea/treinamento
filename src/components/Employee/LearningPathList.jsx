import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, CheckCircle, Loader2, Award, Lock, Clock, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { getAllData } from '@/lib/firebaseService';
import { Button } from '@/components/ui/button';
import TrainingDialog from '@/components/Employee/TrainingDialog';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

const LearningPathList = ({ onViewCertificate }) => {
    const { user } = useAuth();
    const [dbData, setDbData] = useState({ trilhas: [], historico: [], treinamentos: {} });
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTraining, setSelectedTraining] = useState(null);

    const loadData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [trilhasData, historicoData, treinamentosData] = await Promise.all([
                getAllData('trilhas'),
                getAllData('historico'),
                getAllData('treinamentos')
            ]);

            const userHistorico = historicoData.filter(h => h.usuarioId === user.id && h.concluido);
            
            const trainingsMap = treinamentosData.reduce((acc, t) => {
                acc[t.id] = t;
                return acc;
            }, {});

            setDbData({
                trilhas: trilhasData,
                historico: userHistorico,
                trainings: trainingsMap
            });
        } catch (error) {
            console.error("Erro ao carregar dados das trilhas:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user]);

    const handleTrainingComplete = () => {
        setSelectedTraining(null);
        // Recarrega os dados para atualizar o progresso da trilha
        loadData();
    };

    const trilhasComProgresso = useMemo(() => {
        return dbData.trilhas
            .filter(trilha => trilha.ativo && (trilha.departamento === 'Todos' || trililha.departamento === user.departamento))
            .map(trilha => {
                // --- CORREÇÃO AQUI ---
                // Voltamos a usar 'treinamentos', que é o nome correto do campo no seu projeto
                const totalTrainings = trilha.treinamentos?.length || 0;
                if (totalTrainings === 0) {
                    return { ...trilha, completedCount: 0, progress: 0, isCompleted: false, steps: [] };
                }
                const completedIds = new Set(dbData.historico.map(h => h.treinamentoId));
                const completedCount = trilha.treinamentos.filter(id => completedIds.has(id)).length;
                const progress = (completedCount / totalTrainings) * 100;
                const isCompleted = completedCount === totalTrainings;
                
                let isNextStepLocked = false;
                const steps = trilha.treinamentos.map(tid => {
                    const hasCompleted = completedIds.has(tid);
                    const isLocked = isNextStepLocked;
                    if (!hasCompleted) {
                        isNextStepLocked = true;
                    }
                    return {
                        id: tid,
                        training: dbData.trainings[tid],
                        isCompleted: hasCompleted,
                        isLocked: isLocked
                    };
                });

                return { ...trilha, completedCount, progress, isCompleted, steps };
            });
    }, [dbData, user.departamento]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-blue-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold text-white">Minhas Trilhas de Aprendizagem</h1>
                <p className="text-slate-400">Siga um caminho de estudos guiado para aprofundar os seus conhecimentos.</p>
            </motion.div>

            <div className="space-y-6">
                {trilhasComProgresso.map((trilha, index) => (
                    <motion.div key={trilha.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                        <Card className={`glass-effect border-slate-700 card-hover flex flex-col ${trilha.isCompleted ? 'border-green-500/50' : ''}`}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <Zap className="w-8 h-8 text-yellow-400" />
                                    {trilha.isCompleted && <CheckCircle className="w-6 h-6 text-green-400" />}
                                </div>
                                <CardTitle className="text-white pt-4">{trilha.titulo}</CardTitle>
                                <CardDescription>{trilha.descricao}</CardDescription>
                                <div className="flex items-center gap-4 pt-2">
                                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                                        <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${trilha.progress}%` }}></div>
                                    </div>
                                    <span className="text-sm font-semibold text-white">{Math.round(trilha.progress)}%</span>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {trilha.steps.map(step => {
                                    if (!step.training) return null;
                                    return (
                                        <div key={step.id} className={`flex items-center justify-between p-3 rounded-lg ${step.isLocked ? 'bg-slate-800/30 opacity-60' : 'bg-slate-800/60'}`}>
                                            <div className="flex items-center gap-3">
                                                {step.isCompleted ? <CheckCircle className="w-5 h-5 text-green-500" /> : step.isLocked ? <Lock className="w-5 h-5 text-slate-500" /> : <Clock className="w-5 h-5 text-blue-400" />}
                                                <div>
                                                    <p className={`font-medium ${step.isLocked ? 'text-slate-400' : 'text-white'}`}>{step.training.titulo}</p>
                                                </div>
                                            </div>
                                            {!step.isLocked && !step.isCompleted && (
                                                <Button size="sm" onClick={() => setSelectedTraining(step.training)} className="bg-blue-600 hover:bg-blue-700">
                                                    <Play className="w-4 h-4 mr-2" /> Iniciar
                                                </Button>
                                            )}
                                        </div>
                                    )
                                })}
                            </CardContent>
                            <CardFooter>
                                {trilha.isCompleted && (
                                    <Button onClick={() => onViewCertificate(trilha)} className="w-full bg-gradient-to-r from-green-500 to-blue-500">
                                        <Award className="w-4 h-4 mr-2" /> Ver Certificado
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    </motion.div>
                ))}
            </div>
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
