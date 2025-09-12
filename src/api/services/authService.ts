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
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      empresaService.clearEmpresaData();
    }
  }

  saveAuthData(authData: AuthResponse): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", authData.token);
      localStorage.setItem("user", JSON.stringify(authData.user));
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
