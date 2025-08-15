import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Award } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getDatabase, updateDatabase } from '@/data/mockData';

const QuizView = ({ training, onQuizComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);

  const handleAnswer = (answerIndex) => {
    const newAnswers = [...answers, answerIndex];
    setAnswers(newAnswers);
    
    if (currentQuestion < training.perguntas.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      let correctAnswers = 0;
      training.perguntas.forEach((question, index) => {
        if (newAnswers[index] === question.respostaCorreta) {
          correctAnswers++;
        }
      });
      const score = Math.round((correctAnswers / training.perguntas.length) * 10);
      onQuizComplete(score);
    }
  };

  const question = training.perguntas[currentQuestion];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Questionário - Pergunta {currentQuestion + 1} de {training.perguntas.length}
        </h3>
        <div className="w-32 bg-slate-700 rounded-full h-2">
          <div 
            className="progress-bar h-2 rounded-full"
            style={{ width: `${((currentQuestion + 1) / training.perguntas.length) * 100}%` }}
          />
        </div>
      </div>
      <div className="space-y-4">
        <h4 className="text-xl text-white">{question.pergunta}</h4>
        <div className="space-y-3">
          {question.opcoes.map((option, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => handleAnswer(index)}
              className="w-full text-left justify-start p-4 h-auto border-slate-600 hover:bg-slate-700"
            >
              <span className="mr-3 w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-sm">{String.fromCharCode(65 + index)}</span>
              {option}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

const TrainingDialog = ({ training, isOpen, onClose, onComplete }) => {
  const [showQuiz, setShowQuiz] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const startQuiz = () => {
    if (!training?.perguntas || training.perguntas.length === 0) {
      completeTraining(10);
      return;
    }
    setShowQuiz(true);
  };

  const completeTraining = (score) => {
    const database = getDatabase();
    const existingProgress = database.historico.find(h => h.usuarioId === user.id && h.treinamentoId === training.id);

    if (existingProgress) {
      const updatedHistorico = database.historico.map(h =>
        h.id === existingProgress.id ? { ...h, concluido: true, dataConclusao: new Date().toISOString().split('T')[0], notaQuestionario: score, tempoAssistido: (h.tempoAssistido || 0) + 1800 } : h
      );
      updateDatabase({ ...database, historico: updatedHistorico });
    } else {
      const newProgress = {
        id: Math.max(0, ...(database.historico.map(h => h.id) || [0])) + 1,
        usuarioId: user.id,
        treinamentoId: training.id,
        concluido: true,
        dataConclusao: new Date().toISOString().split('T')[0],
        notaQuestionario: score,
        tempoAssistido: 1800
      };
      updateDatabase({ ...database, historico: [...database.historico, newProgress] });
    }
    
    toast({ title: "Treinamento concluído!", description: `Parabéns! Você obteve nota ${score}/10.` });
    setShowQuiz(false);
    onComplete();
  };

  const downloadFile = (file) => {
    if (file && file.url) {
      window.open(file.url, '_blank');
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível encontrar a URL do arquivo.",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    setShowQuiz(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-effect border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader><DialogTitle className="text-xl">{training.titulo}</DialogTitle></DialogHeader>
        {!showQuiz ? (
          <div className="space-y-6">
            <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden">
              <iframe src={training.video} className="w-full h-full" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={training.titulo} />
            </div>
            <div className="space-y-4">
              <p className="text-slate-300">{training.descricao}</p>
              {(training.arquivosComplementares || []).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Arquivos Complementares</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* --- MUDANÇA AQUI: Mapeia todos os arquivos e cria um botão para cada --- */}
                    {training.arquivosComplementares.map((file, index) => (
                      <Button key={index} variant="outline" onClick={() => downloadFile(file)} className="justify-start border-slate-600 hover:bg-slate-700">
                        <Download className="w-4 h-4 mr-2" /> {file.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={startQuiz} className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                  <Award className="w-4 h-4 mr-2" /> Fazer Questionário
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <QuizView training={training} onQuizComplete={completeTraining} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TrainingDialog;
