"use client";
import React from "react";
import { X } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
};

const ActionModal: React.FC<Props> = ({ isOpen, onClose, onAction }) => {
  const actions = [
    {
      key: "iniciar_deslocamento",
      label: "Iniciar deslocamento",
      color: "blue",
    },
    {
      key: "iniciar_atendimento",
      label: "Iniciar Atendimento",
      color: "emerald",
    },
    { key: "pausar_atendimento", label: "Pausar Atendimento", color: "amber" },
    {
      key: "retomar_atendimento",
      label: "Retomar Atendimento",
      color: "purple",
    },
    { key: "interromper_atendimento", label: "Interromper", color: "rose" },
    {
      key: "concluir_atendimento",
      label: "Concluir Atendimento",
      color: "emerald",
    },
    { key: "concluir_os", label: "Concluir OS", color: "slate" },
    { key: "cancelar_atendimento", label: "Cancelar", color: "red" },
  ];

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl md:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Ações</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action) => (
            <button
              key={action.key}
              onClick={() => onAction(action.key)}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl bg-${action.color}-50 text-${action.color}-700 text-sm font-medium hover:bg-${action.color}-100 transition-all duration-200 active:scale-95`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ActionModal);
