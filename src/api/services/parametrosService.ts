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

  async getByChave(chave: string): Promise<ParametroSistema | null> {
    const queryParam = encodeURIComponent(chave);
    const response = await api.get<
      ApiResponse<ParametroSistema | ParametroSistema[]>
    >(`${this.baseUrl}?chave=${queryParam}`);

    const data = extractData<ParametroSistema | ParametroSistema[]>(response);
    if (Array.isArray(data)) {
      return data[0] ?? null;
    }

    return data ?? null;
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
