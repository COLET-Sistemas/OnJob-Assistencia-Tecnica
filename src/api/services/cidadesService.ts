import type { Cidade } from "../../types/admin/cadastro/cidades";
import api from "../api";

class CidadesService {
  private baseUrl = "/cidades";

  async getAll(uf?: string): Promise<Cidade[]> {
    const params =
      uf && uf.trim().length > 0 ? { uf: uf.trim().toUpperCase() } : undefined;

    return await api.get<Cidade[]>(this.baseUrl, { params });
  }
}

export const cidadesService = new CidadesService();
