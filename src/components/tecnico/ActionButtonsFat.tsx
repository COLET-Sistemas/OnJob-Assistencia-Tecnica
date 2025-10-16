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
    if (!message) {
      return undefined;
    }

    const trimmed = message.trim();

    if (trimmed.length >= 2) {
      const startsWithSingle = trimmed.startsWith("'");
      const endsWithSingle = trimmed.endsWith("'");
      const startsWithDouble = trimmed.startsWith('"');
      const endsWithDouble = trimmed.endsWith('"');

      if (startsWithSingle && endsWithSingle) {
        return trimmed.slice(1, -1).trim() || undefined;
      }

      if (startsWithDouble && endsWithDouble) {
        return trimmed.slice(1, -1).trim() || undefined;
      }
    }

    return trimmed || undefined;
  };

  const extractErroValue = (value: unknown): string | undefined => {
    if (value === null || value === undefined) {
      return undefined;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) {
        return undefined;
      }

      try {
        const parsed = JSON.parse(trimmed);
        const parsedErro = extractErroValue(parsed);
        if (parsedErro) {
          return parsedErro;
        }
      } catch {
        // ignore parse errors
      }

      const regexMatch = trimmed.match(/"erro"\s*:\s*"([^"]*)"/i);
      if (regexMatch && regexMatch[1]) {
        return sanitizeMessage(regexMatch[1]) || regexMatch[1].trim();
      }

      return sanitizeMessage(trimmed) || trimmed;
    }

    if (typeof value === "object") {
      const record = value as Record<string, unknown>;

      const directErro = record.erro;
      if (typeof directErro === "string" && directErro.trim() !== "") {
        return sanitizeMessage(directErro) || directErro.trim();
      }

      const nestedCandidates: unknown[] = [
        record.mensagem,
        record.message,
        record.error,
        record.detail,
        record.detalhe,
        record.data,
      ];

      for (const candidate of nestedCandidates) {
        const extracted = extractErroValue(candidate);
        if (extracted) {
          return extracted;
        }
      }
    }

    return undefined;
  };

  const resolveStringCandidate = (value: string): string | undefined => {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    // Avoid returning raw JSON strings when we fail to parse
    const looksLikeJson =
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"));

    if (looksLikeJson) {
      return undefined;
    }

    return sanitizeMessage(trimmed) || trimmed;
  };

  const getErrorMessage = (error: unknown): string => {
    if (!error) {
      return "Erro ao processar a solicitacao";
    }

    const candidates: unknown[] = [];

    const pushCandidate = (value: unknown) => {
      if (value !== undefined && value !== null) {
        candidates.push(value);
      }
    };

    pushCandidate(error);

    if (typeof error === "string") {
      const extracted = extractErroValue(error);
      if (extracted) {
        return extracted;
      }
      const fallback = resolveStringCandidate(error);
      if (fallback) {
        return fallback;
      }
    }

    if (error instanceof Error) {
      const anyError = error as Error & {
        data?: unknown;
        erro?: unknown;
        mensagem?: unknown;
        message?: unknown;
        error?: unknown;
        detail?: unknown;
        detalhe?: unknown;
      };

      pushCandidate(anyError.data);
      pushCandidate(anyError.erro);
      pushCandidate(anyError.mensagem);
      pushCandidate(anyError.error);
      pushCandidate(anyError.detail);
      pushCandidate(anyError.detalhe);
      pushCandidate(anyError.message);
      pushCandidate(error.message);
    } else if (typeof error === "object" && error !== null) {
      const record = error as Record<string, unknown>;
      pushCandidate(record.erro);
      pushCandidate(record.mensagem);
      pushCandidate(record.message);
      pushCandidate(record.error);
      pushCandidate(record.detail);
      pushCandidate(record.detalhe);
      pushCandidate(record.data);
    }

    for (const candidate of candidates) {
      const extracted = extractErroValue(candidate);
      if (extracted) {
        return extracted;
      }
    }

    for (const candidate of candidates) {
      if (typeof candidate === "string") {
        const fallback = resolveStringCandidate(candidate);
        if (fallback) {
          return fallback;
        }
      }
    }

    return "Erro ao processar a solicitacao";
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

      const response =
        await ocorrenciasOSService.registrarOcorrencia(payload);

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
        "Operacao realizada com sucesso!";

      showToast(successMessage, "success");
      setModalOpen(null);
      onActionSuccess?.();
    } catch (error) {
      console.error(error);
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage, "error");
      setModalOpen(null);
    } finally {
      setModalLoading(false);
    }
  };

  const getModalConfig = () => {
    const configs: Record<string, { title: string; label: string }> = {
      iniciar: {
        title: "Iniciar Atendimento",
        label: "Descrição da ocorrência (opcional)",
      },
      pausar: {
        title: "Pausar Atendimento",
        label: "Descrição da ocorrência (opcional)",
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
        label: "Descrição da ocorrência (opcional)",
      },
      concluir: {
        title: "Concluir OS",
        label: "Descrição da ocorrência (opcional)",
      },
    };
    return modalOpen ? configs[modalOpen] : null;
  };

  const baseBtn =
    "group relative flex items-center gap-2 p-3 rounded-xl text-xs font-medium transition-all duration-200 active:scale-[0.98] shadow-sm flex-1 justify-center min-w-[120px] min-h-[90px]";
  const purpleBtn =
    "bg-gray-50 border border-[#7B54BE] text-[#7B54BE] hover:bg-gray-100";
  const redBtn =
    "bg-gray-50 border border-red-600 text-red-600 hover:bg-red-50";
  const greenBtn =
    "bg-gray-50 border border-green-600 text-green-600 hover:bg-green-50";
  const gradientOverlay =
    "absolute inset-0 rounded-xl bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300";

  const modalConfig = getModalConfig();

  return (
    <>
      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
        />
      )}

      {/* Ajuste no padding inferior ↓ */}
      <div className="bg-white border-t border-slate-200 px-4 pt-4 pb-2 flex flex-wrap gap-3 justify-center">
        {/* INICIAR */}
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

        {/* PAUSAR */}
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

        {/* RETOMAR */}
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

        {/* CONCLUIR FAT */}
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

        {/* CANCELAR */}
        <button
          className={`${baseBtn} ${redBtn}`}
          onClick={() => setModalOpen("cancelar")}
        >
          {modalOpen === "cancelar" && modalLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <X className="w-3.5 h-3.5" />
          )}
          <span className="font-medium">Cancelar OS</span>
          <div className={gradientOverlay}></div>
        </button>

        {/* CONCLUIR */}
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
