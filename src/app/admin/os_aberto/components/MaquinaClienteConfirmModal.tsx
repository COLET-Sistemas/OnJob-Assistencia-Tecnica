import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface MaquinaClienteConfirmModalProps {
  isOpen: boolean;
  machineName: string;
  clienteNome: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const MaquinaClienteConfirmModal: React.FC<
  MaquinaClienteConfirmModalProps
> = ({
  isOpen,
  machineName,
  clienteNome,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const maquinaLabel =
    machineName && machineName.trim().length > 0
      ? machineName
      : "selecionada";
  const clienteLabel =
    clienteNome && clienteNome.trim().length > 0
      ? clienteNome
      : "não identificado";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => {
          if (!isLoading) onCancel();
        }}
      />
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Confirmar vinculação da máquina
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle size={24} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700 leading-6">
                A máquina <span className="font-semibold">{maquinaLabel}</span>{" "}
                atualmente está vinculada ao cliente{" "}
                <span className="font-semibold">{clienteLabel}</span>.  Está
                correto passar a vincular essa máquina ao cliente desta OS ?
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            Sim
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaquinaClienteConfirmModal;
