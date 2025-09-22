"use client";
import React from "react";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  StopCircle,
  CheckCircle,
  XCircle,
  MapPin,
} from "lucide-react";
import {
  OSDetalhadaV2,
  OSFatDetalhado,
} from "@/api/services/ordensServicoService";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
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

const OSActionModal: React.FC<Props> = ({ isOpen, onClose, onAction, os }) => {
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
    // Assumindo que o técnico logado está em localStorage ou context
    const idTecnicoLogado = parseInt(localStorage.getItem("id_usuario") || "0");

    if (!os.fats || os.fats.length === 0) return null;

    // Procurar FAT ativa do técnico (status 4 ou 5)
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
    // Pré-condições: OS sem pendência, com liberação financeira
    if (semPendencia && comLiberacao && !fatAtiva && !fatDeslocamento) {
      actions.push({
        key: "iniciar_deslocamento",
        label: "Iniciar deslocamento",
        icon: MapPin,
      });
    }

    // 2. Iniciar atendimento
    // Pré-condições: OS sem pendência, com liberação financeira
    if (semPendencia && comLiberacao && !fatAtiva) {
      actions.push({
        key: "iniciar_atendimento",
        label: "Iniciar Atendimento",
        icon: Play,
      });
    }

    // 3. Pausar atendimento
    // OS sem pendência, com liberação financeira, existir FAT em 4
    if (semPendencia && comLiberacao && fatAtiva?.status_fat === "4") {
      actions.push({
        key: "pausar_atendimento",
        label: "Pausar Atendimento",
        icon: Pause,
      });
    }

    // 4. Retomar atendimento
    // OS sem pendência, com liberação financeira, existir FAT em 5
    if (semPendencia && comLiberacao && fatAtiva?.status_fat === "5") {
      actions.push({
        key: "retomar_atendimento",
        label: "Retomar Atendimento",
        icon: RotateCcw,
      });
    }

    // 5. Interromper atendimento
    // existir FAT em 4 ou 5. (Ignora pendência/liberação aqui.)
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
    // existir FAT em 4 ou 5. Não pode cancelar se a FAT está em 3 (deslocamento).
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
    // OS sem pendência e com liberação.
    // Existir FAT do técnico em 4 ou 5 (se 3, é erro).
    // Na FAT, já gravados: ao menos um: DESCRICAO_PROBLEMA ou SOLUCAO_ENCONTRADA ou OBSERVACOES
    // e NUMERO_CICLOS > 0
    // OS não pode estar 6 (em revisão) ou 7 (concluída).
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

  const getButtonStyles = () => {
    return "group relative flex items-center gap-3 p-4 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98] hover:bg-gray-100 bg-gray-50 border border-[#7c54bd] text-[#7c54bd] shadow-sm";
  };

  const availableActions = getAvailableActions();

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
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-900">
            Ações Disponíveis
            {os && (
              <span className="block text-sm text-slate-600 font-normal mt-1">
                OS #{os.id_os}
              </span>
            )}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Actions Grid */}
        {availableActions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {availableActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.key}
                  onClick={() => onAction(action.key)}
                  className={getButtonStyles()}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3" />
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
              condições de pendência, liberação financeira ou status das FATs.
            </p>
          </div>
        )}

        {/* Debug Info (remover em produção) */}
        {/* {os && process.env.NODE_ENV === "development" && (
          <div className="mt-6 p-3 bg-slate-50 rounded-lg text-xs">
            <p>
              <strong>Debug:</strong>
            </p>
            <p>Pendência: {temPendencia(os) ? "Sim" : "Não"}</p>
            <p>Liberação: {temLiberacaoFinanceira(os) ? "Sim" : "Não"}</p>
            <p>Status OS: {os.situacao_os?.codigo}</p>
            <p>FAT Ativa: {getFatAtivaTecnico(os)?.status_fat || "Nenhuma"}</p>
          </div>
        )} */}

        {/* Bottom decoration */}
        <div className="mt-6 flex justify-center">
          <div className="w-12 h-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent rounded-full opacity-50"></div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(OSActionModal);
