import api from "../api";
import type { LicencaTipo } from "@/types/licenca";

interface EmpresaInfo {
  id: number;
  nome: string;
  nome_bd: string;
  razao_social?: string;
  cnpj?: string;
  licenca_tipo?: LicencaTipo | null;
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
    if (typeof window === "undefined") {
      return;
    }

    const previousEmpresa = this.getEmpresaFromStorage();
    const mergedLicencaTipo =
      empresaData.licenca_tipo ?? previousEmpresa?.licenca_tipo ?? null;

    const dataToStore = {
      ...empresaData,
      licenca_tipo: mergedLicencaTipo,
    };

    localStorage.setItem("empresa", JSON.stringify(dataToStore));
    if (mergedLicencaTipo) {
      localStorage.setItem("licenca_tipo", mergedLicencaTipo);
    } else {
      localStorage.removeItem("licenca_tipo");
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
      if (empresa?.nome) {
        return empresa.nome;
      }
    } catch (error) {
      console.error("Erro ao recuperar empresa do localStorage:", error);
    }
    return "OnJob";
  }

  clearEmpresaData(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("empresa");
      localStorage.removeItem("licenca_tipo");
    }
  }
}

export const empresaService = new EmpresaService();
