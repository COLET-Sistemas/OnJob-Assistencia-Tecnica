import api from "../api";

export interface OSStatusCount {
  em_execucao: number;
  finalizadas: number;
  abertas: number;
  pendentes: number;
  total: number;
}

export interface OSItem {
  id_os: number;
  descricao_problema: string;
  em_garantia: boolean;
  abertura: {
    data_abertura: string;
    forma_abertura: string;
    origem_abertura: string;
    nome_usuario: string;
    id_motivo_atendimento: number;
    motivo_atendimento: string;
  };
  data_agendada: string;
  data_fechamento: string;
  cliente: {
    nome: string;
    endereco: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
    latitude: string;
    longitude: string;
    id_regiao: number;
    nome_regiao: string;
  };
  contato: {
    nome: string;
    telefone: string;
    whatsapp: string;
    email: string;
  };
  maquina: {
    numero_serie: string;
    descricao: string;
    modelo: string;
  };
  situacao_os: {
    codigo: number;
    descricao: string;
    id_motivo_pendencia: number;
    motivo_pendencia: string;
  };
  tecnico: {
    id: number;
    nome: string;
    tipo: string;
    observacoes: string;
  };
  liberacao_financeira: {
    liberada: boolean;
    nome_usuario_liberacao: string;
    data_liberacao: string;
  };
}

export interface OSHistorico {
  id: number;
  data_hora: string;
  usuario: {
    id: number;
    nome: string;
  };
  status_anterior: string;
  status_atual: string;
  comentario: string;
}

export interface OSFat {
  id: number;
  data_inicio: string;
  data_fim: string;
  tecnico: {
    id: number;
    nome: string;
  };
  observacoes: string;
  pecas_utilizadas: OSPeca[];
}

export interface OSPeca {
  id: number;
  peca: {
    id: number;
    nome: string;
  };
  quantidade: number;
  valor_unitario: number;
}

export interface OSRevisao {
  id: number;
  data_revisao: string;
  usuario: {
    id: number;
    nome: string;
  };
  observacoes: string;
}

// Deslocamento interface for FATs
export interface OSDeslocamento {
  id_deslocamento: number;
  km_ida: number;
  km_volta: number;
  tempo_ida_min: number;
  tempo_volta_min: number;
  observacoes: string;
}

// Peça utilizada em FAT
export interface OSPecaUtilizada {
  id?: number;
  nome: string;
  quantidade: number;
}

// FAT detalhado conforme API response
export interface OSFatDetalhado {
  id_fat: number;
  data_atendimento: string;
  descricao_problema: string;
  solucao_encontrada: string;
  testes_realizados: string;
  sugestoes: string;
  observacoes: string;
  numero_ciclos: number;
  tecnico: {
    id: number;
    nome: string;
    tipo: "interno" | "terceiro" | string;
  };
  id_motivo_atendimento: number;
  motivo_atendimento: string;
  nome_atendente: string;
  contato_atendente: string;
  pecas_utilizadas: OSPecaUtilizada[];
  deslocamentos: OSDeslocamento[];
}

// Original interface (kept for backwards compatibility)
export interface OSDetalhada {
  data_revisao?: string;
  status: number;
  status_descricao: string;
  cliente: {
    id: number;
    nome_fantasia: string;
    endereco?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade: string;
    uf: string;
    cep?: string;
    id_regiao?: number;
  };
  contato?: {
    nome: string;
    telefone: string;
    email?: string;
  };
  maquina: {
    id: number;
    numero_serie: string;
    descricao?: string;
    modelo?: string;
  };
  tecnico?: {
    id: number;
    nome: string;
  };
  motivo_atendimento: {
    id: number;
    descricao: string;
  };
  motivo_pendencia?: {
    id: number;
    descricao: string;
  };
  comentarios_pendencia?: string;
  regiao: {
    id: number;
    nome: string;
  };
  historico: OSHistorico[];
  fats?: OSFat[];
  revisao?: OSRevisao;
}

// Updated interface to match the complete API response format
export interface OSDetalhadaV2 {
  id_os: number;
  descricao_problema: string;
  em_garantia: boolean;
  abertura: {
    data_abertura: string;
    forma_abertura: string;
    origem_abertura: string;
    id_usuario: number;
    nome_usuario: string;
    id_motivo_atendimento: number;
    motivo_atendimento: string;
  };
  data_agendada: string;
  data_fechamento: string;
  cliente: {
    id: number;
    nome: string;
    endereco: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
    latitude: string;
    longitude: string;
    id_regiao: number;
    nome_regiao: string;
  };
  contato: {
    id: number;
    nome: string;
    telefone: string;
    whatsapp: string;
    email: string;
  };
  maquina: {
    id: number;
    numero_serie: string;
    descricao: string;
    modelo: string;
  };
  situacao_os: {
    codigo: number;
    descricao: string;
    id_motivo_pendencia: number;
    motivo_pendencia: string;
  };
  tecnico: {
    id: number;
    nome: string;
    tipo: "interno" | "terceiro" | string;
    observacoes: string;
  };
  liberacao_financeira: {
    liberada: boolean;
    id_usuario_liberacao: number;
    nome_usuario_liberacao: string;
    data_liberacao: string;
  };
  revisao_os: {
    id_usuario: number;
    nome: string;
    data: string;
    observacoes: string;
  };
  pecas_corrigidas: Array<{
    id: number;
    nome: string;
    quantidade: number;
  }>;
  deslocamentos_corrigidos: Array<{
    id: number;
    data: string;
    valor: number;
    observacoes: string;
  }>;
  // Updated FATs structure to match actual API response
  fats: OSFatDetalhado[];
}

interface OSPaginada {
  total_registros: number;
  total_paginas: number;
  dados: OSItem[];
  pagina_atual: number;
  registros_por_pagina: number;
}

interface OSFilterParams
  extends Record<string, string | number | boolean | undefined> {
  nro_pagina?: number;
  qtde_registros?: number;
  id_cliente?: number;
  id_maquina?: number;
  id_tecnico?: number;
  status?: string;
  data_inicial?: string;
  data_final?: string;
  numero_os?: string;
}

interface OSForm {
  id_cliente: number;
  id_maquina: number;
  id_regiao: number;
}

interface OSTecnicoForm {
  id_tecnico: number;
}

interface OSPendenciaForm {
  id_motivo_pendencia: number;
  comentarios_pendencia: string;
}

interface OSFinalizadaForm {
  comentarios_finalizacao: string;
}

class OrdensServicoService {
  private baseUrl = "/ordens_servico";

  async getCountByStatus(): Promise<OSStatusCount> {
    return api.get<OSStatusCount>(`${this.baseUrl}/count_status`);
  }

  async getAll(params: OSFilterParams = {}): Promise<OSPaginada> {
    // Filtrar os parâmetros indefinidos
    const cleanParams: Record<string, string | number | boolean> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanParams[key] = value as string | number | boolean;
      }
    });

    return api.get<OSPaginada>(this.baseUrl, { params: cleanParams });
  }

  async getPendentes(): Promise<{
    total_registros: number;
    total_paginas: number;
    nro_pagina: number;
    qtde_registros: number;
    dados: OSItem[];
  }> {
    // Recuperar o id_usuario do localStorage
    const idUsuario = localStorage.getItem("id_usuario");

    const params: Record<string, string> = {
      resumido: "s",
      situacao: "2,3,4,5",
    };

    // Adicionar id_tecnico apenas se o id_usuario existir no localStorage
    if (idUsuario) {
      params.id_tecnico = idUsuario;
    }

    return api.get(`${this.baseUrl}`, { params });
  }

  async getDashboard(params = {}): Promise<{
    total_registros: number;
    total_paginas: number;
    nro_pagina: number;
    qtde_registros: number;
    dados: Record<string, unknown>[]; // Tipo mais seguro que any
  }> {
    return api.get(`${this.baseUrl}`, {
      params: { situacao: "1,2,3,4,5", resumido: "S", ...params },
    });
  }

  async getById(id: number): Promise<OSDetalhadaV2 | OSDetalhadaV2[]> {
    // This method now uses the updated interface format that matches the complete API response
    return api.get<OSDetalhadaV2 | OSDetalhadaV2[]>(`${this.baseUrl}`, {
      params: { id },
    });
  }

  async create(data: OSForm): Promise<OSDetalhada> {
    return api.post<OSDetalhada>(this.baseUrl, data);
  }

  async atribuirTecnico(id: number, data: OSTecnicoForm): Promise<OSDetalhada> {
    return api.put<OSDetalhada>(`${this.baseUrl}/${id}/atribuir`, data);
  }

  async iniciarAtendimento(id: number): Promise<OSDetalhada> {
    return api.put<OSDetalhada>(`${this.baseUrl}/${id}/iniciar`, {});
  }

  async colocarPendente(
    id: number,
    data: OSPendenciaForm
  ): Promise<OSDetalhada> {
    return api.put<OSDetalhada>(`${this.baseUrl}/${id}/pendente`, data);
  }

  async finalizarOS(id: number, data: OSFinalizadaForm): Promise<OSDetalhada> {
    return api.put<OSDetalhada>(`${this.baseUrl}/${id}/finalizar`, data);
  }

  async cancel(id: number): Promise<void> {
    await api.delete<void>(`${this.baseUrl}/${id}`);
  }

  async liberarFinanceiramente(id: number): Promise<OSDetalhada> {
    return api.patch<OSDetalhada>(`${this.baseUrl}/liberacao?id=${id}`, {
      liberada_financeira: true,
    });
  }

  async alterarMotivoPendencia(
    id: number,
    idMotivo: number | null
  ): Promise<OSDetalhada> {
    return api.patch<OSDetalhada>(`${this.baseUrl}/liberacao?id=${id}`, {
      id_motivo_pendencia: idMotivo,
    });
  }
}

export const ordensServicoService = new OrdensServicoService();
