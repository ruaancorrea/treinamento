import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Building, Loader2 } from 'lucide-react';
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

const DepartmentManagement = () => {
    const [departments, setDepartments] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [formData, setFormData] = useState({ nome: '' });
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const loadDepartments = async () => {
        setIsLoading(true);
        const depts = await getAllData('departamentos');
        // Filtra para não exibir o departamento "Todos", que é um valor especial
        setDepartments(depts.filter(d => d.nome !== 'Todos'));
        setIsLoading(false);
    };

    useEffect(() => {
        loadDepartments();
    }, []);

    const resetForm = () => {
        setFormData({ nome: '' });
        setEditingDepartment(null);
    };

    const handleEdit = (department) => {
        setEditingDepartment(department);
        setFormData({ nome: department.nome });
        setIsDialogOpen(true);
    };

    // --- FUNÇÃO REFATORADA ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (editingDepartment) {
            await updateData('departamentos', editingDepartment.id, formData);
            toast({ title: "Departamento atualizado com sucesso!" });
        } else {
            await addData('departamentos', formData);
            toast({ title: "Departamento criado com sucesso!" });
        }

        await loadDepartments();
        resetForm();
        setIsDialogOpen(false);
    };

    // --- FUNÇÃO REFATORADA ---
    const handleDelete = async (departmentId) => {
        if (window.confirm("Tem certeza que deseja remover este departamento?")) {
            await deleteData('departamentos', departmentId);
            await loadDepartments();
            toast({ title: "Departamento removido com sucesso." });
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-blue-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Gerenciamento de Departamentos</h1>
                    <p className="text-slate-400">Adicione, edite ou remova os departamentos da empresa.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600" onClick={resetForm}>
                            <Plus className="w-4 h-4 mr-2" /> Novo Departamento
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-effect border-slate-700 text-white">
                        <DialogHeader>
                            <DialogTitle>{editingDepartment ? 'Editar' : 'Novo'} Departamento</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="nome">Nome do Departamento</Label>
                                <Input id="nome" value={formData.nome} onChange={e => setFormData({ nome: e.target.value })} className="bg-slate-800/50" required />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-600">Cancelar</Button>
                                <Button type="submit" className="bg-gradient-to-r from-blue-500 to-purple-600">{editingDepartment ? 'Salvar' : 'Criar'}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {departments.map((department, index) => (
                    <motion.div key={department.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                        <Card className="glass-effect border-slate-700 card-hover">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-700">
                                        <Building className="w-5 h-5 text-slate-300" />
                                    </div>
                                    <span className="font-medium text-white">{department.nome}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(department)}><Edit className="w-4 h-4" /></Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-red-500/20" onClick={() => handleDelete(department.id)}><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default DepartmentManagement;
