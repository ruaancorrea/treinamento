import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Tag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
// --- MUDANÇA PRINCIPAL ---
import { addData, updateData, deleteData } from '@/lib/firebaseService';
import { collection, getDocs } from 'firebase/firestore';
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

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ nome: '', cor: '#3b82f6' });
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const loadCategories = async () => {
        setIsLoading(true);
        const categoriesData = await getAllData('categorias');
        setCategories(categoriesData);
        setIsLoading(false);
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const resetForm = () => {
        setFormData({ nome: '', cor: '#3b82f6' });
        setEditingCategory(null);
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({ nome: category.nome, cor: category.cor });
        setIsDialogOpen(true);
    };

    // --- FUNÇÃO REFATORADA ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (editingCategory) {
            await updateData('categorias', editingCategory.id, formData);
            toast({ title: "Categoria atualizada com sucesso!" });
        } else {
            await addData('categorias', formData);
            toast({ title: "Categoria criada com sucesso!" });
        }

        await loadCategories();
        resetForm();
        setIsDialogOpen(false);
    };

    // --- FUNÇÃO REFATORADA ---
    const handleDelete = async (categoryId) => {
        if (window.confirm("Tem certeza que deseja remover esta categoria? Isso pode afetar treinamentos existentes.")) {
            await deleteData('categorias', categoryId);
            await loadCategories();
            toast({ title: "Categoria removida com sucesso." });
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-blue-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Gerenciamento de Categorias</h1>
                    <p className="text-slate-400">Organize seus treinamentos em categorias.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600" onClick={resetForm}>
                            <Plus className="w-4 h-4 mr-2" /> Nova Categoria
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-effect border-slate-700 text-white">
                        <DialogHeader>
                            <DialogTitle>{editingCategory ? 'Editar' : 'Nova'} Categoria</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="nome">Nome da Categoria</Label>
                                <Input id="nome" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="bg-slate-800/50" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cor">Cor da Categoria</Label>
                                <div className="flex items-center gap-2">
                                    <Input id="cor" type="color" value={formData.cor} onChange={e => setFormData({...formData, cor: e.target.value})} className="p-1 h-10 w-14 block bg-slate-800/50 border-slate-600 cursor-pointer" />
                                    <Input type="text" value={formData.cor} onChange={e => setFormData({...formData, cor: e.target.value})} className="bg-slate-800/50" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-600">Cancelar</Button>
                                <Button type="submit" className="bg-gradient-to-r from-blue-500 to-purple-600">{editingCategory ? 'Salvar' : 'Criar'}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {categories.map((category, index) => (
                    <motion.div key={category.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                        <Card className="glass-effect border-slate-700 card-hover">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: category.cor }}>
                                        <Tag className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="font-medium text-white">{category.nome}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(category)}><Edit className="w-4 h-4" /></Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-red-500/20" onClick={() => handleDelete(category.id)}><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default CategoryManagement;
