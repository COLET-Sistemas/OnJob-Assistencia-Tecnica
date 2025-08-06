// Configurações da API
export const API_CONFIG = {
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
};

// Função para obter o token (client-side only)
export const getToken = (): string => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Token não encontrado');
        }
        return token;
    }
    return '';
};

// Função para criar headers com token
export const createHeaders = () => {
    if (typeof window !== 'undefined') {
        return {
            ...API_CONFIG.headers,
            'X-Token': getToken()
        };
    }
    return API_CONFIG.headers;
};

// Função para converter objeto de parâmetros em string de consulta
export const buildQueryString = (params?: Record<string, string | number | boolean>): string => {
    if (!params || Object.keys(params).length === 0) return '';

    return '?' + Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
};
