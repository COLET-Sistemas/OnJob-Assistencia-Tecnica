import api from "../api";

export interface OcorrenciaOS {
  id_os: number;
  ocorrencia: string;
  descricao_ocorrencia?: string;
}

export interface OcorrenciaResponse {
  mensagem: string;
}

type OcorrenciaSituacao = {
  codigo: number | string;
  descricao: string;
};

export interface OcorrenciaOSDetalhe {
  id_ocorrencia: number;
  id_os: number;
  id_fat?: number | null;
  ocorrencia?: string;
  descricao_ocorrencia?: string | null;
  data_ocorrencia?: string;
  data?: string;
  situacao?: OcorrenciaSituacao;
  situacao_atual?: OcorrenciaSituacao;
  nova_situacao?: OcorrenciaSituacao;
  usuario?: {
    id?: number;
    nome?: string;
  };
  usuario_nome?: string;
}

class OcorrenciasOSService {
  private baseUrl = "/ocorrencias_os";

  async registrarOcorrencia(data: OcorrenciaOS): Promise<OcorrenciaResponse> {
    return api.post<OcorrenciaResponse>(this.baseUrl, data);
  }

  async listarPorOS(
    id_os: number,
    id_fat = -1
  ): Promise<OcorrenciaOSDetalhe[]> {
    if (!Number.isFinite(id_os)) {
      return [];
    }

    return api.get<OcorrenciaOSDetalhe[]>(this.baseUrl, {
      params: { id_os, id_fat },
    });
  }
}

export const ocorrenciasOSService = new OcorrenciasOSService();
