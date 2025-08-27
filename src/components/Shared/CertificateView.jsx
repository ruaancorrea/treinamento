import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft } from "lucide-react";
import "./certificate.css"; // CSS atualizado para A4 paisagem

const CertificateView = ({ certificateData, onBack }) => {
  const componentRef = useRef(null);
  const { user, learningPath, completionDate } = certificateData;

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Certificado-${user.nome}-${learningPath.titulo}`,
  });

  return (
    <div className="space-y-6 bg-slate-800 p-6 rounded-lg">
      {/* Botões de navegação - escondidos na impressão */}
      <div className="flex justify-between items-center no-print">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-slate-600 hover:bg-slate-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para as Trilhas
        </Button>
        <Button
          onClick={handlePrint}
          className="bg-gradient-to-r from-blue-500 to-purple-600"
        >
          <Download className="w-4 h-4 mr-2" />
          Baixar / Imprimir
        </Button>
      </div>

      {/* Certificado em A4 paisagem */}
      <div
        ref={componentRef}
        className="certificate-a4 bg-white text-gray-800 rounded-lg shadow-2xl mx-auto flex items-center justify-center"
      >
        <div className="w-full h-full border-2 border-blue-800 p-8 flex flex-col justify-between text-center bg-slate-50">
          {/* Cabeçalho */}
          <div className="w-full flex justify-between items-start">
            <div className="text-left">
              <h2 className="text-xl font-bold text-blue-900">
                NTW Contabilidade e Gestão Empresarial
              </h2>
              <p className="text-xs text-gray-500">PLATAFORMA DE TREINAMENTO</p>
            </div>
            <img
              src="https://i.ibb.co/kgfKn9NC/logo-1.png"
              alt="Logo NTW"
              className="w-28"
            />
          </div>

          {/* Corpo do certificado */}
          <div className="flex flex-col items-center mt-8">
            <p className="text-lg text-gray-600">Certificamos que</p>
            <p className="text-4xl font-bold text-blue-900 mt-2">{user.nome}</p>
            <div className="w-3/4 h-px bg-gray-300 mt-4"></div>
            <p className="text-base text-gray-600 mt-4 max-w-2xl">
              concluiu com sucesso a Trilha de Aprendizagem
            </p>
            <p className="text-2xl font-semibold text-gray-800 mt-2">
              "{learningPath.titulo}"
            </p>
          </div>

          {/* Rodapé */}
          <div className="w-full flex justify-between items-end mt-12 text-sm">
            <div className="w-1/3 text-center">
              <p className="border-t-2 border-gray-400 pt-2 font-semibold">
                Diretoria
              </p>
              <p className="text-xs">NTW Contabilidade</p>
            </div>
            <div className="w-1/3 text-center">
              <p className="font-semibold">
                {completionDate.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="text-xs">Data de Conclusão</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateView;
