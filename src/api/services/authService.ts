import api from "../api";
import { empresaService } from "./empresaService";

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
      // Limpar localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Limpar cookie
      document.cookie =
        "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      // Limpar dados da empresa
      empresaService.clearEmpresaData();
    }
  }

  saveAuthData(authData: AuthResponse): void {
    if (typeof window !== "undefined") {
      // Salvar no localStorage
      localStorage.setItem("token", authData.token);
      localStorage.setItem("user", JSON.stringify(authData.user));

      // Salvar em cookie para ser acessível pelo middleware
      // Define o cookie com expiração de 24 horas e disponível em todo o site
      const expirationDate = new Date();
      expirationDate.setTime(expirationDate.getTime() + 24 * 60 * 60 * 1000); // 24 horas

      // Garantir que o cookie seja definido corretamente, com menos restrições para funcionar em ambiente de desenvolvimento
      document.cookie = `token=${
        authData.token
      }; expires=${expirationDate.toUTCString()}; path=/;`;
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
}

export const authService = new AuthService();
