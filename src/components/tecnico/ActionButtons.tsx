"use client";
import Toast from "@/components/tecnico/Toast";
import React from "react";
import { Car, Play, Loader2, XCircle, CheckCircle } from "lucide-react";
import OcorrenciaModal from "./OcorrenciaModal";
import { useOsActions, type ActionSuccessPayload } from "./hooks/useOsActions";

interface ActionButtonsProps {
  id_os?: number;
  onActionSuccess?: (payload: ActionSuccessPayload) => void;
}

const baseBtn =
  "group relative flex items-center gap-2 p-3 rounded-xl text-xs font-medium transition-all duration-200 active:scale-[0.98] shadow-sm flex-1 justify-center min-w-[120px]";
const purpleBtn =
  "bg-gray-50 border border-[#7B54BE] text-[#7B54BE] hover:bg-gray-100";
const redBtn = "bg-gray-50 border border-red-500 text-red-600 hover:bg-red-50";
const greenBtn =
  "bg-gray-50 border border-green-500 text-green-600 hover:bg-green-50";
const disabledBtn = "opacity-50 cursor-not-allowed";
const gradientOverlay =
  "absolute inset-0 rounded-xl bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300";

const ActionButtons: React.FC<ActionButtonsProps> = ({
  id_os,
  onActionSuccess,
}) => {
  const {
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
  } = useOsActions({ id_os, onActionSuccess });

  return (
    <>
      {message && (
        <Toast
          message={message}
          type={messageType || "success"}
          onClose={clearMessage}
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
        onClose={closeModal}
        onSave={handleSaveOcorrencia}
        loading={modalLoading}
        title={
          modalOpen === "deslocamento"
            ? "Iniciar Deslocamento"
            : "Iniciar Atendimento"
        }
        label="Descricao da ocorrencia (opcional)"
      />
    </>
  );
};

export default ActionButtons;
