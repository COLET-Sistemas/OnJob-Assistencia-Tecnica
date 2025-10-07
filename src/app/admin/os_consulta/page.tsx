"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import PageHeader from "@/components/admin/ui/PageHeader";
import { EnhancedDataTable, StatusBadge } from "@/components/admin/common";
import { ordensServicoService } from "@/api/services/ordensServicoService";
import { usuariosService } from "@/api/services/usuariosService";
import { formatarData } from "@/utils/formatters";
import { LoadingSpinner } from "@/components/LoadingPersonalizado";
import Pagination from "@/components/admin/ui/Pagination";
import TecnicoBadge from "@/components/admin/ui/TecnicoBadge";
import { useFilters } from "@/hooks/useFilters";
import {
  Search,
  ChevronDown,
  X,
  Eye,
  Info,
  ClipboardList,
  Clock,
  Bell,
  Car,
  Wrench,
  PauseCircle,
  FileSearch,
  CheckCircle,
  XCircle,
  UserX,
  User,
  Laptop,
  RefreshCw,
} from "lucide-react";

// Interface estendida para suportar os campos adicionais do exemplo da API
interface OSItemExtended {
  // Make id_os required since it's used throughout
  id_os: number;
  id?: number; // Add this for compatibility with keyField
  numero_os?: string; // Add this since it's referenced in the code
  descricao_problema?: string;
  em_garantia?: boolean;
  status?: number; // Add this since it's used in fallbacks
  data_abertura?: string; // Add this since it's used as fallback
  abertura?: {
    data_abertura: string;
    forma_abertura: string;
    origem_abertura: string;
    nome_usuario: string;
    motivo_atendimento: string;
  };
  data_agendada?: string;
  data_fechamento?: string;
  cliente: {
    id: number;
    nome_fantasia: string;
    nome?: string;
    endereco?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
    latitude?: string;
    longitude?: string;
  };
  contato?: {
    nome: string;
    telefone: string;
    whatsapp?: string;
    email?: string;
  };
  maquina: {
    id: number;
    numero_serie: string;
    descricao?: string;
    modelo?: string;
  };
  situacao_os?: {
    codigo: number;
    descricao: string;
    motivo_pendencia?: string;
  };
  tecnico?: {
    id: number;
    nome: string;
    tipo?: string;
    observacoes?: string;
  };
  liberacao_financeira?: {
    liberada: boolean;
    nome_usuario_liberacao?: string;
    data_liberacao?: string;
  };
}

// We're using the imported TecnicoBadge component instead of this local one

// CSS para animações personalizadas (adicionado ao componente)
const fadeInAnimation = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease-in-out;
}
.os-data-table tr:hover td {
  background-color: rgba(var(--color-primary-rgb), 0.05);
  transition: background-color 0.2s ease;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(var(--color-primary-rgb), 0.3);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}
`;

const ConsultaOSPage: React.FC = () => {
  // showFilters is now provided by useFilters hook
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    dados: OSItemExtended[];
    total_registros: number;
  }>({ dados: [], total_registros: 0 });

  // Pagination state
  const [paginacao, setPaginacao] = useState<{
    paginaAtual: number;
    totalPaginas: number;
    totalRegistros: number;
    registrosPorPagina: number;
  }>({
    paginaAtual: 1,
    totalPaginas: 1,
    totalRegistros: 0,
    registrosPorPagina: 25,
  });
  // Define a more flexible type for technicians
  type TecnicoType = {
    id: number;
    nome: string;
    login?: string;
    perfil_tecnico_proprio?: boolean;
    perfil_tecnico_terceirizado?: boolean;
    tipo?: string;
  };

  const [tecnicos, setTecnicos] = useState<TecnicoType[]>([]);
  const [loadingTecnicos, setLoadingTecnicos] = useState<boolean>(false);

  // Define initial filters
  const INITIAL_OS_FILTERS: Record<string, string> = {
    status: "",
    campo_data: "",
    data_ini: "",
    data_fim: "",
    numero_os: "",
    nome_cliente: "",
    numero_serie: "",
    id_tecnico: "",
    tipo_tecnico: "",
  };

  // Setup filters with localStorage persistence
  const {
    filtrosPainel,
    filtrosAplicados,
    showFilters,
    activeFiltersCount,
    handleFiltroChange,
    limparFiltros,
    aplicarFiltros,
    toggleFilters,
    setShowFilters,
  } = useFilters(INITIAL_OS_FILTERS, "os_consulta_filters");

  // Abre os filtros por padrão ao carregar a página
  useEffect(() => {
    // Pequeno delay para garantir que o componente já esteja renderizado
    const timer = setTimeout(() => {
      setShowFilters(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [setShowFilters]);

  // Additional filter state
  const [disableDateFields, setDisableDateFields] = useState<boolean>(false);
  const [fixedDateType, setFixedDateType] = useState<string | null>(null);

  // Função para obter a data de hoje no formato YYYY-MM-DD
  const getToday = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Função para obter a data de 30 dias atrás no formato YYYY-MM-DD
  const get30DaysAgo = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  };

  // Buscar técnicos ao carregar o componente
  useEffect(() => {
    const fetchTecnicos = async () => {
      try {
        setLoadingTecnicos(true);
        const response = await usuariosService.getAll({ apenas_tecnicos: "S" });

        // Normalize the response to ensure we always work with an array
        let tecnicosData: TecnicoType[] = [];

        if (response) {
          try {
            if (Array.isArray(response)) {
              // Direct array response
              tecnicosData = response.map((user) => ({
                id: Number(user.id) || 0,
                nome: String(user.nome) || "",
                login: user.login as string | undefined,
                perfil_tecnico_proprio: Boolean(user.perfil_tecnico_proprio),
                perfil_tecnico_terceirizado: Boolean(
                  user.perfil_tecnico_terceirizado
                ),
                tipo: (user as { tipo?: string }).tipo,
              }));
            } else if (response.dados && Array.isArray(response.dados)) {
              // Object with dados array
              tecnicosData = response.dados.map((user) => ({
                id: Number(user.id) || 0,
                nome: String(user.nome) || "",
                login: user.login as string | undefined,
                perfil_tecnico_proprio: Boolean(user.perfil_tecnico_proprio),
                perfil_tecnico_terceirizado: Boolean(
                  user.perfil_tecnico_terceirizado
                ),
                tipo: (user as unknown as Record<string, unknown>).tipo as
                  | string
                  | undefined,
              }));
            } else if (typeof response === "object") {
              // Cast to unknown first, then to our desired record type
              const obj = response as unknown as Record<string, unknown>;
              if (obj.id && obj.nome) {
                tecnicosData = [
                  {
                    id: Number(obj.id),
                    nome: String(obj.nome),
                    login: obj.login as string | undefined,
                    perfil_tecnico_proprio: Boolean(obj.perfil_tecnico_proprio),
                    perfil_tecnico_terceirizado: Boolean(
                      obj.perfil_tecnico_terceirizado
                    ),
                    tipo: obj.tipo as string | undefined,
                  },
                ];
              }
            }
          } catch (e) {
            console.warn("Erro ao processar resposta dos técnicos:", e);
          }
        }

        // Filter valid technicians
        const tecnicosFiltrados = tecnicosData.filter(
          (user) =>
            user &&
            (user.perfil_tecnico_proprio ||
              user.perfil_tecnico_terceirizado ||
              // Also consider users with 'tecnico' in their attributes as valid
              user.tipo === "interno" ||
              user.tipo === "terceiro")
        );

        setTecnicos(tecnicosFiltrados.length > 0 ? tecnicosFiltrados : []);
      } catch (err) {
        console.error("Erro ao buscar técnicos:", err);
        setTecnicos([]); // Garante que tecnicos seja sempre um array, mesmo em caso de erro
      } finally {
        setLoadingTecnicos(false);
      }
    };

    fetchTecnicos();
  }, []);

  // Definir status mapping para as ordens de serviço
  // Memoize status mapping to avoid rebuilding on each render
  const statusMapping: Record<
    string,
    { label: string; className: string; icon: React.ReactNode }
  > = useMemo(
    () => ({
      "1": {
        label: "Pendente",
        className: "bg-gray-100 text-gray-700 border border-gray-200",
        icon: (
          <span title="Pendente">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
          </span>
        ),
      },
      "2": {
        label: "A atender",
        className: "bg-blue-100 text-blue-700 border border-blue-200",
        icon: (
          <span title="A atender">
            <Bell className="w-3.5 h-3.5 text-blue-600" />
          </span>
        ),
      },
      "3": {
        label: "Em deslocamento",
        className: "bg-purple-100 text-purple-700 border border-purple-200",
        icon: (
          <span title="Em deslocamento">
            <Car className="w-3.5 h-3.5 text-purple-600" />
          </span>
        ),
      },
      "4": {
        label: "Em atendimento",
        className: "bg-orange-100 text-orange-700 border border-orange-200",
        icon: (
          <span title="Em atendimento">
            <Wrench className="w-3.5 h-3.5 text-orange-600" />
          </span>
        ),
      },
      "5": {
        label: "Atendimento interrompido",
        className: "bg-amber-100 text-amber-700 border border-amber-200",
        icon: (
          <span title="Atendimento interrompido">
            <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
          </span>
        ),
      },
      "6": {
        label: "Em Revisão",
        className: "bg-indigo-100 text-indigo-700 border border-indigo-200",
        icon: (
          <span title="Em Revisão">
            <FileSearch className="w-3.5 h-3.5 text-indigo-600" />
          </span>
        ),
      },
      "7": {
        label: "Concluída",
        className: "bg-green-100 text-green-700 border border-green-200",
        icon: (
          <span title="Concluída">
            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
          </span>
        ),
      },
      "8": {
        label: "Cancelada",
        className: "bg-red-100 text-red-700 border border-red-200",
        icon: (
          <span title="Cancelada">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
          </span>
        ),
      },
      "9": {
        label: "Cancelada pelo Cliente",
        className: "bg-rose-100 text-rose-700 border border-rose-200",
        icon: (
          <span title="Cancelada pelo Cliente">
            <UserX className="w-3.5 h-3.5 text-rose-600" />
          </span>
        ),
      },
    }),
    []
  );

  // Manipulação dos filtros
  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      if (key === "status") {
        // Configurar os campos de data baseados no status selecionado
        const pendingStatuses = ["1", "1,2,3,4,5", "6"];
        const finishedStatuses = ["6,7", "8,9"];

        if (pendingStatuses.includes(value)) {
          // Para Pendente, Em aberto e Aguardando Revisão
          setDisableDateFields(true);
          setFixedDateType(null);
          handleFiltroChange("status", value);
          handleFiltroChange("campo_data", "");
          handleFiltroChange("data_ini", "");
          handleFiltroChange("data_fim", "");
        } else if (finishedStatuses.includes(value)) {
          // Para Concluídas e Canceladas
          setDisableDateFields(false);
          setFixedDateType("fechamento");
          handleFiltroChange("status", value);
          handleFiltroChange("campo_data", "fechamento");
          handleFiltroChange("data_ini", get30DaysAgo());
          handleFiltroChange("data_fim", getToday());
        } else {
          // Para Todas (1,2,3,4,5,6,7,8,9)
          setDisableDateFields(false);
          setFixedDateType(null);
          handleFiltroChange("status", value);
          handleFiltroChange("campo_data", "abertura"); // Por padrão, usar data de abertura
          handleFiltroChange("data_ini", get30DaysAgo());
          handleFiltroChange("data_fim", getToday());
        }
      } else {
        handleFiltroChange(key, value);
      }
    },
    [handleFiltroChange]
  );

  // Função para limpar um campo individual
  const handleClearField = useCallback(
    (key: string) => {
      // Verificar se o campo é dependente de outro
      if (key === "data_ini" || key === "data_fim") {
        // Limpar apenas o campo específico
        handleFiltroChange(key, "");
      } else if (key === "campo_data") {
        // Limpar campo de data e campos dependentes
        handleFiltroChange("campo_data", "");
        handleFiltroChange("data_ini", "");
        handleFiltroChange("data_fim", "");
        setDisableDateFields(false);
      } else if (key === "id_tecnico" || key === "tipo_tecnico") {
        // Limpar ambos os campos relacionados a técnicos
        handleFiltroChange("id_tecnico", "");
        handleFiltroChange("tipo_tecnico", "");
      } else {
        // Limpar o campo normalmente
        handleFiltroChange(key, "");
      }
    },
    [handleFiltroChange]
  );

  const handleClearFiltersCustom = useCallback(() => {
    // First, use limparFiltros to reset all filter values
    limparFiltros();

    // Then immediately ensure the panel stays open
    setTimeout(() => {
      setShowFilters(true);

      // Reset additional state
      setDisableDateFields(false);
      setFixedDateType(null);

      // Reset any form controls if needed (like date inputs)
      const dateInputs = document.querySelectorAll('input[type="date"]');
      dateInputs.forEach((input) => {
        (input as HTMLInputElement).value = "";
      });

      // Foco no primeiro campo após limpar
      const firstInput = document.querySelector(
        ".filter-section input, .filter-section select"
      );
      if (firstInput) {
        (firstInput as HTMLElement).focus();
      }
    }, 0);

    // Reset pagination to first page
    setPaginacao((prev) => ({ ...prev, paginaAtual: 1 }));
  }, [limparFiltros, setShowFilters]);

  // Função para buscar dados com filtros
  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Get current panel filters (not yet applied)
    const currentFilters = { ...filtrosPainel };

    // Apply filters and close filter panel
    aplicarFiltros();

    // Scroll para os resultados suavemente
    window.scrollTo({
      top: document.querySelector(".page-header")?.clientHeight || 0,
      behavior: "smooth",
    });

    try {
      const params: Record<string, string | number | boolean> = {
        resumido: "s",
        nro_pagina: paginacao.paginaAtual,
        qtde_registros: paginacao.registrosPorPagina,
      };

      // Adicionar filtros válidos usando os valores atuais do filtrosPainel
      Object.entries(currentFilters).forEach(([key, value]) => {
        // Pula campo_data pois esse é apenas para controle do frontend
        if (key === "campo_data") return;

        if (value && value.trim() !== "") {
          // Verifica se são os parâmetros de data e apenas os adiciona se o campo_data estiver preenchido
          if (
            (key === "data_ini" || key === "data_fim") &&
            currentFilters.campo_data
          ) {
            params[key] = value.trim();
          } else if (key === "id_tecnico") {
            params["id_tecnico"] = value.trim();
          } else if (key === "tipo_tecnico") {
            params["tipo_tecnico"] = value.trim();
          }
          // Tratar o status selecionado
          else if (key === "status") {
            params["situacao"] = value.trim();
          } else {
            params[key] = value.trim();
          }
        }
      });

      // Adiciona o campo_data selecionado aos parâmetros se existir
      if (
        currentFilters.campo_data &&
        currentFilters.campo_data.trim() !== ""
      ) {
        params["campo_data"] = currentFilters.campo_data.trim();
      }

      const result = await ordensServicoService.getAll(params);

      // Handle both formats: array response or object with dados property
      let responseData;
      let total = 0;
      let totalPages = 1;

      if (Array.isArray(result)) {
        // Direct array response as shown in your example
        console.log("API returned array response", result);
        responseData = result;
        total = result.length;
        totalPages = Math.ceil(total / paginacao.registrosPorPagina);
      } else if (result && result.dados && Array.isArray(result.dados)) {
        // Object with dados array property
        responseData = result.dados;
        total = result.total_registros || responseData.length;
        totalPages =
          result.total_paginas ||
          Math.ceil(total / paginacao.registrosPorPagina);
      } else {
        console.error("Dados inválidos recebidos da API:", result);
        setError("Formato de dados inválido recebido da API. Tente novamente.");
        return;
      }

      // Log the first item to help with debugging
      if (responseData.length > 0) {
        console.log("First response item:", responseData[0]);
      }

      // Use type assertion to handle the response data
      const validItems = responseData.filter((item) => !!item);

      const mappedData = {
        total_registros: total,
        dados: validItems.map((item) => {
          const id_os =
            typeof item.id_os === "number"
              ? item.id_os
              : typeof item.id === "number"
              ? item.id
              : 0;
          return {
            ...item,
            id_os,
            id: typeof item.id === "number" ? item.id : id_os,
            cliente: {
              id: item.cliente?.id ?? 0,
              nome_fantasia: item.cliente?.nome_fantasia ?? "",
              nome: item.cliente?.nome,
              endereco: item.cliente?.endereco,
              numero: item.cliente?.numero,
              complemento: item.cliente?.complemento,
              bairro: item.cliente?.bairro,
              cidade: item.cliente?.cidade,
              uf: item.cliente?.uf,
              cep: item.cliente?.cep,
              latitude: item.cliente?.latitude,
              longitude: item.cliente?.longitude,
            },
            maquina: {
              id: item.maquina?.id ?? 0,
              numero_serie: item.maquina?.numero_serie ?? "",
              descricao: item.maquina?.descricao,
              modelo: item.maquina?.modelo,
            },
          };
        }),
      };

      // Update pagination information
      setPaginacao((prev) => ({
        ...prev,
        totalPaginas: totalPages,
        totalRegistros: total,
      }));

      setData(mappedData);
    } catch (err) {
      setError("Refaça o filtro e tente novamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [
    filtrosPainel,
    aplicarFiltros,
    paginacao.paginaAtual,
    paginacao.registrosPorPagina,
  ]);

  // Configurar campos de data com base no status ao iniciar ou quando o status muda
  useEffect(() => {
    const currentStatus = filtrosPainel.status;
    if (currentStatus) {
      const pendingStatuses = ["1", "1,2,3,4,5", "6"];
      const finishedStatuses = ["6,7", "8,9"];

      if (pendingStatuses.includes(currentStatus)) {
        setDisableDateFields(true);
        setFixedDateType(null);
      } else if (finishedStatuses.includes(currentStatus)) {
        setDisableDateFields(false);
        setFixedDateType("fechamento");
      } else {
        setDisableDateFields(false);
        setFixedDateType(null);
      }
    }
  }, [filtrosPainel.status]);

  // Função para lidar com o clique em uma linha da tabela
  const handleRowClick = (id: number | string) => {
    setExpandedRowId(expandedRowId === Number(id) ? null : Number(id));
  };

  // Adicionar suporte a navegação por teclado para acessibilidade
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Fechar o filtro com ESC
      if (e.key === "Escape" && showFilters) {
        toggleFilters();
      }
      // Abrir o filtro com F3
      if (e.key === "F3" && !showFilters) {
        e.preventDefault();
        toggleFilters();
      }
      // Pesquisar com Ctrl+Enter quando o filtro estiver aberto
      if (e.key === "Enter" && e.ctrlKey && showFilters) {
        e.preventDefault();
        handleSearch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showFilters, toggleFilters, handleSearch]);

  // Pagination handlers
  const handlePageChange = useCallback(
    (novaPagina: number) => {
      // First update state with the new page number
      setPaginacao((prev) => ({ ...prev, paginaAtual: novaPagina }));

      // Create a function to manually trigger search with the new page number
      const searchWithCorrectPage = async () => {
        // Get current filters from filtrosPainel to ensure we're using the latest values
        const currentFilters = { ...filtrosPainel };

        // Execute search with the new page number explicitly set
        setLoading(true);
        setError(null);

        try {
          // Create params for the API call
          const params: Record<string, string | number | boolean> = {
            resumido: "s",
            nro_pagina: novaPagina, // Use the new page number directly
            qtde_registros: paginacao.registrosPorPagina,
          };

          // Add valid filters
          Object.entries(currentFilters).forEach(([key, value]) => {
            if (key === "campo_data") return;

            if (value && value.trim() !== "") {
              if (
                (key === "data_ini" || key === "data_fim") &&
                currentFilters.campo_data
              ) {
                params[key] = value.trim();
              } else if (key === "id_tecnico") {
                params["id_tecnico"] = value.trim();
              } else if (key === "tipo_tecnico") {
                params["tipo_tecnico"] = value.trim();
              } else if (key === "status") {
                params["situacao"] = value.trim();
              } else {
                params[key] = value.trim();
              }
            }
          });

          // Add campo_data if it exists
          if (
            currentFilters.campo_data &&
            currentFilters.campo_data.trim() !== ""
          ) {
            params["campo_data"] = currentFilters.campo_data.trim();
          }

          // Make the API call
          const result = await ordensServicoService.getAll(params);

          // Process the result
          if (result) {
            // Handle both formats: array response or object with dados property
            let responseData;
            let total = 0;
            let totalPages = 1;

            if (Array.isArray(result)) {
              // Direct array response
              responseData = result;
              total = result.length;
              totalPages = Math.ceil(total / paginacao.registrosPorPagina);
            } else if (result && result.dados && Array.isArray(result.dados)) {
              // Object with dados array property
              responseData = result.dados;
              total = result.total_registros || responseData.length;
              totalPages =
                result.total_paginas ||
                Math.ceil(total / paginacao.registrosPorPagina);
            } else {
              console.error("Dados inválidos recebidos da API:", result);
              setError(
                "Formato de dados inválido recebido da API. Tente novamente."
              );
              return;
            }

            // Filter out invalid items
            const validItems = responseData.filter((item) => !!item);

            // Transform data to match expected format
            const mappedData = {
              total_registros: total,
              dados: validItems.map((item) => {
                const id_os =
                  typeof item.id_os === "number"
                    ? item.id_os
                    : typeof item.id === "number"
                    ? item.id
                    : 0;
                return {
                  ...item,
                  id_os,
                  id: typeof item.id === "number" ? item.id : id_os,
                  cliente: {
                    id: item.cliente?.id ?? 0,
                    nome_fantasia: item.cliente?.nome_fantasia ?? "",
                    nome: item.cliente?.nome,
                    endereco: item.cliente?.endereco,
                    numero: item.cliente?.numero,
                    complemento: item.cliente?.complemento,
                    bairro: item.cliente?.bairro,
                    cidade: item.cliente?.cidade,
                    uf: item.cliente?.uf,
                    cep: item.cliente?.cep,
                    latitude: item.cliente?.latitude,
                    longitude: item.cliente?.longitude,
                  },
                  maquina: {
                    id: item.maquina?.id ?? 0,
                    numero_serie: item.maquina?.numero_serie ?? "",
                    descricao: item.maquina?.descricao,
                    modelo: item.maquina?.modelo,
                  },
                };
              }),
            };

            // Set processed data
            setData(mappedData);

            // Update pagination state with the correct page number
            setPaginacao((prev) => ({
              ...prev,
              paginaAtual: novaPagina,
              totalRegistros: total,
              totalPaginas: totalPages,
            }));
          }
        } catch (error) {
          console.error("Erro ao buscar ordens de serviço:", error);
          setError("Erro ao buscar ordens de serviço. Tente novamente.");
        } finally {
          setLoading(false);
        }
      };

      // Execute the search immediately with the correct page number
      searchWithCorrectPage();
    },
    [filtrosPainel, paginacao.registrosPorPagina]
  );

  const handleRecordsPerPageChange = useCallback(
    (novoValor: number) => {
      setPaginacao((prev) => ({
        ...prev,
        registrosPorPagina: novoValor,
        paginaAtual: 1,
      }));

      // Create a custom search function that will use the new value directly
      const searchWithNewRecordsPerPage = async () => {
        setLoading(true);
        setError(null);

        // Get current filters before applying them
        const currentFilters = { ...filtrosPainel };

        // Apply filters and close filter panel
        aplicarFiltros();

        try {
          const params: Record<string, string | number | boolean> = {
            resumido: "s",
            nro_pagina: 1, // Reset to page 1
            qtde_registros: novoValor, // Use the new value directly
          };

          // Add other filters as in handleSearch - use currentFilters instead
          Object.entries(currentFilters).forEach(([key, value]) => {
            if (key === "campo_data") return;

            if (value && value.trim() !== "") {
              if (
                (key === "data_ini" || key === "data_fim") &&
                currentFilters.campo_data
              ) {
                params[key] = value.trim();
              } else if (key === "id_tecnico") {
                params["id_tecnico"] = value.trim();
              } else if (key === "tipo_tecnico") {
                params["tipo_tecnico"] = value.trim();
              } else if (key === "status") {
                params["situacao"] = value.trim();
              } else {
                params[key] = value.trim();
              }
            }
          });

          if (
            currentFilters.campo_data &&
            currentFilters.campo_data.trim() !== ""
          ) {
            params["campo_data"] = currentFilters.campo_data.trim();
          }

          const result = await ordensServicoService.getAll(params);

          // Process the result
          let responseData;
          let total = 0;
          let totalPages = 1;

          if (Array.isArray(result)) {
            responseData = result;
            total = result.length;
            totalPages = Math.ceil(total / novoValor);
          } else if (result && result.dados && Array.isArray(result.dados)) {
            responseData = result.dados;
            total = result.total_registros || responseData.length;
            totalPages = result.total_paginas || Math.ceil(total / novoValor);
          } else {
            console.error("Dados inválidos recebidos da API:", result);
            setError(
              "Formato de dados inválido recebido da API. Tente novamente."
            );
            return;
          }

          // Filter out invalid items
          const validItems = responseData.filter((item) => !!item);

          // Transform data to match expected format
          const mappedData = {
            total_registros: total,
            dados: validItems.map((item) => {
              const id_os =
                typeof item.id_os === "number"
                  ? item.id_os
                  : typeof item.id === "number"
                  ? item.id
                  : 0;
              return {
                ...item,
                id_os,
                id: typeof item.id === "number" ? item.id : id_os,
                cliente: {
                  id: item.cliente?.id ?? 0,
                  nome_fantasia: item.cliente?.nome_fantasia ?? "",
                  nome: item.cliente?.nome,
                  endereco: item.cliente?.endereco,
                  numero: item.cliente?.numero,
                  complemento: item.cliente?.complemento,
                  bairro: item.cliente?.bairro,
                  cidade: item.cliente?.cidade,
                  uf: item.cliente?.uf,
                  cep: item.cliente?.cep,
                  latitude: item.cliente?.latitude,
                  longitude: item.cliente?.longitude,
                },
                maquina: {
                  id: item.maquina?.id ?? 0,
                  numero_serie: item.maquina?.numero_serie ?? "",
                  descricao: item.maquina?.descricao,
                  modelo: item.maquina?.modelo,
                },
              };
            }),
          };

          setData(mappedData);

          setPaginacao((prev) => ({
            ...prev,
            totalRegistros: total,
            totalPaginas: totalPages,
          }));

          setExpandedRowId(null);
        } catch (error) {
          console.error("Erro ao buscar ordens de serviço:", error);
          setError("Erro ao buscar ordens de serviço. Tente novamente.");
        } finally {
          setLoading(false);
        }
      };

      // Execute the search immediately with the new value
      searchWithNewRecordsPerPage();
    },
    [aplicarFiltros, filtrosPainel]
  );

  // Reset to first page when filters change
  useEffect(() => {
    setPaginacao((prev) => ({ ...prev, paginaAtual: 1 }));
  }, [filtrosPainel]);

  // Check for saved state on component mount and restore if needed
  useEffect(() => {
    // Função para checar se o estado salvo é válido (menos de 30 minutos)
    const isSavedStateValid = () => {
      const timestamp = localStorage.getItem("os_consulta_state_timestamp");
      if (!timestamp) return false;

      const savedTime = parseInt(timestamp);
      const currentTime = Date.now();
      const MAX_AGE = 30 * 60 * 1000; // 30 minutes in milliseconds

      return currentTime - savedTime < MAX_AGE;
    };

    // Se tiver um estado salvo válido, restaura ele
    if (isSavedStateValid()) {
      try {
        const savedFilters = localStorage.getItem("os_consulta_saved_filters");
        const savedPagination = localStorage.getItem(
          "os_consulta_saved_pagination"
        );
        const hasSearch = localStorage.getItem("os_consulta_has_search");

        if (savedFilters) {
          const parsedFilters = JSON.parse(savedFilters);
          // Atualizar filtrosAplicados diretamente via limparFiltros e aplicarFiltros
          Object.entries(parsedFilters).forEach(([key, value]) => {
            handleFiltroChange(key, value as string);
          });
        }

        if (savedPagination) {
          const parsedPagination = JSON.parse(savedPagination);
          setPaginacao(parsedPagination);
        }

        // Se tinha uma busca anterior, executa a busca novamente
        if (hasSearch && JSON.parse(hasSearch)) {
          // Pequeno timeout para garantir que os estados foram atualizados
          setTimeout(() => {
            handleSearch();
          }, 100);
        }
      } catch (error) {
        console.error("Erro ao restaurar estado dos filtros:", error);
      }
    }

    // Limpar o estado salvo após utilizá-lo
    const cleanSavedState = () => {
      localStorage.removeItem("os_consulta_saved_filters");
      localStorage.removeItem("os_consulta_saved_pagination");
      localStorage.removeItem("os_consulta_has_search");
      localStorage.removeItem("os_consulta_state_timestamp");
    };

    // Remover o estado salvo ao desmontar o componente
    return () => cleanSavedState();
  }, [handleFiltroChange, handleSearch]);

  // Função para salvar o estado atual dos filtros e paginação
  const saveCurrentState = useCallback(() => {
    // Salva filtros e estado de paginação no localStorage
    localStorage.setItem(
      "os_consulta_saved_filters",
      JSON.stringify(filtrosAplicados)
    );
    localStorage.setItem(
      "os_consulta_saved_pagination",
      JSON.stringify(paginacao)
    );
    localStorage.setItem(
      "os_consulta_has_search",
      JSON.stringify(data.dados.length > 0)
    );
    // Timestamp para controlar a validade do estado salvo
    localStorage.setItem("os_consulta_state_timestamp", Date.now().toString());
  }, [filtrosAplicados, paginacao, data.dados.length]);

  // Função para navegar para a página de detalhes da OS
  const handleRowNavigate = useCallback(
    (item: OSItemExtended) => {
      // Salva o estado atual antes de navegar
      saveCurrentState();
      const osId = item.id_os;
      window.location.href = `/admin/os_detalhes/${osId}`;
    },
    [saveCurrentState]
  );

  // Nota: A função de renderização das linhas expandidas é definida diretamente no componente EnhancedDataTable

  // Definição das colunas da tabela - memoizada para evitar recalculos
  const columns = useMemo(
    () => [
      {
        header: "OS",
        accessor: (item: OSItemExtended) => item.id_os || "-",
        className: "font-medium text-gray-900",
        render: (item: OSItemExtended) => (
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              {item.id_os || "-"}
            </span>
          </div>
        ),
      },
      {
        header: "Cliente",
        accessor: (item: OSItemExtended) =>
          item.cliente?.nome || item.cliente?.nome_fantasia || "-",
        className: "max-w-[180px]",
        render: (item: OSItemExtended) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-800 truncate">
              {item.cliente?.nome || item.cliente?.nome_fantasia || "-"}
            </span>
            <span className="text-xs text-gray-500">
              {item.cliente?.cidade
                ? `${item.cliente.cidade}/${item.cliente.uf || ""}`
                : "-"}
            </span>
          </div>
        ),
      },
      {
        header: "Máquina",
        accessor: (item: OSItemExtended) => item.maquina?.numero_serie || "-",
        className: "hidden md:table-cell",
        render: (item: OSItemExtended) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-800">
              {item.maquina?.numero_serie || "-"}
            </span>
            <span className="text-xs text-gray-500 truncate max-w-[180px]">
              {item.maquina?.modelo || "-"}
            </span>
          </div>
        ),
      },
      {
        header: "Data Abertura",
        accessor: (item: OSItemExtended) =>
          item.abertura?.data_abertura ?? item.data_abertura ?? "-",
        className: "whitespace-nowrap hidden md:table-cell",
      },
      {
        header: "Técnico",
        accessor: (item: OSItemExtended) => item.tecnico?.nome || "-",
        className: "hidden lg:table-cell",
        render: (item: OSItemExtended) => (
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-medium text-gray-800 truncate max-w-[120px]">
                {item.tecnico?.nome || "-"}
              </span>
              {item.tecnico?.tipo && <TecnicoBadge tipo={item.tecnico.tipo} />}
            </div>
          </div>
        ),
      },
      {
        header: "Status",
        accessor: (item: OSItemExtended) =>
          item.situacao_os?.descricao || String(item.status),
        render: (item: OSItemExtended) => (
          <StatusBadge
            status={String(item.situacao_os?.codigo || item.status)}
            mapping={statusMapping}
          />
        ),
      },
    ],
    [statusMapping]
  );

  return (
    <>
      <style jsx global>
        {fadeInAnimation}
      </style>
      <div className="page-header">
        <PageHeader
          title="Consulta de Ordens de Serviço"
          config={{
            type: "list",
            itemCount: data?.total_registros ?? 0,
            showFilters: showFilters,
            onFilterToggle: () => {
              toggleFilters();
              if (!showFilters) {
                setTimeout(() => {
                  const firstInput = document.querySelector(
                    ".filter-section input, .filter-section select"
                  );
                  if (firstInput) {
                    (firstInput as HTMLElement).focus();
                  }
                }, 300);
              }
            },
            activeFiltersCount: activeFiltersCount,
            newButton: {
              label: "Nova OS",
              link: "/admin/os_aberto/novo",
            },
          }}
        />
      </div>

      {/* Seção de Filtros */}
      <div
        className={`bg-white rounded-xl shadow-sm border border-gray-100 mb-3 overflow-hidden transition-all duration-300 ease-in-out ${
          showFilters
            ? "opacity-100 max-h-[2000px]"
            : "opacity-0 max-h-0 mt-0 mb-0 border-0"
        }`}
        role="region"
        aria-label="Filtros de pesquisa"
      >
        <div aria-hidden={!showFilters}>
          <div className="bg-gradient-to-r from-[var(--primary)]/5 to-[var(--primary)]/10 px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-3">
              <div className="bg-[var(--primary)]/10 p-2 rounded-lg">
                <Search size={20} className="text-[var(--primary)]" />
              </div>
              Filtros de Pesquisa
            </h2>
          </div>
          <div className="p-6 filter-section">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Número da OS */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Número da OS
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Digite o número da OS"
                    className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-gray-800 placeholder:text-gray-400 transition-all duration-200"
                    value={filtrosPainel.id || ""}
                    onChange={(e) => handleFilterChange("id", e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {filtrosPainel.id ? (
                      <button
                        type="button"
                        onClick={() => handleClearField("id")}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        aria-label="Limpar número da OS"
                      >
                        <X size={16} />
                      </button>
                    ) : (
                      <span className="text-gray-400 pointer-events-none">
                        <Search size={16} />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Cliente */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Cliente
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Digite o nome do cliente"
                    className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-gray-800 placeholder:text-gray-400 transition-all duration-200"
                    value={filtrosPainel.cliente || ""}
                    onChange={(e) =>
                      handleFilterChange("cliente", e.target.value)
                    }
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {filtrosPainel.cliente ? (
                      <button
                        type="button"
                        onClick={() => handleClearField("cliente")}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        aria-label="Limpar nome do cliente"
                      >
                        <X size={16} />
                      </button>
                    ) : (
                      <span className="text-gray-400 pointer-events-none">
                        <Search size={16} />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Máquina */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Máquina
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Digite o número de série"
                    className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-gray-800 placeholder:text-gray-400 transition-all duration-200"
                    value={filtrosPainel.maquina || ""}
                    onChange={(e) =>
                      handleFilterChange("maquina", e.target.value)
                    }
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {filtrosPainel.maquina ? (
                      <button
                        type="button"
                        onClick={() => handleClearField("maquina")}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        aria-label="Limpar número de série"
                      >
                        <X size={16} />
                      </button>
                    ) : (
                      <span className="text-gray-400 pointer-events-none">
                        <Search size={16} />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span className="text-gray-600">
                    <FileSearch size={16} />
                  </span>
                  Status
                </label>
                <div className="relative">
                  <select
                    className="w-full px-3 py-3 appearance-none border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-gray-800 bg-white transition-all duration-200"
                    value={filtrosPainel.status || ""}
                    onChange={(e) =>
                      handleFilterChange("status", e.target.value)
                    }
                  >
                    <option value="1,2,3,4,5,6,7,8,9">Todas</option>
                    <option value="1">Pendentes</option>
                    <option value="1,2,3,4,5">Em aberto</option>
                    <option value="6">Aguardando Revisão</option>
                    <option value="6,7">Concluídas</option>
                    <option value="8,9">Canceladas</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-400">
                      <ChevronDown className="h-5 w-5" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Técnico */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Técnico
                </label>
                <div className="relative">
                  <select
                    className="w-full px-3 py-3 appearance-none border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-gray-800 bg-white transition-all duration-200"
                    value={
                      filtrosPainel.tipo_tecnico ||
                      filtrosPainel.id_tecnico ||
                      ""
                    }
                    onChange={(e) => {
                      if (
                        e.target.value === "interno" ||
                        e.target.value === "terceiro"
                      ) {
                        // Se for seleção por tipo, limpa id_tecnico e configura tipo_tecnico
                        handleFilterChange("id_tecnico", "");
                        handleFilterChange("tipo_tecnico", e.target.value);
                      } else {
                        // Se for seleção por ID, limpa tipo_tecnico
                        handleFilterChange("tipo_tecnico", "");
                        handleFilterChange("id_tecnico", e.target.value);
                      }
                    }}
                  >
                    <option value="">Todos os Técnicos</option>
                    <option value="interno">Apenas Internos</option>
                    <option value="terceiro">Apenas Terceiros</option>
                    <optgroup label="Técnicos específicos">
                      {tecnicos &&
                        tecnicos.map((tecnico) => (
                          <option
                            key={tecnico?.id || "unknown"}
                            value={tecnico?.id?.toString() || ""}
                          >
                            {tecnico?.nome || "Técnico sem nome"}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {loadingTecnicos ? (
                      <div className="h-4 w-4 border-2 border-t-[var(--primary)] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin pointer-events-none" />
                    ) : filtrosPainel.tipo_tecnico ||
                      filtrosPainel.id_tecnico ? (
                      <button
                        type="button"
                        onClick={() => handleClearField("id_tecnico")}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none mr-5"
                        aria-label="Limpar seleção de técnico"
                      >
                        <X size={16} />
                      </button>
                    ) : (
                      <span className="text-gray-400 pointer-events-none">
                        <ChevronDown className="h-5 w-5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tipo de Data, Data Inicial e Data Final em uma linha */}
              <div className="col-span-1 lg:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Tipo de Data */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Tipo de Data
                    </label>
                    <div className="relative">
                      <select
                        className={`w-full px-3 py-3 appearance-none border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-gray-800 transition-all duration-200 ${
                          disableDateFields || fixedDateType
                            ? "bg-gray-100 cursor-not-allowed"
                            : "bg-white"
                        }`}
                        value={filtrosPainel.campo_data || ""}
                        onChange={(e) =>
                          handleFilterChange("campo_data", e.target.value)
                        }
                        disabled={disableDateFields || fixedDateType !== null}
                      >
                        <option value="">Selecione o tipo</option>
                        <option value="abertura">Data de Abertura</option>
                        <option value="agendada">Data Agendada</option>
                        <option value="fechamento">Data de Fechamento</option>
                        <option value="revisao">Data de Revisão</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {!disableDateFields &&
                        !fixedDateType &&
                        filtrosPainel.campo_data ? (
                          <button
                            type="button"
                            onClick={() => handleClearField("campo_data")}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none mr-5"
                            aria-label="Limpar tipo de data"
                          >
                            <X size={16} />
                          </button>
                        ) : (
                          <span className="text-gray-400 pointer-events-none">
                            <ChevronDown className="h-5 w-5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Data Inicial */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Data Inicial
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        className={`w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-gray-800 transition-all duration-200 ${
                          disableDateFields || !filtrosPainel.campo_data
                            ? "bg-gray-100 cursor-not-allowed"
                            : ""
                        }`}
                        value={filtrosPainel.data_ini || ""}
                        onChange={(e) =>
                          handleFilterChange("data_ini", e.target.value)
                        }
                        disabled={
                          disableDateFields || !filtrosPainel.campo_data
                        }
                      />
                      {!disableDateFields &&
                        filtrosPainel.campo_data &&
                        filtrosPainel.data_ini && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <button
                              type="button"
                              onClick={() => handleClearField("data_ini")}
                              className="text-gray-400 hover:text-gray-600 focus:outline-none"
                              aria-label="Limpar data inicial"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Data Final */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Data Final
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        className={`w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-gray-800 transition-all duration-200 ${
                          disableDateFields || !filtrosPainel.campo_data
                            ? "bg-gray-100 cursor-not-allowed"
                            : ""
                        }`}
                        value={filtrosPainel.data_fim || ""}
                        onChange={(e) =>
                          handleFilterChange("data_fim", e.target.value)
                        }
                        disabled={
                          disableDateFields || !filtrosPainel.campo_data
                        }
                      />
                      {!disableDateFields &&
                        filtrosPainel.campo_data &&
                        filtrosPainel.data_fim && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <button
                              type="button"
                              onClick={() => handleClearField("data_fim")}
                              className="text-gray-400 hover:text-gray-600 focus:outline-none"
                              aria-label="Limpar data final"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-wrap gap-3 mt-8 sm:justify-end justify-center">
              <button
                type="button"
                onClick={handleClearFiltersCustom}
                className="px-5 py-2.5 border-2 border-gray-300 cursor-pointer text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2 group"
                aria-label="Limpar todos os filtros"
              >
                <X className="h-4 w-4 group-hover:scale-110 transition-transform" />
                Limpar Filtros
              </button>
              <button
                type="button"
                onClick={handleSearch}
                className="px-6 py-2.5 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[#7B54BE]/40 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-all duration-200 shadow hover:shadow-md flex items-center gap-2 group"
                aria-label="Realizar pesquisa com filtros selecionados"
              >
                <Search className="h-4 w-4 group-hover:scale-110 transition-transform" />
                Pesquisar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Exibição dos resultados da pesquisa */}
      {loading ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-sm border border-gray-100">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100 p-10 animate-fadeIn">
          <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Nenhum registro encontrado
          </h3>
          <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-8">
            {error}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={toggleFilters}
              className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Modificar Filtros
            </button>
            <button
              onClick={handleSearch}
              className="px-6 py-2.5 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-all duration-200 shadow hover:shadow-md flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </button>
          </div>
        </div>
      ) : data.dados && data.dados.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-2 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-1.5">
              <span className="text-[var(--primary)]">
                <ClipboardList className="h-4 w-4" />
              </span>
              Resultados da Pesquisa
              <span className="ml-2 text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-full">
                {data.total_registros} encontrados
              </span>
            </h2>
          </div>
          <EnhancedDataTable
            columns={columns}
            data={data.dados || []}
            keyField="id_os"
            expandedRowId={expandedRowId}
            onRowExpand={handleRowClick}
            onRowClick={handleRowNavigate}
            renderExpandedRow={(item: OSItemExtended) => (
              <div className="p-5 bg-gradient-to-r from-gray-50 to-white border-t border-b border-gray-100 rounded-b-lg shadow-inner animate-fadeIn">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <span className="text-[var(--primary)]">
                      <Info className="h-5 w-5" />
                    </span>
                    Detalhes da OS #{item.id_os || item.numero_os}
                  </h3>

                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={String(item.situacao_os?.codigo || item.status)}
                      mapping={statusMapping}
                    />
                  </div>
                </div>

                {/* Summary Card */}
                <div className="bg-[var(--primary)]/5 p-4 rounded-lg mb-5 border border-[var(--primary)]/20">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-xs text-gray-500 block">
                        Cliente
                      </span>
                      <span className="font-medium">
                        {item.cliente?.nome ||
                          item.cliente?.nome_fantasia ||
                          "-"}
                      </span>
                      <span className="text-xs text-gray-500 block mt-1">
                        {item.cliente?.cidade
                          ? `${item.cliente.cidade}/${item.cliente.uf || ""}`
                          : "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">
                        Máquina
                      </span>
                      <span className="font-medium">
                        {item.maquina?.numero_serie || "-"}
                      </span>
                      <span className="text-xs text-gray-500 block mt-1">
                        {item.maquina?.modelo || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">
                        Técnico
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">
                          {item.tecnico?.nome || "Não atribuído"}
                        </span>
                        {item.tecnico?.tipo && (
                          <TecnicoBadge tipo={item.tecnico.tipo} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                  {/* Coluna da esquerda */}
                  <div>
                    <div className="mb-5">
                      <h4 className="text-sm font-semibold text-gray-700 border-b pb-1 mb-3 border-gray-200 flex items-center gap-2">
                        <span className="text-[var(--primary)] bg-[var(--primary)]/10 p-1 rounded">
                          <User className="h-3.5 w-3.5" />
                        </span>
                        Informações do Cliente
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        <p className="text-sm flex flex-wrap items-baseline gap-2">
                          <span className="font-medium text-gray-700 min-w-[120px]">
                            Nome:
                          </span>{" "}
                          <span className="text-gray-800">
                            {item.cliente?.nome ||
                              item.cliente?.nome_fantasia ||
                              "-"}
                          </span>
                        </p>
                        <p className="text-sm flex flex-wrap items-baseline gap-2">
                          <span className="font-medium text-gray-700 min-w-[120px]">
                            Endereço:
                          </span>{" "}
                          <span className="text-gray-800">
                            {[
                              item.cliente?.endereco,
                              item.cliente?.numero &&
                                `Nº ${item.cliente.numero}`,
                              item.cliente?.complemento,
                            ]
                              .filter(Boolean)
                              .join(", ") || "-"}
                          </span>
                        </p>
                        <p className="text-sm flex flex-wrap items-baseline gap-2">
                          <span className="font-medium text-gray-700 min-w-[120px]">
                            Cidade/UF:
                          </span>{" "}
                          <span className="text-gray-800">
                            {[item.cliente?.cidade, item.cliente?.uf]
                              .filter(Boolean)
                              .join("/") || "-"}
                            {item.cliente?.cep && ` - CEP: ${item.cliente.cep}`}
                          </span>
                        </p>
                        <p className="text-sm flex flex-wrap items-baseline gap-2">
                          <span className="font-medium text-gray-700 min-w-[120px]">
                            Contato:
                          </span>{" "}
                          <span className="text-gray-800">
                            {item.contato?.nome || "-"}
                          </span>
                        </p>
                        <p className="text-sm flex flex-wrap items-baseline gap-2">
                          <span className="font-medium text-gray-700 min-w-[120px]">
                            Telefone:
                          </span>{" "}
                          <span className="text-gray-800">
                            {item.contato?.telefone || "-"}
                            {item.contato?.whatsapp && (
                              <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-800">
                                WhatsApp
                              </span>
                            )}
                          </span>
                        </p>
                        {item.contato?.email && (
                          <p className="text-sm flex flex-wrap items-baseline gap-2">
                            <span className="font-medium text-gray-700 min-w-[120px]">
                              Email:
                            </span>{" "}
                            <span className="text-gray-800">
                              {item.contato.email}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 border-b pb-1 mb-3 border-gray-200 flex items-center gap-2">
                        <span className="text-[var(--primary)] bg-[var(--primary)]/10 p-1 rounded">
                          <Laptop className="h-3.5 w-3.5" />
                        </span>
                        Máquina
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        <p className="text-sm flex flex-wrap items-baseline gap-2">
                          <span className="font-medium text-gray-700 min-w-[120px]">
                            Número de Série:
                          </span>{" "}
                          <span className="text-gray-800">
                            {item.maquina?.numero_serie || "-"}
                          </span>
                        </p>
                        <p className="text-sm flex flex-wrap items-baseline gap-2">
                          <span className="font-medium text-gray-700 min-w-[120px]">
                            Modelo:
                          </span>{" "}
                          <span className="text-gray-800">
                            {item.maquina?.modelo || "-"}
                          </span>
                        </p>
                        <p className="text-sm flex flex-wrap items-baseline gap-2">
                          <span className="font-medium text-gray-700 min-w-[120px]">
                            Descrição:
                          </span>{" "}
                          <span className="text-gray-800">
                            {item.maquina?.descricao || "-"}
                          </span>
                        </p>
                        <p className="text-sm flex flex-wrap items-baseline gap-2">
                          <span className="font-medium text-gray-700 min-w-[120px]">
                            Garantia:
                          </span>{" "}
                          <span className="text-gray-800">
                            {item.em_garantia ? (
                              <span className="text-green-600 font-medium flex items-center gap-1">
                                <CheckCircle className="h-3.5 w-3.5" /> Sim
                              </span>
                            ) : (
                              <span className="text-gray-500 flex items-center gap-1">
                                <XCircle className="h-3.5 w-3.5" /> Não
                              </span>
                            )}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Coluna da direita */}
                  <div>
                    <div className="mb-5">
                      <h4 className="text-sm font-semibold text-gray-700 border-b pb-1 mb-3 border-gray-200 flex items-center gap-2">
                        <span className="text-[var(--primary)] bg-[var(--primary)]/10 p-1 rounded">
                          <ClipboardList className="h-3.5 w-3.5" />
                        </span>
                        Detalhes do Atendimento
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        <p className="text-sm flex flex-wrap items-baseline gap-2">
                          <span className="font-medium text-gray-700 min-w-[120px]">
                            Data Abertura:
                          </span>{" "}
                          <span className="text-gray-800">
                            {formatarData(
                              item.abertura?.data_abertura ??
                                item.data_abertura ??
                                ""
                            ) || "-"}
                          </span>
                        </p>
                        <p className="text-sm flex flex-wrap items-baseline gap-2">
                          <span className="font-medium text-gray-700 min-w-[120px]">
                            Usuário Abertura:
                          </span>{" "}
                          <span className="text-gray-800">
                            {item.abertura?.nome_usuario || "-"}
                          </span>
                        </p>
                        <p className="text-sm flex flex-wrap items-baseline gap-2">
                          <span className="font-medium text-gray-700 min-w-[120px]">
                            Data Agendada:
                          </span>{" "}
                          <span className="text-gray-800">
                            {item.data_agendada || "-"}
                          </span>
                        </p>
                        <p className="text-sm flex flex-wrap items-baseline gap-2">
                          <span className="font-medium text-gray-700 min-w-[120px]">
                            Data Fechamento:
                          </span>{" "}
                          <span className="text-gray-800">
                            {item.data_fechamento || "-"}
                          </span>
                        </p>
                        <p className="text-sm flex flex-wrap items-baseline gap-2">
                          <span className="font-medium text-gray-700 min-w-[120px]">
                            Status:
                          </span>{" "}
                          <StatusBadge
                            status={String(
                              item.situacao_os?.codigo || item.status
                            )}
                            mapping={statusMapping}
                          />
                        </p>
                        <p className="text-sm flex flex-wrap items-baseline gap-2">
                          <span className="font-medium text-gray-700 min-w-[120px]">
                            Motivo Pendência:
                          </span>{" "}
                          <span className="text-gray-800">
                            {item.situacao_os?.motivo_pendencia || "-"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 border-b pb-1 mb-3 border-gray-200 flex items-center gap-2">
                        <span className="text-[var(--primary)] bg-[var(--primary)]/10 p-1 rounded">
                          <Wrench className="h-3.5 w-3.5" />
                        </span>
                        Técnico e Problema
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {item.tecnico && (
                          <p className="text-sm flex flex-wrap items-baseline gap-2">
                            <span className="font-medium text-gray-700 min-w-[120px]">
                              Técnico:
                            </span>{" "}
                            <span className="text-gray-800 flex items-center gap-1 flex-wrap">
                              {item.tecnico.nome}
                              {item.tecnico?.tipo && (
                                <TecnicoBadge tipo={item.tecnico.tipo} />
                              )}
                            </span>
                          </p>
                        )}
                        <div className="text-sm flex flex-wrap gap-2">
                          <span className="font-medium text-gray-700 min-w-[120px]">
                            Descrição:
                          </span>{" "}
                          <div className="text-gray-800 break-words whitespace-pre-wrap flex-1 max-h-[150px] overflow-y-auto custom-scrollbar">
                            {item.descricao_problema || "-"}
                          </div>
                        </div>
                        <p className="text-sm flex flex-wrap items-baseline gap-2">
                          <span className="font-medium text-gray-700 min-w-[120px]">
                            Liberada Financ.:
                          </span>{" "}
                          <span className="text-gray-800 flex items-center gap-1">
                            {item.liberacao_financeira?.liberada ? (
                              <span className="text-green-600 font-medium flex items-center gap-1">
                                <CheckCircle className="h-3.5 w-3.5" /> Sim
                                {item.liberacao_financeira
                                  ?.nome_usuario_liberacao && (
                                  <span className="text-xs text-gray-600 ml-2">
                                    por{" "}
                                    {
                                      item.liberacao_financeira
                                        .nome_usuario_liberacao
                                    }
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-gray-500 flex items-center gap-1">
                                <XCircle className="h-3.5 w-3.5" /> Não
                              </span>
                            )}
                          </span>
                        </p>
                        {item.liberacao_financeira?.data_liberacao && (
                          <p className="text-sm flex flex-wrap items-baseline gap-2">
                            <span className="font-medium text-gray-700 min-w-[120px]">
                              Data Liberação:
                            </span>{" "}
                            <span className="text-gray-800">
                              {item.liberacao_financeira.data_liberacao}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-3">
                  <a
                    href={`/admin/os_aberto/${item.id_os || item.id}`}
                    onClick={saveCurrentState}
                    className="px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors shadow hover:shadow-md flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Ver Detalhes Completos
                  </a>
                </div>
              </div>
            )}
            emptyStateProps={{
              title: "Nenhuma ordem de serviço encontrada",
              description:
                "Não foram encontradas ordens de serviço com os filtros atuais.",
            }}
          />
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100 p-10 animate-fadeIn">
          <div className="w-20 h-20 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Search size={32} className="text-[var(--primary)]" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Nenhuma pesquisa realizada
          </h3>
          <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-8">
            Selecione os filtros acima e clique em &quot;Pesquisar&quot; para
            buscar ordens de serviço.
          </p>
          <button
            type="button"
            onClick={toggleFilters}
            className="px-5 py-2.5 border-2 border-[var(--primary)] text-[var(--primary)] font-medium rounded-lg hover:bg-[var(--primary)]/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2 mx-auto"
          >
            <Search className="h-4 w-4" />
            Exibir filtros
          </button>
        </div>
      )}

      {data.dados && data.dados.length > 0 && (
        <div className="mt-4 mb-6">
          <Pagination
            currentPage={paginacao.paginaAtual}
            totalPages={paginacao.totalPaginas}
            totalRecords={paginacao.totalRegistros}
            recordsPerPage={paginacao.registrosPorPagina}
            onPageChange={handlePageChange}
            onRecordsPerPageChange={handleRecordsPerPageChange}
            recordsPerPageOptions={[10, 25, 50, 100]}
            showRecordsPerPage={true}
          />
        </div>
      )}
    </>
  );
};

export default ConsultaOSPage;
