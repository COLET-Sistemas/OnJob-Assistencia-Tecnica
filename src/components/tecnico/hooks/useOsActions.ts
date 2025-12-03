"use client";

import { useCallback, useState } from "react";
import { ocorrenciasOSService } from "@/api/services/ocorrenciaOSService";

type ModalType = null | "deslocamento" | "atendimento" | "cancelar" | "concluir";
type MessageType = "success" | "error" | null;

export type ActionSuccessType =
  | "deslocamento"
  | "atendimento"
  | "cancelar_os"
  | "concluir_os";

export interface ActionSuccessPayload {
  action: ActionSuccessType;
  idFat?: number;
}

interface UseOsActionsOptions {
  id_os?: number;
  onActionSuccess?: (payload: ActionSuccessPayload) => void;
}

const sanitizeMessage = (value?: string | null): string | undefined => {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    const stripped = trimmed.slice(1, -1).trim();
    return stripped || undefined;
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
        /* ignore */
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
  return "Erro ao processar a solicitacao";
};

export const useOsActions = ({
  id_os,
  onActionSuccess,
}: UseOsActionsOptions) => {
  const [modalOpen, setModalOpen] = useState<ModalType>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<MessageType>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [concluirLoading, setConcluirLoading] = useState(false);

  const handleDeslocamento = useCallback(() => {
    setModalOpen("deslocamento");
  }, []);

  const handleAtendimento = useCallback(() => {
    setModalOpen("atendimento");
  }, []);

  const handleCancelarOS = useCallback(() => {
    setModalOpen("cancelar");
  }, []);

  const handleConcluirOS = useCallback(() => {
    setModalOpen("concluir");
  }, []);

  const handleSaveOcorrencia = useCallback(
    async (descricao: string) => {
      if (!id_os || !modalOpen) {
        setMessage("Dados incompletos para registrar a ocorrencia.");
        setMessageType("error");
        return;
      }

      const actionMap: Record<Exclude<ModalType, null>, string> = {
        deslocamento: "iniciar deslocamento",
        atendimento: "iniciar atendimento",
        cancelar: "cancelar os",
        concluir: "concluir os",
      };

      const actionSuccessMap: Record<Exclude<ModalType, null>, ActionSuccessType> =
        {
          deslocamento: "deslocamento",
          atendimento: "atendimento",
          cancelar: "cancelar_os",
          concluir: "concluir_os",
        };

      const loadingSetterMap: Partial<
        Record<Exclude<ModalType, null>, (value: boolean) => void>
      > = {
        cancelar: setCancelLoading,
        concluir: setConcluirLoading,
      };

      const currentAction = modalOpen;
      const ocorrencia = actionMap[currentAction];
      const successAction = actionSuccessMap[currentAction];
      const setSpecificLoading = loadingSetterMap[currentAction];

      setModalLoading(true);
      setSpecificLoading?.(true);
      setMessage(null);
      setMessageType(null);

      try {
        const response = await ocorrenciasOSService.registrarOcorrencia({
          id_os,
          ocorrencia,
          descricao_ocorrencia: descricao,
        });

        const idFat =
          typeof response?.id_fat === "number" &&
          Number.isFinite(response.id_fat)
            ? response.id_fat
            : undefined;

        setModalOpen(null);
        setMessage(
          sanitizeMessage(response.mensagem) || "Acao realizada com sucesso!"
        );
        setMessageType("success");

        if (onActionSuccess && successAction) {
          setTimeout(() => {
            onActionSuccess({
              action: successAction,
              idFat,
            });
          }, 1000);
        }
      } catch (error) {
        console.error("Erro ao registrar ocorrencia:", error);
        setMessage(getErrorMessage(error));
        setMessageType("error");
      } finally {
        setModalLoading(false);
        setSpecificLoading?.(false);
      }
    },
    [id_os, modalOpen, onActionSuccess]
  );

  const closeModal = useCallback(() => {
    setModalOpen(null);
  }, []);

  const clearMessage = useCallback(() => {
    setMessage(null);
    setMessageType(null);
  }, []);

  return {
    modalOpen,
    modalLoading,
    message,
    messageType,
    cancelLoading,
    concluirLoading,
    handleDeslocamento,
    handleAtendimento,
    handleSaveOcorrencia,
    handleCancelarOS,
    handleConcluirOS,
    closeModal,
    clearMessage,
  };
};

export type UseOsActionsReturn = ReturnType<typeof useOsActions>;
