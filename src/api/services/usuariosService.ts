import { Usuario, UsuarioRegiao } from "../../types/admin/cadastro/usuarios";
import api from "../httpClient";

// Interface para padronizar resposta da API
interface ApiResponse<T> {
  dados: T;
  mensagem?: string;
  sucesso: boolean;
}

class UsuariosService {
  private baseUrl = "/usuarios";

  async getAll(
    params?: Record<string, string | number | boolean>
  ): Promise<ApiResponse<Usuario[]>> {
    return await api.get<ApiResponse<Usuario[]>>(this.baseUrl, { params });
  }

  async getAllTecnicos(
    params?: Record<string, string | number | boolean>
  ): Promise<ApiResponse<Usuario[]>> {
    const tecnicoParams = {
      ...params,
      tipo: "T", // Assumindo que tipo=T filtra por técnicos
    };
    return await api.get<ApiResponse<Usuario[]>>(this.baseUrl, {
      params: tecnicoParams,
    });
  }

  async getById(id: number | string): Promise<Usuario> {
    return await api.get<Usuario>(`${this.baseUrl}/${id}`);
  }

  async create(data: Omit<Usuario, "id" | "data_situacao">): Promise<Usuario> {
    return await api.post<Usuario>(this.baseUrl, data);
  }

  async update(id: number | string, data: Partial<Usuario>): Promise<Usuario> {
    return await api.put<Usuario>(`${this.baseUrl}/${id}`, data);
  }

  async delete(id: number | string): Promise<void> {
    await api.delete<void>(`${this.baseUrl}/${id}`);
  }
}

class UsuariosRegioesService {
  private baseUrl = "/usuarios_regioes";

  async getAll(
    params?: Record<string, string | number | boolean>
  ): Promise<UsuarioRegiao[]> {
    return await api.get<UsuarioRegiao[]>(this.baseUrl, { params });
  }

  async getById(id: number | string): Promise<UsuarioRegiao> {
    return await api.get<UsuarioRegiao>(`${this.baseUrl}/${id}`);
  }

  async create(
    data: Omit<UsuarioRegiao, "id" | "data_cadastro">
  ): Promise<UsuarioRegiao> {
    return await api.post<UsuarioRegiao>(this.baseUrl, data);
  }

  async update(
    id: number | string,
    data: Partial<UsuarioRegiao>
  ): Promise<UsuarioRegiao> {
    return await api.put<UsuarioRegiao>(`${this.baseUrl}/${id}`, data);
  }

  async delete(id: number | string): Promise<void> {
    await api.delete<void>(`${this.baseUrl}/${id}`);
  }
}

export const usuariosService = new UsuariosService();
export const usuariosRegioesService = new UsuariosRegioesService();
