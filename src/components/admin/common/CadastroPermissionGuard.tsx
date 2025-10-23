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
  message = "VocÃª nÃ£o possui permissÃ£o para acessar esta Ã¡rea.",
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
          text="Verificando permissÃµes..."
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


