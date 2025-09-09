import { Peca } from "../../types/admin/cadastro/pecas";
import api from "../api";

export interface PecaResponse {
  total_registros: number;
  total_paginas: number;
  dados: Peca[];
  pagina_atual?: number;
  registros_por_pagina?: number;
}

class PecasService {
  private baseUrl = "/pecas";

  async getAll(
    params?: Record<string, string | number | boolean>
  ): Promise<PecaResponse> {
    return await api.get<PecaResponse>(this.baseUrl, { params });
  }

  async getById(id: number | string): Promise<Peca> {
    const response = await api.get<{ dados: Peca[] }>(`${this.baseUrl}`, {
      params: { id },
    });
    if (
      response.dados &&
      Array.isArray(response.dados) &&
      response.dados.length > 0
    ) {
      return response.dados[0];
    }
    throw new Error("Peça não encontrada");
  }

  async create(data: Omit<Peca, "id">): Promise<Peca> {
    return await api.post<Peca>(this.baseUrl, data);
  }

  async update(id: number | string, data: Partial<Peca>): Promise<Peca> {
    return await api.put<Peca>(`${this.baseUrl}?id=${id}`, data);
  }

  async delete(id: number | string): Promise<string> {
    return await api.delete<string>(`${this.baseUrl}?id=${id}`);
  }
}

export const pecasService = new PecasService();
