import { Link2 } from "lucide-react";

interface VincularButtonProps {
  onClick: () => void;
  label?: string;
  iconSize?: number;
  className?: string;
  disabled?: boolean;
  iconOnly?: boolean;
}

export const VincularButton = ({
  onClick,
  label = "Vincular Região",
  iconSize = 15,
  className = "",
  disabled = false,
  iconOnly = false,
}: VincularButtonProps) => {
  const baseClasses = `inline-flex items-center px-3 py-1.5 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] rounded-lg transition-colors gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={baseClasses}
      title={label}
    >
      <Link2 size={iconSize} />
      {iconOnly !== true && <span>{label}</span>}
    </button>
  );
};
