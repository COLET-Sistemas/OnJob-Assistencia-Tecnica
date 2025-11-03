import React from "react";

interface RevisaoTabProps {
  observacoes: string;
  onObservacoesChange: (value: string) => void;
  onSubmit: (concluirOs: boolean) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  disabled?: boolean;
  submittingAction?: "save" | "conclude" | null;
}

const RevisaoTab: React.FC<RevisaoTabProps> = ({
  observacoes,
  onObservacoesChange,
  onSubmit,
  onCancel,
  isSubmitting = false,
  disabled = false,
  submittingAction = null,
}) => {
  const isActionDisabled = isSubmitting || disabled;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Revisão da Ordem de Serviço
        </h3>
        <label
          htmlFor="observacoes-revisao"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          observaçõesdo revisor
        </label>
        <textarea
          id="observacoes-revisao"
          className="w-full min-h-[160px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          placeholder="Registre aqui detalhes importantes da revisão realizada."
          value={observacoes}
          onChange={(event) => onObservacoesChange(event.target.value)}
          disabled={isSubmitting}
        />
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
              : "Revisão concluida"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RevisaoTab;
