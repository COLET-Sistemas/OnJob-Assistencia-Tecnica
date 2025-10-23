"use client";

import { Edit2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useCadastroPermission } from "@/hooks/useCadastroPermission";

interface EditButtonProps {
  id: number | string;
  editRoute: string;
  iconSize?: number;
  className?: string;
  disabled?: boolean;
  disabledTooltip?: string;
  title?: string;
}

export const EditButton = ({
  id,
  editRoute,
  iconSize = 18, 
  className = "",
  disabled = false,
  disabledTooltip,
  title = "Editar",
}: EditButtonProps) => {
  const { hasPermission } = useCadastroPermission();
  const computedDisabled = disabled || !hasPermission;
  const computedTooltip = useMemo(() => {
    if (!computedDisabled) {
      return title;
    }
    if (disabledTooltip) {
      return disabledTooltip;
    }
    return "Seu perfil não permite editar este registro.";
  }, [computedDisabled, disabledTooltip, title]);

  const cleanRoute = editRoute.endsWith("/")
    ? editRoute.slice(0, -1)
    : editRoute;
  const editUrl = `${cleanRoute}/${id}`;

  const baseClasses = `inline-flex items-center justify-center p-2 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`;

  if (computedDisabled) {
    return (
      <button
        type="button"
        disabled
        className={baseClasses}
        title={computedTooltip}
        aria-disabled="true"
      >
        <Edit2 size={iconSize} />
      </button>
    );
  }

  return (
    <Link href={editUrl} className={baseClasses} title={title}>
      <Edit2 size={iconSize} />
    </Link>
  );
};

