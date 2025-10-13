import api from "../api";

interface DashboardGestor {
  cards: {
    os_abertas_total: number;
    os_encerradas_total: number;
    os_abertas_mes: number;
    os_encerradas_mes: number;
    os_abertas_hoje: number;
    os_encerradas_hoje: number;
    os_aberto_total: number;
    os_aberto_garantia: number;
    os_aberto_pendentes: number;
  };
  graficos: {
    motivos_atendimento: {
      descricao: string;
      quantidade: number;
    }[];
    por_tecnico: {
      nome: string;
      quantidade: number;
    }[];
    top_clientes: {
      cliente: string;
      quantidade: number;
    }[];
  };
}

interface DashboardTecnico {
  cards: {
    os_abertas_total: number;
    os_encerradas_total: number;
    os_abertas_mes: number;
    os_encerradas_mes: number;
    os_abertas_hoje: number;
    os_encerradas_hoje: number;
    os_aberto_total: number;
    os_aberto_garantia: number;
    os_aberto_pendentes: number;
  };
  graficos: {
    motivos_atendimento: {
      descricao: string;
      quantidade: number;
    }[];
    por_tecnico: {
      nome: string;
      quantidade: number;
    }[];
    top_clientes: {
      cliente: string;
      quantidade: number;
    }[];
  };
  os_ultimas?: {
    id: number;
    numero_os: string;
    data_abertura: string;
    cliente: {
      nome_fantasia: string;
    };
    status: string;
  }[];
}

class DashboardService {
  async getGestorData(
    params?: Record<string, string | number | boolean>
  ): Promise<DashboardGestor> {
    return api.get<DashboardGestor>("/dashboard", { params });
  }

  async getTecnicoData(
    params?: Record<string, string | number | boolean>
  ): Promise<DashboardTecnico> {
    return api.get<DashboardTecnico>("/dashboard", { params });
  }
}

export const dashboardService = new DashboardService();
