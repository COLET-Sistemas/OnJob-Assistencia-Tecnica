"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyToken } from "@/utils/jwtUtils";
import { useToast } from "@/components/admin/ui/ToastContainer";

interface AuthGuardProps {
  children: React.ReactNode;
}


const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthGuardInner>{children}</AuthGuardInner>
    </Suspense>
  );
};

// Componente interno que utiliza os hooks que precisam de Suspense
const AuthGuardInner: React.FC<AuthGuardProps> = ({ children }) => {
  const router = useRouter();
  const { showError } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Verificar se existe uma mensagem de erro de autenticação nos parâmetros de consulta
    const authError = searchParams.get("authError");
    if (authError) {
      showError("Autenticação", authError);

      // Remover o parâmetro de consulta da URL sem recarregar a página
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams, showError]);

  useEffect(() => {
    // Verificar autenticação no lado do cliente
    const checkAuth = () => {
      // Verificar token no localStorage
      const token = localStorage.getItem("token");

      if (!token) {
        // Se não houver token, redirecionar para a página de login
        router.push("/?authError=Sua sessão expirou, faça login novamente.");
        return;
      }

      // Verificar se o token é válido
      const { isValid } = verifyToken(token);
      if (!isValid) {
        // Se o token for inválido, limpar localStorage e cookie
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        document.cookie =
          "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

        // Redirecionar para a página de login
        router.push("/?authError=Sua sessão expirou, faça login novamente.");
        return;
      }
    };

    checkAuth();

    // Configurar verificação periódica de autenticação (a cada 5 minutos)
    const intervalId = setInterval(checkAuth, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [router]);

  return children;
};

export default AuthGuard;
