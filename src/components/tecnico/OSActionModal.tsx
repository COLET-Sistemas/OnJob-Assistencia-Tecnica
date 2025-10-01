"use client";
import React, { useState, useCallback } from "react";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  StopCircle,
  CheckCircle,
  XCircle,
  MapPin,
  MessageCircle,
  Loader2,
} from "lucide-react";
import {
  OSDetalhadaV2,
  OSFatDetalhado,
} from "@/api/services/ordensServicoService";
import {
  ocorrenciasOSService,
  OcorrenciaOS,
  OcorrenciaResponse,
} from "@/api/services/ocorrenciaOSService";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; 
  os: OSDetalhadaV2 | null;
};


// Ações que têm descrição obrigatória
const ACOES_DESCRICAO_OBRIGATORIA = [
  "pausar_atendimento",
  "cancelar_atendimento",
];

// Mapeamento das ações para ocorrências
const ACAO_PARA_OCORRENCIA: Record<string, string> = {
  iniciar_deslocamento: "iniciar deslocamento",
  iniciar_atendimento: "iniciar atendimento",
  pausar_atendimento: "pausar atendimento",
  retomar_atendimento: "retomar atendimento",
  interromper_atendimento: "interromper atendimento",
  cancelar_atendimento: "cancelar atendimento",
  concluir_os: "concluir os",
};

// Labels para as ações
const ACAO_LABELS: Record<string, string> = {
  iniciar_deslocamento: "Iniciar Deslocamento",
  iniciar_atendimento: "Iniciar Atendimento",
  pausar_atendimento: "Pausar Atendimento",
  retomar_atendimento: "Retomar Atendimento",
  interromper_atendimento: "Interromper Atendimento",
  cancelar_atendimento: "Cancelar Atendimento",
  concluir_os: "Concluir OS",
};

// Tipo para as ações disponíveis
type ActionItem = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const OSActionModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, os }) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [descricao, setDescricao] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showDescriptionInput, setShowDescriptionInput] = useState(false);

  // Função para obter a data de hoje no formato brasileiro DD/MM/YYYY
  const getDataHoje = (): string => {
    const hoje = new Date();
    const dia = hoje.getDate().toString().padStart(2, "0");
    const mes = (hoje.getMonth() + 1).toString().padStart(2, "0");
    const ano = hoje.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  // Função para obter a última FAT (maior id_fat)
  const getUltimaFat = (os: OSDetalhadaV2): OSFatDetalhado | null => {
    if (!os.fats || os.fats.length === 0) return null;

    // Ordena por id_fat decrescente e pega a primeira (maior id_fat)
    return os.fats.sort((a, b) => (b.id_fat || 0) - (a.id_fat || 0))[0];
  };

  // Função para verificar se a data_atendimento da FAT é igual a hoje
  const fatEhDeHoje = (fat: OSFatDetalhado): boolean => {
    if (!fat.data_atendimento) return false;

    // Se a data contém espaço, pega apenas a parte da data (antes do espaço)
    const dataFat = fat.data_atendimento.includes(" ")
      ? fat.data_atendimento.split(" ")[0]
      : fat.data_atendimento;

    const dataHoje = getDataHoje();
    return dataFat === dataHoje;
  };

  // Fechar modal e resetar estados
  const handleClose = useCallback(() => {
    setSelectedAction(null);
    setShowDescriptionInput(false);
    setDescricao("");
    setLoadingAction(null);
    onClose();
  }, [onClose]);

  const executarAcao = useCallback(
    async (action: string, descricaoOcorrencia?: string) => {
      if (!os?.id_os) {
        alert("Erro: ID da OS não encontrado");
        return;
      }

      setLoadingAction(action);

      try {
        const ocorrencia = ACAO_PARA_OCORRENCIA[action];

        if (!ocorrencia) {
          throw new Error(`Ação não mapeada: ${action}`);
        }

        const payload: OcorrenciaOS = {
          id_os: os.id_os,
          ocorrencia: ocorrencia,
          ...(descricaoOcorrencia && {
            descricao_ocorrencia: descricaoOcorrencia,
          }),
        };

        const response: OcorrenciaResponse =
          await ocorrenciasOSService.registrarOcorrencia(payload);

        // Mostrar mensagem de sucesso
        alert(response.mensagem);

        // CHAMADA DO CALLBACK DE SUCESSO - AQUI ACONTECE A ATUALIZAÇÃO
        onSuccess(); // Isso chama handleActionSuccess em OSDetalheMobile

        // Fechar modal
        handleClose();
      } catch (error: unknown) {
        console.error("Erro ao executar ação:", error);
        if (error instanceof Error) {
          alert(`Erro: ${error.message}`);
        } else {
          alert("Erro desconhecido ao executar ação");
        }
      } finally {
        setLoadingAction(null);
      }
    },
    [os?.id_os, onSuccess, handleClose]
  );

  // Lidar com ação selecionada - agora todas as ações mostram o campo de descrição
  const handleActionClick = useCallback((action: string) => {
    setSelectedAction(action);
    setShowDescriptionInput(true);
    setDescricao("");
  }, []);

  // Validar se pode confirmar a ação
  const canConfirm = useCallback(() => {
    if (!selectedAction) return false;

    // Se for ação obrigatória, precisa ter descrição
    if (ACOES_DESCRICAO_OBRIGATORIA.includes(selectedAction)) {
      return descricao.trim().length > 0;
    }

    // Para outras ações, pode estar vazio (opcional)
    return true;
  }, [selectedAction, descricao]);

  // Confirmar ação com descrição
  const handleConfirmWithDescription = useCallback(() => {
    if (selectedAction && canConfirm()) {
      // Só envia descrição se não estiver vazia
      const descricaoParaEnviar = descricao.trim() || undefined;
      executarAcao(selectedAction, descricaoParaEnviar);
    }
  }, [selectedAction, descricao, executarAcao, canConfirm]);

  // Cancelar entrada de descrição
  const handleCancelDescription = useCallback(() => {
    setSelectedAction(null);
    setShowDescriptionInput(false);
    setDescricao("");
  }, []);

  // Definir ações disponíveis baseada na nova lógica
  const getAvailableActions = (): ActionItem[] => {
    if (!os) return [];

    const actions: ActionItem[] = [];
    const ultimaFat = getUltimaFat(os);
    const situacaoOsCodigo = os.situacao_os?.codigo;

    // Se não há FAT ou a data_atendimento da última FAT é diferente de hoje
    if (!ultimaFat || !fatEhDeHoje(ultimaFat)) {
      actions.push(
        {
          key: "iniciar_deslocamento",
          label: "Iniciar deslocamento",
          icon: MapPin,
        },
        {
          key: "iniciar_atendimento",
          label: "Iniciar Atendimento",
          icon: Play,
        },
        {
          key: "cancelar_atendimento",
          label: "Cancelar",
          icon: XCircle,
        }
      );
      return actions;
    }

    // Se a FAT é de hoje, verificar situacao_os.codigo e fats.status_fat
    const fatStatusFat = ultimaFat.status_fat;

    if (situacaoOsCodigo === 2 && (!fatStatusFat || fatStatusFat === "")) {
      // situacao_os.codigo=2 e fats.status_fat for vazio
      actions.push(
        {
          key: "iniciar_deslocamento",
          label: "Iniciar deslocamento",
          icon: MapPin,
        },
        {
          key: "iniciar_atendimento",
          label: "Iniciar Atendimento",
          icon: Play,
        },
        {
          key: "cancelar_atendimento",
          label: "Cancelar",
          icon: XCircle,
        }
      );
    } else if (situacaoOsCodigo === 3 && fatStatusFat === "3") {
      // situacao_os.codigo=3 e fats.status_fat=3
      actions.push(
        {
          key: "iniciar_atendimento",
          label: "Iniciar Atendimento",
          icon: Play,
        },
        {
          key: "cancelar_atendimento",
          label: "Cancelar",
          icon: XCircle,
        }
      );
    } else if (situacaoOsCodigo === 4 && fatStatusFat === "4") {
      // situacao_os.codigo=4 e fats.status_fat=4
      actions.push(
        {
          key: "pausar_atendimento",
          label: "Pausar Atendimento",
          icon: Pause,
        },
        {
          key: "interromper_atendimento",
          label: "Interromper",
          icon: StopCircle,
        },
        {
          key: "cancelar_atendimento",
          label: "Cancelar",
          icon: XCircle,
        }
      );
    } else if (situacaoOsCodigo === 5 && fatStatusFat === "5") {
      // situacao_os.codigo=5 e fats.status_fat=5
      actions.push(
        {
          key: "retomar_atendimento",
          label: "Retomar Atendimento",
          icon: RotateCcw,
        },
        {
          key: "interromper_atendimento",
          label: "Interromper",
          icon: StopCircle,
        },
        {
          key: "cancelar_atendimento",
          label: "Cancelar",
          icon: XCircle,
        },
        {
          key: "concluir_os",
          label: "Concluir OS",
          icon: CheckCircle,
        }
      );
    }

    return actions;
  };

  const getButtonStyles = (actionKey: string) => {
    const isLoading = loadingAction === actionKey;
    const isDisabled = loadingAction !== null && loadingAction !== actionKey;

    let baseStyles =
      "group relative flex items-center gap-3 p-4 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98] bg-gray-50 border border-[#7B54BE] text-[#7B54BE] shadow-sm";

    if (isDisabled) {
      baseStyles += " opacity-50 cursor-not-allowed";
    } else if (!isLoading) {
      baseStyles += " hover:bg-gray-100";
    }

    return baseStyles;
  };

  const availableActions = getAvailableActions();
  const hasAnyLoading = loadingAction !== null;
  const isDescricaoObrigatoria = selectedAction
    ? ACOES_DESCRICAO_OBRIGATORIA.includes(selectedAction)
    : false;

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)" }}
    >
      {/* Backdrop with glassmorphism effect */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-slate-800/50 to-slate-900/60"
        onClick={!hasAnyLoading ? handleClose : undefined}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-900">
            {showDescriptionInput ? "Adicionar Descrição" : "Ações Disponíveis"}
            {os && (
              <span className="block text-sm text-slate-600 font-normal mt-1">
                OS #{os.id_os}
              </span>
            )}
          </h3>
          <button
            onClick={handleClose}
            disabled={hasAnyLoading}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Input de Descrição */}
        {showDescriptionInput && selectedAction && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-700">
              <MessageCircle className="w-4 h-4" />
              <span className="font-medium">{ACAO_LABELS[selectedAction]}</span>
              {isDescricaoObrigatoria && (
                <span className="text-red-500 text-sm font-normal">*</span>
              )}
            </div>

            <div className="space-y-2">
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder={
                  isDescricaoObrigatoria
                    ? "Digite uma descrição (obrigatória)..."
                    : "Digite uma descrição (opcional)..."
                }
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#7B54BE] focus:border-transparent resize-none transition-colors placeholder:text-slate-500 ${
                  isDescricaoObrigatoria && !descricao.trim()
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                }`}
                rows={3}
                disabled={hasAnyLoading}
              />
              {isDescricaoObrigatoria && (
                <p className="text-xs text-red-600">
                  * Descrição obrigatória para esta ação
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelDescription}
                disabled={hasAnyLoading}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmWithDescription}
                disabled={hasAnyLoading || !canConfirm()}
                className="flex-1 px-4 py-3 bg-[#7B54BE] text-white rounded-xl text-sm font-medium hover:bg-[#6a4ba0] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingAction === selectedAction ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Confirmar"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Actions Grid */}
        {!showDescriptionInput && (
          <>
            {availableActions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availableActions.map((action) => {
                  const Icon = action.icon;
                  const isLoading = loadingAction === action.key;
                  const isDisabled = hasAnyLoading && !isLoading;

                  return (
                    <button
                      key={action.key}
                      onClick={() => handleActionClick(action.key)}
                      disabled={isDisabled}
                      className={getButtonStyles(action.key)}
                    >
                      <div className="relative">
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Icon className="w-5 h-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3" />
                        )}
                        <div className="absolute -inset-1 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                      </div>
                      <span className="flex-1 text-left font-medium">
                        {action.label}
                      </span>

                      {/* Subtle gradient overlay */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-slate-400" />
                </div>
                <h4 className="text-lg font-medium text-slate-900 mb-2">
                  Nenhuma ação disponível
                </h4>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Não há ações disponíveis para esta OS no momento. Verifique as
                  condições de pendência, liberação financeira ou status das
                  FATs.
                </p>
              </div>
            )}
          </>
        )}

        {/* Bottom decoration */}
        <div className="mt-6 flex justify-center">
          <div className="w-12 h-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent rounded-full opacity-50"></div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(OSActionModal);
