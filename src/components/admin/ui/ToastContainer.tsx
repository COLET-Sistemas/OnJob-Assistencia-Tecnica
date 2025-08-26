"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useId,
} from "react";
import { Toast, ToastProps } from "../ui/Toast";

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, "id" | "onClose">) => void;
  showSuccess: (
    title: string,
    message?: string | Record<string, unknown>
  ) => void;
  showError: (
    title: string,
    message?: string | Record<string, unknown>
  ) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de um ToastProvider");
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const idPrefix = useId();

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastProps, "id" | "onClose">) => {
      const id = `${idPrefix}-${Date.now()}`;
      const newToast: ToastProps = {
        ...toast,
        id,
        onClose: removeToast,
      };

      setToasts((prev) => [...prev, newToast]);
    },
    [removeToast, idPrefix]
  );

  const showSuccess = useCallback(
    (title: string, message?: string | Record<string, unknown>) => {
      // Se message é um objeto da API, extrair a mensagem
      let finalMessage = message;
      if (message && typeof message === "object") {
        if ("mensagem" in message && typeof message.mensagem === "string") {
          finalMessage = message.mensagem;
        } else if (
          "message" in message &&
          typeof message.message === "string"
        ) {
          finalMessage = message.message;
        } else {
          finalMessage = undefined;
        }
      }
      showToast({ type: "success", title, message: finalMessage as string });
    },
    [showToast]
  );

  const showError = useCallback(
    (title: string, message?: string | Record<string, unknown>) => {
      // Se message é um objeto de erro da API, extrair a mensagem
      let finalMessage = message;
      if (message && typeof message === "object") {
        if ("mensagem" in message && typeof message.mensagem === "string") {
          finalMessage = message.mensagem;
        } else if (
          "message" in message &&
          typeof message.message === "string"
        ) {
          finalMessage = message.message;
        } else {
          finalMessage = "Ocorreu um erro inesperado. Tente novamente.";
        }
      }
      showToast({ type: "error", title, message: finalMessage as string });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (title: string, message?: string) => {
      showToast({ type: "warning", title, message });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (title: string, message?: string) => {
      showToast({ type: "info", title, message });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}

      <div className="fixed top-4 right-4 z-50 space-y-2" id="toast-container">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
