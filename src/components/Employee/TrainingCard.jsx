import React from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const TrainingCard = ({ training, userProgress, categories, onStartTraining, index }) => {

  const getCategoryProp = (categoryId, prop) => {
    const category = categories.find(c => c.id === categoryId);
    if (prop === 'nome') return category?.nome || 'N/A';
    if (prop === 'cor') return category?.cor || '#3b82f6';
    return null;
  };
  
  const getStatus = () => {
    if (!userProgress) return 'not-started';
    return userProgress.concluido ? 'completed' : 'in-progress';
  };
  
  const status = getStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="glass-effect border-slate-700 card-hover h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg text-white mb-2">{training.titulo}</CardTitle>
              <div className="flex items-center space-x-2 mb-2">
                <Badge style={{ backgroundColor: getCategoryProp(training.categoriaId, 'cor') }} className="text-white">
                  {getCategoryProp(training.categoriaId, 'nome')}
                </Badge>
                {training.obrigatorio && <Badge variant="destructive">Obrigatório</Badge>}
              </div>
            </div>
            <div className="flex flex-col items-center">
              {status === 'completed' && <CheckCircle className="w-6 h-6 text-green-500" />}
              {status === 'in-progress' && <Clock className="w-6 h-6 text-yellow-500" />}
              {status === 'not-started' && training.obrigatorio && <AlertCircle className="w-6 h-6 text-red-500" />}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 flex-grow flex flex-col justify-end">
          <p className="text-sm text-slate-300 line-clamp-3 flex-grow">{training.descricao}</p>
          
          {userProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Progresso</span>
                <span className="text-white">{userProgress.concluido ? '100%' : '50%'}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="progress-bar h-2 rounded-full" style={{ width: userProgress.concluido ? '100%' : '50%' }} />
              </div>
              {userProgress.concluido && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Nota:</span>
                  <span className="text-green-400 font-semibold">{userProgress.notaQuestionario}/10</span>
                </div>
              )}
            </div>
          )}
          
          {/* --- MUDANÇA AQUI: Botão de download removido para simplificar --- */}
          <div className="pt-4 border-t border-slate-700">
             <Button
                onClick={onStartTraining}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                disabled={status === 'completed'}
              >
                <Play className="w-4 h-4 mr-2" />
                {status === 'completed' ? 'Concluído' : 'Assistir'}
              </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TrainingCard;
