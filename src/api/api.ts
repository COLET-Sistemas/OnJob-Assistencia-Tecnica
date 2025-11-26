import { authService } from "./services/authService";

interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

// Configurações base da API - sempre usa o proxy interno para garantir envio de cookies
export const API_CONFIG = {
  baseURL: "/api-proxy",
  headers: {
    "Content-Type": "application/json",
  },
};

// Token agora fica apenas em cookie HttpOnly; não deve ser acessado via client-side
export const getToken = (): string => "";

// Headers padrão sem token explícito (token é injetado pelo middleware via cookie)
export const createHeaders = () => {
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
    const friendlyMessage =
      "Sessão encerrada: novo login efetuado neste usuário.";
    sessionStorage.setItem("loginRedirectReason", friendlyMessage);
    authService.logout();
    window.location.href = "/";
  }
};

// Variável para controlar o tempo entre exibições de mensagens de erro 403
let lastForbiddenErrorTime = 0;
const ERROR_COOLDOWN_MS = 3000;

// Função para lidar com erros de acesso negado (403)
const handleForbiddenError = (message: string) => {
  if (typeof window !== "undefined") {
    const now = Date.now();
    if (now - lastForbiddenErrorTime < ERROR_COOLDOWN_MS) {
      return;
    }

    lastForbiddenErrorTime = now;

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
    credentials: "include",
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

      const createApiError = (message: string, data?: unknown): ApiError => {
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

        if (status === 500) {
          console.error("API 500 error details:", errorData);
        }

        if (response.status === 401) {
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

        if (response.status === 403) {
          handleForbiddenError(apiMessage || "Acesso negado");
          const forbiddenError = createApiError(
            apiMessage || "Acesso negado",
            errorData
          );
          forbiddenError.name = "ForbiddenError";
          throw forbiddenError;
        }

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

    if (response.status === 204) {
      return {} as T;
    }

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

    return response.json() as Promise<T>;
  } catch (error) {
    console.error("Erro na API:", error);
    throw error;
  }
};

// API com métodos HTTP específicos
const api = {
  get: <T>(endpoint: string, options: RequestOptions = {}) => {
    const { params, ...restOptions } = options;
    const queryString = buildQueryString(params);

    return apiRequest<T>(`${endpoint}${queryString}`, {
      method: "GET",
      ...restOptions,
    });
  },

  post: <T>(endpoint: string, data: unknown, options: RequestOptions = {}) => {
    return apiRequest<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
      ...options,
    });
  },

  put: <T>(endpoint: string, data: unknown, options: RequestOptions = {}) => {
    return apiRequest<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
      ...options,
    });
  },

  delete: <T>(endpoint: string, options: RequestOptions = {}) => {
    const { params, ...restOptions } = options;

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

  patch: <T>(endpoint: string, data: unknown, options: RequestOptions = {}) => {
    return apiRequest<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
      ...options,
    });
  },
};

export default api;
