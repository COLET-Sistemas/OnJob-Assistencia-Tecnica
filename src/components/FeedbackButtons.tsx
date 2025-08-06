'use client';

import { useFeedback } from '@/context/FeedbackContext';
import React from 'react';

type FeedbackButtonsProps = {
    // You can add props here if needed
} & React.HTMLAttributes<HTMLDivElement>;

/**
 * Component that provides buttons to test the different types of feedback
 */
export const FeedbackButtons: React.FC<FeedbackButtonsProps> = () => {
    const { showToast, showAlert, dismissAll } = useFeedback();

    const buttonBaseClasses = "px-4 py-2 rounded font-medium text-white m-1 transition-all hover:opacity-90";

    return (
        <div className="flex flex-wrap gap-2">
            <button
                className={`${buttonBaseClasses} bg-[var(--primary)]`}
                onClick={() => showToast('Isto é uma mensagem de informação', 'info')}
            >
                Toast Info
            </button>

            <button
                className={`${buttonBaseClasses} bg-[var(--secondary-green)]`}
                onClick={() => showToast('Operação realizada com sucesso!', 'success')}
            >
                Toast Sucesso
            </button>

            <button
                className={`${buttonBaseClasses} bg-[var(--secondary-yellow)] text-[var(--dark-navy)]`}
                onClick={() => showToast('Atenção: campo obrigatório não preenchido.', 'warning')}
            >
                Toast Alerta
            </button>

            <button
                className={`${buttonBaseClasses} bg-red-500`}
                onClick={() => showToast('Erro ao processar a solicitação!', 'error')}
            >
                Toast Erro
            </button>

            <button
                className={`${buttonBaseClasses} bg-[var(--primary)]`}
                onClick={() => showAlert('Isto é um alerta de informação', 'info')}
            >
                Alerta Info
            </button>

            <button
                className={`${buttonBaseClasses} bg-[var(--secondary-green)]`}
                onClick={() => showAlert('Operação realizada com sucesso!', 'success')}
            >
                Alerta Sucesso
            </button>

            <button
                className={`${buttonBaseClasses} bg-[var(--secondary-yellow)] text-[var(--dark-navy)]`}
                onClick={() => showAlert('Atenção: Esta operação exige confirmação.', 'warning')}
            >
                Alerta Aviso
            </button>

            <button
                className={`${buttonBaseClasses} bg-red-500`}
                onClick={() => showAlert('Erro crítico detectado no sistema!', 'error')}
            >
                Alerta Erro
            </button>

            <button
                className={`${buttonBaseClasses} bg-gray-500`}
                onClick={() => dismissAll()}
            >
                Fechar Todos
            </button>
        </div>
    );
};

export default FeedbackButtons;
