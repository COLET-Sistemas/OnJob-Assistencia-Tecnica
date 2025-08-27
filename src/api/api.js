export const ordensServicoAPI = {
  getPendentes: (params = {}) =>
    api.get("/ordens_servico", { params: { ...params } }),
};

const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
};

const getToken = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Token não encontrado");
  }
  return token;
};

const createHeaders = () => {
  return {
    ...API_CONFIG.headers,
    "X-Token": getToken(),
  };
};

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.baseURL}${endpoint}`;

  const config = {
    ...options,
    headers: {
      ...createHeaders(),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(
        `Erro na requisição: ${response.status} - ${response.statusText}`
      );
    }

    return response.json();
  } catch (error) {
    console.error("Erro na API:", error);
    throw error;
  }
};

// Função para converter objeto de parâmetros em string de consulta
const buildQueryString = (params) => {
  if (!params || Object.keys(params).length === 0) return "";

  return (
    "?" +
    Object.entries(params)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== ""
      )
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join("&")
  );
};

const api = {
  // GET
  get: (endpoint, options = {}) => {
    const { params, ...restOptions } = options;
    const queryString = buildQueryString(params);

    return apiRequest(`${endpoint}${queryString}`, {
      method: "GET",
      ...restOptions,
    });
  },

  // POST
  post: (endpoint, data, options = {}) => {
    return apiRequest(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
      ...options,
    });
  },

  // PUT
  put: (endpoint, data, options = {}) => {
    return apiRequest(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
      ...options,
    });
  },

  // DELETE
  delete: (endpoint, options = {}) => {
    return apiRequest(endpoint, {
      method: "DELETE",
      ...options,
    });
  },

  // PATCH
  patch: (endpoint, data, options = {}) => {
    return apiRequest(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
      ...options,
    });
  },
};

export const clientesAPI = {
  getAll: (params = {}) => {
    const { nro_pagina = 1, qtde_registros = 20, ...filtros } = params;
    return api.get("/clientes", {
      params: {
        nro_pagina,
        qtde_registros,
        ...filtros,
      },
    });
  },
  getAllWithInactive: (params = {}) => {
    const { nro_pagina = 1, qtde_registros = 20, ...filtros } = params;
    return api.get("/clientes", {
      params: {
        incluir_inativos: "S",
        nro_pagina,
        qtde_registros,
        ...filtros,
      },
    });
  },
  getById: (id) => api.get("/clientes", { params: { id } }),
  create: (clienteData) => api.post("/clientes", clienteData),
  update: (id, clienteData) => api.put(`/clientes?id=${id}`, clienteData),
  delete: (id) => api.delete(`/clientes?id=${id}`),
};

export const maquinasAPI = {
  getAll: (params = {}) => {
    const { nro_pagina = 1, qtde_registros = 20, ...filtros } = params;
    return api.get("/maquinas", {
      params: {
        nro_pagina,
        qtde_registros,
        ...filtros,
      },
    });
  },
  getAllWithInactive: (params = {}) => {
    const { nro_pagina = 1, qtde_registros = 20, ...filtros } = params;
    return api.get("/maquinas", {
      params: {
        incluir_inativos: "S",
        nro_pagina,
        qtde_registros,
        ...filtros,
      },
    });
  },
  getById: (id) => api.get("/maquinas", { params: { id } }),
  create: (maquinaData) => api.post("/maquinas", maquinaData),
  update: (id, maquinaData) => api.put(`/maquinas?id=${id}`, maquinaData),
  delete: (id) => api.delete(`/maquinas?id=${id}`),
};

export const usuariosAPI = {
  getAll: (params = {}) => {
    return api.get("/usuarios", { params });
  },
  getById: (id) => api.get(`/usuarios/${id}`),
  create: (usuarioData) => api.post("/usuarios", usuarioData),
  update: (id, usuarioData) => api.put(`/usuarios/${id}`, usuarioData),
  delete: (id) => api.delete(`/usuarios?id=${id}`),
};

export const regioesAPI = {
  getAll: (params = {}) => {
    return api.get("/regioes", {
      params: {
        ...params,
      },
    });
  },
  getAllWithInactive: (params = {}) => {
    return api.get("/regioes", {
      params: {
        incluir_inativos: "S",
        ...params,
      },
    });
  },
  getById: (id) => api.get("/regioes", { params: { id } }),
  create: (regiaoData) => api.post("/regioes", regiaoData),
  update: (id, regiaoData) => api.put(`/regioes?id=${id}`, regiaoData),
  delete: (id) => api.delete(`/regioes/${id}`),
};

export const pecasAPI = {
  getAll: (params = {}) => {
    const { nro_pagina = 1, qtde_registros = 20, ...filtros } = params;
    return api.get("/pecas", {
      params: {
        nro_pagina,
        qtde_registros,
        ...filtros,
      },
    });
  },
  getAllWithInactive: (params = {}) => {
    const { nro_pagina = 1, qtde_registros = 20, ...filtros } = params;
    return api.get("/pecas", {
      params: {
        incluir_inativos: "S",
        nro_pagina,
        qtde_registros,
        ...filtros,
      },
    });
  },
  getById: (id) => api.get("/pecas", { params: { id } }),
  create: (pecaData) => api.post("/pecas", pecaData),
  update: (id, pecaData) => api.put(`/pecas?id=${id}`, pecaData),
  delete: (id) => api.delete(`/pecas?id=${id}`),
};

export const motivosAtendimentoAPI = {
  getAll: (params = {}) => {
    return api.get("/motivos_atendimento", { params });
  },
  getAllWithInactive: (params = {}) => {
    return api.get("/motivos_atendimento", {
      params: {
        incluir_inativos: "S",
        ...params,
      },
    });
  },
  getById: (id) => api.get("/motivos_atendimento", { params: { id } }),
  create: (motivoData) => api.post("/motivos_atendimento", motivoData),
  update: (id, motivoData) =>
    api.put(`/motivos_atendimento?id=${id}`, motivoData),
  delete: (id) => api.delete(`/motivos_atendimento?id=${id}`),
};

export const motivosPendenciaAPI = {
  getAll: (params = {}) => {
    return api.get("/motivos_pendencia_os", { params });
  },
  getAllWithInactive: (params = {}) => {
    return api.get("/motivos_pendencia_os", {
      params: {
        incluir_inativos: "S",
        ...params,
      },
    });
  },
  getById: (id) => api.get("/motivos_pendencia_os", { params: { id } }),
  create: (motivoData) => api.post("/motivos_pendencia_os", motivoData),
  update: (id, motivoData) =>
    api.put(`/motivos_pendencia_os?id=${id}`, motivoData),
  delete: (id) => api.delete(`/motivos_pendencia_os?id=${id}`),
};

export const tiposPecasAPI = {
  getAll: (params = {}) => {
    // Garante paginação padrão se não vier nos filtros
    const { nro_pagina = 1, qtde_registros = 20, ...filtros } = params;
    return api.get("/tipos_pecas", {
      params: {
        nro_pagina,
        qtde_registros,
        ...filtros,
      },
    });
  },
  getAllWithInactive: (params = {}) => {
    const { nro_pagina = 1, qtde_registros = 20, ...filtros } = params;
    return api.get("/tipos_pecas", {
      params: {
        incluir_inativos: "S",
        nro_pagina,
        qtde_registros,
        ...filtros,
      },
    });
  },
  getById: (id) => api.get("/tipos_pecas", { params: { id } }),
  create: (tipoPecaData) => api.post("/tipos_pecas", tipoPecaData),
  update: (id, tipoPecaData) => api.put(`/tipos_pecas?id=${id}`, tipoPecaData),
  delete: (id) => api.delete(`/tipos_pecas?id=${id}`),
};

export const usuariosRegioesAPI = {
  getAll: (params = {}) => {
    return api.get("/usuarios_regioes", { params });
  },
  getAllWithInactive: (params = {}) => {
    return api.get("/usuarios_regioes", {
      params: {
        incluir_inativos: "S",
        ...params,
      },
    });
  },
  getById: (id) => api.get("/usuarios_regioes", { params: { id } }),
  create: (motivoData) => api.post("/usuarios_regioes", motivoData),
  update: (id, motivoData) => api.put(`/usuarios_regioes?id=${id}`, motivoData),
  delete: (id) => api.delete(`/usuarios_regioes?id=${id}`),
};

export default api;
