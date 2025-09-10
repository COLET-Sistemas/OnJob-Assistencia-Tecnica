import { MotivoAtendimento } from "../../types/admin/cadastro/motivos_atendimento";
import api from "../api";
import { BaseService } from "./baseService";

class MotivosAtendimentoService implements BaseService<MotivoAtendimento> {
  private baseUrl = "/motivos_atendimento";

  async getAll(
    params?: Record<string, string | number | boolean>
  ): Promise<MotivoAtendimento[]> {
    return await api.get<MotivoAtendimento[]>(this.baseUrl, { params });
  }

  async getById(id: number | string): Promise<MotivoAtendimento> {
    return await api.get<MotivoAtendimento>(this.baseUrl, { params: { id } });
  }

  async create(
    data: Omit<MotivoAtendimento, "id">
  ): Promise<MotivoAtendimento> {
    return await api.post<MotivoAtendimento>(this.baseUrl, data);
  }

  async update(
    id: number | string,
    data: Partial<MotivoAtendimento>
  ): Promise<MotivoAtendimento> {
    return await api.put<MotivoAtendimento>(`${this.baseUrl}/${id}`, data);
  }

  async delete(id: number | string): Promise<void> {
    await api.delete<void>(`${this.baseUrl}/${id}`);
  }
}

export const motivosAtendimentoService = new MotivosAtendimentoService();
