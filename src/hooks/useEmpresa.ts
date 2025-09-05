import { useState, useEffect } from "react";
import { empresaService } from "@/api/services";

interface UseEmpresaReturn {
  nomeEmpresa: string;
  loading: boolean;
  error: string | null;
  refreshEmpresa: () => Promise<void>;
}

export function useEmpresa(): UseEmpresaReturn {
  const [nomeEmpresa, setNomeEmpresa] = useState<string>("OnJob");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmpresaFromStorage = () => {
    const nome = empresaService.getNomeEmpresa();
    setNomeEmpresa(nome);
  };

  const refreshEmpresa = async () => {
    try {
      setLoading(true);
      setError(null);

      const empresaData = await empresaService.getEmpresaInfo();
      empresaService.saveEmpresaData(empresaData);

      const nome = empresaService.getNomeEmpresa();
      setNomeEmpresa(nome);
    } catch (error) {
      console.error("Erro ao carregar dados da empresa:", error);
      setError("Erro ao carregar dados da empresa");
      // Em caso de erro, usa o que está no localStorage ou valor padrão
      loadEmpresaFromStorage();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchEmpresaFromServer = async () => {
      try {
        setLoading(true);
        setError(null);

        const empresaData = await empresaService.getEmpresaInfo();
        empresaService.saveEmpresaData(empresaData);

        const nome = empresaService.getNomeEmpresa();
        setNomeEmpresa(nome);
      } catch (error) {
        console.error("Erro ao carregar dados da empresa:", error);
        setError("Erro ao carregar dados da empresa");
        // Em caso de erro, usa o que está no localStorage ou valor padrão
        loadEmpresaFromStorage();
      } finally {
        setLoading(false);
      }
    };

    // Primeiro, tenta carregar do localStorage
    const empresaFromStorage = empresaService.getEmpresaFromStorage();

    if (empresaFromStorage) {
      // Se tem dados no localStorage, carrega eles primeiro
      loadEmpresaFromStorage();
      setLoading(false);
    } else {
      // Se não tem dados no localStorage, busca do servidor
      fetchEmpresaFromServer();
    }
  }, []);

  return {
    nomeEmpresa,
    loading,
    error,
    refreshEmpresa,
  };
}
