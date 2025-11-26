// /api/services/login.ts
import { criptografarSenha } from "@/utils/cryptoPassword";
import {
  clearCadastroPermission,
  setCadastroPermission,
} from "@/utils/cadastroPermission";
import type { LicencaTipo } from "@/types/licenca";

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
  licenca_tipo?: LicencaTipo | null;
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
      throw new Error("Login e senha s\u00e3o obrigat\u00f3rios");
    }

    const loginData: LoginRequest = {
      login: login.trim(),
      senha_criptografada: criptografarSenha(senha),
    };

    try {
      const loginUrl = "/api/auth/login";

      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Credenciais inv\u00e1lidas");
        }
        if (response.status === 403) {
          throw new Error("Acesso negado");
        }
        if (response.status >= 500) {
          throw new Error("Erro no servidor. Tente novamente mais tarde");
        }
        throw new Error(`Erro na requisi\u00e7\u00e3o: ${response.status}`);
      }

      const data: LoginResponse = await response.json();

      if (!data.token) {
        throw new Error("Resposta inv\u00e1lida do servidor");
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Erro desconhecido durante a autentica\u00e7\u00e3o");
    }
  }

  static hasAdminAccess(perfil: LoginResponse["perfil"]): boolean {
    return perfil.interno || perfil.gestor || perfil.admin;
  }

  static hasTechAccess(perfil: LoginResponse["perfil"]): boolean {
    return perfil.tecnico_proprio || perfil.tecnico_terceirizado;
  }

  /**
   * Salva os dados do usu\u00e1rio sem persistir o token no localStorage
   */
  static saveUserData(authData: LoginResponse): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem("email", authData.email);
      localStorage.setItem("id_usuario", String(authData.id_usuario));
      localStorage.setItem("nome_usuario", authData.nome_usuario);
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

      if (authData.empresa) {
        const storedLicencaTipo: LicencaTipo | null =
          authData.empresa.licenca_tipo ?? null;
        const empresaObj = {
          nome_bd: authData.empresa.nome_bd || "",
          nome: authData.empresa.nome || "",
          razao_social: authData.empresa.razao_social || "",
          id_empresa: authData.empresa.id_empresa,
          cnpj: authData.empresa.cnpj || "",
          usuarios_ativos: authData.empresa.usuarios_ativos || 0,
          usuarios_cadastrados: authData.empresa.usuarios_cadastrados || 0,
          usuarios_licenciados: authData.empresa.usuarios_licenciados || 0,
          latitude: authData.empresa.latitude ? Number(authData.empresa.latitude) : undefined,
          longitude: authData.empresa.longitude ? Number(authData.empresa.longitude) : undefined,
          data_validade: authData.empresa.data_validade || "",
          licenca_demo: !!authData.empresa.licenca_demo,
          licenca_tipo: storedLicencaTipo,
          cep: authData.empresa.cep || "",
          bairro: authData.empresa.bairro || "",
          cidade: authData.empresa.cidade || "",
          endereco: authData.empresa.endereco || "",
          numero: authData.empresa.numero || "",
          uf: authData.empresa.uf || "",
        };
        localStorage.setItem("empresa", JSON.stringify(empresaObj));
        if (storedLicencaTipo) {
          localStorage.setItem("licenca_tipo", storedLicencaTipo);
        } else {
          localStorage.removeItem("licenca_tipo");
        }
      }
    } catch (error) {
      console.error("Erro ao salvar dados no localStorage:", error);
      throw new Error("Erro ao salvar dados de sess\u00e3o");
    }
  }

  /**
   * Limpa os dados de sess\u00e3o
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
      "licenca_tipo",
    ];

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });

    clearCadastroPermission();

    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `active_module=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax${secure}`;
  }

  /**
   * Verifica se h\u00e1 dados de sess\u00e3o v\u00e1lidos
   */
  static hasValidSession(): boolean {
    if (typeof window === "undefined") return false;

    const userId = localStorage.getItem("id_usuario");
    return document.cookie.includes("session_active=true") && Boolean(userId);
  }

  /**
   * Verifica se o usu\u00e1rio \u00e9 super admin
   */
  static isSuperAdmin(): boolean {
    if (typeof window === "undefined") return false;

    const superAdmin = localStorage.getItem("super_admin");
    return superAdmin === "true";
  }

  private static resolveEndpoint(path: string): string {
    return `/api-proxy${path}`;
  }

  static async fetchEmpresas(): Promise<Empresa[]> {
    const empresasUrl = this.resolveEndpoint("/empresas");

    try {
      const response = await fetch(empresasUrl, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sess\u00e3o expirada. Fa\u00e7a login novamente.");
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

      throw new Error("Resposta inv\u00e1lida ao buscar empresas.");
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Erro desconhecido ao buscar empresas.");
    }
  }

  static async impersonateEmpresa(
    idEmpresa: number
  ): Promise<LoginResponse> {
    if (!idEmpresa) {
      throw new Error("Selecione uma empresa v\u00e1lida.");
    }

    const impersonateUrl = this.resolveEndpoint("/impersonate_empresa");

    try {
      const response = await fetch(impersonateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id_empresa: idEmpresa }),
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sess\u00e3o expirada. Fa\u00e7a login novamente.");
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
        throw new Error("Resposta inv\u00e1lida ao impersonar empresa.");
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Erro desconhecido ao impersonar empresa.");
    }
  }
}
