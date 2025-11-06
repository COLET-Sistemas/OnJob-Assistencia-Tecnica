import React from "react";

interface RevisaoTabProps {
  observacoesRevisao: string;
  onObservacoesRevisaoChange: (value: string) => void;
  observacoesMaquina: string;
  isEditandoObservacoesMaquina: boolean;
  onToggleEditarObservacoesMaquina: (checked: boolean) => void;
  onObservacoesMaquinaChange: (value: string) => void;
  onSubmit: (concluirOs: boolean) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  disabled?: boolean;
  submittingAction?: "save" | "conclude" | null;
}

const RevisaoTab: React.FC<RevisaoTabProps> = ({
  observacoesRevisao,
  onObservacoesRevisaoChange,
  observacoesMaquina,
  isEditandoObservacoesMaquina,
  onToggleEditarObservacoesMaquina,
  onObservacoesMaquinaChange,
  onSubmit,
  onCancel,
  isSubmitting = false,
  disabled = false,
  submittingAction = null,
}) => {
  const isActionDisabled = isSubmitting || disabled;

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revisão da Ordem de Serviço
          </h3>
          <label
            htmlFor="observacoes-revisao"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Observações do revisor
          </label>
          <textarea
            id="observacoes-revisao"
            className="w-full min-h-[160px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            placeholder="Registre aqui detalhes importantes da revisão realizada."
            value={observacoesRevisao}
            onChange={(event) => onObservacoesRevisaoChange(event.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="editar-observacao-maquina"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
            checked={isEditandoObservacoesMaquina}
            onChange={(event) =>
              onToggleEditarObservacoesMaquina(event.target.checked)
            }
            disabled={isSubmitting}
          />
          <label
            htmlFor="editar-observacao-maquina"
            className="text-sm font-medium text-gray-700"
          >
            Editar observação da máquina
          </label>
        </div>

        {isEditandoObservacoesMaquina && (
          <div>
            <label
              htmlFor="observacoes-maquina"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Observação da máquina
            </label>
            <textarea
              id="observacoes-maquina"
              className="w-full min-h-[160px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              placeholder="Atualize as observações da máquina quando necessário."
              value={observacoesMaquina}
              onChange={(event) =>
                onObservacoesMaquinaChange(event.target.value)
              }
              disabled={isSubmitting}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </button>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => onSubmit(false)}
            disabled={isActionDisabled}
          >
            {isSubmitting && submittingAction === "save"
              ? "Salvando..."
              : "Salvar para continuar mais tarde"}
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--primary-dark,#2563eb)] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => onSubmit(true)}
            disabled={isActionDisabled}
          >
            {isSubmitting && submittingAction === "conclude"
              ? "Concluindo..."
              : "Revisão concluída"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RevisaoTab;
