"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  X,
  CheckCircle,
  Loader2,
  Plus,
} from "lucide-react";
import OcorrenciaModal from "./OcorrenciaModal";
import Toast from "./Toast";
import { ocorrenciasOSService } from "@/api/services/ocorrenciaOSService";
import { type FATDetalhada } from "@/api/services/fatService";

type ModalAction =
  | null
  | "iniciar"
  | "pausar"
  | "retomar"
  | "interromper"
  | "cancelar"
  | "concluir";

interface FloatingActionMenuFatProps {
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

type ToastType = "success" | "error";

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

const optionBaseClasses =
  "flex w-full max-w-[260px] items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-lg transition hover:shadow-xl";
const disabledClasses = "opacity-60 pointer-events-none";

const sanitizeMessage = (message?: string | null): string | undefined => {
  if (!message) return undefined;
  const trimmed = message.trim();
  if (!trimmed) return undefined;
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    const inner = trimmed.slice(1, -1).trim();
    return inner || undefined;
  }
  return trimmed;
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

      const erroMatch = trimmed.match(/["']erro["']\s*:\s*["']([^"']*)["']/i);
      if (erroMatch?.[1]) {
        return sanitizeMessage(erroMatch[1]) || erroMatch[1].trim();
      }

      try {
        const parsed = JSON.parse(trimmed);
        const fromParsed = handle(parsed);
        if (fromParsed) return fromParsed;
      } catch {
        /* ignore parse errors */
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

      for (const key of candidateKeys) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
          const valueForKey = (input as Record<string, unknown>)[key];
          const result = handle(valueForKey);
          if (result) return result;
        }
      }

      for (const candidate of Object.values(input)) {
        const result = handle(candidate);
        if (result) return result;
      }
    }

    return undefined;
  };

  return handle(value);
};

const getErrorMessage = (error: unknown): string => {
  const extracted = extractErroValue(error);
  if (extracted) return extracted;
  if (error instanceof Error) return error.message;
  return "Erro ao processar a solicitação.";
};

type ActionOption = {
  key: Exclude<ModalAction, null>;
  label: string;
  icon:
    | typeof Play
    | typeof Pause
    | typeof RotateCcw
    | typeof Square
    | typeof X
    | typeof CheckCircle
    | typeof Loader2;
  iconClass: string;
  buttonClassName?: string;
  onClick: () => void;
};

const variantClasses: Record<string, string> = {
  iniciar: "hover:bg-[#7B54BE]/5",
  pausar: "hover:bg-amber-50",
  retomar: "hover:bg-[#7B54BE]/5",
  interromper: "hover:bg-[#7B54BE]/5",
  cancelar: "hover:bg-red-50",
  concluir: "hover:bg-green-50",
};

const iconColorClasses: Record<string, string> = {
  iniciar: "text-[#7B54BE]",
  pausar: "text-amber-600",
  retomar: "text-[#7B54BE]",
  interromper: "text-[#7B54BE]",
  cancelar: "text-red-600",
  concluir: "text-green-600",
};

const FloatingActionMenuFat: React.FC<FloatingActionMenuFatProps> = ({
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
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState<ModalAction>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    if (modalOpen) {
      setOpen(false);
    }
  }, [modalOpen]);

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3500);
  }, []);

  const handleSaveOcorrencia = useCallback(
    async (descricao: string) => {
      if (!modalOpen || !id_os) {
        showToast("Dados incompletos para executar a ação.", "error");
        return;
      }

      setModalLoading(true);
      try {
        const ocorrenciaMap: Record<Exclude<ModalAction, null>, string> = {
          iniciar: "iniciar atendimento",
          pausar: "pausar atendimento",
          retomar: "retomar atendimento",
          interromper: "interromper atendimento",
          cancelar: "cancelar atendimento",
          concluir: "concluir os",
        };

        const mensagensMap: Record<Exclude<ModalAction, null>, string> = {
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
    },
    [
      id_os,
      modalOpen,
      onActionSuccess,
      onCancelarAtendimento,
      onConcluirAtendimento,
      onIniciarAtendimento,
      onInterromperAtendimento,
      onPausarAtendimento,
      onRetomarAtendimento,
      showToast,
    ]
  );

  const situacao = fat?.situacao?.codigo;

  const options = useMemo(() => {
    if (!situacao) return [];

    const buildOption = (key: Exclude<ModalAction, null>, label: string, icon: ActionOption["icon"]) => {
      const isLoading = modalOpen === key && modalLoading;

      return {
        key,
        label,
        icon: isLoading ? Loader2 : icon,
        iconClass: `${isLoading ? "animate-spin" : ""} ${
          iconColorClasses[key]
        }`,
        buttonClassName: variantClasses[key],
        onClick: () => setModalOpen(key),
      };
    };

    switch (situacao) {
      case 3:
        return [
          buildOption("iniciar", "Iniciar Atendimento", Play),
          buildOption("cancelar", "Cancelar FAT", X),
        ];
      case 4:
        return [
          buildOption("pausar", "Pausar Atendimento", Pause),
          buildOption("cancelar", "Cancelar FAT", X),
          buildOption("interromper", "Concluir FAT", Square),
          buildOption("concluir", "Concluir OS", CheckCircle),
        ];
      case 5:
        return [
          buildOption("retomar", "Retomar Atendimento", RotateCcw),
          buildOption("cancelar", "Cancelar FAT", X),
          buildOption("interromper", "Concluir FAT", Square),
          buildOption("concluir", "Concluir OS", CheckCircle),
        ];
      default:
        return [];
    }
  }, [modalLoading, modalOpen, situacao]);

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

  if (!options.length) {
    return null;
  }

  return (
    <>
      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
        />
      )}

      <div className="fixed bottom-8 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
        <div
          className={`flex flex-col items-end gap-2 transition-all duration-200 ${
            open
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0"
          }`}
        >
          {options.map(
            ({ key, label, icon: IconComponent, iconClass, buttonClassName, onClick }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setOpen(false);
                  onClick();
                }}
                className={`${optionBaseClasses} ${buttonClassName ?? ""} ${
                  modalLoading ? disabledClasses : ""
                }`}
                disabled={modalLoading}
              >
                <IconComponent className={`h-4 w-4 ${iconClass}`} />
                <span>{label}</span>
              </button>
            )
          )}
        </div>

        <button
          type="button"
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#7B54BE] text-white shadow-xl transition hover:scale-105 hover:shadow-2xl active:scale-95"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? "Fechar as ações" : "Abrir as ações"}
        >
          {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
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

export default FloatingActionMenuFat;
