// /api/services/login.ts
import { criptografarSenha } from "@/utils/cryptoPassword";

export interface Empresa {
  id_empresa: number;
  razao_social: string;
  cnpj: string;
  nome_bd: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  latitude: number;
  longitude: number;
  licenca_demo: boolean;
  usuarios_ativos?: number;
  usuarios_cadastrados?: number;
  usuarios_licenciados?: number;
  data_validade?: string;
}

export interface LoginResponse {
  token: string;
  nome_usuario: string;
  id_usuario: number;
  email: string;
  perfil: {
    interno: boolean;
    gestor: boolean;
    tecnico_proprio: boolean;
    tecnico_terceirizado: boolean;
    admin: boolean;
  };
  empresa?: Empresa;
  versao_api?: string | number;
  senha_provisoria?: boolean;
}

export interface LoginRequest {
  login: string;
  senha_criptografada: string;
}

export class LoginService {
  private static readonly API_URL = process.env.NEXT_PUBLIC_API_URL;

  /**
   * Realiza a autenticação do usuário
   */
  static async authenticate(
    login: string,
    senha: string
  ): Promise<LoginResponse> {
    if (!this.API_URL) {
      throw new Error("URL da API não configurada");
    }

    if (!login.trim() || !senha.trim()) {
      throw new Error("Login e senha são obrigatórios");
    }

    const loginData: LoginRequest = {
      login: login.trim(),
      senha_criptografada: criptografarSenha(senha),
    };

    try {
      const response = await fetch(`${this.API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Credenciais inválidas");
        }
        if (response.status === 403) {
          throw new Error("Acesso negado");
        }
        if (response.status >= 500) {
          throw new Error("Erro no servidor. Tente novamente mais tarde");
        }
        throw new Error(`Erro na requisição: ${response.status}`);
      }

      const data: LoginResponse = await response.json();

      if (!data.token) {
        throw new Error("Resposta inválida do servidor");
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Erro desconhecido durante a autenticação");
    }
  }

  /**
   * Verifica se o usuário tem acesso administrativo
   */
  static hasAdminAccess(perfil: LoginResponse["perfil"]): boolean {
    return perfil.interno || perfil.gestor || perfil.admin;
  }

  /**
   * Verifica se o usuário tem acesso técnico
   */
  static hasTechAccess(perfil: LoginResponse["perfil"]): boolean {
    return perfil.tecnico_proprio || perfil.tecnico_terceirizado;
  }

  /**
   * Salva os dados do usuário no localStorage
   */
  static saveUserData(authData: LoginResponse): void {
    if (typeof window === "undefined") return;

    try {
      // Dados principais do usuário
      localStorage.setItem("email", authData.email);
      localStorage.setItem("id_usuario", String(authData.id_usuario));
      localStorage.setItem("nome_usuario", authData.nome_usuario);
      localStorage.setItem("token", authData.token);
      localStorage.setItem("perfil", JSON.stringify(authData.perfil));
      localStorage.setItem("versao_api", String(authData.versao_api || ""));

      // Dados da empresa (se disponível)
      if (authData.empresa) {
        const empresaObj = {
          nome_bd: authData.empresa.nome_bd || "",
          razao_social: authData.empresa.razao_social || "",
          id_empresa: authData.empresa.id_empresa,
          cnpj: authData.empresa.cnpj || "",
          usuarios_ativos: authData.empresa.usuarios_ativos || 0,
          usuarios_cadastrados: authData.empresa.usuarios_cadastrados || 0,
          usuarios_licenciados: authData.empresa.usuarios_licenciados || 0,
          latitude: Number(authData.empresa.latitude) || 0,
          longitude: Number(authData.empresa.longitude) || 0,
          data_validade: authData.empresa.data_validade || "",
          licenca_demo: !!authData.empresa.licenca_demo,
          cep: authData.empresa.cep || "",
          bairro: authData.empresa.bairro || "",
          cidade: authData.empresa.cidade || "",
          endereco: authData.empresa.endereco || "",
          numero: authData.empresa.numero || "",
          uf: authData.empresa.uf || "",
        };
        localStorage.setItem("empresa", JSON.stringify(empresaObj));
      }
    } catch (error) {
      console.error("Erro ao salvar dados no localStorage:", error);
      throw new Error("Erro ao salvar dados de sessão");
    }
  }

  /**
   * Limpa os dados de sessão
   */
  static clearUserData(): void {
    if (typeof window === "undefined") return;

    const keysToRemove = [
      "email",
      "id_usuario",
      "nome_usuario",
      "token",
      "perfil",
      "versao_api",
      "empresa",
    ];

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });
  }

  /**
   * Verifica se há dados de sessão válidos
   */
  static hasValidSession(): boolean {
    if (typeof window === "undefined") return false;

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("id_usuario");

    return !!(token && userId);
  }
}
