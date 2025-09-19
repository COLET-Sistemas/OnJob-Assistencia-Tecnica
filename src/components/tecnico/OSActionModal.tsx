"use client";
import React from "react";
import {
  X,
  Play,
  Square,
  Pause,
  RotateCcw,
  StopCircle,
  CheckCircle,
  FileCheck,
  XCircle,
} from "lucide-react";

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
      icon: Play,
      variant: "primary",
    },
    {
      key: "iniciar_atendimento",
      label: "Iniciar Atendimento",
      icon: Play,
      variant: "success",
    },
    {
      key: "pausar_atendimento",
      label: "Pausar Atendimento",
      icon: Pause,
      variant: "warning",
    },
    {
      key: "retomar_atendimento",
      label: "Retomar Atendimento",
      icon: RotateCcw,
      variant: "secondary",
    },
    {
      key: "interromper_atendimento",
      label: "Interromper",
      icon: StopCircle,
      variant: "danger",
    },
    {
      key: "concluir_atendimento",
      label: "Concluir Atendimento",
      icon: CheckCircle,
      variant: "success",
    },
    {
      key: "concluir_os",
      label: "Concluir OS",
      icon: FileCheck,
      variant: "neutral",
    },
    {
      key: "cancelar_atendimento",
      label: "Cancelar",
      icon: XCircle,
      variant: "danger",
    },
  ];

  const getButtonStyles = (variant: string) => {
    const baseStyles =
      "group relative flex items-center justify-center gap-3 p-4 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 hover:shadow-md";

    switch (variant) {
      case "primary":
        return `${baseStyles} bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200`;
      case "success":
        return `${baseStyles} bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200`;
      case "warning":
        return `${baseStyles} bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200`;
      case "danger":
        return `${baseStyles} bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200`;
      case "secondary":
        return `${baseStyles} bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200`;
      case "neutral":
        return `${baseStyles} bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200`;
      default:
        return `${baseStyles} bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200`;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-white rounded-t-2xl md:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-900">
            Ações Disponíveis
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.key}
                onClick={() => onAction(action.key)}
                className={getButtonStyles(action.variant)}
              >
                <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="flex-1 text-center">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ActionModal);
