import { Edit2 } from "lucide-react";
import Link from "next/link";

interface EditButtonProps {
  id: number | string;
  editRoute: string;
  label?: string;
  iconSize?: number;
  className?: string;
  disabled?: boolean;
  iconOnly?: boolean;
}

export const EditButton = ({
  id,
  editRoute,
  label = "Editar",
  iconSize = 15,
  className = "",
  disabled = false,
  iconOnly = false,
}: EditButtonProps) => {
  const cleanRoute = editRoute.endsWith("/")
    ? editRoute.slice(0, -1)
    : editRoute;
  const editUrl = `${cleanRoute}/${id}`;

  const baseClasses = `inline-flex items-center px-3 py-1.5 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] rounded-lg transition-colors gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`;

  if (disabled) {
    return (
      <button disabled className={baseClasses} title={label}>
        <Edit2 size={iconSize} />
        {!iconOnly && <span>{label}</span>}
      </button>
    );
  }

  return (
    <Link href={editUrl} className={baseClasses} title={label}>
      <Edit2 size={iconSize} />
      {iconOnly !== true && <span>{label}</span>}
    </Link>
  );
};
