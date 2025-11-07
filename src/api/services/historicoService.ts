import api from "../api";

export type HistoricoTipo = "cliente" | "maquina";

export interface HistoricoRegistro {
  id_fat: number;
  numero_os: number;
  data_atendimento: string;
  motivo_atendimento: string;
  em_garantia: boolean;
  nome_cliente?: string;
  nome_tecnico: string;
  numero_serie?: string;
  descricao_maquina?: string;
  descricao_problema: string;
  solucao_encontrada: string;
  testes_realizados: string;
  sugestoes: string;
  observacoes: string;
  observacoes_tecnico: string;
  observacoes_revisao: string;
  numero_ciclos: number;
}

export interface HistoricoResponse {
  total_registros: number;
  total_paginas: number;
  dados: HistoricoRegistro[];
}

interface HistoricoParams {
  id_cliente?: number;
  id_maquina?: number;
  nro_pagina?: number;
  qtde_registros?: number;
}

class HistoricoService {
  private baseUrl = "/historico";

  async getHistorico(params: HistoricoParams): Promise<HistoricoResponse> {
    return api.get<HistoricoResponse>(this.baseUrl, {
      params: {
        qtde_registros: 50,
        nro_pagina: 1,
        ...params,
      },
    });
  }
}

export const historicoService = new HistoricoService();
