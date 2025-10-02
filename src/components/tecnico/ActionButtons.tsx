import Toast from "@/components/tecnico/Toast";
import React, { useState } from "react";
import { Car, Play, Loader2 } from "lucide-react";
import OcorrenciaModal from "./OcorrenciaModal";
import { ocorrenciasOSService } from "@/api/services/ocorrenciaOSService";

interface ActionButtonsProps {
  id_os?: number;
  onActionSuccess?: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  id_os,
  onActionSuccess,
}) => {
  // const [loading, setLoading] = useState<"deslocamento" | "atendimento" | null>(null);
  const [modalOpen, setModalOpen] = useState<
    null | "deslocamento" | "atendimento"
  >(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );

  // Removido: validação para habilitar/desabilitar botões

  // Abre modal ao clicar
  const handleDeslocamento = () => setModalOpen("deslocamento");
  const handleAtendimento = () => setModalOpen("atendimento");

  // Salva ocorrência
  const handleSaveOcorrencia = async (descricao: string) => {
    if (!id_os || !modalOpen) return;
    setModalLoading(true);
    setMessage(null);
    setMessageType(null);
    try {
      const response = await ocorrenciasOSService.registrarOcorrencia({
        id_os,
        ocorrencia:
          modalOpen === "deslocamento"
            ? "iniciar deslocamento"
            : "iniciar atendimento",
        descricao_ocorrencia: descricao,
      });

      setModalOpen(null);
      // Usar a mensagem de retorno da API
      setMessage(response.mensagem || "Ação realizada com sucesso!");
      setMessageType("success");

      console.log("🎯 Ocorrência registrada com sucesso, iniciando reload...");

      // Aguardar um pequeno delay para garantir que o servidor processou a ocorrência
      // antes de recarregar os dados da OS
      setTimeout(() => {
        if (onActionSuccess) {
          console.log(
            "🔄 Chamando callback onActionSuccess para atualizar a OS"
          );
          try {
            onActionSuccess();
            console.log("✅ Callback onActionSuccess executado com sucesso");
          } catch (error) {
            console.error(
              "❌ Erro ao executar callback onActionSuccess:",
              error
            );
          }
        } else {
          console.warn("⚠️ onActionSuccess não foi fornecido");
        }
      }, 1000);
    } catch (error: unknown) {
      console.error("Erro ao registrar ocorrência:", error);

      // A função apiRequest já processa os erros e retorna a mensagem da API
      // Vamos extrair a mensagem do Error que foi criado
      let errorMessage = "Erro ao registrar ocorrência";

      if (error instanceof Error) {
        // A função apiRequest já extraiu a mensagem da API e colocou no Error.message
        const rawMessage = error.message;
    

        // Verificar se a mensagem contém o padrão {"erro":"..."}
        const erroMatch = rawMessage.match(/\{"erro":"([^"]+)"\}/);
        if (erroMatch && erroMatch[1]) {
          errorMessage = erroMatch[1];
      
        } else {
          // Se não encontrar o padrão, usar a mensagem completa
          errorMessage = rawMessage;
 
        }
      } else if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
      ) {
        const rawMessage = error.message;
       

        // Verificar se a mensagem contém o padrão {"erro":"..."}
        const erroMatch = rawMessage.match(/\{"erro":"([^"]+)"\}/);
        if (erroMatch && erroMatch[1]) {
          errorMessage = erroMatch[1];
         
        } else {
          errorMessage = rawMessage;

        }
      } else {
   
      }

      setMessage(errorMessage);
      setMessageType("error");
    } finally {
      setModalLoading(false);
    }
  };

  const baseBtn =
    "group relative flex items-center gap-3 p-4 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98] bg-gray-50 border border-[#7B54BE] text-[#7B54BE] shadow-sm flex-1 justify-center";
  const disabledBtn = "opacity-50 cursor-not-allowed";
  const hoverBtn = "hover:bg-gray-100";

  return (
    <>
      {message && (
        <Toast
          message={message}
          type={messageType || "success"}
          onClose={() => setMessage(null)}
        />
      )}
      <div className="flex gap-3">
        <button
          disabled={modalOpen !== null}
          className={
            baseBtn + " " + (modalOpen !== null ? disabledBtn : hoverBtn)
          }
          onClick={handleDeslocamento}
        >
          <span className="relative flex items-center">
            {modalOpen === "deslocamento" && modalLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Car className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3" />
            )}
          </span>
          <span className="flex-1 text-left font-medium">
            Iniciar Deslocamento
          </span>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
        <button
          disabled={modalOpen !== null}
          className={
            baseBtn + " " + (modalOpen !== null ? disabledBtn : hoverBtn)
          }
          onClick={handleAtendimento}
        >
          <span className="relative flex items-center">
            {modalOpen === "atendimento" && modalLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3" />
            )}
          </span>
          <span className="flex-1 text-left font-medium">
            Iniciar Atendimento
          </span>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
      </div>
      <OcorrenciaModal
        open={modalOpen !== null}
        onClose={() => setModalOpen(null)}
        onSave={handleSaveOcorrencia}
        loading={modalLoading}
        title={
          modalOpen === "deslocamento"
            ? "Iniciar Deslocamento"
            : "Iniciar Atendimento"
        }
        label="Descrição da ocorrência (opcional)"
      />
    </>
  );
};

export default ActionButtons;
