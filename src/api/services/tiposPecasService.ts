import api from "../httpClient";

export interface TipoPeca {
  id: number;
  descricao: string;
  situacao: string;
}

export interface TiposPecaResponse {
  total_registros: number;
  total_paginas: number;
  dados: TipoPeca[];
  pagina_atual?: number;
  registros_por_pagina?: number;
}

class TiposPecasService {
  private baseUrl = "/tipos_pecas";

  async search(term: string): Promise<TiposPecaResponse> {
    const params = {
      descricao: term,
    };

    return await api.get<TiposPecaResponse>(this.baseUrl, { params });
  }

  async getAll(
    page = 1,
    limit = 20,
    incluirInativos = false
  ): Promise<TiposPecaResponse> {
    const params = {
      nro_pagina: page,
      qtde_registros: limit,
      incluir_inativos: incluirInativos ? "S" : "N",
    };

    return await api.get<TiposPecaResponse>(this.baseUrl, { params });
  }

  async getById(id: number | string): Promise<TipoPeca> {
    return await api.get<TipoPeca>(`${this.baseUrl}/${id}`);
  }
}

export const tiposPecasService = new TiposPecasService();
