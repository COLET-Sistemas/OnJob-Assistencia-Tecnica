"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ui/ToastContainer";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

/**
 * Componente de proteção para páginas que exigem permissão de administrador
 * Verifica se o usuário atual tem permissão de administrador
 */
const AdminAuthGuard: React.FC<AdminAuthGuardProps> = ({ children }) => {
  const router = useRouter();
  const { showError } = useToast();

  // Estado para controlar se o usuário tem permissão
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  // Ref para controlar se já exibimos uma mensagem de erro
  const hasShownErrorRef = useRef(false);

  // Verificação imediata no momento da montagem do componente,
  // antes de qualquer renderização do conteúdo protegido
  useEffect(() => {
    const checkAdminPermission = () => {
      try {
        setIsChecking(true);

        // Buscar informações do usuário no localStorage
        const userStr = localStorage.getItem("user");

        if (!userStr) {
          // Se não houver dados do usuário, redirecionar para a página inicial
          if (!hasShownErrorRef.current) {
            showError("Acesso negado", "Dados de usuário não encontrados.");
            hasShownErrorRef.current = true;
          }
          router.push("/admin/dashboard");
          setHasPermission(false);
          return;
        }

        // Converter string para objeto
        const user = JSON.parse(userStr);

        // Verificar se o usuário é administrador
        if (!user.administrador) {
          // Se não for administrador, redirecionar para a página inicial
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

        // Tem permissão
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

    // Executar a verificação imediatamente
    checkAdminPermission();
  }, [router, showError]);

  // Não renderiza o conteúdo protegido enquanto estiver verificando permissões
  // ou se o usuário não tiver permissão
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

  // Somente renderiza o conteúdo se o usuário tiver permissão
  return hasPermission ? <>{children}</> : null;
};

export default AdminAuthGuard;
