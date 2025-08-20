import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search, Filter, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getTrainingsForUser, getAllData } from '@/lib/firebaseService'; // <-- USA A NOVA FUNÇÃO
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import TrainingCard from '@/components/Employee/TrainingCard';
import TrainingDialog from '@/components/Employee/TrainingDialog';

const TrainingList = () => {
    const [allTrainings, setAllTrainings] = useState([]);
    const [filteredTrainings, setFilteredTrainings] = useState([]);
    const [categories, setCategories] = useState([]);
    const [userProgress, setUserProgress] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedTraining, setSelectedTraining] = useState(null);
    const { user } = useAuth();

    // Estado de loading simplificado
    const [isLoading, setIsLoading] = useState(true);

    const loadAllData = async () => {
        if (!user) return;
        setIsLoading(true);

        try {
            // Busca todos os dados necessários em paralelo para mais performance
            const [trainingsData, categoriesData, historicoSnapshot] = await Promise.all([
                getTrainingsForUser(user.departamento),
                getAllData('categorias'),
                getDocs(query(collection(db, 'historico'), where('usuarioId', '==', user.id)))
            ]);

            setAllTrainings(trainingsData);
            setCategories(categoriesData);

            const progress = {};
            historicoSnapshot.forEach(doc => {
                const data = doc.data();
                // O ID do treinamento é um número no seu mock, mas pode ser string no Firestore.
                // Garantimos que a chave do objeto seja consistente.
                const trainingId = data.treinamentoId.toString();
                progress[trainingId] = { id: doc.id, ...data };
            });
            setUserProgress(progress);

        } catch (error) {
            console.error("Erro ao carregar dados da lista de treinamentos:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            loadAllData(); 
        }
    }, [user]);

    useEffect(() => {
        let filtered = allTrainings;
        
        if (searchTerm) {
            filtered = filtered.filter(training =>
                training.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (training.descricao && training.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(training => 
                training.categoriaId.toString() === selectedCategory
            );
        }
        
        setFilteredTrainings(filtered);
    }, [allTrainings, searchTerm, selectedCategory]);
    
    const handleTrainingComplete = () => {
        setSelectedTraining(null);
        // Recarrega todos os dados para garantir que o progresso seja atualizado
        loadAllData();
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
                        placeholder="Buscar nos treinamentos..."
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
                        userProgress={userProgress[training.id.toString()]} // Garante que a chave seja string
                        categories={categories}
                        onStartTraining={() => setSelectedTraining(training)}
                        index={index}
                    />
                ))}
            </div>

            {filteredTrainings.length === 0 && !isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                >
                    <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">Nenhum treinamento encontrado</p>
                </motion.div>
            )}

            {/* O botão "Carregar Mais" foi removido pois agora carregamos todos os treinamentos disponíveis de uma vez */}

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