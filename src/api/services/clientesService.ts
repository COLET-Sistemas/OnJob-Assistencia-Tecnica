import { Cliente, FormData as ClienteFormData } from '../../types/admin/cadastro/clientes';
import api from '../httpClient';

class ClientesService {
    private baseUrl = '/clientes';

    async getAll(params?: Record<string, string | number | boolean>): Promise<Cliente[]> {
        return await api.get<Cliente[]>(this.baseUrl, { params });
    }

    async getById(id: number | string): Promise<Cliente> {
        return await api.get<Cliente>(`${this.baseUrl}/${id}`);
    }

    async create(data: ClienteFormData): Promise<Cliente> {
        return await api.post<Cliente>(this.baseUrl, data);
    }

    async update(id: number | string, data: Partial<ClienteFormData>): Promise<Cliente> {
        return await api.put<Cliente>(`${this.baseUrl}/${id}`, data);
    }

    async delete(id: number | string): Promise<void> {
        await api.delete<void>(`${this.baseUrl}/${id}`);
    }
}

export const clientesService = new ClientesService();
