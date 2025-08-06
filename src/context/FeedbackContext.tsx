'use client';

import React, { createContext, useContext } from 'react';
import toast, { Toaster } from 'react-hot-toast';

// Types for our feedback system
export type FeedbackType = 'success' | 'error' | 'warning' | 'info';

interface FeedbackContextProps {
    showToast: (message: string, type?: FeedbackType) => void;
    showAlert: (message: string, type?: FeedbackType) => void;
    dismissAll: () => void;
}

// Default styles based on project color scheme
const toastStyles = {
    success: {
        style: {
            background: 'var(--secondary-green)',
            color: 'var(--dark-navy)',
            fontWeight: '600',
        },
        icon: '✓',
    },
    error: {
        style: {
            background: '#FF6568', // Using red from CSS
            color: 'var(--neutral-white)',
            fontWeight: '600',
        },
        icon: '✗',
    },
    warning: {
        style: {
            background: 'var(--secondary-yellow)',
            color: 'var(--dark-navy)',
            fontWeight: '600',
        },
        icon: '⚠',
    },
    info: {
        style: {
            background: 'var(--primary)',
            color: 'var(--neutral-white)',
            fontWeight: '600',
        },
        icon: 'ℹ',
    },
};

const FeedbackContext = createContext<FeedbackContextProps | undefined>(undefined);

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Function to show toast notifications
    const showToast = (message: string, type: FeedbackType = 'info') => {
        const { style, icon } = toastStyles[type];

        toast(message, {
            duration: 3000,
            position: 'top-right',
            icon,
            style,
        });
    };

    // Function to show more prominent alerts
    const showAlert = (message: string, type: FeedbackType = 'info') => {
        const { style, icon } = toastStyles[type];

        toast(message, {
            duration: 5000,
            position: 'top-center',
            icon,
            style: {
                ...style,
                padding: '16px',
                maxWidth: '500px',
            },
        });
    };

    // Function to dismiss all notifications
    const dismissAll = () => {
        toast.dismiss();
    };

    return (
        <FeedbackContext.Provider value={{ showToast, showAlert, dismissAll }}>
            <Toaster
                containerStyle={{
                    top: 20,
                    right: 20,
                }}
                toastOptions={{
                    className: '',
                    duration: 3000,
                    style: {
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    },
                }}
            />
            {children}
        </FeedbackContext.Provider>
    );
};

// Custom hook to use the feedback system
export const useFeedback = (): FeedbackContextProps => {
    const context = useContext(FeedbackContext);

    if (context === undefined) {
        throw new Error('useFeedback must be used within a FeedbackProvider');
    }

    return context;
};
