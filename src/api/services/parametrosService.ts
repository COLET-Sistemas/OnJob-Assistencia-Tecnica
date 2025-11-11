import api from "../api";
import { ParametroSistema } from "@/types/admin/administracao/parametros";

interface ApiResponse<T> {
  dados?: T;
  mensagem?: string;
  sucesso?: boolean;
}

const extractData = <T>(response: ApiResponse<T> | T): T => {
  if (Array.isArray(response)) {
    return response as T;
  }

  if (
    response &&
    typeof response === "object" &&
    "dados" in response &&
    response.dados !== undefined
  ) {
    return response.dados as T;
  }

  return response as T;
};

class ParametrosService {
  private baseUrl = "/parametros";

  async getAll(): Promise<ParametroSistema[]> {
    const response = await api.get<ApiResponse<ParametroSistema[]>>(
      this.baseUrl
    );

    return extractData<ParametroSistema[]>(response) ?? [];
  }

  async getAlteraveis(): Promise<ParametroSistema[]> {
    const response = await api.get<ApiResponse<ParametroSistema[]>>(
      this.baseUrl,
      {
        params: {
          alteraveis: "S",
        },
      }
    );

    return extractData<ParametroSistema[]>(response) ?? [];
  }

  async updateValor(
    chave: string,
    valor: string
  ): Promise<ApiResponse<unknown>> {
    const queryParam = encodeURIComponent(chave);

    return await api.put<ApiResponse<unknown>>(
      `${this.baseUrl}?chave=${queryParam}`,
      {
        valor,
      }
    );
  }
}

export const parametrosService = new ParametrosService();
