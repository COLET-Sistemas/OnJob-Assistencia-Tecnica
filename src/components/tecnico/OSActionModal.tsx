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
  onSuccess: () => void; // Callback para atualizar a OS após sucesso
  os: OSDetalhadaV2 | null;
};

// Definição dos status das OS
const OS_STATUS = {
  ABERTA: 1,
  ATRIBUIDA: 2,
  DESLOCAMENTO: 3,
  EM_ATENDIMENTO: 4,
  PAUSADA: 5,
  EM_REVISAO: 6,
  CONCLUIDA: 7,
  CANCELADA: 8,
} as const;

// Ações que precisam de descrição
const ACOES_COM_DESCRICAO = [
  "pausar_atendimento",
  "retomar_atendimento",
  "interromper_atendimento",
  "cancelar_atendimento",
  "concluir_os",
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

const OSActionModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, os }) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [descricao, setDescricao] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null); // Estado para controlar qual botão está em loading
  const [showDescriptionInput, setShowDescriptionInput] = useState(false);

  // Função para verificar se a OS tem pendência
  const temPendencia = (os: OSDetalhadaV2): boolean => {
    return os.situacao_os?.id_motivo_pendencia > 0;
  };

  // Função para verificar liberação financeira
  const temLiberacaoFinanceira = (os: OSDetalhadaV2): boolean => {
    return os.liberacao_financeira?.liberada === true;
  };

  // Função para obter a FAT ativa do técnico atual
  const getFatAtivaTecnico = (os: OSDetalhadaV2): OSFatDetalhado | null => {
    const idTecnicoLogado = parseInt(localStorage.getItem("id_usuario") || "0");

    if (!os.fats || os.fats.length === 0) return null;

    return (
      os.fats.find(
        (fat) =>
          fat.tecnico.id === idTecnicoLogado &&
          (fat.status_fat === "4" || fat.status_fat === "5")
      ) || null
    );
  };

  // Função para obter FAT em deslocamento do técnico atual
  const getFatDeslocamentoTecnico = (
    os: OSDetalhadaV2
  ): OSFatDetalhado | null => {
    const idTecnicoLogado = parseInt(localStorage.getItem("id_usuario") || "0");

    if (!os.fats || os.fats.length === 0) return null;

    return (
      os.fats.find(
        (fat) => fat.tecnico.id === idTecnicoLogado && fat.status_fat === "3"
      ) || null
    );
  };

  // Função para verificar se FAT tem dados obrigatórios para conclusão
  const fatTemDadosObrigatorios = (fat: OSFatDetalhado): boolean => {
    const temDescricaoOuSolucaoOuObs = !!(
      fat.descricao_problema?.trim() ||
      fat.solucao_encontrada?.trim() ||
      fat.observacoes?.trim()
    );

    const temCiclos = (fat.numero_ciclos || 0) > 0;

    return temDescricaoOuSolucaoOuObs && temCiclos;
  };

  // Fechar modal e resetar estados
  const handleClose = useCallback(() => {
    setSelectedAction(null);
    setShowDescriptionInput(false);
    setDescricao("");
    setLoadingAction(null);
    onClose();
  }, [onClose]);

  // Executar ação
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

        // Chamar callback de sucesso para atualizar a OS
        onSuccess();

        // Fechar modal
        handleClose();
      } catch (error: unknown) {
        console.error("Erro ao executar ação:", error);

        // Mostrar mensagem de erro
        let mensagemErro = "Erro ao executar a ação. Tente novamente.";

        if (error && typeof error === "object") {
          if (
            "response" in error &&
            error.response &&
            typeof error.response === "object" &&
            "data" in error.response &&
            error.response.data &&
            typeof error.response.data === "object" &&
            "mensagem" in error.response.data &&
            typeof error.response.data.mensagem === "string"
          ) {
            mensagemErro = error.response.data.mensagem;
          } else if ("message" in error && typeof error.message === "string") {
            mensagemErro = error.message;
          }
        }

        alert(mensagemErro);
      } finally {
        setLoadingAction(null);
      }
    },
    [os?.id_os, onSuccess, handleClose]
  );

  // Lidar com ação selecionada
  const handleActionClick = useCallback(
    (action: string) => {
      if (ACOES_COM_DESCRICAO.includes(action)) {
        setSelectedAction(action);
        setShowDescriptionInput(true);
        setDescricao("");
      } else {
        // Executar diretamente para ações sem descrição
        executarAcao(action);
      }
    },
    [executarAcao]
  );

  // Confirmar ação com descrição
  const handleConfirmWithDescription = useCallback(() => {
    if (selectedAction) {
      executarAcao(selectedAction, descricao);
    }
  }, [selectedAction, descricao, executarAcao]);

  // Cancelar entrada de descrição
  const handleCancelDescription = useCallback(() => {
    setSelectedAction(null);
    setShowDescriptionInput(false);
    setDescricao("");
  }, []);

  // Definir ações disponíveis baseadas nas condições
  const getAvailableActions = (): Array<{
    key: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> => {
    if (!os) return [];

    const actions = [];
    const semPendencia = !temPendencia(os);
    const comLiberacao = temLiberacaoFinanceira(os);
    const fatAtiva = getFatAtivaTecnico(os);
    const fatDeslocamento = getFatDeslocamentoTecnico(os);

    // 1. Iniciar deslocamento
    if (semPendencia && comLiberacao && !fatAtiva && !fatDeslocamento) {
      actions.push({
        key: "iniciar_deslocamento",
        label: "Iniciar deslocamento",
        icon: MapPin,
      });
    }

    // 2. Iniciar atendimento
    if (semPendencia && comLiberacao && !fatAtiva) {
      actions.push({
        key: "iniciar_atendimento",
        label: "Iniciar Atendimento",
        icon: Play,
      });
    }

    // 3. Pausar atendimento
    if (semPendencia && comLiberacao && fatAtiva?.status_fat === "4") {
      actions.push({
        key: "pausar_atendimento",
        label: "Pausar Atendimento",
        icon: Pause,
      });
    }

    // 4. Retomar atendimento
    if (semPendencia && comLiberacao && fatAtiva?.status_fat === "5") {
      actions.push({
        key: "retomar_atendimento",
        label: "Retomar Atendimento",
        icon: RotateCcw,
      });
    }

    // 5. Interromper atendimento
    if (
      fatAtiva &&
      (fatAtiva.status_fat === "4" || fatAtiva.status_fat === "5")
    ) {
      actions.push({
        key: "interromper_atendimento",
        label: "Interromper",
        icon: StopCircle,
      });
    }

    // 6. Cancelar atendimento
    if (
      fatAtiva &&
      (fatAtiva.status_fat === "4" || fatAtiva.status_fat === "5")
    ) {
      actions.push({
        key: "cancelar_atendimento",
        label: "Cancelar",
        icon: XCircle,
      });
    }

    // 7. Concluir OS
    const osNaoRevisadaNemConcluida =
      os.situacao_os?.codigo !== OS_STATUS.EM_REVISAO &&
      os.situacao_os?.codigo !== OS_STATUS.CONCLUIDA;

    if (
      semPendencia &&
      comLiberacao &&
      osNaoRevisadaNemConcluida &&
      fatAtiva &&
      (fatAtiva.status_fat === "4" || fatAtiva.status_fat === "5") &&
      fatTemDadosObrigatorios(fatAtiva)
    ) {
      actions.push({
        key: "concluir_os",
        label: "Concluir OS",
        icon: CheckCircle,
      });
    }

    return actions;
  };

  const getButtonStyles = (actionKey: string) => {
    const isLoading = loadingAction === actionKey;
    const isDisabled = loadingAction !== null && loadingAction !== actionKey;

    let baseStyles =
      "group relative flex items-center gap-3 p-4 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98] bg-gray-50 border border-[#7c54bd] text-[#7c54bd] shadow-sm";

    if (isDisabled) {
      baseStyles += " opacity-50 cursor-not-allowed";
    } else if (!isLoading) {
      baseStyles += " hover:bg-gray-100";
    }

    return baseStyles;
  };

  const availableActions = getAvailableActions();
  const hasAnyLoading = loadingAction !== null;

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
              <span className="font-medium">
                {selectedAction === "pausar_atendimento" &&
                  "Pausar Atendimento"}
                {selectedAction === "retomar_atendimento" &&
                  "Retomar Atendimento"}
                {selectedAction === "interromper_atendimento" &&
                  "Interromper Atendimento"}
                {selectedAction === "cancelar_atendimento" &&
                  "Cancelar Atendimento"}
                {selectedAction === "concluir_os" && "Concluir OS"}
              </span>
            </div>

            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Digite uma descrição (opcional)..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7c54bd] focus:border-transparent resize-none"
              rows={3}
              disabled={hasAnyLoading}
            />

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
                disabled={hasAnyLoading}
                className="flex-1 px-4 py-3 bg-[#7c54bd] text-white rounded-xl text-sm font-medium hover:bg-[#6a4ba0] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
