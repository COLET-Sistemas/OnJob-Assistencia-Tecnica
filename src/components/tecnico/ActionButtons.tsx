import React, { useState } from "react";
import { Car, Play, Loader2 } from "lucide-react";
import OcorrenciaModal from "./OcorrenciaModal";
import { ocorrenciasOSService } from "@/api/services/ocorrenciaOSService";

interface Fat {
  id_fat: number;
  status_fat?: string;
}

interface ActionButtonsProps {
  fats: Fat[] | undefined;
  id_os?: number;
  onActionSuccess?: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  fats,
  id_os,
  onActionSuccess,
}) => {
  // const [loading, setLoading] = useState<"deslocamento" | "atendimento" | null>(null);
  const [modalOpen, setModalOpen] = useState<
    null | "deslocamento" | "atendimento"
  >(null);
  const [modalLoading, setModalLoading] = useState(false);

  let enableActions = false;
  if (!fats || fats.length === 0) {
    enableActions = true;
  } else {
    // Pega a FAT com maior id_fat
    const lastFat = fats.reduce((prev, curr) =>
      prev.id_fat > curr.id_fat ? prev : curr
    );
    enableActions = lastFat.status_fat === "7";
  }

  // Abre modal ao clicar
  const handleDeslocamento = () => setModalOpen("deslocamento");
  const handleAtendimento = () => setModalOpen("atendimento");

  // Salva ocorrência
  const handleSaveOcorrencia = async (descricao: string) => {
    if (!id_os || !modalOpen) return;
    setModalLoading(true);
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
      if (onActionSuccess) onActionSuccess();
    } catch {
      // TODO: feedback de erro
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
      <div className="flex gap-3">
        <button
          disabled={!enableActions || modalOpen !== null}
          className={
            baseBtn +
            " " +
            (!enableActions || modalOpen !== null ? disabledBtn : hoverBtn)
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
          <span className="flex-1 text-left font-medium">Novo Deslocam.</span>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
        <button
          disabled={!enableActions || modalOpen !== null}
          className={
            baseBtn +
            " " +
            (!enableActions || modalOpen !== null ? disabledBtn : hoverBtn)
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
          <span className="flex-1 text-left font-medium">Novo Atendimento</span>
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
