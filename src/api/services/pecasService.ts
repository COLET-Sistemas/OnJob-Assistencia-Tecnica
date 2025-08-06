import { Peca } from '../../types/admin/cadastro/pecas';
import api from '../httpClient';

interface PecaResponse {
    total_registros: number;
    total_paginas: number;
    dados: Peca[];
    pagina_atual?: number;
    registros_por_pagina?: number;
}

class PecasService {
    private baseUrl = '/pecas';

    async getAll(page = 1, limit = 20, incluirInativos = false): Promise<PecaResponse> {
        const params = {
            nro_pagina: page,
            qtde_registros: limit,
            incluir_inativos: incluirInativos ? 'S' : 'N'
        };

        return await api.get<PecaResponse>(this.baseUrl, { params });
    }

    async getById(id: number | string): Promise<Peca> {
        return await api.get<Peca>(`${this.baseUrl}/${id}`);
    }

    async create(data: Omit<Peca, 'id'>): Promise<Peca> {
        return await api.post<Peca>(this.baseUrl, data);
    }

    async update(id: number | string, data: Partial<Peca>): Promise<Peca> {
        return await api.put<Peca>(`${this.baseUrl}/${id}`, data);
    }

    async delete(id: number | string): Promise<void> {
        await api.delete<void>(`${this.baseUrl}/${id}`);
    }
}

export const pecasService = new PecasService();
