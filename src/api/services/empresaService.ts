import api from "../api";

interface EmpresaInfo {
  id: number;
  nome: string;
  nome_bd: string;
  razao_social?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

class EmpresaService {
  async getEmpresaInfo(): Promise<EmpresaInfo> {
    return api.get<EmpresaInfo>("/empresa/info");
  }

  saveEmpresaData(empresaData: EmpresaInfo): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("empresa", JSON.stringify(empresaData));
    }
  }

  getEmpresaFromStorage(): EmpresaInfo | null {
    if (typeof window !== "undefined") {
      const empresa = localStorage.getItem("empresa");
      return empresa ? JSON.parse(empresa) : null;
    }
    return null;
  }

  getNomeEmpresa(): string {
    try {
      const empresa = this.getEmpresaFromStorage();
      if (empresa?.nome_bd) {
        const nomeExtraido = empresa.nome_bd.includes(":")
          ? empresa.nome_bd.split(":").pop()?.trim() ?? "OnJob"
          : empresa.nome_bd;
        return nomeExtraido;
      }
    } catch (error) {
      console.error("Erro ao recuperar empresa do localStorage:", error);
    }
    return "OnJob";
  }

  clearEmpresaData(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("empresa");
    }
  }
}

export const empresaService = new EmpresaService();
