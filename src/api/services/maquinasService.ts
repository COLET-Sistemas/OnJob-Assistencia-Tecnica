import {
  Maquina,
  FormData as MaquinaFormData,
  MaquinaResponse,
} from "../../types/admin/cadastro/maquinas";
import api from "../api";

class MaquinasService {
  private baseUrl = "/maquinas";

  async getAll(
    page = 1,
    limit = 20,
    incluirInativos = false,
    numeroSerie?: string,
    modelo?: string,
    descricao?: string
  ): Promise<MaquinaResponse> {
    const params: Record<string, string | number | boolean> = {
      nro_pagina: page,
      qtde_registros: limit,
    };

    // Apenas adiciona o parâmetro incluir_inativos se for true
    if (incluirInativos) {
      params.incluir_inativos = "S";
    }

    // Adiciona os parâmetros de filtro apenas se estiverem presentes
    if (numeroSerie) {
      params.numero_serie = numeroSerie;
    }

    if (modelo) {
      params.modelo = modelo;
    }

    if (descricao) {
      params.descricao = descricao;
    }

    return await api.get<MaquinaResponse>(this.baseUrl, { params });
  }

  async getByClienteId(
    clienteId: number,
    limit = 10
  ): Promise<MaquinaResponse> {
    const params = {
      id_cliente_atual: clienteId,
      qtde_registros: limit,
    };

    return await api.get<MaquinaResponse>(this.baseUrl, { params });
  }

  async searchByNumeroSerie(
    numeroSerie: string,
    limit = 15
  ): Promise<MaquinaResponse> {
    const params = {
      qtde_registros: limit,
      resumido: "S",
      numero_serie: numeroSerie,
    };

    return await api.get<MaquinaResponse>(this.baseUrl, { params });
  }

  async getById(id: number | string): Promise<Maquina> {
    return await api.get<Maquina>(this.baseUrl, { params: { id } });
  }

  async create(data: MaquinaFormData): Promise<Maquina> {
    return await api.post<Maquina>(this.baseUrl, data);
  }

  async update(
    id: number | string,
    data: Partial<MaquinaFormData>
  ): Promise<Maquina> {
    return await api.put<Maquina>(`${this.baseUrl}?id=${id}`, data);
  }

  async delete(id: number | string): Promise<void> {
    await api.delete<void>(`${this.baseUrl}?id=${id}`);
  }

  /** 🔍 Busca modelos de máquinas conforme o texto digitado */
  async getModelos(modelo: string): Promise<string[]> {
    const response = await api.get<
      | { data?: { dados?: { modelo: string }[] } }
      | { dados?: { modelo: string }[] }
      | { data?: { modelo: string }[] }
      | { modelo: string }[]
    >(`/modelos_maquinas`, {
      params: { modelo },
    });

    type ModeloItem = string | { modelo?: string };
    const candidates: unknown[] = [
      response,
      (response as { data?: unknown }).data,
      (response as { dados?: unknown }).dados,
      (response as { data?: { dados?: unknown } }).data?.dados,
    ];

    const rawList =
      (candidates.find((candidate) => Array.isArray(candidate)) as
        | ModeloItem[]
        | undefined) ?? [];

    const modelos = rawList
      .map((item) =>
        typeof item === "string" ? item : item?.modelo?.toString() ?? ""
      )
      .map((valor) => valor.trim())
      .filter((valor): valor is string => valor.length > 0);

    return Array.from(new Set(modelos));
  }
}

export const maquinasService = new MaquinasService();
