"use client";
import React, { useState } from "react";
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
import Toast from "./Toast";
import { type FATDetalhada } from "@/api/services/fatService";

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
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error";
  }>({
    visible: false,
    message: "",
    type: "success",
  });

  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3500);
  };

  const sanitizeMessage = (message?: string | null): string | undefined => {
    if (!message) return undefined;
    const trimmed = message.trim();
    if (trimmed.startsWith("'") && trimmed.endsWith("'"))
      return trimmed.slice(1, -1).trim() || undefined;
    if (trimmed.startsWith('"') && trimmed.endsWith('"'))
      return trimmed.slice(1, -1).trim() || undefined;
    return trimmed || undefined;
  };

  const extractErroValue = (value: unknown): string | undefined => {
    const visited = new WeakSet<object>();
    const candidateKeys = [
      "erro",
      "mensagem",
      "message",
      "error",
      "detail",
      "detalhe",
      "descricao",
      "descricao_ocorrencia",
      "data",
    ];

    const handle = (input: unknown): string | undefined => {
      if (typeof input === "string") {
        const trimmed = input.trim();
        if (!trimmed) return undefined;

        const regexMatch = trimmed.match(
          /["']erro["']\s*:\s*["']([^"']*)["']/i
        );
        if (regexMatch?.[1]) {
          return sanitizeMessage(regexMatch[1]) || regexMatch[1].trim();
        }

        try {
          const parsed = JSON.parse(trimmed);
          const fromParsed = handle(parsed);
          if (fromParsed) return fromParsed;
        } catch {
          /* ignore json parse errors */
        }

        return sanitizeMessage(trimmed) || trimmed;
      }

      if (typeof input === "object" && input !== null) {
        if (visited.has(input)) return undefined;
        visited.add(input);

        if (Array.isArray(input)) {
          for (const item of input) {
            const result = handle(item);
            if (result) return result;
          }
          return undefined;
        }

        const record = input as Record<string, unknown>;

        for (const key of candidateKeys) {
          if (key in record) {
            const result = handle(record[key]);
            if (result) return result;
          }
        }

        for (const content of Object.values(record)) {
          const result = handle(content);
          if (result) return result;
        }
      }

      return undefined;
    };

    return handle(value);
  };

  const getErrorMessage = (error: unknown): string => {
    const extracted = extractErroValue(error);
    return extracted || "Erro ao processar a solicitação";
  };

  const handleSaveOcorrencia = async (descricao: string) => {
    if (!id_os || !modalOpen) {
      showToast("Erro: Dados incompletos para esta operação", "error");
      return;
    }

    setModalLoading(true);
    try {
      const ocorrenciaMap: Record<string, string> = {
        iniciar: "iniciar atendimento",
        pausar: "pausar atendimento",
        retomar: "retomar atendimento",
        interromper: "interromper atendimento",
        cancelar: "cancelar atendimento",
        concluir: "concluir os",
      };

      const mensagensMap: Record<string, string> = {
        iniciar: "Atendimento iniciado com sucesso!",
        pausar: "Atendimento pausado com sucesso!",
        retomar: "Atendimento retomado com sucesso!",
        interromper: "FAT concluída com sucesso!",
        cancelar: "Atendimento cancelado com sucesso!",
        concluir: "OS concluída com sucesso!",
      };

      const payload = {
        id_os,
        ocorrencia: ocorrenciaMap[modalOpen],
        descricao_ocorrencia: descricao,
      };

      let response;

      if (modalOpen === "concluir") {
        const interromperPayload = {
          id_os,
          ocorrencia: ocorrenciaMap["interromper"],
          descricao_ocorrencia: descricao,
        };

        await ocorrenciasOSService.registrarOcorrencia(interromperPayload);
        response = await ocorrenciasOSService.registrarOcorrencia(payload);
      } else {
        response = await ocorrenciasOSService.registrarOcorrencia(payload);
      }

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

      const successMessage =
        sanitizeMessage(response?.mensagem) ||
        mensagensMap[modalOpen] ||
        "Operação realizada com sucesso!";

      showToast(successMessage, "success");
      setModalOpen(null);
      onActionSuccess?.();
    } catch (error) {
      console.error(error);
      showToast(getErrorMessage(error), "error");
      setModalOpen(null);
    } finally {
      setModalLoading(false);
    }
  };

  const baseBtn =
    "group relative flex items-center gap-2 p-3 rounded-xl text-xs font-medium transition-all duration-200 active:scale-[0.98] shadow-sm flex-1 justify-center min-w-[120px] text-center whitespace-normal leading-tight";
  const purpleBtn =
    "bg-gray-50 border border-[#7B54BE] text-[#7B54BE] hover:bg-gray-100";
  const redBtn =
    "bg-gray-50 border border-red-600 text-red-600 hover:bg-red-50";
  const greenBtn =
    "bg-gray-50 border border-green-600 text-green-600 hover:bg-green-50";
  const gradientOverlay =
    "absolute inset-0 rounded-xl bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300";

  // 🔹 Lógica de exibição conforme fat.situacao.codigo
  const situacao = fat?.situacao?.codigo;

  const botoes = (() => {
    switch (situacao) {
      // 3 → Em deslocamento
      case 3:
        return (
          <>
            <button
              className={`${baseBtn} ${purpleBtn}`}
              onClick={() => setModalOpen("iniciar")}
            >
              {modalOpen === "iniciar" && modalLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span className="font-medium">Iniciar Atendimento</span>
              <div className={gradientOverlay}></div>
            </button>

            <button
              className={`${baseBtn} ${redBtn}`}
              onClick={() => setModalOpen("cancelar")}
            >
              {modalOpen === "cancelar" && modalLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
              <span className="font-medium">Cancelar FAT</span>
              <div className={gradientOverlay}></div>
            </button>
          </>
        );

      // 4 → Em atendimento
      case 4:
        return (
          <>
            <button
              className={`${baseBtn} ${purpleBtn}`}
              onClick={() => setModalOpen("pausar")}
            >
              {modalOpen === "pausar" && modalLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Pause className="w-3.5 h-3.5" />
              )}
              <span className="font-medium">Pausar Atendimento</span>
              <div className={gradientOverlay}></div>
            </button>

            <button
              className={`${baseBtn} ${redBtn}`}
              onClick={() => setModalOpen("cancelar")}
            >
              {modalOpen === "cancelar" && modalLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
              <span className="font-medium">Cancelar FAT</span>
              <div className={gradientOverlay}></div>
            </button>

            <button
              className={`${baseBtn} ${purpleBtn}`}
              onClick={() => setModalOpen("interromper")}
            >
              {modalOpen === "interromper" && modalLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              <span className="font-medium">Concluir FAT</span>
              <div className={gradientOverlay}></div>
            </button>

            <button
              className={`${baseBtn} ${greenBtn}`}
              onClick={() => setModalOpen("concluir")}
            >
              {modalOpen === "concluir" && modalLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
              <span className="font-medium">Concluir OS</span>
              <div className={gradientOverlay}></div>
            </button>
          </>
        );

      // 5 → Atendimento pausado
      case 5:
        return (
          <>
            <button
              className={`${baseBtn} ${purpleBtn}`}
              onClick={() => setModalOpen("retomar")}
            >
              {modalOpen === "retomar" && modalLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              <span className="font-medium">Retomar Atendimento</span>
              <div className={gradientOverlay}></div>
            </button>

            <button
              className={`${baseBtn} ${redBtn}`}
              onClick={() => setModalOpen("cancelar")}
            >
              {modalOpen === "cancelar" && modalLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
              <span className="font-medium">Cancelar FAT</span>
              <div className={gradientOverlay}></div>
            </button>

            <button
              className={`${baseBtn} ${purpleBtn}`}
              onClick={() => setModalOpen("interromper")}
            >
              {modalOpen === "interromper" && modalLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              <span className="font-medium">Concluir FAT</span>
              <div className={gradientOverlay}></div>
            </button>

            <button
              className={`${baseBtn} ${greenBtn}`}
              onClick={() => setModalOpen("concluir")}
            >
              {modalOpen === "concluir" && modalLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
              <span className="font-medium">Concluir OS</span>
              <div className={gradientOverlay}></div>
            </button>
          </>
        );

      case 7:
      case 8:
      case 9:
        return null;

      default:
        return null;
    }
  })();

  const modalConfig = modalOpen
    ? {
        title:
          {
            iniciar: "Iniciar Atendimento",
            pausar: "Pausar Atendimento",
            retomar: "Retomar Atendimento",
            interromper: "Concluir FAT",
            cancelar: "Cancelar FAT",
            concluir: "Concluir OS",
          }[modalOpen] || "",
        label: "Descrição da ocorrência (opcional)",
      }
    : null;

  return (
    <>
      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
        />
      )}

      <div className="bg-white px-3 pt-1 pb-1 flex flex-wrap gap-3 justify-center">
        {botoes}
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
