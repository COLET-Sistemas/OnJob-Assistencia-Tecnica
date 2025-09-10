import {
  Cliente,
  ClienteContato,
  FormData as ClienteFormData,
} from "../../types/admin/cadastro/clientes";
import api from "../api";

class ClientesService {
  private baseUrl = "/clientes";

  async getAll(params?: Record<string, string | number | boolean>): Promise<{
    total_registros: number;
    total_paginas: number;
    dados: Cliente[];
  }> {
    return await api.get<{
      total_registros: number;
      total_paginas: number;
      dados: Cliente[];
    }>(this.baseUrl, { params });
  }

  async search(term: string): Promise<{
    total_registros: number;
    total_paginas: number;
    dados: Cliente[];
  }> {
    return await api.get<{
      total_registros: number;
      total_paginas: number;
      dados: Cliente[];
    }>(this.baseUrl, {
      params: {
        qtde_registros: 25,
        resumido: "S",
        nome: term,
      },
    });
  }

  async getById(id: number | string): Promise<Cliente> {
    return await api.get<Cliente>(this.baseUrl, { params: { id } });
  }

  async create(data: ClienteFormData): Promise<Cliente> {
    return await api.post<Cliente>(this.baseUrl, data);
  }

  async update(
    id: number | string,
    data: Partial<ClienteFormData>
  ): Promise<Cliente> {
    return await api.put<Cliente>(`${this.baseUrl}/${id}`, data);
  }

  async delete(id: number | string): Promise<void> {
    await api.delete<void>(`${this.baseUrl}/${id}`);
  }

  async getContacts(clienteId: number | string): Promise<{
    id_cliente: number;
    nome_fantasia: string;
    contatos: ClienteContato[];
  }> {
    return await api.get<{
      id_cliente: number;
      nome_fantasia: string;
      contatos: ClienteContato[];
    }>(`${this.baseUrl}_contatos`, {
      params: { id_cliente: clienteId },
    });
  }
}

export const clientesService = new ClientesService();
