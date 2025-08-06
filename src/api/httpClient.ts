import { API_CONFIG, buildQueryString, createHeaders } from './config';

// Tipo para opções de requisição
interface RequestOptions extends RequestInit {
    params?: Record<string, string | number | boolean>;
    headers?: Record<string, string>;
}

// Função genérica para fazer requisições
const apiRequest = async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
    const url = `${API_CONFIG.baseURL}${endpoint}`;

    const config: RequestInit = {
        ...options,
        headers: {
            ...createHeaders(),
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Erro na requisição: ${response.status} - ${errorData || response.statusText}`);
        }

        // Se a resposta estiver vazia, retorne um objeto vazio para evitar erro de parse JSON
        if (response.status === 204) {
            return {} as T;
        }

        return response.json() as Promise<T>;
    } catch (error) {
        console.error('Erro na API:', error);
        throw error;
    }
};

// Métodos HTTP específicos
const api = {
    // GET
    get: <T>(endpoint: string, options: RequestOptions = {}) => {
        const { params, ...restOptions } = options;
        const queryString = buildQueryString(params);

        return apiRequest<T>(`${endpoint}${queryString}`, {
            method: 'GET',
            ...restOptions
        });
    },

    // POST
    post: <T>(endpoint: string, data: unknown, options: RequestOptions = {}) => {
        return apiRequest<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options
        });
    },

    // PUT
    put: <T>(endpoint: string, data: unknown, options: RequestOptions = {}) => {
        return apiRequest<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...options
        });
    },

    // DELETE
    delete: <T>(endpoint: string, options: RequestOptions = {}) => {
        return apiRequest<T>(endpoint, {
            method: 'DELETE',
            ...options
        });
    },

    // PATCH
    patch: <T>(endpoint: string, data: unknown, options: RequestOptions = {}) => {
        return apiRequest<T>(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
            ...options
        });
    }
};

export default api;
