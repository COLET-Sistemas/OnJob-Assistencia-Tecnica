"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/api/services/authService";
import { useToast } from "@/components/admin/ui/ToastContainer";

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

interface SessionResponse {
  authenticated: boolean;
  user?: User;
}

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  isSuperAdmin: boolean;
  logout: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const router = useRouter();
  const { showError } = useToast();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
        });

        if (!response.ok) {
          setIsAuthenticated(false);
          setUser(null);
          setIsSuperAdmin(false);
          return;
        }

        const data: SessionResponse = await response.json();

        if (data.authenticated && data.user) {
          setIsAuthenticated(true);
          setUser(data.user);
          setIsSuperAdmin(Boolean(data.user.super_admin));
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setIsSuperAdmin(false);
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

    const interval = setInterval(checkAuthStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

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
