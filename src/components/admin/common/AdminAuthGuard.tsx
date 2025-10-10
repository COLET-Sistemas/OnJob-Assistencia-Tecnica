"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ui/ToastContainer";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}


const AdminAuthGuard: React.FC<AdminAuthGuardProps> = ({ children }) => {
  const router = useRouter();
  const { showError } = useToast();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  const hasShownErrorRef = useRef(false);


  useEffect(() => {
    const checkAdminPermission = () => {
      try {
        setIsChecking(true);

        const userStr = localStorage.getItem("user");

        if (!userStr) {
          if (!hasShownErrorRef.current) {
            showError("Acesso negado", "Dados de usuário não encontrados.");
            hasShownErrorRef.current = true;
          }
          router.push("/admin/dashboard");
          setHasPermission(false);
          return;
        }

        const user = JSON.parse(userStr);

        if (!user.administrador) {
          if (!hasShownErrorRef.current) {
            showError(
              "Acesso negado",
              "Você não tem permissão para acessar esta página."
            );
            hasShownErrorRef.current = true;
          }
          router.push("/admin/dashboard");
          setHasPermission(false);
          return;
        }

        setHasPermission(true);
      } catch (error) {
        console.error("Erro ao verificar permissão de administrador:", error);
        if (!hasShownErrorRef.current) {
          showError("Erro", "Erro ao verificar permissões. Tente novamente.");
          hasShownErrorRef.current = true;
        }
        router.push("/admin/dashboard");
        setHasPermission(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAdminPermission();
  }, [router, showError]);

  if (isChecking) {
    return (
      <div className="w-full h-[200px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
          <div className="text-gray-600 font-medium">
            Verificando permissões...
          </div>
        </div>
      </div>
    );
  }

  return hasPermission ? <>{children}</> : null;
};

export default AdminAuthGuard;
