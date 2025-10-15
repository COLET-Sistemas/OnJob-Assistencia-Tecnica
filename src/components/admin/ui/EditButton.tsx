import { Edit2 } from "lucide-react";
import Link from "next/link";

interface EditButtonProps {
  id: number | string;
  editRoute: string;
  iconSize?: number;
  className?: string;
  disabled?: boolean;
}

export const EditButton = ({
  id,
  editRoute,
  iconSize = 18, 
  className = "",
  disabled = false,
}: EditButtonProps) => {
  const cleanRoute = editRoute.endsWith("/")
    ? editRoute.slice(0, -1)
    : editRoute;
  const editUrl = `${cleanRoute}/${id}`;

  const baseClasses = `inline-flex items-center justify-center p-2 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`;

  if (disabled) {
    return (
      <button disabled className={baseClasses} title="Editar">
        <Edit2 size={iconSize} />
      </button>
    );
  }

  return (
    <Link href={editUrl} className={baseClasses} title="Editar">
      <Edit2 size={iconSize} />
    </Link>
  );
};
