import { useState } from "react";
import { Trash2, X } from "lucide-react";

type DeleteButtonProps = {
  id: number;
  onDelete: (id: number) => Promise<void>;
  loading?: boolean;
  confirmText?: string;
  confirmTitle?: string;
  label?: string;
  className?: string;
  itemName?: string; // Nome do item sendo excluído para exibir no modal
};

export const DeleteButton = ({
  id,
  onDelete,
  loading = false,
  confirmText = "Tem certeza que deseja excluir este item?",
  confirmTitle = "Confirmar Exclusão",
  label = "Excluir",
  className = "",
  itemName = "",
}: DeleteButtonProps) => {
  const [localLoading, setLocalLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    setShowModal(true);
  };

  const handleConfirm = async () => {
    setLocalLoading(true);
    try {
      await onDelete(id);
      setShowModal(false);
    } catch (error) {
      console.error("Erro ao excluir:", error);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  const isLoading = loading || localLoading;

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`
          inline-flex items-center px-3 py-1.5 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] rounded-lg transition-colors gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `.trim()}
      >
        <Trash2 size={14} />
        {isLoading ? "Excluindo..." : label}
      </button>

      {/* Modal de Confirmação */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCancel}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {confirmTitle}
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={localLoading}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 size={20} className="text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">{confirmText}</p>
                  {itemName && (
                    <p className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                      {itemName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button
                onClick={handleCancel}
                disabled={localLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={localLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {localLoading && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {localLoading ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
