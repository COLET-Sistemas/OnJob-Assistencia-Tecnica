"use client";

import { ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";
import CadastroPermissionGuard from "@/components/admin/common/CadastroPermissionGuard";

const RESTRICTED_SEGMENTS = ["novo", "editar", "vincular", "definir", "inativar"];

interface CadastroPermissionBoundaryProps {
  children: ReactNode;
}

const CadastroPermissionBoundary = ({
  children,
}: CadastroPermissionBoundaryProps) => {
  const pathname = usePathname();

  const shouldGuard = useMemo(() => {
    if (!pathname) {
      return false;
    }

    return RESTRICTED_SEGMENTS.some((segment) =>
      pathname.split("/").includes(segment)
    );
  }, [pathname]);

  if (!shouldGuard) {
    return <>{children}</>;
  }

  return (
    <CadastroPermissionGuard redirectTo="/admin/cadastro">
      {children}
    </CadastroPermissionGuard>
  );
};

export default CadastroPermissionBoundary;

