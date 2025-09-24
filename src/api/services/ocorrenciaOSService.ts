import api from "../api";

export interface OcorrenciaOS {
  id_os: number;
  ocorrencia: string;
  descricao_ocorrencia?: string;
}

export interface OcorrenciaResponse {
  mensagem: string;
}

class OcorrenciasOSService {
  private baseUrl = "/ocorrencias_os";

  async registrarOcorrencia(data: OcorrenciaOS): Promise<OcorrenciaResponse> {
    return api.post<OcorrenciaResponse>(this.baseUrl, data);
  }
}

export const ocorrenciasOSService = new OcorrenciasOSService();
