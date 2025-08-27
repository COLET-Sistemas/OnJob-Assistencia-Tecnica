import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  children,
  className = "",
  type = "button",
  disabled = false,
  onClick,
}) => (
  <button
    type={type}
    disabled={isLoading || disabled}
    onClick={onClick}
    className={`
      relative px-6 py-3 rounded-lg font-medium transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      ${className}
    `}
  >
    {isLoading && (
      <Loader2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 animate-spin" />
    )}
    <span className={isLoading ? "opacity-0" : "opacity-100"}>{children}</span>
  </button>
);

export default LoadingButton;
