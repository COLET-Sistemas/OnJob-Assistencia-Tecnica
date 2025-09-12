import { authService } from "./services/authService";

// Configurações da API
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
};

// Função para obter o token (client-side only)
export const getToken = (): string => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Token não encontrado");
    }
    return token;
  }
  return "";
};

// Função para criar headers com token
export const createHeaders = () => {
  if (typeof window !== "undefined") {
    return {
      ...API_CONFIG.headers,
      "X-Token": getToken(),
    };
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
const ERROR_COOLDOWN_MS = 3000; // 3 segundos de intervalo entre mensagens

// Função para lidar com erros de acesso negado (403)
const handleForbiddenError = (message: string) => {
  // Verifica se o módulo de toast está disponível no lado do cliente
  if (typeof window !== "undefined") {
    // Prevenir múltiplas mensagens de erro em sequência rápida
    const now = Date.now();
    if (now - lastForbiddenErrorTime < ERROR_COOLDOWN_MS) {
      return; // Ignorar esse erro, pois já mostramos um recentemente
    }

    // Atualiza o timestamp da última mensagem
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
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      const status = response.status;

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

        // Verificar se é o erro específico de sessão encerrada
        if (
          response.status === 401 &&
          apiMessage === "Sessão encerrada: novo login efetuado neste usuário"
        ) {
          handleSessionExpiredError();
          throw new Error(
            "Sessão encerrada devido a um novo login. Por favor, faça login novamente."
          );
        }

        // Tratar erros de status 403 (Forbidden)
        if (response.status === 403) {
          handleForbiddenError(apiMessage || "Acesso negado");
          const forbiddenError = new Error(apiMessage || "Acesso negado");
          forbiddenError.name = "ForbiddenError";
          throw forbiddenError;
        }

        // Include error detail if available
        const fullErrorMessage = errorDetail
          ? `${apiMessage || "Erro na API"}: ${errorDetail}`
          : apiMessage || "Erro desconhecido na API";

        throw new Error(fullErrorMessage);
      } catch {
        // Se não for um JSON válido, mas ainda for 401, verificar o texto
        if (
          response.status === 401 &&
          errorText.includes(
            "Sessão encerrada: novo login efetuado neste usuário"
          )
        ) {
          handleSessionExpiredError();
          throw new Error(
            "Sessão encerrada devido a um novo login. Por favor, faça login novamente."
          );
        }

        // Se for um erro 403, mas não for JSON válido
        if (response.status === 403) {
          handleForbiddenError(errorText || "Acesso negado");
          const forbiddenError = new Error(errorText || "Acesso negado");
          forbiddenError.name = "ForbiddenError";
          throw forbiddenError;
        }

        throw new Error(errorText || "Erro inesperado na requisição");
      }
    }

    if (response.status === 204) {
      return {} as T;
    }

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
    return apiRequest<T>(endpoint, {
      method: "DELETE",
      ...options,
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
