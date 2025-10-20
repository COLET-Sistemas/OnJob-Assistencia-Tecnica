import React, { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  onClose?: () => void;
  duration?: number; 
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = "success",
  onClose,
  duration = 3500,
}) => {
  useEffect(() => {
    if (!onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      className={`fixed left-1/2 bottom-6 z-[9999] px-4 py-3 rounded-xl shadow-lg text-sm font-medium border w-[90vw] max-w-xs -translate-x-1/2 transition-all
        ${
          type === "success"
            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
            : "bg-red-100 text-red-800 border-red-200"
        }
      `}
      role="alert"
      style={{ pointerEvents: "auto" }}
    >
      {message}
    </div>
  );
};

export default Toast;
