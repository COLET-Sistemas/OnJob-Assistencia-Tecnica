// /api/services/login.ts
import { criptografarSenha } from "@/utils/cryptoPassword";
import {
  clearCadastroPermission,
  setCadastroPermission,
} from "@/utils/cadastroPermission";

export interface Empresa {
  id_empresa: number;
  razao_social: string;
  cnpj: string;
  nome_bd: string;
  nome: string;
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
  super_admin?: boolean;
  perfil: {
    interno: boolean;
    gestor: boolean;
    tecnico_proprio: boolean;
    tecnico_terceirizado: boolean;
    admin: boolean;
    permite_cadastros?: boolean;
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

  static async authenticate(
    login: string,
    senha: string
  ): Promise<LoginResponse> {
    if (!login.trim() || !senha.trim()) {
      throw new Error("Login e senha sÃ£o obrigatÃ³rios");
    }

    const loginData: LoginRequest = {
      login: login.trim(),
      senha_criptografada: criptografarSenha(senha),
    };

    try {
      // Usando o proxy interno para evitar problemas de CORS
      const loginUrl = this.resolveEndpoint("/login");

      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
        credentials: "same-origin",
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
        throw new Error(`Erro na requisiÃ§Ã£o: ${response.status}`);
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
      throw new Error("Erro desconhecido durante a autenticaÃ§Ã£o");
    }
  }

  static hasAdminAccess(perfil: LoginResponse["perfil"]): boolean {
    return perfil.interno || perfil.gestor || perfil.admin;
  }

  static hasTechAccess(perfil: LoginResponse["perfil"]): boolean {
    return perfil.tecnico_proprio || perfil.tecnico_terceirizado;
  }

  /**
   * Salva os dados do usuÃ¡rio no localStorage e cookie
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
      localStorage.setItem(
        "super_admin",
        String(authData.super_admin || false)
      );

      const permiteCadastros =
        typeof authData.perfil.permite_cadastros === "boolean"
          ? authData.perfil.permite_cadastros
          : true;
      setCadastroPermission(permiteCadastros);
      localStorage.setItem("versao_api", String(authData.versao_api || ""));

      // Definir cookie para o middleware
      const expirationDate = new Date();
      expirationDate.setTime(expirationDate.getTime() + 24 * 60 * 60 * 1000); // 24 horas

      // Configurar o cookie com valores seguros para o ambiente
      const secure = window.location.protocol === "https:" ? "; Secure" : "";

      // Configurar o cookie com SameSite=Lax para melhor compatibilidade
      document.cookie = `token=${
        authData.token
      }; expires=${expirationDate.toUTCString()}; path=/; SameSite=Lax${secure}`;

      // Dados da empresa (se disponÃ­vel)
      if (authData.empresa) {
        const empresaObj = {
          nome_bd: authData.empresa.nome_bd || "",
          nome: authData.empresa.nome || "",
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
      throw new Error("Erro ao salvar dados de sessÃ£o");
    }
  }

  /**
   * Limpa os dados de sessÃ£o
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
      "active_module",
      "super_admin",
    ];

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });

    clearCadastroPermission();

    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `active_module=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax${secure}`;
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

  /**
   * Verifica se o usuário é super admin
   */
  static isSuperAdmin(): boolean {
    if (typeof window === "undefined") return false;

    const superAdmin = localStorage.getItem("super_admin");
    return superAdmin === "true";
  }

  private static resolveEndpoint(path: string): string {
    if (
      typeof window !== "undefined" &&
      window.location.hostname === "localhost"
    ) {
      return `/api-proxy${path}`;
    }

    if (!this.API_URL) {
      throw new Error("URL da API não configurada");
    }

    return `${this.API_URL}${path}`;
  }

  static async fetchEmpresas(token: string): Promise<Empresa[]> {
    const empresasUrl = this.resolveEndpoint("/empresas");

    try {
      const response = await fetch(empresasUrl, {
        method: "GET",
        headers: this.createAuthorizedHeaders(token),
        credentials: "same-origin",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sessão expirada. Faça login novamente.");
        }
        if (response.status === 403) {
          throw new Error("Acesso negado ao listar empresas.");
        }
        if (response.status >= 500) {
          throw new Error("Erro no servidor ao carregar empresas.");
        }
        throw new Error(`Erro ao buscar empresas: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        return data as Empresa[];
      }

      if (data && Array.isArray(data.empresas)) {
        return data.empresas as Empresa[];
      }

      throw new Error("Resposta inválida ao buscar empresas.");
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Erro desconhecido ao buscar empresas.");
    }
  }

  static async impersonateEmpresa(
    token: string,
    idEmpresa: number
  ): Promise<LoginResponse> {
    if (!idEmpresa) {
      throw new Error("Selecione uma empresa válida.");
    }

    const impersonateUrl = this.resolveEndpoint("/impersonate_empresa");

    try {
      const response = await fetch(impersonateUrl, {
        method: "POST",
        headers: this.createAuthorizedHeaders(token),
        body: JSON.stringify({ id_empresa: idEmpresa }),
        credentials: "same-origin",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sessão expirada. Faça login novamente.");
        }
        if (response.status === 403) {
          throw new Error("Acesso negado para impersonar empresa.");
        }
        if (response.status >= 500) {
          throw new Error("Erro no servidor ao impersonar empresa.");
        }
        throw new Error(`Erro ao impersonar empresa: ${response.status}`);
      }

      const data: LoginResponse = await response.json();

      if (!data?.token) {
        throw new Error("Resposta inválida ao impersonar empresa.");
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Erro desconhecido ao impersonar empresa.");
    }
  }

  private static createAuthorizedHeaders(token: string) {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Token": token,
    };
  }
}
