import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Lock, Play, GitMerge } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { getDatabase } from '@/data/mockData';
import TrainingDialog from '@/components/Employee/TrainingDialog';

const LearningPathList = () => {
  const [paths, setPaths] = useState([]);
  const [trainings, setTrainings] = useState({});
  const [userProgress, setUserProgress] = useState({});
  const [selectedTraining, setSelectedTraining] = useState(null);
  const { user } = useAuth();

  const loadData = () => {
    const db = getDatabase();
    const availablePaths = (db.trilhas || []).filter(p => 
      p.ativo && (p.departamento === 'Todos' || p.departamento === user?.departamento)
    );
    setPaths(availablePaths);

    const trainingsMap = (db.treinamentos || []).reduce((acc, t) => {
      acc[t.id] = t;
      return acc;
    }, {});
    setTrainings(trainingsMap);

    const progress = {};
    (db.historico || []).filter(h => h.usuarioId === user?.id).forEach(h => {
      progress[h.treinamentoId] = h;
    });
    setUserProgress(progress);
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const handleTrainingComplete = () => {
    setSelectedTraining(null);
    loadData(); // Recarrega os dados para atualizar o progresso
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white">Minhas Trilhas de Aprendizagem</h1>
        <p className="text-slate-400">Siga as sequências de treinamento para aprimorar suas habilidades.</p>
      </motion.div>

      {paths.length > 0 ? (
        paths.map((path, index) => {
          const completedInPath = path.treinamentos.filter(tid => userProgress[tid]?.concluido).length;
          const totalInPath = path.treinamentos.length;
          const progressPercentage = totalInPath > 0 ? (completedInPath / totalInPath) * 100 : 0;
          let isNextStepLocked = false;

          return (
            <motion.div key={path.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (index + 1) * 0.1 }}>
              <Card className="glass-effect border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">{path.titulo}</CardTitle>
                  {/* CORREÇÃO: Garante que a descrição da trilha exista */}
                  <p className="text-sm text-slate-300">{path.descricao || ''}</p>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                      <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <span className="text-sm font-semibold text-white">{Math.round(progressPercentage)}%</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {path.treinamentos.map((trainingId) => {
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
                            {/* CORREÇÃO: Garante que a descrição do treinamento exista antes de tentar cortá-la */}
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
                  })}
                </CardContent>
              </Card>
            </motion.div>
          );
        })
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
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