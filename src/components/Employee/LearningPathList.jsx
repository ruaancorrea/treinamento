import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Lock, Play, GitMerge, AlertTriangle } from 'lucide-react';
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

  // Esta função é segura e carrega os dados
  useEffect(() => {
    try {
      const db = getDatabase();
      if (!db) {
        console.error("Database is null or undefined.");
        return;
      }
      const availablePaths = (db.trilhas || []).filter(p => 
        p && p.ativo && (p.departamento === 'Todos' || p.departamento === user?.departamento)
      );
      setPaths(availablePaths);

      const trainingsMap = (db.treinamentos || []).reduce((acc, t) => {
        if (t && t.id) acc[t.id] = t;
        return acc;
      }, {});
      setTrainings(trainingsMap);

      const progress = {};
      (db.historico || []).filter(h => h && h.usuarioId === user?.id).forEach(h => {
        if (h.treinamentoId) progress[h.treinamentoId] = h;
      });
      setUserProgress(progress);
    } catch (error) {
        console.error("Error loading data in LearningPathList:", error);
    }
  }, [user]);

  const handleTrainingComplete = () => {
    setSelectedTraining(null);
    // Recarrega os dados para atualizar o progresso
  };

  // --- Bloco de renderização com proteção contra erros ---
  try {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white">Minhas Trilhas de Aprendizagem</h1>
          <p className="text-slate-400">Siga as sequências de treinamento para aprimorar suas habilidades.</p>
        </motion.div>

        {paths.length > 0 ? (
          paths.map((path, index) => {
            // --- Bloco de proteção para cada item da lista ---
            try {
              if (!path || typeof path !== 'object') {
                console.error("Invalid 'path' object found in list:", path);
                return null; // Ignora itens inválidos
              }

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
            } catch (error) {
              console.error(`ERRO CRÍTICO AO RENDERIZAR A TRILHA ID: ${path?.id}`, error);
              return (
                <Card className="border-red-500/50 bg-red-500/10 text-white p-4">
                  <div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400"/><span>Ocorreu um erro ao carregar esta trilha.</span></div>
                </Card>
              );
            }
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
  } catch (error) {
    console.error("ERRO FATAL NO COMPONENTE LearningPathList:", error);
    return (
      <div className="text-red-400 bg-red-500/10 p-6 rounded-lg">
        <h2 className="font-bold text-lg mb-2">Ocorreu um erro crítico nesta página.</h2>
        <p>Por favor, abra a consola do navegador (tecla F12) e envie o erro detalhado para depuração.</p>
      </div>
    );
  }
};

export default LearningPathList;