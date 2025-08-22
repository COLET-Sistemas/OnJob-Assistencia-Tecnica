"use client";

import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const toastStyles = {
  success: {
    container: "bg-green-50 border-green-200 text-green-800",
    icon: CheckCircle,
    iconColor: "text-green-600",
  },
  error: {
    container: "bg-red-50 border-red-200 text-red-800",
    icon: AlertCircle,
    iconColor: "text-red-600",
  },
  warning: {
    container: "bg-yellow-50 border-yellow-200 text-yellow-800",
    icon: AlertTriangle,
    iconColor: "text-yellow-600",
  },
  info: {
    container: "bg-blue-50 border-blue-200 text-blue-800",
    icon: Info,
    iconColor: "text-blue-600",
  },
};

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side only logic
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const style = toastStyles[type];
  const Icon = style.icon;

  useEffect(() => {
    // Delay initial animation to prevent hydration mismatch
    const enterTimer = setTimeout(() => setIsVisible(true), 10);

    const close = () => {
      setIsExiting(true);
      setTimeout(() => {
        onClose(id);
      }, 300);
    };

    const closeTimer = setTimeout(() => {
      close();
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(closeTimer);
    };
  }, [duration, id, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  // Only render animation effects on client-side
  return (
    <div
      className={`
        relative flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-sm w-full
        transition-all duration-300 ease-out transform
        ${style.container}
        ${
          isMounted && isVisible && !isExiting
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0"
        }
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex-shrink-0">
        <Icon className={`h-5 w-5 ${style.iconColor}`} />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm">{title}</h4>
        {message && (
          <p className="mt-1 text-sm opacity-90 leading-relaxed">{message}</p>
        )}
      </div>

      <button
        onClick={handleClose}
        className={`
          flex-shrink-0 p-1 rounded-full transition-colors
          hover:bg-black/10 focus:bg-black/10 focus:outline-none
        `}
        aria-label="Fechar notificação"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-lg overflow-hidden">
        {isMounted && (
          <div
            className="h-full bg-current opacity-30 rounded-b-lg"
            style={{
              animation: `toast-progress ${duration}ms linear`,
            }}
          />
        )}
      </div>

      <style jsx>{`
        @keyframes toast-progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};
