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
  requiresPermission?: boolean;
}

export const EditButton = ({
  id,
  editRoute,
  iconSize = 18, 
  className = "",
  disabled = false,
  disabledTooltip,
  title = "Editar",
  requiresPermission = true,
}: EditButtonProps) => {
  const { hasPermission } = useCadastroPermission();
  const permissionBlocked = requiresPermission && !hasPermission;
  const computedDisabled = disabled || permissionBlocked;
  const computedTooltip = useMemo(() => {
    if (!computedDisabled) {
      return title;
    }
    if (disabledTooltip) {
      return disabledTooltip;
    }
    return permissionBlocked
      ? "Seu perfil nao permite editar este registro."
      : "Esta acao esta desabilitada.";
  }, [computedDisabled, disabledTooltip, permissionBlocked, title]);

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

