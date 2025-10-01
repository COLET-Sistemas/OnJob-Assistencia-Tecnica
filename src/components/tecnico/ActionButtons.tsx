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
      await ocorrenciasOSService.registrarOcorrencia({
        id_os,
        ocorrencia:
          modalOpen === "deslocamento"
            ? "iniciar deslocamento"
            : "iniciar atendimento",
        descricao_ocorrencia: descricao,
      });
      setModalOpen(null);
      setMessage("Ação realizada com sucesso!");
      setMessageType("success");
      if (onActionSuccess) onActionSuccess();
    } catch (error: unknown) {
      let errorMsg = "Erro ao realizar ação.";

      interface ErrorResponse {
        response?: {
          data?: {
            erro?: string;
          };
        };
        message?: string;
      }

      const err = error as ErrorResponse;
      if (
        err.response &&
        err.response.data &&
        typeof err.response.data.erro === "string"
      ) {
        errorMsg = err.response.data.erro;
      } else if (typeof err.message === "string") {
        errorMsg = err.message;
      }
      setMessage(errorMsg);
      setMessageType("error");
      setModalOpen(null);
    } finally {
      setModalLoading(false);
    }
  };

  const baseBtn =
    "group relative flex items-center gap-3 p-4 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98] bg-gray-50 border border-[#7c54bd] text-[#7c54bd] shadow-sm flex-1 justify-center";
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
            Iniciar Deslocam.
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
