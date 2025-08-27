import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileUp, Download, FileDown, AlertTriangle, Loader2, Award, Plus, Edit, Trash2, Star, Medal, Trophy, Target, Palette } from 'lucide-react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { addData, updateData, deleteData, getAllData } from '@/lib/firebaseService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// --- COMPONENTE PARA GESTÃO DE DADOS (SEU CÓDIGO ORIGINAL) ---
const COLLECTIONS_TO_BACKUP = ['usuarios', 'treinamentos', 'categorias', 'departamentos', 'historico', 'trilhas', 'knowledgeBase', 'simulados', 'resultadosSimulados', 'medalhas_config'];

const colorClasses = {
    blue: { gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-600', hoverBg: 'hover:bg-blue-700' },
    green: { gradient: 'from-green-500 to-green-600', bg: 'bg-green-600', hoverBg: 'hover:bg-green-700' },
    purple: { gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-600', hoverBg: 'hover:bg-purple-700' },
    red: { gradient: 'from-red-500 to-orange-600', bg: 'bg-red-600', hoverBg: 'hover:bg-red-700' }
};

const DadosSettings = () => {
    const { toast } = useToast();
    const jsonInputRef = useRef(null);
    const csvInputRef = useRef(null);
    const [isLoading, setIsLoading] = useState(null);

    const handleBackup = async () => {
        setIsLoading('backup');
        try {
            const backupData = {};
            for (const collectionName of COLLECTIONS_TO_BACKUP) {
                const data = await getAllData(collectionName);
                backupData[collectionName] = data;
            }
            const dataStr = JSON.stringify(backupData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const exportFileDefaultName = `backup_${new Date().toISOString().split('T')[0]}.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            toast({ title: "Backup Realizado", description: "O arquivo de backup foi baixado." });
        } catch (error) {
            toast({ title: "Erro no Backup", description: "Não foi possível gerar o backup.", variant: "destructive" });
        } finally {
            setIsLoading(null);
        }
    };

    const handleJsonFileChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            setIsLoading('importJson');
            try {
                const dataToImport = JSON.parse(e.target?.result);
                if (!window.confirm("ATENÇÃO: A importação irá sobrescrever TODOS os dados existentes. Deseja continuar?")) {
                    setIsLoading(null);
                    return;
                }
                const batch = writeBatch(db);
                for (const collectionName of COLLECTIONS_TO_BACKUP) {
                    const oldDocsSnapshot = await getDocs(collection(db, collectionName));
                    oldDocsSnapshot.forEach(doc => batch.delete(doc.ref));
                    if (dataToImport[collectionName]) {
                        dataToImport[collectionName].forEach(item => {
                            const docRef = doc(db, collectionName, item.id);
                            batch.set(docRef, item);
                        });
                    }
                }
                await batch.commit();
                toast({ title: "✅ Importação Concluída", description: "Os dados foram restaurados com sucesso." });
                setTimeout(() => window.location.reload(), 1500);
            } catch (error) {
                toast({ title: "❌ Erro na Importação", description: "O arquivo JSON é inválido ou a operação falhou.", variant: "destructive" });
            } finally {
                setIsLoading(null);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const handleCsvFileChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsLoading('importCsv');
        Papa.parse(file, {
            header: true, skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const newUsers = results.data;
                    for (const user of newUsers) {
                        const userToAdd = {
                            ...user,
                            ativo: user.ativo ? user.ativo.toLowerCase() === 'true' : true,
                            dataCriacao: new Date().toISOString()
                        };
                        await addData('usuarios', userToAdd);
                    }
                    toast({ title: "✅ Importação de Usuários Concluída", description: `${newUsers.length} usuários foram importados.` });
                } catch (error) {
                    toast({ title: "❌ Erro na Importação do CSV", description: "Não foi possível processar os dados.", variant: "destructive" });
                } finally {
                    setIsLoading(null);
                }
            },
            error: (err) => {
                toast({ title: "❌ Erro ao ler o arquivo CSV", description: err.message, variant: "destructive" });
                setIsLoading(null);
            }
        });
        event.target.value = '';
    };

    const handleResetData = async () => {
        if (window.confirm("ATENÇÃO: Esta ação irá apagar TODOS os dados do Firestore. Esta ação é irreversível. Deseja continuar?")) {
            if (window.confirm("CONFIRMAÇÃO FINAL: Tem certeza absoluta que deseja resetar todos os dados?")) {
                setIsLoading('reset');
                try {
                    const batch = writeBatch(db);
                    for (const collectionName of COLLECTIONS_TO_BACKUP) {
                        const querySnapshot = await getDocs(collection(db, collectionName));
                        querySnapshot.forEach(doc => batch.delete(doc.ref));
                    }
                    await batch.commit();
                    toast({ title: "Dados Resetados!", description: "A aplicação será recarregada." });
                    setTimeout(() => window.location.reload(), 1500);
                } catch (error) {
                    toast({ title: "Erro ao Resetar", description: "Não foi possível limpar o banco de dados.", variant: "destructive" });
                } finally {
                    setIsLoading(null);
                }
            }
        }
    };
    
    const handleImportClick = () => jsonInputRef.current?.click();
    const handleImportUsersClick = () => csvInputRef.current?.click();

    const settingsCards = [
        { id: "backup", title: "Backup dos Dados", description: "Faça o download de um backup completo dos dados.", icon: Download, action: handleBackup, buttonText: "Fazer Backup", color: "blue" },
        { id: "importJson", title: "Importar Dados (JSON)", description: "Importe dados de um arquivo de backup para restaurar o sistema.", icon: FileUp, action: handleImportClick, buttonText: "Importar JSON", color: "green" },
        { id: "importCsv", title: "Importar Usuários (CSV)", description: "Importe uma lista de usuários a partir de um arquivo CSV.", icon: FileDown, action: handleImportUsersClick, buttonText: "Importar CSV", color: "purple" },
        { id: "reset", title: "Resetar Dados da Aplicação", description: "Atenção: Esta ação apaga todos os dados do banco de dados.", icon: AlertTriangle, action: handleResetData, buttonText: "Resetar Dados", color: "red" }
    ];

    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {settingsCards.map((card) => {
                    const Icon = card.icon;
                    const colors = colorClasses[card.color] || colorClasses.blue;
                    const cardIsLoading = isLoading === card.id;
                    return (
                        <motion.div key={card.title}>
                            <Card className="glass-effect border-slate-700 card-hover h-full flex flex-col">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-lg bg-gradient-to-r ${colors.gradient}`}><Icon className="h-6 w-6 text-white" /></div>
                                        <div><CardTitle className="text-lg text-white">{card.title}</CardTitle></div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow flex flex-col justify-between">
                                    <CardDescription className="text-slate-300 mb-4">{card.description}</CardDescription>
                                    <Button onClick={card.action} className={`w-full ${colors.bg} ${colors.hoverBg}`} disabled={cardIsLoading}>
                                        {cardIsLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                        {cardIsLoading ? 'Processando...' : card.buttonText}
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
            <input type="file" ref={jsonInputRef} onChange={handleJsonFileChange} accept="application/json" style={{ display: 'none' }} />
            <input type="file" ref={csvInputRef} onChange={handleCsvFileChange} accept=".csv" style={{ display: 'none' }} />
        </div>
    );
};


// --- COMPONENTE PARA GESTÃO DE MEDALHAS ---
const iconMap = { Star: <Star />, Award: <Award />, Medal: <Medal />, Trophy: <Trophy />, Target: <Target /> };

const MedalhasSettings = () => {
    const [medalhas, setMedalhas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMedal, setEditingMedal] = useState(null);
    const { toast } = useToast();
    const initialFormData = { nome: '', descricao: '', icone: 'Star', regra_tipo: 'simulados_concluidos', regra_valor: 1 };
    const [formData, setFormData] = useState(initialFormData);

    const fetchMedalhas = async () => {
        setIsLoading(true);
        const data = await getAllData('medalhas_config');
        setMedalhas(data);
        setIsLoading(false);
    };

    useEffect(() => { fetchMedalhas(); }, []);

    const handleOpenDialog = (medal = null) => {
        setEditingMedal(medal);
        setFormData(medal || initialFormData);
        setIsDialogOpen(true);
    };

    const handleDelete = async (medalId) => {
        if (!window.confirm("Tem certeza que deseja apagar esta medalha?")) return;
        await deleteData('medalhas_config', medalId);
        toast({ title: "Medalha apagada!" });
        fetchMedalhas();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const dataToSave = { ...formData, regra_valor: Number(formData.regra_valor) };
        if (editingMedal) {
            await updateData('medalhas_config', editingMedal.id, dataToSave);
            toast({ title: "Medalha atualizada!" });
        } else {
            await addData('medalhas_config', dataToSave);
            toast({ title: "Medalha criada!" });
        }
        setIsDialogOpen(false);
        fetchMedalhas();
    };

    return (
        <Card className="glass-effect border-slate-700 text-white">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Gestão de Medalhas</CardTitle>
                    <CardDescription>Crie e edite as conquistas personalizadas da plataforma.</CardDescription>
                </div>
                <Button onClick={() => handleOpenDialog()}><Plus className="w-4 h-4 mr-2" /> Nova Medalha</Button>
            </CardHeader>
            <CardContent>
                {isLoading ? <div className="flex justify-center"><Loader2 className="animate-spin" /></div> : (
                    <div className="space-y-4">
                        {medalhas.map(medal => (
                            <div key={medal.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <div className="text-yellow-400">{React.cloneElement(iconMap[medal.icone], { className: "w-8 h-8" })}</div>
                                    <div>
                                        <p className="font-semibold">{medal.nome}</p>
                                        <p className="text-sm text-slate-400">{medal.descricao}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="icon" onClick={() => handleOpenDialog(medal)}><Edit className="w-4 h-4" /></Button>
                                    <Button variant="destructive" size="icon" onClick={() => handleDelete(medal.id)}><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                {/* --- CORREÇÃO AQUI --- */}
                <DialogContent key={editingMedal ? editingMedal.id : 'new'} className="glass-effect border-slate-700 text-white">
                    <DialogHeader><DialogTitle>{editingMedal ? 'Editar' : 'Nova'} Medalha</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div><Label>Nome</Label><Input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required /></div>
                        <div><Label>Descrição</Label><Textarea value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} required /></div>
                        <div><Label>Ícone</Label><Select value={formData.icone} onValueChange={value => setFormData({...formData, icone: value})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(iconMap).map(iconName => (<SelectItem key={iconName} value={iconName}>{iconName}</SelectItem>))}</SelectContent></Select></div>
                        <div><Label>Tipo de Regra</Label><Select value={formData.regra_tipo} onValueChange={value => setFormData({...formData, regra_tipo: value})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="simulados_concluidos">Nº de Simulados Concluídos</SelectItem><SelectItem value="pontuacao_media_acima">Pontuação Média Acima de (%)</SelectItem><SelectItem value="nota_perfeita_em">Nota Perfeita em (Nº simulados)</SelectItem></SelectContent></Select></div>
                        <div><Label>Valor da Regra</Label><Input type="number" value={formData.regra_valor} onChange={e => setFormData({...formData, regra_valor: e.target.value})} required /></div>
                        <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

// --- COMPONENTE PARA GESTÃO DA APARÊNCIA ---
const AparenciaSettings = () => {
    const { toast } = useToast();
    const defaultTheme = {
        '--primary': '210 40% 98%',
        '--accent': '262.1 83.3% 57.8%',
        '--background': '222.2 84% 4.9%',
        '--foreground': '210 40% 98%',
        '--card': '222.2 84% 4.9%',
    };
    const [colors, setColors] = useState(() => {
        const saved = localStorage.getItem('customTheme');
        return saved ? JSON.parse(saved) : defaultTheme;
    });

    const applyTheme = (themeColors) => {
        const root = document.documentElement;
        Object.entries(themeColors).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    };
    
    useEffect(() => {
        applyTheme(colors);
    }, [colors]);

    const handleColorChange = (key, value) => {
        setColors(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveTheme = () => {
        localStorage.setItem('customTheme', JSON.stringify(colors));
        toast({ title: "Tema Salvo!", description: "As novas cores foram aplicadas." });
    };

    const handleResetTheme = () => {
        localStorage.removeItem('customTheme');
        setColors(defaultTheme);
        toast({ title: "Tema Restaurado!", description: "O tema padrão foi aplicado." });
    };

    return (
        <Card className="glass-effect border-slate-700 text-white">
            <CardHeader>
                <CardTitle>Personalização da Aparência</CardTitle>
                <CardDescription>Escolha as cores principais da plataforma (formato HSL).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(colors).map(([key, value]) => (
                        <div key={key} className="flex flex-col space-y-2">
                            <Label className="capitalize">{key.replace('--', '').replace('-', ' ')}</Label>
                            <Input type="text" value={value} onChange={e => handleColorChange(key, e.target.value)} className="bg-slate-800 border-slate-600" />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                    <Button variant="outline" onClick={handleResetTheme}>Restaurar Padrão</Button>
                    <Button onClick={handleSaveTheme}>Salvar Tema</Button>
                </div>
            </CardContent>
        </Card>
    );
};


// --- COMPONENTE PRINCIPAL QUE UNE TUDO ---
const Settings = () => {
    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold text-white">Configurações</h1>
                <p className="text-slate-400">Ajustes e personalizações da plataforma.</p>
            </motion.div>
            <Tabs defaultValue="dados" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="dados">Gestão de Dados</TabsTrigger>
                    <TabsTrigger value="aparencia">Aparência</TabsTrigger>
                    <TabsTrigger value="medalhas">Gestão de Medalhas</TabsTrigger>
                </TabsList>
                <TabsContent value="dados" className="mt-6">
                    <DadosSettings />
                </TabsContent>
                <TabsContent value="aparencia" className="mt-6">
                    <AparenciaSettings />
                </TabsContent>
                <TabsContent value="medalhas" className="mt-6">
                    <MedalhasSettings />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Settings;
