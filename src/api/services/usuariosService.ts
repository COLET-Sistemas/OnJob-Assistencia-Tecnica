import {
  Usuario,
  UsuarioRegiao,
  UsuarioComRegioes,
  UsuariosRegioesResponse,
  UsuarioAPIResponse,
} from "../../types/admin/cadastro/usuarios";
import api from "../api";

// Interface para padronizar resposta da API
interface ApiResponse<T> {
  dados: T;
  mensagem?: string;
  sucesso: boolean;
}

interface CreateUserResponse {
  mensagem: string;
  senha_provisoria: string;
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
      apenas_tecnicos: "S",
      situacao: "A",
    };
    return await api.get<ApiResponse<Usuario[]>>(this.baseUrl, {
      params: tecnicoParams,
    });
  }

  async getById(id: number | string): Promise<Usuario> {
    const response = await api.get<UsuarioAPIResponse[]>(`${this.baseUrl}`, {
      params: { id },
    });

    // Verificar se a resposta é um array e pegar o primeiro item
    if (!Array.isArray(response) || response.length === 0) {
      throw new Error(`Usuário com ID ${id} não encontrado`);
    }

    // Obter o usuário do array (primeiro item)
    const usuarioAPI = response[0];

    // Mapeamento para o formato esperado pela aplicação
    const usuarioFormatado: Usuario = {
      id: usuarioAPI.id,
      nome: usuarioAPI.nome,
      login: usuarioAPI.login,
      email: usuarioAPI.email,
      telefone: usuarioAPI.telefone,
      // Mantendo situacao como string ("A" ou "I")
      situacao: usuarioAPI.situacao,
      data_situacao: usuarioAPI.data_situacao,
      perfil_interno: usuarioAPI.perfil_interno || false,
      perfil_gestor_assistencia: usuarioAPI.perfil_gestor_assistencia || false,
      perfil_tecnico_proprio: usuarioAPI.perfil_tecnico_proprio || false,
      perfil_tecnico_terceirizado:
        usuarioAPI.perfil_tecnico_terceirizado || false,
      administrador: usuarioAPI.administrador || false,
      senha_provisoria: usuarioAPI.senha_provisoria || false,
      empresa: usuarioAPI.empresa,
      permite_cadastros: usuarioAPI.permite_cadastros ?? false,
    };

    return usuarioFormatado;
  }

  async create(
    data: Omit<Usuario, "id" | "data_situacao">
  ): Promise<CreateUserResponse> {
    return await api.post<CreateUserResponse>(this.baseUrl, data);
  }

  async update(id: number | string, data: Partial<Usuario>): Promise<Usuario> {
    return await api.put<Usuario>(`${this.baseUrl}?id=${id}`, data);
  }

  async delete(id: number | string): Promise<void> {
    await api.delete<void>(`${this.baseUrl}?id=${id}`);
  }

  // Nova função para ativar usuário
  async activate(id: number | string): Promise<{
    mensagem: string;
    sucesso: boolean;
  }> {
    return await api.put<{
      mensagem: string;
      sucesso: boolean;
    }>(`${this.baseUrl}?id=${id}`, {
      situacao: "A", // Enviando "A" para ativar o usuário
    });
  }

  async resetPassword(
    id: number | string,
    passwordData: { senha_atual: string; nova_senha: string }
  ): Promise<{
    mensagem: string;
    sucesso: boolean;
    senha_provisoria?: string;
  }> {
    return await api.patch<{
      mensagem: string;
      sucesso: boolean;
      senha_provisoria?: string;
    }>(this.baseUrl, {
      id_usuario: id,
      senha_atual: passwordData.senha_atual,
      nova_senha: passwordData.nova_senha,
    });
  }
}

class UsuariosRegioesService {
  private baseUrl = "/usuarios_regioes";

  async getAll(
    params?: Record<string, string | number | boolean>
  ): Promise<UsuariosRegioesResponse> {
    return await api.get<UsuariosRegioesResponse>(this.baseUrl, { params });
  }

  async getById(id: number | string): Promise<UsuarioComRegioes> {
    // Add query parameter to ensure we get the specific user with their regions
    const response = await api.get<{ dados: UsuarioComRegioes[] }>(
      `${this.baseUrl}`,
      {
        params: { id_usuario: id },
      }
    );

    // Extract the user from the dados array (should be only one)
    const users = response.dados || [];
    if (users.length === 0) {
      throw new Error(`Usuário com ID ${id} não encontrado`);
    }

    return users[0];
  }

  async create(
    data: Omit<UsuarioRegiao, "id" | "data_cadastro">
  ): Promise<UsuarioRegiao> {
    return await api.post<UsuarioRegiao>(this.baseUrl, data);
  }

  async update(
    id: number | string,
    data: { id_usuario: number; id_regiao: number[] }
  ): Promise<{ message: string; success: boolean }> {
    return await api.put<{ message: string; success: boolean }>(
      `${this.baseUrl}/${id}`,
      data
    );
  }

  async delete(id: number | string): Promise<void> {
    await api.delete<void>(`${this.baseUrl}/${id}`);
  }
}

export const usuariosService = new UsuariosService();
export const usuariosRegioesService = new UsuariosRegioesService();
