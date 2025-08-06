'use client';

import { FeedbackType } from '@/context/FeedbackContext';
import toast from 'react-hot-toast';

// Cores do sistema conforme definido no globals.css
const colorStyles = {
    success: {
        background: 'var(--secondary-green)',
        color: 'var(--dark-navy)',
        icon: '✓',
    },
    error: {
        background: '#FF6568', // Using red from CSS
        color: 'var(--neutral-white)',
        icon: '✗',
    },
    warning: {
        background: 'var(--secondary-yellow)',
        color: 'var(--dark-navy)',
        icon: '⚠',
    },
    info: {
        background: 'var(--primary)',
        color: 'var(--neutral-white)',
        icon: 'ℹ',
    },
};

/**
 * Exibe uma notificação toast
 * @param message Mensagem a ser exibida
 * @param type Tipo de notificação (success, error, warning, info)
 */
export const showToast = (message: string, type: FeedbackType = 'info'): void => {
    const { background, color, icon } = colorStyles[type];

    toast(message, {
        duration: 3000,
        position: 'top-right',
        icon,
        style: {
            background,
            color,
            fontWeight: '600',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
    });
};

/**
 * Exibe um alerta mais proeminente
 * @param message Mensagem a ser exibida
 * @param type Tipo de alerta (success, error, warning, info)
 */
export const showAlert = (message: string, type: FeedbackType = 'info'): void => {
    const { background, color, icon } = colorStyles[type];

    toast(message, {
        duration: 5000,
        position: 'top-center',
        icon,
        style: {
            background,
            color,
            fontWeight: '600',
            padding: '16px',
            maxWidth: '500px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
    });
};

/**
 * Remove todas as notificações ativas
 */
export const dismissAllFeedback = (): void => {
    toast.dismiss();
};

// Objeto para exportação simplificada
export const feedback = {
    toast: showToast,
    alert: showAlert,
    dismissAll: dismissAllFeedback,
};
