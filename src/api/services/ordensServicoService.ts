import api from "../httpClient";

interface OSStatusCount {
  em_execucao: number;
  finalizadas: number;
  abertas: number;
  pendentes: number;
  total: number;
}

interface OSItem {
  id: number;
  numero_os: string;
  data_abertura: string;
  cliente: {
    id: number;
    nome_fantasia: string;
  };
  maquina: {
    id: number;
    numero_serie: string;
  };
  status: string;
  tecnico?: {
    id: number;
    nome: string;
  };
}

interface OSDetalhada extends OSItem {
  motivo_atendimento: {
    id: number;
    descricao: string;
  };
  motivo_pendencia?: {
    id: number;
    descricao: string;
  };
  comentarios: string;
  comentarios_pendencia?: string;
  regiao: {
    id: number;
    nome: string;
  };
  historico: OSHistorico[];
}

interface OSHistorico {
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
  id_motivo_atendimento: number;
  comentarios: string;
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
    return api.get(`${this.baseUrl}?resumido=s&situacao=1,2,3,4,5`);
  }

  async getById(id: number): Promise<OSDetalhada> {
    return api.get<OSDetalhada>(`${this.baseUrl}/${id}`);
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
}

export const ordensServicoService = new OrdensServicoService();
