import api from "../api";
import { ocorrenciasOSService } from "./ocorrenciaOSService";

export interface OSStatusCount {
  em_execucao: number;
  finalizadas: number;
  abertas: number;
  pendentes: number;
  total: number;
}
export interface CreateOSResponse {
  id_os: number;
  id_fat: number;
  mensagem: string;
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
    codigo_erp: string;
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
    data_situacao: string;
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

export interface OSDeslocamento {
  id_deslocamento: number;
  km_ida: number;
  km_volta: number;
  tempo_ida_min: number;
  tempo_volta_min: number;
  valor_km?: number;
  valor_total?: number;
  observacoes: string;
}

export interface OSPecaUtilizada {
  id?: number;
  id_peca?: number;
  nome?: string;
  descricao?: string;
  codigo?: string;
  quantidade: number;
  valor_unitario?: number;
  valor_total?: number;
}

export interface OSFatDetalhado {
  id_fat: number;
  data_atendimento: string;
  hora_inicio?: string;
  hora_fim?: string;
  tempo_total_min?: number;
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
  // Campos adicionais que podem estar presentes
  status_fat?: string;
  aprovado?: boolean;
  data_aprovacao?: string;
  usuario_aprovacao?: string;
  valor_mao_obra?: number;
  valor_deslocamento?: number;
  valor_pecas?: number;
  valor_total?: number;
  situacao?: number | string;
  descricao_situacao?: string;
  // Arrays relacionados
  pecas_utilizadas: OSPecaUtilizada[];
  deslocamentos: OSDeslocamento[];
}

// Original interface (kept for backwards compatibility)
export interface OSDetalhada {
  data_revisao?: string;
  status: number;
  status_descricao: string;
  cliente: {
    codigo_erp: string;
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

// Interface para peças corrigidas
export interface OSPecaCorrigida {
  id: number;
  id_peca?: number;
  nome: string;
  codigo?: string;
  quantidade: number;
  valor_unitario?: number;
  valor_total?: number;
  data_correcao?: string;
}

// Interface para deslocamentos corrigidos
export interface OSDeslocamentoCorrigido {
  id: number;
  data: string;
  km_ida?: number;
  km_volta?: number;
  tempo_ida_min?: number;
  tempo_volta_min?: number;
  valor_km?: number;
  valor: number;
  observacoes: string;
  data_correcao?: string;
}

// Interface para anexos da OS
export interface OSAnexo {
  id: number;
  nome_arquivo: string;
  tipo_arquivo: string;
  tamanho: number;
  data_upload: string;
  usuario_upload: string;
  url?: string;
}

// Interface para histórico detalhado
export interface OSHistoricoDetalhado extends OSHistorico {
  ip_usuario?: string;
  detalhes_alteracao?: Record<string, unknown>;
  anexos?: OSAnexo[];
}

// VERSÃO ATUALIZADA DA OSDetalhadaV2 - COM NOVOS CAMPOS
export interface OSDetalhadaV2 {
  id_os: number;
  numero_os?: string;
  numero_interno?: string;
  descricao_problema: string;
  em_garantia: boolean;
  prioridade?: "baixa" | "media" | "alta" | "critica";
  abertura: {
    data_abertura: string;
    hora_abertura?: string;
    forma_abertura: string;
    origem_abertura: string;
    id_usuario: number;
    nome_usuario: string;
    id_motivo_atendimento: number;
    motivo_atendimento: string;
  };
  data_agendada: string;
  data_fechamento: string;
  // Informações do cliente expandidas
  cliente: {
    id: number;
    codigo_erp: string;
    nome: string;
    nome_fantasia?: string;
    cnpj_cpf?: string;
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
  // Informações de contato expandidas
  contato: {
    id: number;
    nome: string;
    cargo?: string;
    telefone: string;
    whatsapp: string;
    email: string;
    telefone_alternativo?: string;
  };
  // Informações da máquina expandidas
  maquina: {
    id: number;
    numero_serie: string;
    descricao: string;
    modelo: string;
    marca?: string;
    ano_fabricacao?: number;
    horas_trabalhadas?: number;
    ultima_manutencao?: string;
  };
  // Situação da OS expandida
  situacao_os: {
    codigo: number;
    descricao: string;
    data_situacao?: string;
    id_motivo_pendencia: number;
    motivo_pendencia: string;
    data_alteracao?: string;
    usuario_alteracao?: string;
    motivo_cancelamento?: string;
  };
  // Informações do técnico expandidas
  tecnico: {
    id: number;
    nome: string;
    tipo: "interno" | "terceiro" | string;
    observacoes: string;
    telefone?: string;
    email?: string;
    especialidades?: string[];
  };
  // Liberação financeira expandida
  liberacao_financeira: {
    liberada: boolean;
    id_usuario_liberacao: number;
    nome_usuario_liberacao: string;
    data_liberacao: string;
    motivo_liberacao?: string;
    valor_autorizado?: number;
  };
  // Revisão da OS expandida
  revisao_os: {
    id_usuario: number;
    nome: string;
    data: string;
    observacoes: string;
    aprovada?: boolean;
    nota_qualidade?: number;
  };
  // Custos e valores
  custos?: {
    valor_mao_obra: number;
    valor_pecas: number;
    valor_deslocamento: number;
    valor_outros: number;
    valor_total: number;
    moeda?: string;
  };
  // Arrays de dados relacionados expandidos
  pecas_corrigidas: OSPecaCorrigida[];
  deslocamentos_corrigidos: OSDeslocamentoCorrigido[];
  fats: OSFatDetalhado[];
  historico?: OSHistoricoDetalhado[];
  anexos?: OSAnexo[];
  // Campos adicionais que podem estar presentes
  observacoes_internas?: string;
  data_criacao?: string;
  data_ultima_alteracao?: string;
  usuario_ultima_alteracao?: string;
  tags?: string[];
  categoria?: string;
  subcategoria?: string;
  motivo_cancelamento?: string;
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

export interface OSRetroativaPayload {
  id_cliente: number;
  id_maquina: number;
  id_contato_abertura?: number;
  nome_contato_abertura: string;
  telefone_contato_abertura?: string;
  whatsapp_contato_abertura?: string;
  email_contato_abertura?: string;
  forma_abertura: string;
  origem_abertura: string;
  data_abertura: string;
  id_usuario_abertura: number;
  id_usuario_tecnico: number;
  em_garantia: boolean;
  id_motivo_atendimento: number;
  descricao_problema: string;
  observacoes_tecnico?: string;
  solucao_encontrada?: string;
  testes_realizados?: string;
  sugestoes?: string;
  observacoes?: string;
  numero_ciclos?: number;
  id_usuario_revisao: number;
  emissao_retroativa: boolean;
}

class OrdensServicoService {
  private baseUrl = "/ordens_servico";
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private pendingRequests = new Map<string, Promise<unknown>>();
  private readonly CACHE_DURATION = 30000; // 30 segundos

  // Método para limpar cache expirado
  private cleanExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  // Método para obter dados do cache ou fazer nova requisição
  private async getCachedOrFetch<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    useCache = true
  ): Promise<T> {
    // Limpar cache expirado
    this.cleanExpiredCache();

    // Se não usar cache, executar diretamente
    if (!useCache) {
      return fetchFn();
    }

    // Verificar se existe uma requisição pendente para evitar duplicatas
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey) as Promise<T>;
    }

    // Verificar cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data as T;
    }

    // Criar nova requisição
    const promise = fetchFn()
      .then((data) => {
        // Salvar no cache
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        // Remover da lista de pendentes
        this.pendingRequests.delete(cacheKey);
        return data;
      })
      .catch((error) => {
        // Remover da lista de pendentes em caso de erro
        this.pendingRequests.delete(cacheKey);
        throw error;
      });

    // Adicionar à lista de requisições pendentes
    this.pendingRequests.set(cacheKey, promise);

    return promise;
  }

  async getCountByStatus(): Promise<OSStatusCount> {
    const cacheKey = "count_status";
    return this.getCachedOrFetch(cacheKey, () =>
      api.get<OSStatusCount>(`${this.baseUrl}/count_status`)
    );
  }

  async getAll(params: OSFilterParams = {}): Promise<OSPaginada> {
    // Filtrar os parâmetros indefinidos
    const cleanParams: Record<string, string | number | boolean> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanParams[key] = value as string | number | boolean;
      }
    });

    const cacheKey = `all_${JSON.stringify(cleanParams)}`;
    return this.getCachedOrFetch(
      cacheKey,
      () => api.get<OSPaginada>(this.baseUrl, { params: cleanParams }),
      false // Não usar cache para listagem geral
    );
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

    const cacheKey = `pendentes_${idUsuario || "all"}`;
    const emptyResponse = {
      total_registros: 0,
      total_paginas: 0,
      nro_pagina: 1,
      qtde_registros: 0,
      dados: [] as OSItem[],
    };
    return this.getCachedOrFetch(cacheKey, async () => {
      try {
        return await api.get(`${this.baseUrl}`, { params });
      } catch (error) {
        const status =
          typeof error === "object" && error !== null && "status" in error
            ? (error as { status?: number }).status
            : undefined;

        if (status === 404) {
          return { ...emptyResponse, dados: [] as OSItem[] };
        }

        throw error;
      }
    });
  }

  async getDashboard(params = {}): Promise<{
    total_registros: number;
    total_paginas: number;
    nro_pagina: number;
    qtde_registros: number;
    dados: Record<string, unknown>[];
  }> {
    const cacheKey = `dashboard_${JSON.stringify(params)}`;
    return this.getCachedOrFetch(cacheKey, () =>
      api.get(`${this.baseUrl}`, {
        params: { situacao: "1,2,3,4,5", resumido: "S", ...params },
      })
    );
  }

  // MÉTODO OTIMIZADO - getById com cache inteligente
  async getById(id: number, forceRefresh = false): Promise<OSDetalhadaV2> {
    const cacheKey = `os_detail_${id}`;

    return this.getCachedOrFetch(
      cacheKey,
      async () => {
        const response = await api.get<OSDetalhadaV2 | OSDetalhadaV2[]>(
          `${this.baseUrl}`,
          {
            params: { id },
          }
        );

        // Se a API retornar um array, pega o primeiro elemento
        // Se retornar um objeto, retorna diretamente
        return Array.isArray(response) ? response[0] : response;
      },
      !forceRefresh // Usar cache apenas se não for forçar refresh
    );
  }

  async create(data: OSForm): Promise<OSDetalhada> {
    const result = await api.post<OSDetalhada>(this.baseUrl, data);
    // Limpar caches relacionados
    this.cache.clear();
    return result;
  }

  async createRetroativa(data: OSRetroativaPayload): Promise<CreateOSResponse> {
    const result = await api.post<CreateOSResponse>(
      `${this.baseUrl}/retroativa`,
      data
    );

    this.cache.clear();
    return result;
  }

  async atribuirTecnico(id: number, data: OSTecnicoForm): Promise<OSDetalhada> {
    const result = await api.put<OSDetalhada>(
      `${this.baseUrl}/${id}/atribuir`,
      data
    );
    // Invalidar cache específico da OS
    this.cache.delete(`os_detail_${id}`);
    this.cache.delete("count_status");
    return result;
  }

  async iniciarAtendimento(id: number): Promise<OSDetalhada> {
    const result = await api.put<OSDetalhada>(
      `${this.baseUrl}/${id}/iniciar`,
      {}
    );
    // Invalidar cache específico da OS
    this.cache.delete(`os_detail_${id}`);
    this.cache.delete("count_status");
    return result;
  }

  async colocarPendente(
    id: number,
    data: OSPendenciaForm
  ): Promise<OSDetalhada> {
    const result = await api.put<OSDetalhada>(
      `${this.baseUrl}/${id}/pendente`,
      data
    );
    // Invalidar cache específico da OS
    this.cache.delete(`os_detail_${id}`);
    this.cache.delete("count_status");
    return result;
  }

  async finalizarOS(id: number, data: OSFinalizadaForm): Promise<OSDetalhada> {
    const result = await api.put<OSDetalhada>(
      `${this.baseUrl}/${id}/finalizar`,
      data
    );
    // Invalidar cache específico da OS
    this.cache.delete(`os_detail_${id}`);
    this.cache.delete("count_status");
    return result;
  }

  async cancel(
    id: number,
    data?: { tipo_cancelamento: "cliente" | "empresa"; descricao: string }
  ): Promise<void> {
    if (!data) {
      // Caso sem dados adicionais (não deve acontecer mais)
      throw new Error("Dados de cancelamento são obrigatórios");
    }

    // Formatar a ocorrência baseada no tipo de cancelamento
    const ocorrencia =
      data.tipo_cancelamento === "cliente"
        ? "cancelar os (cliente)"
        : "cancelar os";

    // Registrar a ocorrência de cancelamento
    await ocorrenciasOSService.registrarOcorrencia({
      id_os: id,
      ocorrencia: ocorrencia,
      descricao_ocorrencia: data.descricao,
    });

    // Invalidar cache específico da OS
    this.cache.delete(`os_detail_${id}`);
    this.cache.delete("count_status");
  }

  async liberarFinanceiramente(id: number): Promise<OSDetalhada> {
    const result = await api.patch<OSDetalhada>(
      `${this.baseUrl}/liberacao?id=${id}`,
      {
        liberada_financeira: true,
      }
    );
    // Invalidar cache específico da OS
    this.cache.delete(`os_detail_${id}`);
    return result;
  }

  async alterarMotivoPendencia(
    id: number,
    idMotivo: number | null
  ): Promise<OSDetalhada> {
    const result = await api.patch<OSDetalhada>(
      `${this.baseUrl}/liberacao?id=${id}`,
      {
        id_motivo_pendencia: idMotivo,
      }
    );
    // Invalidar cache específico da OS
    this.cache.delete(`os_detail_${id}`);
    return result;
  }

  // Método para invalidar cache específico
  invalidateCache(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // Método para invalidar cache de uma OS específica
  invalidateOSCache(id: number) {
    this.cache.delete(`os_detail_${id}`);
    this.cache.delete("count_status");
    // Invalidar também caches de listagem que possam conter esta OS
    for (const key of this.cache.keys()) {
      if (key.startsWith("pendentes_") || key.startsWith("dashboard_")) {
        this.cache.delete(key);
      }
    }
  }

  // Método para salvar revisão da OS
  async salvarRevisaoOS(
    id_os: number,
    dados: {
      observacoes: string;
      pecas: OSPecaUtilizada[];
      deslocamentos: OSDeslocamento[];
    }
  ): Promise<{ success: boolean; message: string }> {
    // Obter ID do usuário atual do localStorage
    const id_usuario_revisor = Number(localStorage.getItem("id_usuario"));

    // Formatar dados para envio à API
    const requestData = {
      id_os: id_os,
      id_usuario_revisor: id_usuario_revisor,
      observacoes_revisao: dados.observacoes,
      pecas_corrigidas: dados.pecas.map((peca) => ({
        codigo: peca.codigo || "",
        descricao: peca.descricao || peca.nome || "",
        quantidade: peca.quantidade,
        valor_unitario: peca.valor_unitario || 0,
      })),
      deslocamentos_corrigidos: dados.deslocamentos.map((desl) => ({
        km_ida: desl.km_ida,
        km_volta: desl.km_volta,
        tempo_ida_min: desl.tempo_ida_min,
        tempo_volta_min: desl.tempo_volta_min,
        observacao: desl.observacoes,
      })),
    };

    await api.post(`/revisoes_os`, requestData);

    // Invalidar caches relacionados
    this.invalidateOSCache(id_os);

    return {
      success: true,
      message: "Revisão salva com sucesso",
    };
  }
}

export const ordensServicoService = new OrdensServicoService();
