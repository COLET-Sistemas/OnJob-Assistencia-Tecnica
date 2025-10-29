"use client";
import Toast from "@/components/tecnico/Toast";
import React, { useState } from "react";
import { Car, Play, Loader2, XCircle, CheckCircle } from "lucide-react";
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
  const [modalOpen, setModalOpen] = useState<
    null | "deslocamento" | "atendimento"
  >(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );
  const [cancelLoading, setCancelLoading] = useState(false);
  const [concluirLoading, setConcluirLoading] = useState(false);

  const handleDeslocamento = () => setModalOpen("deslocamento");
  const handleAtendimento = () => setModalOpen("atendimento");

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
      setMessage(response.mensagem || "Ação realizada com sucesso!");
      setMessageType("success");

      setTimeout(() => {
        if (onActionSuccess) onActionSuccess();
      }, 1000);
    } catch (error: unknown) {
      console.error("Erro ao registrar ocorrência:", error);
      let errorMessage = "Erro ao registrar ocorrência";

      if (error instanceof Error) {
        const match = error.message.match(/\{"erro":"([^"]+)"\}/);
        errorMessage = match ? match[1] : error.message;
      }

      setMessage(errorMessage);
      setMessageType("error");
    } finally {
      setModalLoading(false);
    }
  };

  const sanitizeMessage = (value?: string | null) => {
    if (!value) return undefined;
    const trimmed = value.trim();
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

        const erroMatch = trimmed.match(
          /["']erro["']\s*:\s*["']([^"']*)["']/i
        );
        if (erroMatch?.[1]) {
          return sanitizeMessage(erroMatch[1]) || erroMatch[1].trim();
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

  const getErrorMessage = (error: unknown) => {
    const extracted = extractErroValue(error);
    if (extracted) return extracted;
    if (error instanceof Error) return error.message;
    return "Erro ao processar a solicitacao";
  };

  const baseBtn =
    "group relative flex items-center gap-2 p-3 rounded-xl text-xs font-medium transition-all duration-200 active:scale-[0.98] shadow-sm flex-1 justify-center min-w-[120px]";
  const purpleBtn =
    "bg-gray-50 border border-[#7B54BE] text-[#7B54BE] hover:bg-gray-100";
  const redBtn =
    "bg-gray-50 border border-red-500 text-red-600 hover:bg-red-50";
  const greenBtn =
    "bg-gray-50 border border-green-500 text-green-600 hover:bg-green-50";
  const disabledBtn = "opacity-50 cursor-not-allowed";
  const gradientOverlay =
    "absolute inset-0 rounded-xl bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300";

  const handleCancelarOS = async () => {
    if (!id_os) {
      setMessage("Dados incompletos para cancelar a OS.");
      setMessageType("error");
      return;
    }

    setCancelLoading(true);
    setMessage(null);
    setMessageType(null);

    try {
      const response = await ocorrenciasOSService.registrarOcorrencia({
        id_os,
        ocorrencia: "cancelar os",
      });

      const successMessage =
        sanitizeMessage(response?.mensagem) || "OS cancelada com sucesso!";

      setMessage(successMessage);
      setMessageType("success");

      setTimeout(() => {
        onActionSuccess?.();
      }, 1000);
    } catch (error) {
      console.error("Erro ao cancelar OS:", error);
      setMessage(getErrorMessage(error));
      setMessageType("error");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleConcluirOS = async () => {
    if (!id_os) {
      setMessage("Dados incompletos para concluir a OS.");
      setMessageType("error");
      return;
    }

    setConcluirLoading(true);
    setMessage(null);
    setMessageType(null);

    try {
      const response = await ocorrenciasOSService.registrarOcorrencia({
        id_os,
        ocorrencia: "concluir os",
      });

      const successMessage =
        sanitizeMessage(response?.mensagem) || "OS concluída com sucesso!";

      setMessage(successMessage);
      setMessageType("success");

      setTimeout(() => {
        onActionSuccess?.();
      }, 1000);
    } catch (error) {
      console.error("Erro ao concluir OS:", error);
      setMessage(getErrorMessage(error));
      setMessageType("error");
    } finally {
      setConcluirLoading(false);
    }
  };

  return (
    <>
      {message && (
        <Toast
          message={message}
          type={messageType || "success"}
          onClose={() => setMessage(null)}
        />
      )}

      <div className="flex flex-col gap-3 justify-center">
        {/* Primeira linha: Iniciar deslocamento e atendimento */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            disabled={modalOpen !== null}
            className={`${baseBtn} ${purpleBtn} ${
              modalOpen !== null ? disabledBtn : ""
            }`}
            onClick={handleDeslocamento}
          >
            <span className="relative flex items-center">
              {modalOpen === "deslocamento" && modalLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Car className="w-3.5 h-3.5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3" />
              )}
            </span>
            <span className="font-medium">Iniciar Deslocamento</span>
            <div className={gradientOverlay}></div>
          </button>

          <button
            disabled={modalOpen !== null}
            className={`${baseBtn} ${purpleBtn} ${
              modalOpen !== null ? disabledBtn : ""
            }`}
            onClick={handleAtendimento}
          >
            <span className="relative flex items-center">
              {modalOpen === "atendimento" && modalLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3" />
              )}
            </span>
            <span className="font-medium">Iniciar Atendimento</span>
            <div className={gradientOverlay}></div>
          </button>
        </div>

        {/* Segunda linha: Cancelar e Concluir OS */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            className={`${baseBtn} ${redBtn} ${
              cancelLoading ? disabledBtn : ""
            }`}
            onClick={handleCancelarOS}
            disabled={cancelLoading}
          >
            {cancelLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <XCircle className="w-3.5 h-3.5" />
            )}
            <span className="font-medium">Cancelar OS</span>
            <div className={gradientOverlay}></div>
          </button>

          <button
            className={`${baseBtn} ${greenBtn} ${
              concluirLoading || modalOpen !== null ? disabledBtn : ""
            }`}
            onClick={handleConcluirOS}
            disabled={concluirLoading || modalOpen !== null}
          >
            {concluirLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5" />
            )}
            <span className="font-medium">Concluir OS</span>
            <div className={gradientOverlay}></div>
          </button>
        </div>
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
