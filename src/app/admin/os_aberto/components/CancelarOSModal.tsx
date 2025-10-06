import React, { useState } from "react";
import { FileX, X, AlertTriangle } from "lucide-react";

interface CancelarOSModalProps {
  isOpen: boolean;
  osId: number;
  onClose: () => void;
  onConfirm: (
    osId: number,
    descricao: string,
    tipoCancelamento: "cliente" | "empresa"
  ) => Promise<void>;
}

const CancelarOSModal: React.FC<CancelarOSModalProps> = ({
  isOpen,
  osId,
  onClose,
  onConfirm,
}) => {
  const [descricao, setDescricao] = useState("");
  const [canceladoPeloCliente, setCanceladoPeloCliente] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Resetar estado quando o modal for fechado
  React.useEffect(() => {
    if (!isOpen) {
      setDescricao("");
      setCanceladoPeloCliente(false);
      setError("");
    }
  }, [isOpen]);

  // Verificar se a descrição tem pelo menos 10 caracteres
  const isDescricaoValida = descricao.trim().length >= 10;

  // Confirmar cancelamento
  const handleConfirm = async () => {
    // Validar descrição
    if (!isDescricaoValida) {
      setError("A descrição deve ter pelo menos 10 caracteres");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const tipoCancelamento = canceladoPeloCliente ? "cliente" : "empresa";
      await onConfirm(osId, descricao, tipoCancelamento);
    } catch (error) {
      console.error("Erro ao cancelar OS:", error);
      setError("Ocorreu um erro ao cancelar a OS. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileX className="w-5 h-5 text-red-600" />
            Cancelar OS #{osId}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-4">
                Esta ação irá <strong>cancelar permanentemente</strong> a ordem
                de serviço. Por favor, descreva o motivo do cancelamento abaixo.
              </p>

              {/* Campo de descrição */}
              <div className="mb-4">
                <label
                  htmlFor="descricaoCancelamento"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Motivo do cancelamento <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="descricaoCancelamento"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className={`w-full border ${
                    error ? "border-red-300" : "border-gray-300"
                  } rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm text-gray-800 min-h-[100px]`}
                  placeholder="Descreva o motivo do cancelamento em pelo menos 10 caracteres..."
                  disabled={loading}
                />
                <div className="flex justify-between mt-1">
                  <div>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                  </div>
                  <div className="text-xs text-gray-500">
                    {descricao.length}/10 caracteres mínimos
                  </div>
                </div>
              </div>

              {/* Checkbox para cancelamento pelo cliente */}
              <div className="flex items-center mt-3">
                <input
                  id="canceladoPeloCliente"
                  type="checkbox"
                  checked={canceladoPeloCliente}
                  onChange={(e) => setCanceladoPeloCliente(e.target.checked)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  disabled={loading}
                />
                <label
                  htmlFor="canceladoPeloCliente"
                  className="ml-2 block text-sm text-gray-700"
                >
                  O cancelamento foi solicitado pelo cliente
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            disabled={loading || !isDescricaoValida}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {loading ? "Cancelando..." : "Confirmar cancelamento"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelarOSModal;
