import { MotivoPendencia } from "../../types/admin/cadastro/motivos_pendencia";
import api from "../api";
import { BaseService } from "./baseService";

class MotivosPendenciaService implements BaseService<MotivoPendencia> {
  private baseUrl = "/motivos_pendencia_os";

  async getAll(
    params?: Record<string, string | number | boolean>
  ): Promise<MotivoPendencia[]> {
    return await api.get<MotivoPendencia[]>(this.baseUrl, { params });
  }

  async getAllWithInactive(): Promise<MotivoPendencia[]> {
    return await api.get<MotivoPendencia[]>(this.baseUrl, {
      params: { incluir_inativos: "S" },
    });
  }

  async getById(id: number | string): Promise<MotivoPendencia> {
    return await api.get<MotivoPendencia>(`${this.baseUrl}/${id}`);
  }

  async create(data: Omit<MotivoPendencia, "id">): Promise<MotivoPendencia> {
    return await api.post<MotivoPendencia>(this.baseUrl, data);
  }

  async update(
    id: number | string,
    data: Partial<MotivoPendencia>
  ): Promise<MotivoPendencia> {
    return await api.put<MotivoPendencia>(`${this.baseUrl}/${id}`, data);
  }

  async delete(id: number | string): Promise<void> {
    await api.delete<void>(`${this.baseUrl}/${id}`);
  }
}

export const motivosPendenciaService = new MotivosPendenciaService();
