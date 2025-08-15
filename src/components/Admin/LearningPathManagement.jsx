import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
// --- ESTA É A CORREÇÃO CRÍTICA ---
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { getDatabase, updateDatabase } from '@/data/mockData';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

const LearningPathManagement = () => {
  const [paths, setPaths] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPath, setEditingPath] = useState(null);
  
  const initialFormData = {
    titulo: '',
    descricao: '',
    departamento: 'Todos',
    ativo: true,
    treinamentos: []
  };

  const [formData, setFormData] = useState(initialFormData);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const db = getDatabase();
    setPaths(db.trilhas || []);
    setTrainings(db.treinamentos || []);
    setDepartments(db.departamentos || []);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingPath(null);
  };

  const handleEdit = (path) => {
    setEditingPath(path);
    setFormData({
      ...path,
      treinamentos: path.treinamentos || []
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const db = getDatabase();
    
    if (editingPath) {
      const updatedPaths = db.trilhas.map(p => p.id === editingPath.id ? { ...p, ...formData } : p);
      updateDatabase({ ...db, trilhas: updatedPaths });
      toast({ title: "Trilha atualizada com sucesso!" });
    } else {
      const newPath = {
        ...formData,
        id: Math.max(0, ...(db.trilhas || []).map(p => p.id)) + 1
      };
      updateDatabase({ ...db, trilhas: [...(db.trilhas || []), newPath] });
      toast({ title: "Trilha criada com sucesso!" });
    }
    loadData();
    resetForm();
    setIsDialogOpen(false);
  };

  const handleDelete = (pathId) => {
    if (window.confirm("Tem certeza que deseja remover esta trilha?")) {
      const db = getDatabase();
      const updatedPaths = db.trilhas.filter(p => p.id !== pathId);
      updateDatabase({ ...db, trilhas: updatedPaths });
      loadData();
      toast({ title: "Trilha removida com sucesso." });
    }
  };

  const handleTrainingSelection = (trainingId) => {
    setFormData(prev => {
      const newTrainings = prev.treinamentos.includes(trainingId)
        ? prev.treinamentos.filter(id => id !== trainingId)
        : [...prev.treinamentos, trainingId];
      return { ...prev, treinamentos: newTrainings };
    });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Trilhas de Aprendizagem</h1>
          <p className="text-slate-400">Crie e organize sequências de treinamentos.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-500 to-teal-600" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" /> Nova Trilha
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-effect border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPath ? 'Editar' : 'Nova'} Trilha de Aprendizagem</DialogTitle>
              <DialogDescription>Defina os detalhes e selecione os treinamentos para a trilha.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input placeholder="Título da Trilha" value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} required className="bg-slate-800/50" />
              <Textarea placeholder="Descrição da Trilha" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="bg-slate-800/50" />
              <Select value={formData.departamento} onValueChange={value => setFormData({...formData, departamento: value})}>
                <SelectTrigger className="bg-slate-800/50"><SelectValue /></SelectTrigger>
                <SelectContent>{departments.map(dep => <SelectItem key={dep.id} value={dep.nome}>{dep.nome}</SelectItem>)}</SelectContent>
              </Select>
              <div className="flex items-center space-x-2"><Switch id="ativo" checked={formData.ativo} onCheckedChange={checked => setFormData({...formData, ativo: checked})} /><Label htmlFor="ativo">Ativa</Label></div>
              
              <div className="space-y-2">
                <Label>Treinamentos (selecione na ordem desejada)</Label>
                <div className="max-h-60 overflow-y-auto space-y-2 p-2 border border-slate-700 rounded-md">
                  {trainings.map(training => (
                    <div key={training.id} className="flex items-center space-x-2 p-2 bg-slate-800/50 rounded">
                       <Checkbox 
                          id={`training-${training.id}`}
                          checked={formData.treinamentos.includes(training.id)}
                          onCheckedChange={() => handleTrainingSelection(training.id)}
                       />
                       <label htmlFor={`training-${training.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                         {training.titulo}
                       </label>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">{editingPath ? 'Salvar' : 'Criar Trilha'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paths.map((path, index) => (
          <motion.div key={path.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <Card className="glass-effect border-slate-700 card-hover h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg text-white">{path.titulo}</CardTitle>
                <p className="text-sm text-slate-400">{path.departamento}</p>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-slate-300 line-clamp-2">{path.descricao}</p>
                <div className="text-xs text-slate-400 mt-4 pt-2 border-t border-slate-700 flex items-center gap-2">
                  <ListOrdered className="w-4 h-4" />
                  <span>{(path.treinamentos || []).length} Treinamento(s)</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(path)}><Edit className="w-4 h-4" /></Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(path.id)}><Trash2 className="w-4 h-4" /></Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LearningPathManagement;