import { Link2 } from "lucide-react";

interface VincularButtonProps {
  onClick: () => void;
  iconSize?: number;
  className?: string;
  disabled?: boolean;
}

export const VincularButton = ({
  onClick,
  iconSize = 18,
  className = "",
  disabled = false,
}: VincularButtonProps) => {
  const baseClasses = `
    inline-flex items-center justify-center p-2
    bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20
    text-[var(--primary)] rounded-lg transition-colors
    cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
    ${className}
  `.trim();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={baseClasses}
      title="Vincular Região"
    >
      <Link2 size={iconSize} />
    </button>
  );
};
