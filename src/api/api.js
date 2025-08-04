// Configurações da API
const API_CONFIG = {
    baseURL: 'http://localhost:8080',
    headers: {
        'Content-Type': 'application/json'
    }
};

// Função para obter o token
const getToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('Token não encontrado');
    }
    return token;
};

// Função para criar headers com token
const createHeaders = () => {
    return {
        ...API_CONFIG.headers,
        'X-Token': getToken()
    };
};

// Função genérica para fazer requisições
const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_CONFIG.baseURL}${endpoint}`;

    const config = {
        ...options,
        headers: {
            ...createHeaders(),
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error('Erro na API:', error);
        throw error;
    }
};

// Métodos HTTP específicos
const api = {
    // GET
    get: (endpoint, options = {}) => {
        return apiRequest(endpoint, {
            method: 'GET',
            ...options
        });
    },

    // POST
    post: (endpoint, data, options = {}) => {
        return apiRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options
        });
    },

    // PUT
    put: (endpoint, data, options = {}) => {
        return apiRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...options
        });
    },

    // DELETE
    delete: (endpoint, options = {}) => {
        return apiRequest(endpoint, {
            method: 'DELETE',
            ...options
        });
    },

    // PATCH
    patch: (endpoint, data, options = {}) => {
        return apiRequest(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
            ...options
        });
    }
};

// Funções específicas para diferentes recursos
export const clientesAPI = {
    getAll: (params = {}) => api.get('/clientes', { params }),
    getById: (id) => api.get(`/clientes/${id}`),
    create: (clienteData) => api.post('/clientes', clienteData),
    update: (id, clienteData) => api.put(`/clientes/${id}`, clienteData),
    delete: (id) => api.delete(`/clientes/${id}`),
    getById: (id) => api.get(`/clientes/${id}`),
    create: (clienteData) => api.post('/clientes', clienteData),
    update: (id, clienteData) => api.put(`/clientes/${id}`, clienteData),
    delete: (id) => api.delete(`/clientes/${id}`)
};

export const maquinasAPI = {
    getAll: () => api.get('/maquinas'),
    getAllWithInactive: () => api.get('/maquinas?incluir_inativos=S'),
    getById: (id) => api.get(`/maquinas/${id}`),
    create: (maquinaData) => api.post('/maquinas', maquinaData),
    update: (id, maquinaData) => api.put(`/maquinas/${id}`, maquinaData),
    delete: (id) => api.delete(`/maquinas/${id}`)
};

export const usuariosAPI = {
    getAll: () => api.get('/usuarios'),
    getById: (id) => api.get(`/usuarios/${id}`),
    create: (usuarioData) => api.post('/usuarios', usuarioData),
    update: (id, usuarioData) => api.put(`/usuarios/${id}`, usuarioData),
    delete: (id) => api.delete(`/usuarios/${id}`)
};

export const regioesAPI = {
    getAll: () => api.get('/regioes'),
    getAllWithInactive: () => api.get('/regioes?incluir_inativos=S'),
    getById: (id) => api.get(`/regioes/${id}`),
    create: (regiaoData) => api.post('/regioes', regiaoData),
    update: (id, regiaoData) => api.put(`/regioes/${id}`, regiaoData),
    delete: (id) => api.delete(`/regioes/${id}`)
};

export const pecasAPI = {
    getAll: () => api.get('/pecas'),
    getAllWithInactive: () => api.get('/pecas?incluir_inativos=S'),
    getById: (id) => api.get(`/pecas/${id}`),
    create: (pecaData) => api.post('/pecas', pecaData),
    update: (id, pecaData) => api.put(`/pecas/${id}`, pecaData),
    delete: (id) => api.delete(`/pecas/${id}`)
};

export const motivosAtendimentoAPI = {
    getAll: () => api.get('/motivos_atendimento'),
    getById: (id) => api.get(`/motivos_atendimento/${id}`),
    create: (motivoData) => api.post('/motivos_atendimento', motivoData),
    update: (id, motivoData) => api.put(`/motivos_atendimento/${id}`, motivoData),
    delete: (id) => api.delete(`/motivos_atendimento/${id}`)
};

export const motivosPendenciaAPI = {
    getAll: () => api.get('/motivos_pendencia_os'),
    getAllWithInactive: () => api.get('/motivos_pendencia_os?incluir_inativos=S'),
    getById: (id) => api.get(`/motivos_pendencia_os/${id}`),
    create: (motivoData) => api.post('/motivos_pendencia_os', motivoData),
    update: (id, motivoData) => api.put(`/motivos_pendencia_os/${id}`, motivoData),
    delete: (id) => api.delete(`/motivos_pendencia_os/${id}`)
};

export const usuariosRegioesAPI = {
    getAll: () => api.get('/usuarios_regioes'),
    getById: (id) => api.get(`/usuarios_regioes/${id}`),
    create: (data) => api.post('/usuarios_regioes', data),
    update: (id, data) => api.put(`/usuarios_regioes/${id}`, data),
    delete: (id) => api.delete(`/usuarios_regioes/${id}`)
};

// Exportar API genérica também
export default api;