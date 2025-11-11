/**
 * Componente para exibir conteúdo exclusivo para Super Administradores
 */

import React from "react";
import { isSuperAdmin } from "@/utils/superAdmin";
import { useAuth } from "@/hooks/useAuth";

interface SuperAdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Componente que renderiza conteúdo apenas para super administradores
 * @param children - Conteúdo a ser exibido para super admins
 * @param fallback - Conteúdo alternativo (opcional)
 */
export const SuperAdminOnly: React.FC<SuperAdminOnlyProps> = ({
  children,
  fallback = null,
}) => {
  const { isSuperAdmin: isSuperAdminAuth } = useAuth();

  // Verificação dupla: hook + localStorage
  const isSuperAdminUser = isSuperAdminAuth || isSuperAdmin();

  return isSuperAdminUser ? <>{children}</> : <>{fallback}</>;
};

/**
 * Hook personalizado para verificar se o usuário é super admin
 */
export const useSuperAdmin = () => {
  const { isSuperAdmin: isSuperAdminAuth } = useAuth();

  return {
    isSuperAdmin: isSuperAdminAuth || isSuperAdmin(),
    checkSuperAdmin: isSuperAdmin,
  };
};
