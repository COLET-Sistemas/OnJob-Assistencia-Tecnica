"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Car,
  Play,
  Loader2,
  XCircle,
  CheckCircle,
  Plus,
  X,
} from "lucide-react";
import Toast from "@/components/tecnico/Toast";
import OcorrenciaModal from "./OcorrenciaModal";
import { useOsActions } from "./hooks/useOsActions";

interface FloatingActionMenuProps {
  id_os?: number;
  onActionSuccess?: () => void;
}

const optionBaseClasses =
  "flex w-56 items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-lg transition hover:shadow-xl";
const disabledClasses = "opacity-60 pointer-events-none";

const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({
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

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (modalOpen) {
      setOpen(false);
    }
  }, [modalOpen]);

  const buildAction = useCallback(
    (action: () => void, shouldClose = true): (() => void) => {
      if (!shouldClose) return action;
      return () => {
        setOpen(false);
        action();
      };
    },
    []
  );

  const options = useMemo(
    () => [
      {
        key: "deslocamento",
        label: "Iniciar Deslocamento",
        icon: modalOpen === "deslocamento" && modalLoading ? Loader2 : Car,
        iconClass:
          modalOpen === "deslocamento" && modalLoading
            ? "animate-spin text-[#7B54BE]"
            : "text-[#7B54BE]",
        onClick: buildAction(handleDeslocamento),
        disabled: modalOpen !== null,
      },
      {
        key: "atendimento",
        label: "Iniciar Atendimento",
        icon: modalOpen === "atendimento" && modalLoading ? Loader2 : Play,
        iconClass:
          modalOpen === "atendimento" && modalLoading
            ? "animate-spin text-[#7B54BE]"
            : "text-[#7B54BE]",
        onClick: buildAction(handleAtendimento),
        disabled: modalOpen !== null,
      },
      {
        key: "cancelar",
        label: "Cancelar OS",
        icon: cancelLoading ? Loader2 : XCircle,
        iconClass: cancelLoading
          ? "animate-spin text-red-600"
          : "text-red-600",
        onClick: buildAction(handleCancelarOS),
        disabled: cancelLoading,
      },
      {
        key: "concluir",
        label: "Concluir OS",
        icon: concluirLoading ? Loader2 : CheckCircle,
        iconClass: concluirLoading
          ? "animate-spin text-green-600"
          : "text-green-600",
        onClick: buildAction(handleConcluirOS),
        disabled: concluirLoading || modalOpen !== null,
      },
    ],
    [
      buildAction,
      cancelLoading,
      concluirLoading,
      handleAtendimento,
      handleCancelarOS,
      handleConcluirOS,
      handleDeslocamento,
      modalLoading,
      modalOpen,
    ]
  );

  return (
    <>
      {message && (
        <Toast
          message={message}
          type={messageType || "success"}
          onClose={clearMessage}
        />
      )}

      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        <div
          className={`flex flex-col items-end gap-2 transition-all duration-200 ${
            open
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0"
          }`}
        >
          {options.map(({ key, label, icon: Icon, iconClass, onClick, disabled }) => (
            <button
              key={key}
              onClick={onClick}
              className={`${optionBaseClasses} ${
                disabled ? disabledClasses : ""
              }`}
              disabled={disabled}
            >
              <Icon className={`h-4 w-4 ${iconClass}`} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <button
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7B54BE] text-white shadow-xl transition hover:scale-105 hover:shadow-2xl active:scale-95"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? "Fechar acoes" : "Abrir acoes"}
        >
          {open ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </button>
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

export default FloatingActionMenu;
