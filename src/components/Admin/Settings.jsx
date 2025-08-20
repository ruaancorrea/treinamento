import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FileUp, Download, FileDown, AlertTriangle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
// --- MUDANÇA PRINCIPAL ---
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { addData } from '@/lib/firebaseService'; // Usaremos para importar CSV

// Nomes de todas as coleções que fazem parte do backup
const COLLECTIONS_TO_BACKUP = ['usuarios', 'treinamentos', 'categorias', 'departamentos', 'historico', 'trilhas', 'knowledgeBase'];

const colorClasses = {
    blue: { gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-600', hoverBg: 'hover:bg-blue-700' },
    green: { gradient: 'from-green-500 to-green-600', bg: 'bg-green-600', hoverBg: 'hover:bg-green-700' },
    purple: { gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-600', hoverBg: 'hover:bg-purple-700' },
    red: { gradient: 'from-red-500 to-orange-600', bg: 'bg-red-600', hoverBg: 'hover:bg-red-700' }
};

const Settings = () => {
    const { toast } = useToast();
    const jsonInputRef = useRef(null);
    const csvInputRef = useRef(null);
    const [isLoading, setIsLoading] = useState(null); // Controla o loading de cada card

    // --- FUNÇÃO REFATORADA ---
    const handleBackup = async () => {
        setIsLoading('backup');
        try {
            const backupData = {};
            for (const collectionName of COLLECTIONS_TO_BACKUP) {
                const querySnapshot = await getDocs(collection(db, collectionName));
                const data = [];
                querySnapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
                backupData[collectionName] = data;
            }

            const dataStr = JSON.stringify(backupData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const exportFileDefaultName = 'backup_completo.json';
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

    // --- FUNÇÃO REFATORADA ---
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

                // Usar batch para operações em massa
                const batch = writeBatch(db);

                for (const collectionName of COLLECTIONS_TO_BACKUP) {
                    // Limpa a coleção antiga
                    const oldDocsSnapshot = await getDocs(collection(db, collectionName));
                    oldDocsSnapshot.forEach(doc => batch.delete(doc.ref));

                    // Adiciona os novos documentos
                    if (dataToImport[collectionName]) {
                        dataToImport[collectionName].forEach(item => {
                            const docRef = doc(db, collectionName, item.id); // Mantém os IDs originais
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

    // --- FUNÇÃO REFATORADA ---
    const handleCsvFileChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsLoading('importCsv');
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const newUsers = results.data;
                    for (const user of newUsers) {
                        const userToAdd = {
                            ...user,
                            ativo: user.ativo ? user.ativo.toLowerCase() === 'true' : true,
                            dataCriacao: new Date().toISOString()
                        };
                        await addData('usuarios', userToAdd); // Usa o novo serviço
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

    // --- FUNÇÃO REFATORADA ---
    const handleResetData = async () => {
        if (window.confirm("ATENÇÃO: Esta ação irá apagar TODOS os dados do Firestore (usuários, treinamentos, etc.). Esta ação é irreversível. Deseja continuar?")) {
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
    
    // Funções de clique para acionar os inputs de arquivo
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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold text-white">Configurações</h1>
                <p className="text-slate-400">Gerencie as configurações gerais da plataforma.</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {settingsCards.map((card, index) => {
                    const Icon = card.icon;
                    const colors = colorClasses[card.color] || colorClasses.blue;
                    const cardIsLoading = isLoading === card.id;
                    return (
                        <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * (index + 1) }}>
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

export default Settings;
