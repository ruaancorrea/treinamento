import os
import shutil
import logging
import datetime
import threading
import tkinter as tk
from tkinter import scrolledtext, messagebox, END

# ==============================================================================
# CONFIGURAÇÕES - AJUSTE AS VARIÁVEIS AQUI SE NECESSÁRIO
# ==============================================================================

# 1. Caminhos de origem dos documentos
CAMINHOS_ORIGEM = [
    r"\\192.168.10.17\e\backup\ROTINAS_AUTOMATICAS",
    r"O:\ROTINAS_AUTOMATICAS"
]

# 2. Pastas dentro da origem para verificar
PASTAS_DEPARTAMENTOS = [
    "FOLHA",
    "CONTABIL",
    "PESSOAL",
    "FISCAL",
    "PATRIMONIO"
]

# 3. Letras dos drives compartilhados para procurar as pastas dos clientes
LETRAS_DRIVE = ["I", "G", "F"]

# 4. Nome da pasta principal dentro dos drives
PASTA_DRIVES_COMPARTILHADOS = "Drives compartilhados"

# Pega o ano atual automaticamente para usar nos caminhos
ANO_ATUAL = str(datetime.datetime.now().year)

# 5. Mapeamento entre a pasta de origem e a pasta de destino final
MAPEAMENTO_DESTINO = {
    "FOLHA": os.path.join("3 CONTABIL", ANO_ATUAL, "3 ROTINAS AUTOMATICAS", "FOLHA"),
    "CONTABIL": os.path.join("3 CONTABIL", ANO_ATUAL, "3 ROTINAS AUTOMATICAS", "CONTABIL"),
    "PESSOAL": os.path.join("3 CONTABIL", ANO_ATUAL, "3 ROTINAS AUTOMATICAS", "PESSOAL"),
    "FISCAL": os.path.join("3 CONTABIL", ANO_ATUAL, "3 ROTINAS AUTOMATICAS", "FISCAL"),
    "PATRIMONIO": os.path.join("3 CONTABIL", ANO_ATUAL, "3 ROTINAS AUTOMATICAS", "PATRIMONIO")
}

# 6. Pasta para salvar os arquivos de log
PASTA_LOGS = os.path.join(os.getcwd(), "logs_automacao")

# ==============================================================================
# FIM DAS CONFIGURAÇÕES
# ==============================================================================

class TextHandler(logging.Handler):
    def __init__(self, text_widget):
        super().__init__()
        self.text_widget = text_widget

    def emit(self, record):
        msg = self.format(record)
        def append():
            self.text_widget.configure(state='normal')
            self.text_widget.insert(END, msg + '\n')
            self.text_widget.configure(state='disabled')
            self.text_widget.yview(END)
        self.text_widget.after(0, append)

class AutomationApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Automatizador de Documentos Fiscais/Contábeis")
        self.root.geometry("800x600")
        main_frame = tk.Frame(root, padx=10, pady=10)
        main_frame.pack(fill=tk.BOTH, expand=True)
        self.start_button = tk.Button(main_frame, text="Iniciar Processamento", command=self.start_processing_thread, font=("Helvetica", 12, "bold"), bg="#4CAF50", fg="white")
        self.start_button.pack(pady=10, fill=tk.X)
        log_label = tk.Label(main_frame, text="Log de Atividades:", font=("Helvetica", 10))
        log_label.pack(anchor='w')
        self.log_text = scrolledtext.ScrolledText(main_frame, state='disabled', wrap=tk.WORD, height=25, font=("Courier New", 9))
        self.log_text.pack(fill=tk.BOTH, expand=True)
        self.status_var = tk.StringVar()
        self.status_var.set("Pronto para iniciar.")
        status_bar = tk.Label(root, textvariable=self.status_var, bd=1, relief=tk.SUNKEN, anchor=tk.W)
        status_bar.pack(side=tk.BOTTOM, fill=tk.X)
        self.setup_logging()

    def setup_logging(self):
        if not os.path.exists(PASTA_LOGS):
            os.makedirs(PASTA_LOGS)
        log_filename = os.path.join(PASTA_LOGS, f"automacao_log_{datetime.datetime.now().strftime('%d-%m-%Y')}.txt")
        log_format = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s', datefmt='%d/%m/%Y %H:%M:%S')
        logger = logging.getLogger()
        logger.setLevel(logging.INFO)
        if not logger.handlers:
            file_handler = logging.FileHandler(log_filename, encoding='utf-8')
            file_handler.setFormatter(log_format)
            logger.addHandler(file_handler)
            text_handler = TextHandler(self.log_text)
            text_handler.setFormatter(log_format)
            logger.addHandler(text_handler)

    def start_processing_thread(self):
        self.start_button.config(state=tk.DISABLED, text="Processando...")
        self.status_var.set("Iniciando processo...")
        processing_thread = threading.Thread(target=self.run_automation)
        processing_thread.daemon = True
        processing_thread.start()

    def run_automation(self):
        try:
            logging.info("================ INICIANDO NOVA VERIFICAÇÃO ================")
            caminho_origem_ativo = self.encontrar_caminho_origem()
            if not caminho_origem_ativo:
                logging.error("Nenhum dos caminhos de origem foi encontrado. Verificação abortada.")
                self.status_var.set("Erro: Caminho de origem não encontrado.")
                return

            arquivos_processados = 0
            for departamento in PASTAS_DEPARTAMENTOS:
                pasta_departamento = os.path.join(caminho_origem_ativo, departamento)
                logging.info(f"--- Verificando pasta do departamento: '{pasta_departamento}' ---")
                if not os.path.isdir(pasta_departamento):
                    logging.warning(f"A pasta '{pasta_departamento}' não existe. Pulando.")
                    continue
                for nome_arquivo in os.listdir(pasta_departamento):
                    caminho_arquivo_completo = os.path.join(pasta_departamento, nome_arquivo)
                    if os.path.isfile(caminho_arquivo_completo):
                        logging.info(f"Processando arquivo: '{nome_arquivo}'")
                        self.processar_arquivo(caminho_arquivo_completo, departamento)
                        arquivos_processados += 1
            if arquivos_processados == 0:
                logging.info("Nenhum arquivo novo encontrado para processar.")
                self.status_var.set("Concluído. Nenhum arquivo novo encontrado.")
            else:
                 self.status_var.set(f"Processo concluído. {arquivos_processados} arquivo(s) verificado(s).")
            logging.info("================ VERIFICAÇÃO CONCLUÍDA ================\n")
        except Exception as e:
            logging.critical(f"Ocorreu um erro fatal durante a execução: {e}", exc_info=True)
            self.status_var.set("Erro fatal! Verifique o log.")
        finally:
            self.start_button.config(state=tk.NORMAL, text="Iniciar Processamento")

    def encontrar_caminho_origem(self):
        logging.info("Procurando caminho de origem ativo...")
        for caminho in CAMINHOS_ORIGEM:
            logging.info(f"Tentando acessar: '{caminho}'")
            if os.path.isdir(caminho):
                logging.info(f"Sucesso! Usando origem: '{caminho}'")
                return caminho
        return None

    def extrair_codigo_empresa(self, nome_arquivo):
        try:
            delimitador = '-' if '-' in nome_arquivo else '_'
            codigo = nome_arquivo.split(delimitador)[0].strip()
            if codigo.isdigit():
                logging.info(f"Código da empresa extraído: '{codigo}'")
                return codigo
            else:
                logging.warning(f"Não foi possível extrair um código numérico do arquivo '{nome_arquivo}'.")
                return None
        except Exception as e:
            logging.error(f"Erro ao extrair código do arquivo '{nome_arquivo}': {e}")
            return None

    def encontrar_pasta_cliente(self, codigo_empresa):
        logging.info(f"Procurando pasta do cliente para o código '{codigo_empresa}'...")
        for letra in LETRAS_DRIVE:
            drive = f"{letra}:\\"
            if not os.path.isdir(drive):
                continue
            caminho_base_drive = os.path.join(drive, PASTA_DRIVES_COMPARTILHADOS)
            if not os.path.isdir(caminho_base_drive):
                logging.warning(f"O caminho '{caminho_base_drive}' não foi encontrado no drive {letra}.")
                continue
            logging.info(f"Buscando em '{caminho_base_drive}'...")
            for pasta_container in os.listdir(caminho_base_drive):
                caminho_container = os.path.join(caminho_base_drive, pasta_container)
                if os.path.isdir(caminho_container):
                    for pasta_cliente in os.listdir(caminho_container):
                        if f" - {codigo_empresa}" in pasta_cliente or pasta_cliente.endswith(f" {codigo_empresa}"):
                            caminho_cliente = os.path.join(caminho_container, pasta_cliente)
                            logging.info(f"PASTA DO CLIENTE ENCONTRADA: '{caminho_cliente}'")
                            return caminho_cliente
        logging.error(f"NÃO FOI POSSÍVEL ENCONTRAR a pasta para o código de empresa '{codigo_empresa}' em nenhum drive.")
        return None

    # ---> INÍCIO DA ALTERAÇÃO <---
    def processar_arquivo(self, caminho_arquivo_origem, departamento):
        """Processa um único arquivo: extrai código, acha pasta e move SE a pasta de destino existir."""
        nome_arquivo = os.path.basename(caminho_arquivo_origem)
        
        codigo_empresa = self.extrair_codigo_empresa(nome_arquivo)
        if not codigo_empresa:
            logging.error(f"PULANDO arquivo '{nome_arquivo}' por não ter um código válido.")
            return

        pasta_cliente_destino = self.encontrar_pasta_cliente(codigo_empresa)
        if not pasta_cliente_destino:
            logging.error(f"PULANDO arquivo '{nome_arquivo}' pois a pasta do cliente não foi encontrada.")
            return
            
        subpasta_final = MAPEAMENTO_DESTINO.get(departamento)
        if not subpasta_final:
            logging.error(f"Departamento '{departamento}' não encontrado no mapeamento de destino. Verifique as configurações.")
            return
            
        caminho_final = os.path.join(pasta_cliente_destino, subpasta_final)
        
        # VERIFICAÇÃO CRÍTICA: Checa se a pasta de destino JÁ EXISTE antes de mover.
        if not os.path.isdir(caminho_final):
            logging.error(f"ERRO: A pasta de destino '{caminho_final}' NÃO EXISTE. O arquivo '{nome_arquivo}' não será movido.")
            return # Pula para o próximo arquivo, não faz mais nada com este.

        # Se o código chegou até aqui, a pasta de destino existe.
        try:
            arquivo_destino_final = os.path.join(caminho_final, nome_arquivo)
            
            logging.info(f"Movendo '{nome_arquivo}' para '{caminho_final}'")
            shutil.move(caminho_arquivo_origem, arquivo_destino_final)
            logging.info(f"SUCESSO! Arquivo movido para '{arquivo_destino_final}'")
        
        except PermissionError:
            logging.error(f"ERRO DE PERMISSÃO ao mover '{nome_arquivo}'. O arquivo pode estar aberto ou a pasta de destino está protegida.")
        except FileNotFoundError:
             logging.error(f"ERRO: O arquivo de origem '{caminho_arquivo_origem}' não foi encontrado no momento da movimentação.")
        except Exception as e:
            logging.error(f"ERRO INESPERADO ao mover '{nome_arquivo}': {e}", exc_info=True)
    # ---> FIM DA ALTERAÇÃO <---


if __name__ == "__main__":
    root = tk.Tk()
    app = AutomationApp(root)
    root.mainloop()
