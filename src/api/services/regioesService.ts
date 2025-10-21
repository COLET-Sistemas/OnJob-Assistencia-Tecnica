import { Regiao } from "../../types/admin/cadastro/regioes";
import api from "../api";
import { BaseService } from "./baseService";

class RegioesService implements BaseService<Regiao> {
  private baseUrl = "/regioes";

  async getAll(
    params?: Record<string, string | number | boolean>
  ): Promise<Regiao[]> {
    try {
      return await api.get<Regiao[]>(this.baseUrl, { params });
    } catch (error) {
      console.error("Error in regioesService.getAll:", error);
      throw error;
    }
  }

  // Alternative method that uses the API module with proper error handling
  async getAllWithDirectFetch(
    params?: Record<string, string | number | boolean>
  ): Promise<Regiao[]> {
    try {
      // Use the standard API module for consistency
      const result = await api.get<Regiao[]>(this.baseUrl, { params });
      return result;
    } catch (error) {
      console.error("Error in getAllWithDirectFetch:", error);
      throw error;
    }
  }

  async getAllWithInactive(): Promise<Regiao[]> {
    return await api.get<Regiao[]>(this.baseUrl, {
      params: { incluir_inativos: "S" },
    });
  }

  async getById(id: number | string): Promise<Regiao> {
    return await api.get<Regiao>(this.baseUrl, { params: { id } });
  }

  async create(
    data: Omit<Regiao, "id" | "data_cadastro" | "id_usuario_cadastro">
  ): Promise<Regiao> {
    return await api.post<Regiao>(this.baseUrl, data);
  }

  async update(id: number | string, data: Partial<Regiao>): Promise<Regiao> {
    return await api.put<Regiao>(`${this.baseUrl}?id=${id}`, data);
  }

  async delete(id: number | string): Promise<void> {
    await api.delete<void>(`${this.baseUrl}?id=${id}`);
  }
}

export const regioesService = new RegioesService();
