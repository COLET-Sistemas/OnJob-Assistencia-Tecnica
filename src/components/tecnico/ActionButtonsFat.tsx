"use client";
import React, { useState } from "react";
import { type FATDetalhada } from "@/api/services/fatService";
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  X,
  CheckCircle,
  Loader2,
} from "lucide-react";
import OcorrenciaModal from "./OcorrenciaModal";
import { ocorrenciasOSService } from "@/api/services/ocorrenciaOSService";

interface ActionButtonsFatProps {
  fat: FATDetalhada;
  id_os?: number;
  onActionSuccess?: () => void;
  onIniciarAtendimento?: () => void;
  onPausarAtendimento?: () => void;
  onRetomarAtendimento?: () => void;
  onInterromperAtendimento?: () => void;
  onCancelarAtendimento?: () => void;
  onConcluirAtendimento?: () => void;
}

const ActionButtonsFat: React.FC<ActionButtonsFatProps> = ({
  fat,
  id_os,
  onActionSuccess,
  onIniciarAtendimento,
  onPausarAtendimento,
  onRetomarAtendimento,
  onInterromperAtendimento,
  onCancelarAtendimento,
  onConcluirAtendimento,
}) => {
  const [modalOpen, setModalOpen] = useState<
    | null
    | "iniciar"
    | "pausar"
    | "retomar"
    | "interromper"
    | "cancelar"
    | "concluir"
  >(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Verifica se tem campos de atendimento preenchidos
  const temCamposAtendimento = Boolean(
    fat.solucao_encontrada ||
      fat.testes_realizados ||
      fat.observacoes ||
      (fat.numero_ciclos != null && fat.numero_ciclos > 0)
  );

  const situacaoCodigo = fat.situacao?.codigo;

  // Verifica se pode cancelar
  const podeCancelarAtendimento =
    situacaoCodigo === 2 ||
    situacaoCodigo === 3 ||
    ((situacaoCodigo === 4 || situacaoCodigo === 5) && temCamposAtendimento);

  // Verifica se o botão cancelar deve estar desabilitado
  const cancelarDisabled =
    (situacaoCodigo === 4 || situacaoCodigo === 5) && !temCamposAtendimento;

  // Handlers para abrir modais
  const handleIniciar = () => setModalOpen("iniciar");
  const handlePausar = () => setModalOpen("pausar");
  const handleRetomar = () => setModalOpen("retomar");
  const handleInterromper = () => setModalOpen("interromper");
  const handleCancelar = () => {
    if (!cancelarDisabled) {
      setModalOpen("cancelar");
    }
  };
  const handleConcluir = () => setModalOpen("concluir");

  // Salva ocorrência e chama callback original se existir
  const handleSaveOcorrencia = async (descricao: string) => {
    console.log("handleSaveOcorrencia called with:", {
      descricao,
      id_os,
      modalOpen,
    });

    if (!id_os || !modalOpen) {
      console.log("Missing id_os or modalOpen:", { id_os, modalOpen });
      return;
    }

    // Validação para campos obrigatórios (pausar e cancelar)
    const isRequired = modalOpen === "pausar" || modalOpen === "cancelar";
    if (isRequired && (!descricao || descricao.trim() === "")) {
      alert("A descrição é obrigatória para esta ação.");
      return;
    }

    setModalLoading(true);

    try {
      // Mapear tipo de modal para tipo de ocorrência
      const ocorrenciaMap: Record<string, string> = {
        iniciar: "iniciar atendimento",
        pausar: "pausar atendimento",
        retomar: "retomar atendimento",
        interromper: "interromper atendimento",
        cancelar: "cancelar atendimento",
        concluir: "concluir os",
      };

      const payload = {
        id_os: id_os,
        ocorrencia: ocorrenciaMap[modalOpen],
        descricao_ocorrencia: descricao,
      };

      console.log("Sending API request with payload:", payload);

      await ocorrenciasOSService.registrarOcorrencia(payload);

      console.log("API request successful");

      // Chamar callback original se existir
      switch (modalOpen) {
        case "iniciar":
          onIniciarAtendimento?.();
          break;
        case "pausar":
          onPausarAtendimento?.();
          break;
        case "retomar":
          onRetomarAtendimento?.();
          break;
        case "interromper":
          onInterromperAtendimento?.();
          break;
        case "cancelar":
          onCancelarAtendimento?.();
          break;
        case "concluir":
          onConcluirAtendimento?.();
          break;
      }

      setModalOpen(null);
      if (onActionSuccess) onActionSuccess();
    } catch (error) {
      console.error("API request failed:", error);
      setModalOpen(null);
    } finally {
      setModalLoading(false);
    }
  };

  // Configuração dos modais
  const getModalConfig = () => {
    const configs: Record<string, { title: string; label: string }> = {
      iniciar: {
        title: "Iniciar Atendimento",
        label: "Descrição da ocorrência (opcional)",
      },
      pausar: {
        title: "Pausar Atendimento",
        label: "Descrição da ocorrência (obrigatório)",
      },
      retomar: {
        title: "Retomar Atendimento",
        label: "Descrição da ocorrência (opcional)",
      },
      interromper: {
        title: "Concluir FAT",
        label: "Descrição da ocorrência (opcional)",
      },
      cancelar: {
        title: "Cancelar OS",
        label: "Descrição da ocorrência (obrigatório)",
      },
      concluir: {
        title: "Concluir OS",
        label: "Descrição da ocorrência (opcional)",
      },
    };
    return modalOpen ? configs[modalOpen] : null;
  };

  // Classes base padronizadas
  const baseBtn =
    "group relative flex items-center gap-2 p-3 rounded-xl text-xs font-medium transition-all duration-200 active:scale-[0.98] shadow-sm flex-1 justify-center min-w-[120px]";
  const purpleBtn =
    "bg-gray-50 border border-[#7c54bd] text-[#7c54bd] hover:bg-gray-100";
  const redBtn =
    "bg-gray-50 border border-red-600 text-red-600 hover:bg-red-50";
  const greenBtn =
    "bg-gray-50 border border-green-600 text-green-600 hover:bg-green-50";
  const disabledBtn = "opacity-50 cursor-not-allowed";
  const gradientOverlay =
    "absolute inset-0 rounded-xl bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300";

  const modalConfig = getModalConfig();

  return (
    <>
      <div className="bg-white border-t border-slate-200 p-4 flex flex-wrap gap-3 justify-center">
        {/* INICIAR ATENDIMENTO: Exibir se situacao.codigo = 3 */}
        {situacaoCodigo === 3 && (
          <button
            className={`${baseBtn} ${purpleBtn}`}
            type="button"
            onClick={handleIniciar}
            disabled={modalOpen !== null}
          >
            <span className="relative flex items-center">
              {modalOpen === "iniciar" && modalLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3" />
              )}
            </span>
            <span className="flex-1 text-left font-medium">
              Iniciar Atendimento
            </span>
            <div className={gradientOverlay}></div>
          </button>
        )}

        {/* PAUSAR ATENDIMENTO: Exibir se situacao.codigo = 4 */}
        {situacaoCodigo === 4 && (
          <button
            className={`${baseBtn} ${purpleBtn}`}
            type="button"
            onClick={handlePausar}
            disabled={modalOpen !== null}
          >
            <span className="relative flex items-center">
              {modalOpen === "pausar" && modalLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Pause className="w-3.5 h-3.5 transition-all duration-300 group-hover:scale-110" />
              )}
            </span>
            <span className="flex-1 text-left font-medium">
              Pausar Atendimento
            </span>
            <div className={gradientOverlay}></div>
          </button>
        )}

        {/* RETOMAR ATENDIMENTO: Exibir se situacao.codigo = 5 */}
        {situacaoCodigo === 5 && (
          <button
            className={`${baseBtn} ${purpleBtn}`}
            type="button"
            onClick={handleRetomar}
            disabled={modalOpen !== null}
          >
            <span className="relative flex items-center">
              {modalOpen === "retomar" && modalLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
              )}
            </span>
            <span className="flex-1 text-left font-medium">
              Retomar Atendimento
            </span>
            <div className={gradientOverlay}></div>
          </button>
        )}

        {/* INTERROMPER ATENDIMENTO: Exibir se situacao.codigo = 4 ou 5 E pelo menos um campo preenchido */}
        {(situacaoCodigo === 4 || situacaoCodigo === 5) &&
          temCamposAtendimento && (
            <button
              className={`${baseBtn} ${purpleBtn}`}
              type="button"
              onClick={handleInterromper}
              disabled={modalOpen !== null}
            >
              <span className="relative flex items-center">
                {modalOpen === "interromper" && modalLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Square className="w-3.5 h-3.5 transition-all duration-300 group-hover:scale-110" />
                )}
              </span>
              <span className="flex-1 text-left font-medium">Concluir FAT</span>
              <div className={gradientOverlay}></div>
            </button>
          )}

        {/* CANCELAR ATENDIMENTO: Sempre exibir, mas regras para habilitar/desabilitar */}
        {podeCancelarAtendimento && (
          <button
            className={`${baseBtn} ${redBtn} ${
              cancelarDisabled || modalOpen !== null ? disabledBtn : ""
            }`}
            type="button"
            onClick={handleCancelar}
            disabled={cancelarDisabled || modalOpen !== null}
          >
            <span className="relative flex items-center">
              {modalOpen === "cancelar" && modalLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <X className="w-3.5 h-3.5 transition-all duration-300 group-hover:scale-110" />
              )}
            </span>
            <span className="flex-1 text-left font-medium">Cancelar OS</span>
            {!cancelarDisabled && modalOpen === null && (
              <div className={gradientOverlay}></div>
            )}
          </button>
        )}

        {/* CONCLUIR ATENDIMENTO: Exibir se situacao.codigo = 4 ou 5 E pelo menos um campo preenchido */}
        {(situacaoCodigo === 4 || situacaoCodigo === 5) &&
          temCamposAtendimento && (
            <button
              className={`${baseBtn} ${greenBtn}`}
              type="button"
              onClick={handleConcluir}
              disabled={modalOpen !== null}
            >
              <span className="relative flex items-center">
                {modalOpen === "concluir" && modalLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5 transition-all duration-300 group-hover:scale-110" />
                )}
              </span>
              <span className="flex-1 text-left font-medium">Concluir OS</span>
              <div className={gradientOverlay}></div>
            </button>
          )}
      </div>

      <OcorrenciaModal
        open={modalOpen !== null}
        onClose={() => setModalOpen(null)}
        onSave={handleSaveOcorrencia}
        loading={modalLoading}
        title={modalConfig?.title || ""}
        label={modalConfig?.label || ""}
        id_os={id_os}
      />
    </>
  );
};

export default ActionButtonsFat;
