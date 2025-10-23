"use client";

import { Link2 } from "lucide-react";
import { useCadastroPermission } from "@/hooks/useCadastroPermission";

interface VincularButtonProps {
  onClick: () => void;
  iconSize?: number;
  className?: string;
  disabled?: boolean;
  title?: string;
  disabledTooltip?: string;
}

export const VincularButton = ({
  onClick,
  iconSize = 18,
  className = "",
  disabled = false,
  title = "Vincular Região",
  disabledTooltip,
}: VincularButtonProps) => {
  const { hasPermission } = useCadastroPermission();
  const computedDisabled = disabled || !hasPermission;
  const buttonTitle = computedDisabled
    ? disabledTooltip || "Você não possui permissão para vincular regiões."
    : title;

  const baseClasses = `
    inline-flex items-center justify-center p-2
    bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20
    text-[var(--primary)] rounded-lg transition-colors
    cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
    ${className}
  `.trim();

  return (
    <button
      onClick={() => {
        if (computedDisabled) {
          return;
        }
        onClick();
      }}
      disabled={computedDisabled}
      className={baseClasses}
      title={buttonTitle}
      aria-disabled={computedDisabled ? "true" : undefined}
      type="button"
    >
      <Link2 size={iconSize} />
    </button>
  );
};


