import { authService } from "./services/authService";

interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

// Função para determinar a baseURL da API com base no ambiente
const getBaseUrl = (): string => {
  // Em ambiente de desenvolvimento local, use o proxy para evitar problemas de CORS
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    return "/api-proxy"; // Usa o proxy definido no next.config.ts
  }

  // Em outros ambientes, use a URL da API diretamente
  return process.env.NEXT_PUBLIC_API_URL || "";
};

// Configurações da API
export const API_CONFIG = {
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
};

// Função para obter o token (client-side only)
export const getToken = (): string => {
  if (typeof window !== "undefined") {
    // Primeiro tenta obter do localStorage
    const token = localStorage.getItem("token");

    // Se não encontrou no localStorage, tenta obter do cookie
    if (!token) {
      // Função para obter valor de um cookie específico
      const getCookie = (name: string): string | null => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
          return parts.pop()?.split(";").shift() || null;
        }
        return null;
      };

      // Verifica se existe no cookie
      const tokenCookie = getCookie("token");
      if (tokenCookie) {
        // Se encontrado no cookie, sincroniza com localStorage
        localStorage.setItem("token", tokenCookie);
        return tokenCookie;
      }

      throw new Error("Token não encontrado");
    }
    return token;
  }
  return "";
};

// Função para criar headers com token
export const createHeaders = () => {
  if (typeof window !== "undefined") {
    try {
      const token = getToken();
      return {
        ...API_CONFIG.headers,
        Authorization: `Bearer ${token}`,
        "X-Token": token, 
      };
    } catch (error) {
      console.error("Erro ao obter token para headers:", error);

      return API_CONFIG.headers;
    }
  }
  return API_CONFIG.headers;
};

// Função para converter objeto de parâmetros em string de consulta
export const buildQueryString = (
  params?: Record<string, string | number | boolean>
): string => {
  if (!params || Object.keys(params).length === 0) return "";

  return (
    "?" +
    Object.entries(params)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== ""
      )
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
      )
      .join("&")
  );
};

// Tipo para opções de requisição
interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
}

// Função para lidar com erros de sessão encerrada
const handleSessionExpiredError = () => {
  if (typeof window !== "undefined") {
    // Armazenar uma mensagem amigável para exibir na página de login
    const friendlyMessage =
      "Sessão encerrada: novo login efetuado neste usuário.";
    sessionStorage.setItem("loginRedirectReason", friendlyMessage);

    // Fazer logout para limpar os dados de autenticação
    authService.logout();

    // Redirecionar para a página inicial (login)
    window.location.href = "/";
  }
};

// Variável para controlar o tempo entre exibições de mensagens de erro 403
let lastForbiddenErrorTime = 0;
const ERROR_COOLDOWN_MS = 3000; 

// Função para lidar com erros de acesso negado (403)
const handleForbiddenError = (message: string) => {
  if (typeof window !== "undefined") {
    // Prevenir múltiplas mensagens de erro em sequência rápida
    const now = Date.now();
    if (now - lastForbiddenErrorTime < ERROR_COOLDOWN_MS) {
      return; 
    }

    lastForbiddenErrorTime = now;

    // Usamos um evento customizado para garantir que qualquer componente possa escutar
    window.dispatchEvent(
      new CustomEvent("api:forbidden", {
        detail: {
          message: message || "Acesso negado para este recurso",
        },
      })
    );
  }
};

// Função genérica para fazer requisições
const apiRequest = async <T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> => {
  const url = `${API_CONFIG.baseURL}${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      ...createHeaders(),
      ...options.headers,
    },
    credentials:
      typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "same-origin" 
        : "include", 
  };

  try {
    const response = await fetch(url, config);

    if (
      typeof window !== "undefined" &&
      document.cookie.includes("clearLocalStorage=true")
    ) {
      console.warn("Detectado sinal de limpeza de localStorage do servidor");
      authService.logout();
      window.location.href =
        "/?authError=Sessão expirada. Faça login novamente.";
      throw new Error("Sessão encerrada pelo servidor");
    }

    if (!response.ok) {
      const errorText = await response.text();
      const status = response.status;

      const createApiError = (
        message: string,
        data?: unknown
      ): ApiError => {
        const error = new Error(message || "Erro na API") as ApiError;
        error.status = status;
        if (data !== undefined) {
          error.data = data;
        }
        return error;
      };

      try {
        const errorData = JSON.parse(errorText);

        const apiMessage =
          errorData?.erro ||
          errorData?.error ||
          errorData?.message ||
          errorData?.mensagem;

        const errorDetail = errorData?.detalhe || errorData?.detail || "";

        // Log detailed error information for debugging
        if (status === 500) {
          console.error("API 500 error details:", errorData);
        }

        // Tratamento de erros de autenticação (401)
        if (response.status === 401) {
          // Verificar se é o erro específico de sessão encerrada
          if (
            apiMessage === "Sessão encerrada: novo login efetuado neste usuário"
          ) {
            handleSessionExpiredError();
            const sessionError = createApiError(
              "Sessão encerrada devido a um novo login. Por favor, faça login novamente.",
              errorData
            );
            throw sessionError;
          }

          // Outros erros de autenticação
          console.warn("Erro de autenticação na API:", apiMessage);
          authService.logout();
          if (typeof window !== "undefined") {
            window.location.href =
              "/?authError=Sessão expirada. Faça login novamente.";
          }
          const authError = createApiError(
            "Sua sessão expirou. Por favor, faça login novamente.",
            errorData
          );
          throw authError;
        }

        // Tratar erros de status 403 (Forbidden)
        if (response.status === 403) {
          handleForbiddenError(apiMessage || "Acesso negado");
          const forbiddenError = createApiError(
            apiMessage || "Acesso negado",
            errorData
          );
          forbiddenError.name = "ForbiddenError";
          throw forbiddenError;
        }

        // Include error detail if available
        const fullErrorMessage = errorDetail
          ? `${apiMessage || "Erro na API"}: ${errorDetail}`
          : apiMessage || "Erro desconhecido na API";

        const apiError = createApiError(fullErrorMessage, errorData);
        throw apiError;
      } catch {
        if (response.status === 401) {
          if (
            errorText.includes(
              "Sessão encerrada: novo login efetuado neste usuário"
            )
          ) {
            handleSessionExpiredError();
          } else {
            authService.logout();
            if (typeof window !== "undefined") {
              window.location.href =
                "/?authError=Sessão expirada. Faça login novamente.";
            }
          }
          const sessionError = createApiError(
            "Sessão encerrada. Por favor, faça login novamente."
          );
          throw sessionError;
        }

        // Se for um erro 403, mas não for JSON válido
        if (response.status === 403) {
          handleForbiddenError(errorText || "Acesso negado");
          const forbiddenError = createApiError(errorText || "Acesso negado");
          forbiddenError.name = "ForbiddenError";
          throw forbiddenError;
        }

        const fallbackError = createApiError(
          errorText || "Erro inesperado na requisição"
        );
        throw fallbackError;
      }
    }

    // No content (204) ou outros status de sucesso que podem não ter corpo
    if (response.status === 204) {
      return {} as T;
    }

    // Para status 201 (Created), tente obter o corpo da resposta ou retorne um objeto de sucesso padrão
    if (response.status === 201) {
      try {
        const jsonData = await response.json();
        return jsonData as T;
      } catch {
 
        return {
          sucesso: true,
          mensagem: "Operação realizada com sucesso.",
        } as unknown as T;
      }
    }

    // Outros status de sucesso com corpo JSON
    return response.json() as Promise<T>;
  } catch (error) {
    console.error("Erro na API:", error);
    throw error;
  }
};

// API com métodos HTTP específicos
const api = {
  // GET
  get: <T>(endpoint: string, options: RequestOptions = {}) => {
    const { params, ...restOptions } = options;
    const queryString = buildQueryString(params);

    return apiRequest<T>(`${endpoint}${queryString}`, {
      method: "GET",
      ...restOptions,
    });
  },

  // POST
  post: <T>(endpoint: string, data: unknown, options: RequestOptions = {}) => {
    return apiRequest<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
      ...options,
    });
  },

  // PUT
  put: <T>(endpoint: string, data: unknown, options: RequestOptions = {}) => {
    return apiRequest<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
      ...options,
    });
  },

  // DELETE
  delete: <T>(endpoint: string, options: RequestOptions = {}) => {
    const { params, ...restOptions } = options;

    // Validar parâmetros
    if (params && params.id !== undefined) {
      if (params.id === null || params.id === "") {
        console.error("API DELETE: ID inválido:", params.id);
      }
    } else {
      console.warn("API DELETE: chamada sem ID nos parâmetros");
    }

    const queryString = buildQueryString(params);
    const fullEndpoint = `${endpoint}${queryString}`;

    return apiRequest<T>(fullEndpoint, {
      method: "DELETE",
      ...restOptions,
    })
      .then((result) => {
        return result;
      })
      .catch((error) => {
        console.error("API DELETE erro:", error);
        throw error;
      });
  },

  // PATCH
  patch: <T>(endpoint: string, data: unknown, options: RequestOptions = {}) => {
    return apiRequest<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
      ...options,
    });
  },
};

export default api;
