"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/api/services/authService";
import { verifyToken } from "@/utils/jwtUtils";
import { useToast } from "@/components/admin/ui/ToastContainer";

// Interface para o usuário com base no payload do token
interface User {
  id: number;
  nome: string;
  login: string;
  email: string;
  perfil_interno: boolean;
  perfil_gestor_assistencia: boolean;
  perfil_tecnico_proprio: boolean;
  perfil_tecnico_terceirizado: boolean;
  administrador: boolean;
  super_admin?: boolean;
}

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  isSuperAdmin: boolean;
  logout: () => Promise<void>;
}

/**
 * Hook personalizado para gerenciar autenticação
 * @returns Objeto com estado de autenticação, usuário e funções de logout
 */
export const useAuth = (): UseAuthReturn => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const router = useRouter();
  const { showError } = useToast();

  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        // Verificar se existe token no localStorage
        const token = localStorage.getItem("token");

        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
          setIsSuperAdmin(false);
          setIsLoading(false);
          return;
        }

        // Verificar se o token é válido
        const { isValid } = verifyToken(token);

        if (!isValid) {
          // Token inválido, limpar dados e atualizar estado
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("super_admin");
          document.cookie =
            "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

          setIsAuthenticated(false);
          setUser(null);
          setIsSuperAdmin(false);
        } else {
          // Token válido
          const userData = authService.getUser();
          const superAdminStatus = authService.isSuperAdmin();
          setIsAuthenticated(true);
          setUser(userData);
          setIsSuperAdmin(superAdminStatus);
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        setIsAuthenticated(false);
        setUser(null);
        setIsSuperAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();

    // Verificar periodicamente (a cada 5 minutos)
    const interval = setInterval(checkAuthStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Função para fazer logout
   */
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setUser(null);
      setIsSuperAdmin(false);
      router.push("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      showError("Erro", "Erro ao fazer logout. Tente novamente.");
    }
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    isSuperAdmin,
    logout,
  };
};
