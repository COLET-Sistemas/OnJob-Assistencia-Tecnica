"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCadastroPermission } from "@/hooks/useCadastroPermission";
import { useToast } from "@/components/admin/ui/ToastContainer";
import { Loading } from "@/components/LoadingPersonalizado";

interface CadastroPermissionGuardProps {
  children: ReactNode;
  redirectTo: string;
  message?: string;
}

const CadastroPermissionGuard = ({
  children,
  redirectTo,
  message = "Você não possui permissão para acessar esta página.",
}: CadastroPermissionGuardProps) => {
  const router = useRouter();
  const { showError } = useToast();
  const { hasPermission, isLoading } = useCadastroPermission();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!hasPermission) {
      showError("Acesso negado", message);
      router.replace(redirectTo);
    }
  }, [hasPermission, isLoading, message, redirectTo, router, showError]);

  if (isLoading) {
    return (
      <div className="py-16">
        <Loading
          fullScreen={false}
          preventScroll={false}
          size="medium"
          text="Verificando permissões..."
        />
      </div>
    );
  }

  if (!hasPermission) {
    return null;
  }

  return <>{children}</>;
};

export default CadastroPermissionGuard;
