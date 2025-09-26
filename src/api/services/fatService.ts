import api from "../api";

// Interface para técnico
export interface FATTecnico {
  id: number;
  nome: string;
}

// Interface para motivo do atendimento
export interface FATMotivoAtendimento {
  id_motivo: number;
  descricao: string;
}

// Interface para máquina
export interface FATMaquina {
  id: number;
  numero_serie: string;
  descricao: string;
  modelo: string;
}

// Interface para situação da FAT
export interface FATSituacao {
  codigo: number;
  descricao: string;
}

// Interface para usuário
export interface FATUsuario {
  id: number;
  nome: string;
}

// Interface para deslocamento - ATUALIZADA
export interface FATDeslocamento {
  id_deslocamento: number;
  km_ida: number;
  km_volta: number;
  tempo_ida_min: number | null;
  tempo_volta_min: number | null;
  observacoes?: string;
}

// Interface para peça utilizada - ATUALIZADA
export interface FATPeca {
  id_fat_peca: number;
  codigo_peca: string;
  descricao_peca: string;
  quantidade: number;
  observacoes?: string;
}

// Interface para foto - ATUALIZADA
export interface FATFoto {
  id_fat_foto: number;
  nome_arquivo: string;
  tipo: string;
  descricao?: string;
  data_cadastro: string;
}

// Interface para ocorrência
export interface FATOcorrencia {
  id_ocorrencia: number;
  nova_situacao: FATSituacao;
  descricao_ocorrencia: string;
  data_ocorrencia: string;
  usuario: FATUsuario;
}

// Interface principal da FAT detalhada - ATUALIZADA
export interface FATDetalhada {
  id_fat: number;
  id_os: number;
  tecnico: FATTecnico;
  motivo_atendimento: FATMotivoAtendimento;
  data_atendimento: string | null;
  nome_atendente?: string | null;
  contato_atendente?: string | null;
  maquina: FATMaquina;
  situacao: FATSituacao;
  descricao_problema?: string | null;
  solucao_encontrada?: string | null;
  testes_realizados?: string | null;
  sugestoes?: string | null;
  observacoes?: string | null;
  numero_ciclos?: number;
  data_cadastro: string;
  id_usuario_cadastro: number | null; // pode ser null

  // Arrays relacionados
  deslocamentos?: FATDeslocamento[];
  pecas?: FATPeca[];
  fotos?: FATFoto[];
  ocorrencias?: FATOcorrencia[];
}

class FATService {
  // Método para criar peça utilizada (POST deve enviar codigo_peca)
  async createPeca(data: {
    id_fat: number;
    codigo_peca?: string;
    descricao_peca: string;
    quantidade: number;
    observacoes?: string;
  }): Promise<FATPeca> {
    // Garante que o campo enviado seja codigo_peca
    const payload = {
      ...data,
      codigo_peca: data.codigo_peca || "",
    };
    const result = await api.post<FATPeca>(`/fats_pecas`, payload);
    this.invalidateFATCache(data.id_fat);
    return result;
  }
  // Métodos para CRUD de deslocamento
  async createDeslocamento(data: {
    id_fat: number;
    km_ida: number;
    km_volta: number;
    tempo_ida_min: number;
    tempo_volta_min: number;
    observacoes?: string;
  }): Promise<FATDeslocamento> {
    const result = await api.post<FATDeslocamento>(`/fats_deslocamentos`, data);
    this.invalidateFATCache(data.id_fat);
    return result;
  }

  async updateDeslocamento(data: {
    id_deslocamento: number;
    id_fat: number;
    km_ida: number;
    km_volta: number;
    tempo_ida_min: number;
    tempo_volta_min: number;
    observacoes?: string;
  }): Promise<FATDeslocamento> {
    const result = await api.put<FATDeslocamento>(
      `/fats_deslocamentos?id=${data.id_deslocamento}`,
      data
    );
    this.invalidateFATCache(data.id_fat);
    return result;
  }

  async deleteDeslocamento(
    id_deslocamento: number,
    id_fat?: number
  ): Promise<void> {
    await api.delete(`/fats_deslocamentos?id=${id_deslocamento}`);
    if (id_fat) this.invalidateFATCache(id_fat);
  }
  private baseUrl = "/fats";
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private pendingRequests = new Map<string, Promise<unknown>>();
  private readonly CACHE_DURATION = 30000;

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
      console.log(`Aguardando requisição pendente: ${cacheKey}`);
      return this.pendingRequests.get(cacheKey) as Promise<T>;
    }

    // Verificar cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`Dados obtidos do cache: ${cacheKey}`);
      return cached.data as T;
    }

    // Criar nova requisição
    console.log(`Fazendo nova requisição: ${cacheKey}`);
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

  // Método principal para buscar FAT por ID
  async getById(id_fat: number, forceRefresh = false): Promise<FATDetalhada> {
    const cacheKey = `fat_detail_${id_fat}`;

    return this.getCachedOrFetch(
      cacheKey,
      async () => {
        console.log(`Buscando FAT ${id_fat} na API`);
        const response = await api.get<FATDetalhada[]>(`${this.baseUrl}`, {
          params: { id_fat },
        });

        // A API sempre retorna um array, pegar o primeiro elemento
        if (!Array.isArray(response) || response.length === 0) {
          throw new Error(`FAT ${id_fat} não encontrada`);
        }

        return response[0];
      },
      !forceRefresh
    );
  }

  // Método para buscar FATs por OS
  async getByOSId(id_os: number): Promise<FATDetalhada[]> {
    const cacheKey = `fats_os_${id_os}`;
    return this.getCachedOrFetch(cacheKey, () =>
      api.get<FATDetalhada[]>(`${this.baseUrl}`, {
        params: { id_os },
      })
    );
  }

  // Método para buscar todas as FATs (sem filtro)
  async getAll(): Promise<FATDetalhada[]> {
    const cacheKey = "fats_all";
    return this.getCachedOrFetch(cacheKey, () =>
      api.get<FATDetalhada[]>(`${this.baseUrl}`)
    );
  }

  // Método para atualizar uma FAT
  async update(
    id_fat: number,
    data: Partial<FATDetalhada>
  ): Promise<FATDetalhada> {
    // Envia o PUT para /fats?id=1
    const result = await api.put<FATDetalhada>(
      `${this.baseUrl}?id=${id_fat}`,
      data
    );
    // Invalidar cache específico da FAT
    this.cache.delete(`fat_detail_${id_fat}`);
    // Invalidar também caches relacionados
    this.invalidateRelatedCaches();
    return result;
  }

  // Método para criar nova FAT
  async create(data: Partial<FATDetalhada>): Promise<FATDetalhada> {
    const result = await api.post<FATDetalhada>(this.baseUrl, data);
    // Limpar caches relacionados
    this.cache.clear();
    return result;
  }

  // Método para aprovar FAT (se existir na API)
  async aprovar(id_fat: number): Promise<FATDetalhada> {
    const result = await api.patch<FATDetalhada>(
      `${this.baseUrl}/${id_fat}/aprovar`,
      {}
    );
    // Invalidar cache específico da FAT
    this.cache.delete(`fat_detail_${id_fat}`);
    this.invalidateRelatedCaches();
    return result;
  }

  // Método para invalidar caches relacionados
  private invalidateRelatedCaches() {
    for (const key of this.cache.keys()) {
      if (key.startsWith("fats_os_") || key === "fats_all") {
        this.cache.delete(key);
      }
    }
  }

  // Método para invalidar cache específico
  invalidateCache(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // Método para invalidar cache de uma FAT específica
  invalidateFATCache(id_fat: number) {
    this.cache.delete(`fat_detail_${id_fat}`);
    // Invalidar também caches relacionados
    this.invalidateRelatedCaches();
  }

  // Método para obter estatísticas do cache (útil para debug)
  getCacheStats() {
    this.cleanExpiredCache();
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      cacheKeys: Array.from(this.cache.keys()),
    };
  }
}

export const fatService = new FATService();
