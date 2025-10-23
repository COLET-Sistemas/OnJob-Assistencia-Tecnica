import api from "../api";
import { empresaService } from "./empresaService";
import { clearStoredRoles, setStoredRoles } from "@/utils/userRoles";
import {
  clearCadastroPermission,
  setCadastroPermission,
} from "@/utils/cadastroPermission";

type ModuleType = "admin" | "tecnico";

interface LoginCredentials {
  login: string;
  senha: string;
}

interface ChangePasswordRequest {
  id_usuario: number;
  senha_atual: string;
  nova_senha: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: number;
    nome: string;
    login: string;
    email: string;
    perfil_interno: boolean;
    perfil_gestor_assistencia: boolean;
    perfil_tecnico_proprio: boolean;
    perfil_tecnico_terceirizado: boolean;
    administrador: boolean;
    permite_cadastros?: boolean;
  };
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return api.post<AuthResponse>("/auth/login", credentials);
  }

  async alterarSenha(data: ChangePasswordRequest): Promise<void> {
    return api.patch<void>("/usuarios", data);
  }

  async logout(): Promise<void> {
    if (typeof window !== "undefined") {
      try {
        // 🔹 Apenas limpeza local (sem chamada à API)
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        this.clearActiveModule();
        this.clearRolesCookie();
        clearStoredRoles();
        clearCadastroPermission();

        // Remove cookie do token
        const secure = window.location.protocol === "https:" ? "; secure" : "";
        const sameSite = "; samesite=lax";
        document.cookie = `token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/${secure}${sameSite}`;

        // Limpa dados da empresa
        empresaService.clearEmpresaData();
      } catch (error) {
        console.error("Erro durante logout:", error);
      }
    }
  }

  saveAuthData(authData: AuthResponse, module?: ModuleType): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", authData.token);
      localStorage.setItem("user", JSON.stringify(authData.user));
      const permiteCadastros =
        typeof authData.user.permite_cadastros === "boolean"
          ? authData.user.permite_cadastros
          : true;
      setCadastroPermission(permiteCadastros);

      const expirationDate = new Date();
      expirationDate.setTime(expirationDate.getTime() + 24 * 60 * 60 * 1000);

      const secure = window.location.protocol === "https:" ? "; secure" : "";
      const sameSite = "; samesite=lax";

      document.cookie = `token=${
        authData.token
      }; expires=${expirationDate.toUTCString()}; path=/${secure}${sameSite}`;

      document.cookie =
        "clearLocalStorage=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      if (module) {
        this.setActiveModule(module);
      }

      const roles = {
        admin: authData.user.administrador,
        gestor: authData.user.perfil_gestor_assistencia,
        interno: authData.user.perfil_interno,
        tecnico_proprio: authData.user.perfil_tecnico_proprio,
        tecnico_terceirizado: authData.user.perfil_tecnico_terceirizado,
      };

      setStoredRoles(roles);
      this.setRolesCookie(roles);
    }
  }

  getUser(): AuthResponse["user"] | null {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  isAuthenticated(): boolean {
    if (typeof window !== "undefined") {
      return Boolean(localStorage.getItem("token"));
    }
    return false;
  }

  setActiveModule(module: ModuleType): void {
    if (typeof window === "undefined") return;

    localStorage.setItem("active_module", module);

    const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + 24 * 60 * 60 * 1000);

    const secure = window.location.protocol === "https:" ? "; secure" : "";
    const sameSite = "; samesite=lax";

    document.cookie = `active_module=${module}; expires=${expirationDate.toUTCString()}; path=/${secure}${sameSite}`;
  }

  clearActiveModule(): void {
    if (typeof window === "undefined") return;

    localStorage.removeItem("active_module");

    const secure = window.location.protocol === "https:" ? "; secure" : "";
    const sameSite = "; samesite=lax";

    document.cookie = `active_module=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/${secure}${sameSite}`;
  }

  private setRolesCookie(roles: {
    admin: boolean;
    gestor: boolean;
    interno: boolean;
    tecnico_proprio: boolean;
    tecnico_terceirizado: boolean;
  }): void {
    if (typeof window === "undefined") return;

    const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + 24 * 60 * 60 * 1000);

    const secure = window.location.protocol === "https:" ? "; secure" : "";
    const sameSite = "; samesite=lax";

    const encodedRoles = encodeURIComponent(JSON.stringify(roles));

    document.cookie = `user_roles=${encodedRoles}; expires=${expirationDate.toUTCString()}; path=/${secure}${sameSite}`;
  }

  private clearRolesCookie(): void {
    if (typeof window === "undefined") return;

    const secure = window.location.protocol === "https:" ? "; secure" : "";
    const sameSite = "; samesite=lax";

    document.cookie = `user_roles=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/${secure}${sameSite}`;
  }
}

export const authService = new AuthService();
