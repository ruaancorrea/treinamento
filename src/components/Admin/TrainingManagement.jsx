import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, BookOpen, Tag, Users, Clock, FileText, HelpCircle, Upload, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { getDatabase, updateDatabase } from '@/data/mockData';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'; // Importe o RadioGroup

const TrainingManagement = () => {
  const [trainings, setTrainings] = useState([]);
  const [filteredTrainings, setFilteredTrainings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState(null);
  
  const fileInputRef = useRef(null); // Ref para o input de arquivo
  
  const initialFormData = {
    titulo: '',
    descricao: '',
    video: '',
    categoriaId: '',
    departamento: 'Todos',
    obrigatorio: false,
    ativo: true,
    dataExpiracao: '',
    perguntas: [],
    arquivosComplementares: [] // Alterado para array
  };
  
  const [formData, setFormData] = useState(initialFormData);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filtered = trainings.filter(training =>
      training.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTrainings(filtered);
  }, [trainings, searchTerm]);

  const loadData = () => {
    const database = getDatabase();
    setTrainings(database.treinamentos);
    setCategories(database.categorias);
    setDepartments(database.departamentos);
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.nome || 'N/A';
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingTraining(null);
  };

  const handleEdit = (training) => {
    setEditingTraining(training);
    setFormData({
      ...training,
      categoriaId: training.categoriaId.toString(),
      // Garante que os campos sejam arrays vazios se não existirem
      arquivosComplementares: training.arquivosComplementares || [],
      perguntas: training.perguntas || [],
      dataExpiracao: training.dataExpiracao || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validação para garantir que cada pergunta tem uma resposta correta
    if (formData.perguntas.some(q => q.respostaCorreta === undefined || q.respostaCorreta === null)) {
        toast({
            title: "Erro de Validação",
            description: "Todas as perguntas devem ter uma resposta correta selecionada.",
            variant: "destructive",
        });
        return;
    }

    const database = getDatabase();
    const preparedData = {
      ...formData,
      categoriaId: parseInt(formData.categoriaId),
      dataExpiracao: formData.dataExpiracao || null,
    };

    if (editingTraining) {
      const updatedTrainings = database.treinamentos.map(t =>
        t.id === editingTraining.id ? { ...t, ...preparedData } : t
      );
      updateDatabase({ ...database, treinamentos: updatedTrainings });
      toast({ title: "Treinamento atualizado com sucesso!" });
    } else {
      const newTraining = {
        ...preparedData,
        id: Math.max(...database.treinamentos.map(t => t.id), 0) + 1,
        dataPublicacao: new Date().toISOString().split('T')[0]
      };
      updateDatabase({ ...database, treinamentos: [...database.treinamentos, newTraining] });
      toast({ title: "Treinamento criado com sucesso!" });
    }

    loadData();
    resetForm();
    setIsDialogOpen(false);
  };
  
  // --- NOVAS FUNÇÕES PARA GERENCIAR PERGUNTAS ---
  const handleAddQuestion = () => {
    setFormData(prev => ({
      ...prev,
      perguntas: [...prev.perguntas, { pergunta: '', opcoes: ['', '', '', ''], respostaCorreta: null }]
    }));
  };

  const handleRemoveQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      perguntas: prev.perguntas.filter((_, i) => i !== index)
    }));
  };

  const handleQuestionChange = (index, value) => {
    const newQuestions = [...formData.perguntas];
    newQuestions[index].pergunta = value;
    setFormData({ ...formData, perguntas: newQuestions });
  };
  
  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...formData.perguntas];
    newQuestions[qIndex].opcoes[oIndex] = value;
    setFormData({ ...formData, perguntas: newQuestions });
  };
  
  const handleCorrectAnswerChange = (qIndex, oIndex) => {
    const newQuestions = [...formData.perguntas];
    newQuestions[qIndex].respostaCorreta = oIndex;
    setFormData({ ...formData, perguntas: newQuestions });
  };

  // --- NOVAS FUNÇÕES PARA UPLOAD DE ARQUIVOS ---
  const handleFileSelect = (event) => {
      const files = Array.from(event.target.files);
      // Aqui estamos apenas armazenando os nomes. Numa app real, você faria o upload.
      const fileNames = files.map(file => file.name);
      setFormData(prev => ({
          ...prev,
          arquivosComplementares: [...prev.arquivosComplementares, ...fileNames]
      }));
  };

  const handleRemoveFile = (fileName) => {
      setFormData(prev => ({
          ...prev,
          arquivosComplementares: prev.arquivosComplementares.filter(f => f !== fileName)
      }));
  };


  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Gerenciamento de Treinamentos</h1>
          <p className="text-slate-400">Crie, edite e gerencie os treinamentos da plataforma.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" /> Novo Treinamento
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-effect border-slate-700 text-white max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{editingTraining ? 'Editar' : 'Novo'} Treinamento</DialogTitle>
              <DialogDescription>Preencha os detalhes do treinamento e adicione o conteúdo.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto scrollbar-thin pr-4">
              {/* --- Campos Principais --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título</Label>
                  <Input id="titulo" value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} className="bg-slate-800/50" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video">URL do Vídeo (Embed)</Label>
                  <Input id="video" value={formData.video} onChange={e => setFormData({...formData, video: e.target.value})} className="bg-slate-800/50" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoriaId">Categoria</Label>
                  <Select value={formData.categoriaId} onValueChange={value => setFormData({...formData, categoriaId: value})}>
                    <SelectTrigger className="bg-slate-800/50"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{categories.map(cat => <SelectItem key={cat.id} value={cat.id.toString()}>{cat.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departamento">Departamento</Label>
                  <Select value={formData.departamento} onValueChange={value => setFormData({...formData, departamento: value})}>
                    <SelectTrigger className="bg-slate-800/50"><SelectValue /></SelectTrigger>
                    <SelectContent>{departments.map(dep => <SelectItem key={dep.id} value={dep.nome}>{dep.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea id="descricao" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="bg-slate-800/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataExpiracao">Data de Expiração (Opcional)</Label>
                <Input type="date" id="dataExpiracao" value={formData.dataExpiracao} onChange={e => setFormData({...formData, dataExpiracao: e.target.value})} className="bg-slate-800/50" />
              </div>
              <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2"><Switch id="obrigatorio" checked={formData.obrigatorio} onCheckedChange={checked => setFormData({...formData, obrigatorio: checked})} /><Label htmlFor="obrigatorio">Obrigatório</Label></div>
                  <div className="flex items-center space-x-2"><Switch id="ativo" checked={formData.ativo} onCheckedChange={checked => setFormData({...formData, ativo: checked})} /><Label htmlFor="ativo">Ativo</Label></div>
              </div>
              
              {/* --- SEÇÃO DE ARQUIVOS --- */}
              <div className="space-y-3 pt-4 border-t border-slate-700">
                  <h3 className="text-lg font-semibold text-white">Arquivos Complementares</h3>
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current.click()}>
                      <Upload className="w-4 h-4 mr-2"/> Selecionar Arquivos
                  </Button>
                  <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                  <div className="space-y-2">
                      {formData.arquivosComplementares.map(file => (
                          <div key={file} className="flex items-center justify-between bg-slate-800/50 p-2 rounded">
                              <span className="text-sm text-slate-300">{file}</span>
                              <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleRemoveFile(file)}>
                                  <XCircle className="w-4 h-4 text-red-500"/>
                              </Button>
                          </div>
                      ))}
                  </div>
              </div>

              {/* --- SEÇÃO DE PERGUNTAS --- */}
              <div className="space-y-4 pt-4 border-t border-slate-700">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">Questionário</h3>
                    <Button type="button" size="sm" onClick={handleAddQuestion}><Plus className="w-4 h-4 mr-2" /> Adicionar Pergunta</Button>
                </div>
                {formData.perguntas.map((q, qIndex) => (
                  <div key={qIndex} className="p-4 border border-slate-700 rounded-lg space-y-4 bg-slate-800/30">
                    <div className="flex justify-between items-center">
                      <Label>Pergunta {qIndex + 1}</Label>
                      <Button type="button" size="sm" variant="destructive" onClick={() => handleRemoveQuestion(qIndex)}><Trash2 className="w-4 h-4"/>
                      </Button>
                    </div>
                    <Textarea placeholder="Digite a pergunta..." value={q.pergunta} onChange={(e) => handleQuestionChange(qIndex, e.target.value)} required/>
                    
                    <RadioGroup value={q.respostaCorreta?.toString()} onValueChange={(value) => handleCorrectAnswerChange(qIndex, parseInt(value))}>
                        {q.opcoes.map((opt, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}o${oIndex}`} />
                            <Input placeholder={`Opção ${oIndex + 1}`} value={opt} onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} required />
                          </div>
                        ))}
                    </RadioGroup>
                  </div>
                ))}
              </div>
            </form>
            <DialogFooter className="pt-4 border-t border-slate-700">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-600">Cancelar</Button>
              {/* O botão de submit agora está atrelado ao form via ID */}
              <Button type="submit" form="trainingForm" className="bg-gradient-to-r from-blue-500 to-purple-600">{editingTraining ? 'Salvar' : 'Criar'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input placeholder="Buscar por título..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-slate-800/50 border-slate-600" />
        </div>
      </motion.div>

      {/* --- Grid de Treinamentos (Exibição) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrainings.map((training, index) => (
          <motion.div key={training.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <Card className="glass-effect border-slate-700 card-hover h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg text-white mb-1">{training.titulo}</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge style={{ backgroundColor: categories.find(c => c.id === training.categoriaId)?.cor || '#ccc' }}>{getCategoryName(training.categoriaId)}</Badge>
                  <Badge variant={training.ativo ? 'default' : 'destructive'}>{training.ativo ? "Ativo" : "Inativo"}</Badge>
                  {training.obrigatorio && <Badge variant="destructive">Obrigatório</Badge>}
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-3">
                <p className="text-sm text-slate-300 line-clamp-3 flex-grow">{training.descricao}</p>
                <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-700">
                  <div className="flex items-center gap-2"><Users className="w-3 h-3"/><span>Departamento: {training.departamento}</span></div>
                  <div className="flex items-center gap-2"><FileText className="w-3 h-3"/><span>Arquivos: {(training.arquivosComplementares || []).length}</span></div>
                  <div className="flex items-center gap-2"><HelpCircle className="w-3 h-3"/><span>Perguntas: {(training.perguntas || []).length}</span></div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button size="sm" variant="outline" className="border-slate-600" onClick={() => handleEdit(training)}><Edit className="w-4 h-4" /></Button>
                <Button size="sm" variant="outline" className="border-slate-600 hover:bg-red-500/20" onClick={() => handleDelete(training.id)}><Trash2 className="w-4 h-4" /></Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
      {filteredTrainings.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Nenhum treinamento encontrado</p>
        </motion.div>
      )}
    </div>
  );
};

export default TrainingManagement;

