import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { getDatabase } from '@/data/mockData';
import TrainingCard from '@/components/Employee/TrainingCard';
import TrainingDialog from '@/components/Employee/TrainingDialog';

const TrainingList = () => {
  const [trainings, setTrainings] = useState([]);
  const [filteredTrainings, setFilteredTrainings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [userProgress, setUserProgress] = useState({});
  const { user } = useAuth();

  const loadData = () => {
    const database = getDatabase();
    
    const availableTrainings = database.treinamentos.filter(training => 
      training.ativo && 
      (training.departamento === 'Todos' || training.departamento === user?.departamento)
    );
    
    setTrainings(availableTrainings);
    setCategories(database.categorias);
    
    const progress = {};
    database.historico
      .filter(h => h.usuarioId === user?.id)
      .forEach(h => {
        progress[h.treinamentoId] = h;
      });
    setUserProgress(progress);
  };
  
  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    let filtered = trainings;
    
    if (searchTerm) {
      filtered = filtered.filter(training =>
        training.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        training.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(training => 
        training.categoriaId === parseInt(selectedCategory)
      );
    }
    
    setFilteredTrainings(filtered);
  }, [trainings, searchTerm, selectedCategory]);
  
  const handleTrainingComplete = () => {
    setSelectedTraining(null);
    loadData();
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white">Meus Treinamentos</h1>
        <p className="text-slate-400">Acesse seus treinamentos disponíveis</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar treinamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-600 text-white"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48 bg-slate-800/50 border-slate-600">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrainings.map((training, index) => (
          <TrainingCard
            key={training.id}
            training={training}
            userProgress={userProgress[training.id]}
            categories={categories}
            onStartTraining={() => setSelectedTraining(training)}
            index={index}
          />
        ))}
      </div>

      {filteredTrainings.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Nenhum treinamento encontrado</p>
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

export default TrainingList;