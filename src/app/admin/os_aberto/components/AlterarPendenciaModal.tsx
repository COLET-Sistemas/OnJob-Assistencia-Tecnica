import React, { useState, useEffect } from "react";
import { MotivoPendencia } from "@/types/admin/cadastro/motivos_pendencia";
import { motivosPendenciaService } from "@/api/services/motivosPendenciaService";
import { feedback } from "@/utils/feedback";
import { AlertTriangle, X } from "lucide-react";

interface AlterarPendenciaModalProps {
  isOpen: boolean;
  osId: number;
  onClose: () => void;
  onConfirm: (osId: number, motivoId: number | null) => Promise<void>;
  currentMotivoId?: number;
  currentMotivoText?: string;
}

const AlterarPendenciaModal: React.FC<AlterarPendenciaModalProps> = ({
  isOpen,
  osId,
  onClose,
  onConfirm,
  currentMotivoId,
  currentMotivoText,
}) => {
  const [motivos, setMotivos] = useState<MotivoPendencia[]>([]);
  const [selectedMotivo, setSelectedMotivo] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Combinando os efeitos em um único efeito mais limpo
  useEffect(() => {
    // Quando o modal fecha, reseta o estado
    if (!isOpen) {
      setSelectedMotivo(null);
      return;
    }

    // Quando o modal abre, carrega os dados
    const fetchMotivos = async () => {
      try {
        setFetchLoading(true);
        const response = await motivosPendenciaService.getAll();

        if (response && response.length > 0) {
          // Reordena a lista para mostrar o motivo atual no topo
          const orderedMotivos = [...response];
          if (currentMotivoId) {
            // Encontra o índice do motivo atual
            const currentMotivoIndex = orderedMotivos.findIndex(
              (motivo) => motivo.id === currentMotivoId
            );

            // Se encontrou o motivo atual, move para o topo da lista
            if (currentMotivoIndex !== -1) {
              const currentMotivo = orderedMotivos.splice(
                currentMotivoIndex,
                1
              )[0];
              orderedMotivos.unshift(currentMotivo);
            }

            setSelectedMotivo(currentMotivoId);
          } else {
            // Se não tiver motivo atual na OS, seleciona o primeiro da lista
            setSelectedMotivo(response[0].id);
          }

          setMotivos(orderedMotivos);
        }
      } catch (error) {
        console.error("Erro ao buscar motivos de pendência:", error);
        feedback.toast("Erro ao buscar motivos de pendência", "error");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchMotivos();
  }, [isOpen, currentMotivoId]);

  // Confirmar alteração do motivo de pendência
  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm(osId, selectedMotivo);
      onClose();
    } catch (error) {
      console.error("Erro ao alterar pendência:", error);
    } finally {
      setLoading(false);
    }
  };

  // Liberar OS (remover pendência)
  const handleLiberarOS = async () => {
    try {
      setLoading(true);
      await onConfirm(osId, null);
      onClose();
    } catch (error) {
      console.error("Erro ao liberar OS:", error);
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
          <h3 className="text-lg font-semibold text-gray-900">
            Alterar Pendência da OS #{osId}
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
          {fetchLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertTriangle size={20} className="text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-3">
                    Selecione o motivo da pendência para a OS ou remova a
                    pendência atual.
                  </p>

                  <div className="mb-3">
                    <div className="flex justify-between">
                      <label
                        htmlFor="motivoPendencia"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Motivo da Pendência :{" "}
                        <span className="font-medium text-orange-600">
                          {currentMotivoText}
                        </span>
                      </label>
                    </div>
                    <select
                      id="motivoPendencia"
                      value={selectedMotivo || ""}
                      onChange={(e) =>
                        setSelectedMotivo(Number(e.target.value))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-800"
                      disabled={loading}
                    >
                      {motivos.map((motivo, index) => {
                        // Verifica se este motivo tem a mesma descrição do motivo atual da OS
                        const isCurrentText =
                          currentMotivoText &&
                          motivo.descricao.toLowerCase() ===
                            currentMotivoText.toLowerCase();

                        // Verifica se é o motivo atual pelo ID
                        const isCurrentById = motivo.id === currentMotivoId;

                        // Destaca tanto pelo texto quanto pelo ID
                        const isCurrent = isCurrentById || isCurrentText;

                        return (
                          <option
                            key={motivo.id}
                            value={motivo.id}
                            className={
                              isCurrent ? "font-bold bg-orange-50" : ""
                            }
                          >
                            {index === 0 && isCurrent ? "➡️ " : ""}
                            {motivo.descricao}
                            {isCurrent ? " ✓" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={handleLiberarOS}
            disabled={loading || fetchLoading}
            className="px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
            ) : null}
            Remover Pendência
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={loading || fetchLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>

            <button
              onClick={handleConfirm}
              disabled={loading || fetchLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {loading ? "Alterando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlterarPendenciaModal;
