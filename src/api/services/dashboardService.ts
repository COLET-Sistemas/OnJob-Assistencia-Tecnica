import api from "../api";

interface DashboardGestor {
  os_status_count: {
    abertas: number;
    pendentes: number;
    em_execucao: number;
    finalizadas: number;
    total: number;
  };
  os_por_regiao: {
    regiao: string;
    quantidade: number;
  }[];
  os_por_cliente: {
    cliente: string;
    quantidade: number;
  }[];
  os_por_motivo: {
    motivo: string;
    quantidade: number;
  }[];
  os_por_periodo: {
    periodo: string;
    quantidade: number;
  }[];
}

interface DashboardTecnico {
  os_status_count: {
    abertas: number;
    pendentes: number;
    em_execucao: number;
    finalizadas: number;
    total: number;
  };
  os_ultimas: {
    id: number;
    numero_os: string;
    data_abertura: string;
    cliente: {
      nome_fantasia: string;
    };
    status: string;
  }[];
  os_por_periodo: {
    periodo: string;
    quantidade: number;
  }[];
}

class DashboardService {
  async getGestorData(
    params?: Record<string, string | number | boolean>
  ): Promise<DashboardGestor> {
    return api.get<DashboardGestor>("/dashboard/gestor", { params });
  }

  async getTecnicoData(
    params?: Record<string, string | number | boolean>
  ): Promise<DashboardTecnico> {
    return api.get<DashboardTecnico>("/dashboard/tecnico", { params });
  }
}

export const dashboardService = new DashboardService();
