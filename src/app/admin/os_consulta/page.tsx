"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import PageHeader from "@/components/admin/ui/PageHeader";
import { StatusBadge } from "@/components/admin/common";
import { ordensServicoService } from "@/api/services/ordensServicoService";
import { usuariosService } from "@/api/services/usuariosService";
import { motivosAtendimentoService } from "@/api/services/motivosAtendimentoService";
import { MotivoAtendimento } from "@/types/admin/cadastro/motivos_atendimento";
import { LoadingSpinner } from "@/components/LoadingPersonalizado";
import Pagination from "@/components/admin/ui/Pagination";
import TecnicoBadge from "@/components/admin/ui/TecnicoBadge";
import { useFilters } from "@/hooks/useFilters";
import {
  Search,
  ChevronDown,
  X,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  FileSearch,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { STATUS_MAPPING } from "@/utils/statusMapping";

// Interface estendida para suportar os campos adicionais do exemplo da API
interface OSItemExtended {
  id_os: number;
  id?: number;
  numero_os?: string;
  descricao_problema?: string;
  em_garantia?: boolean;
  status?: number;
  data_abertura?: string;
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

const fadeInAnimation = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease-in-out forwards;
  opacity: 1;
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

const RESET_FLAG_KEY = "os_consulta_reset_from_sidebar";
const INITIAL_DATA_STATE: { dados: OSItemExtended[]; total_registros: number } =
  {
    dados: [],
    total_registros: 0,
  };

const INITIAL_OS_FILTERS: Record<string, string> = {
  status: "",
  campo_data: "",
  data_ini: "",
  data_fim: "",
  numero_os: "",
  numero_interno: "",
  nome_cliente: "",
  numero_serie: "",
  id_tecnico: "",
  tipo_tecnico: "",
  em_garantia: "",
  id_motivo_atendimento: "",
};

const INITIAL_PAGINATION_STATE: {
  paginaAtual: number;
  totalPaginas: number;
  totalRegistros: number;
  registrosPorPagina: number;
} = {
  paginaAtual: 1,
  totalPaginas: 1,
  totalRegistros: 0,
  registrosPorPagina: 25,
};

const ConsultaOSPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState(INITIAL_DATA_STATE);

  // Pagination state
  const [paginacao, setPaginacao] = useState(INITIAL_PAGINATION_STATE);
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
  const [motivos, setMotivos] = useState<MotivoAtendimento[]>([]);
  const [loadingMotivos, setLoadingMotivos] = useState<boolean>(false);
  const [hasSearch, setHasSearch] = useState<boolean>(false);
  const hasSearchRef = useRef<boolean>(false);
  const [hasRestoredState, setHasRestoredState] = useState<boolean>(false);

  // Ordenação state
  const [campoOrdem, setCampoOrdem] = useState<string>("data");
  const [tipoOrdem, setTipoOrdem] = useState<"asc" | "desc">("asc");

  if (
    typeof window !== "undefined" &&
    sessionStorage.getItem(RESET_FLAG_KEY) === "true"
  ) {
    try {
      sessionStorage.removeItem("os_consulta_filters");
      sessionStorage.removeItem("os_consulta_filters_state");
    } catch (error) {
      console.error("Erro ao limpar filtros da sessão:", error);
    }
  }

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

  const handleFiltroChangeRef = useRef(handleFiltroChange);

  useEffect(() => {
    handleFiltroChangeRef.current = handleFiltroChange;
  }, [handleFiltroChange]);

  const clearPersistedState = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem("os_consulta_saved_filters");
      localStorage.removeItem("os_consulta_saved_pagination");
      localStorage.removeItem("os_consulta_has_search");
      localStorage.removeItem("os_consulta_state_timestamp");
    } catch (error) {
      console.error("Erro ao limpar estado dos filtros:", error);
    }
  }, []);

  const persistState = useCallback(
    (
      filters?: Record<string, string>,
      pagination?: {
        paginaAtual: number;
        totalPaginas: number;
        totalRegistros: number;
        registrosPorPagina: number;
      },
      hasSearchValue?: boolean
    ) => {
      if (typeof window === "undefined") return;

      const filtersToPersist = filters ?? filtrosAplicados;
      const paginationToPersist = pagination ?? paginacao;
      const hasSearchFlag = hasSearchValue ?? hasSearch;

      try {
        localStorage.setItem(
          "os_consulta_saved_filters",
          JSON.stringify(filtersToPersist)
        );
        localStorage.setItem(
          "os_consulta_saved_pagination",
          JSON.stringify(paginationToPersist)
        );
        localStorage.setItem(
          "os_consulta_has_search",
          JSON.stringify(hasSearchFlag)
        );
        localStorage.setItem(
          "os_consulta_state_timestamp",
          Date.now().toString()
        );
      } catch (error) {
        console.error("Erro ao salvar estado dos filtros:", error);
      }
    },
    [filtrosAplicados, paginacao, hasSearch]
  );

  // Abre os filtros por padrão ao carregar a página
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFilters(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [setShowFilters]);

  // Additional filter state
  const [disableDateFields, setDisableDateFields] = useState<boolean>(false);
  const [fixedDateType, setFixedDateType] = useState<string | null>(null);

  const getToday = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const get30DaysAgo = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  };

  useEffect(() => {
    const fetchTecnicos = async () => {
      try {
        setLoadingTecnicos(true);
        const response = await usuariosService.getAll({ apenas_tecnicos: "S" });

        let tecnicosData: TecnicoType[] = [];

        if (response) {
          try {
            if (Array.isArray(response)) {
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
              user.tipo === "interno" ||
              user.tipo === "terceiro")
        );

        setTecnicos(tecnicosFiltrados.length > 0 ? tecnicosFiltrados : []);
      } catch (err) {
        console.error("Erro ao buscar técnicos:", err);
        setTecnicos([]);
      } finally {
        setLoadingTecnicos(false);
      }
    };

    fetchTecnicos();
  }, []);

  useEffect(() => {
    const fetchMotivos = async () => {
      try {
        setLoadingMotivos(true);
        const response = await motivosAtendimentoService.getAll();

        if (response && Array.isArray(response)) {
          // Filter only active motivos
          const motivosAtivos = response.filter(
            (motivo) => motivo && motivo.situacao === "A"
          );
          setMotivos(motivosAtivos);
        } else {
          setMotivos([]);
        }
      } catch (err) {
        console.error("Erro ao buscar motivos de atendimento:", err);
        setMotivos([]);
      } finally {
        setLoadingMotivos(false);
      }
    };

    fetchMotivos();
  }, []);

  // Use the shared status mapping
  const statusMapping = STATUS_MAPPING;

  // Manipulação dos filtros
  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      if (key === "status") {
        const pendingStatuses = ["1", "1,2,3,4,5", "6"];
        const finishedStatuses = ["6,7", "8,9"];

        if (pendingStatuses.includes(value)) {
          setDisableDateFields(true);
          setFixedDateType(null);
          handleFiltroChange("status", value);
          handleFiltroChange("campo_data", "");
          handleFiltroChange("data_ini", "");
          handleFiltroChange("data_fim", "");
        } else if (finishedStatuses.includes(value)) {
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
          handleFiltroChange("campo_data", "abertura");
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
        handleFiltroChange(key, "");
      } else if (key === "campo_data") {
        handleFiltroChange("campo_data", "");
        handleFiltroChange("data_ini", "");
        handleFiltroChange("data_fim", "");
        setDisableDateFields(false);
      } else if (key === "id_tecnico" || key === "tipo_tecnico") {
        handleFiltroChange("id_tecnico", "");
        handleFiltroChange("tipo_tecnico", "");
      } else if (key === "id_motivo_atendimento") {
        handleFiltroChange("id_motivo_atendimento", "");
      } else {
        handleFiltroChange(key, "");
      }
    },
    [handleFiltroChange]
  );

  // Função para alternar ordenação
  const handleSortToggle = useCallback(
    (campo: string) => {
      if (campoOrdem === campo) {
        // Se já está ordenando por este campo, alterna entre asc/desc
        setTipoOrdem(tipoOrdem === "asc" ? "desc" : "asc");
      } else {
        // Se mudou o campo, define como asc
        setCampoOrdem(campo);
        setTipoOrdem("asc");
      }
    },
    [campoOrdem, tipoOrdem]
  );

  // Função para retornar o ícone correto de ordenação
  const getSortIcon = useCallback(
    (campo: string) => {
      if (campoOrdem === campo) {
        return tipoOrdem === "asc" ? (
          <ArrowUp size={14} className="text-[var(--primary)]" />
        ) : (
          <ArrowDown size={14} className="text-[var(--primary)]" />
        );
      }
      return <ArrowUpDown size={14} className="text-gray-400" />;
    },
    [campoOrdem, tipoOrdem]
  );

  const handleClearFiltersCustom = useCallback(() => {
    // First, use limparFiltros to reset all filter values
    limparFiltros();
    hasSearchRef.current = false;
    setHasSearch(false);
    clearPersistedState();

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

    setPaginacao((prev) => ({ ...prev, paginaAtual: 1 }));
  }, [limparFiltros, setShowFilters, clearPersistedState]);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const currentFilters = { ...filtrosPainel };
    aplicarFiltros();

    window.scrollTo({
      top: document.querySelector(".page-header")?.clientHeight || 0,
      behavior: "smooth",
    });

    try {
      const params: Record<string, string | number | boolean> = {
        resumido: "s",
        nro_pagina: paginacao.paginaAtual,
        qtde_registros: paginacao.registrosPorPagina,
        campo_ordem: campoOrdem,
        tipo_ordem: tipoOrdem,
      };

      // Adicionar filtros válidos usando os valores atuais do filtrosPainel
      Object.entries(currentFilters).forEach(([key, value]) => {
        // Pula campo_data pois esse é apenas para controle do frontend
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
          } else if (key === "numero_interno") {
            params["numero_interno"] = value.trim();
          } else if (key === "id_motivo_atendimento") {
            params["id_motivo_atendimento"] = value.trim();
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

      let responseData;
      let total = 0;
      let totalPages = 1;

      if (Array.isArray(result)) {
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
      hasSearchRef.current = true;
      setHasSearch(true);
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
    campoOrdem,
    tipoOrdem,
  ]);

  const handleSearchRef = useRef(handleSearch);

  useEffect(() => {
    handleSearchRef.current = handleSearch;
  }, [handleSearch]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showFilters) {
        toggleFilters();
      }
      if (e.key === "F3" && !showFilters) {
        e.preventDefault();
        toggleFilters();
      }
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
      setPaginacao((prev) => ({ ...prev, paginaAtual: novaPagina }));
      const searchWithCorrectPage = async () => {
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
            campo_ordem: campoOrdem,
            tipo_ordem: tipoOrdem,
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
              } else if (key === "id_motivo_atendimento") {
                params["id_motivo_atendimento"] = value.trim();
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

          // Make the API call
          const result = await ordensServicoService.getAll(params);

          if (result) {
            let responseData;
            let total = 0;
            let totalPages = 1;

            if (Array.isArray(result)) {
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

            setData(mappedData);
            hasSearchRef.current = true;
            setHasSearch(true);

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

      // Execute search with new page if there has been a previous search
      if (hasSearch) {
        searchWithCorrectPage();
      }
    },
    [
      filtrosPainel,
      paginacao.registrosPorPagina,
      campoOrdem,
      tipoOrdem,
      hasSearch,
    ]
  );

  const handleRecordsPerPageChange = useCallback(
    (novoValor: number) => {
      setPaginacao((prev) => ({
        ...prev,
        registrosPorPagina: novoValor,
        paginaAtual: 1,
      }));
      const searchWithNewRecordsPerPage = async () => {
        setLoading(true);
        setError(null);

        const currentFilters = { ...filtrosPainel };

        aplicarFiltros();

        try {
          const params: Record<string, string | number | boolean> = {
            resumido: "s",
            nro_pagina: 1,
            qtde_registros: novoValor,
            campo_ordem: campoOrdem,
            tipo_ordem: tipoOrdem,
          };

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
              } else if (key === "id_motivo_atendimento") {
                params["id_motivo_atendimento"] = value.trim();
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
          hasSearchRef.current = true;
          setHasSearch(true);

          setPaginacao((prev) => ({
            ...prev,
            totalRegistros: total,
            totalPaginas: totalPages,
          }));

          // No need to reset expanded rows in card-based layout
        } catch (error) {
          console.error("Erro ao buscar ordens de serviço:", error);
          setError("Erro ao buscar ordens de serviço. Tente novamente.");
        } finally {
          setLoading(false);
        }
      };

      // Execute search with new records per page if there has been a previous search
      if (hasSearch) {
        searchWithNewRecordsPerPage();
      }
    },
    [aplicarFiltros, filtrosPainel, campoOrdem, tipoOrdem, hasSearch]
  );

  // Reset to first page when filters change
  useEffect(() => {
    setPaginacao((prev) => ({ ...prev, paginaAtual: 1 }));
  }, [filtrosPainel]);

  // Note: Search is now only executed manually via the search button
  // Removed automatic search execution when ordering changes

  useEffect(() => {
    // Restore saved filters unless a sidebar navigation demanded a clean slate
    const searchTimeout: ReturnType<typeof setTimeout> | null = null;

    const shouldResetFromSidebar =
      typeof window !== "undefined" &&
      sessionStorage.getItem(RESET_FLAG_KEY) === "true";

    if (shouldResetFromSidebar) {
      sessionStorage.removeItem(RESET_FLAG_KEY);
      clearPersistedState();
      limparFiltros();
      setPaginacao(() => ({ ...INITIAL_PAGINATION_STATE }));
      setData(() => ({ ...INITIAL_DATA_STATE }));
      setError(null);
      hasSearchRef.current = false;
      setHasSearch(false);
      setHasRestoredState(true);

      return () => {
        if (searchTimeout) {
          clearTimeout(searchTimeout);
        }
      };
    }

    const isSavedStateValid = () => {
      const timestamp = localStorage.getItem("os_consulta_state_timestamp");
      if (!timestamp) return false;

      const savedTime = parseInt(timestamp, 10);
      const currentTime = Date.now();
      const MAX_AGE = 30 * 60 * 1000;

      return currentTime - savedTime < MAX_AGE;
    };

    if (isSavedStateValid()) {
      try {
        const savedFilters = localStorage.getItem("os_consulta_saved_filters");
        const savedPagination = localStorage.getItem(
          "os_consulta_saved_pagination"
        );
        const storedHasSearch = localStorage.getItem("os_consulta_has_search");

        if (savedFilters) {
          const parsedFilters = JSON.parse(savedFilters);
          Object.entries(parsedFilters).forEach(([key, value]) => {
            handleFiltroChangeRef.current?.(key, value as string);
          });
        }

        if (savedPagination) {
          const parsedPagination = JSON.parse(savedPagination);
          setPaginacao(parsedPagination);
        }

        let parsedHasSearch = false;
        if (storedHasSearch !== null) {
          parsedHasSearch = Boolean(JSON.parse(storedHasSearch));
        }

        hasSearchRef.current = parsedHasSearch;
        setHasSearch(parsedHasSearch);

        // Note: Removed automatic search execution on state restoration
        // Search is now only executed manually via the search button
      } catch (error) {
        console.error("Erro ao restaurar estado dos filtros:", error);
        clearPersistedState();
        hasSearchRef.current = false;
        setHasSearch(false);
      }
    } else {
      clearPersistedState();
      hasSearchRef.current = false;
      setHasSearch(false);
    }

    setHasRestoredState(true);

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [clearPersistedState, limparFiltros]);

  useEffect(() => {
    if (!hasRestoredState) return;
    persistState();
  }, [persistState, hasRestoredState]);

  // Função para salvar o estado atual dos filtros e paginação
  const saveCurrentState = useCallback(() => {
    persistState(undefined, undefined, hasSearchRef.current);
  }, [persistState]);

  // Função para navegar para a página de detalhes da OS
  const handleRowNavigate = useCallback(
    (item: OSItemExtended) => {
      saveCurrentState();
      const osId = item.id_os;
      router.push(`/admin/os_detalhes/${osId}`);
    },
    [router, saveCurrentState]
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
            showFilterToggleShortcut: true,
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
              label: "",
              link: "#",
              onClick: () => {},
            },
          }}
        />
      </div>

      {/* Seção de Filtros */}
      <div
        role="region"
        aria-label="Filtros de pesquisa"
        className={`bg-white rounded-xl shadow-sm border border-gray-100 mb-3 overflow-hidden transition-all duration-300 ease-in-out ${
          showFilters
            ? "opacity-100 max-h-[2000px]"
            : "opacity-0 max-h-0 mt-0 mb-0 border-0"
        }`}
      >
        <div aria-hidden={!showFilters}>
          <div className="bg-gradient-to-r from-[var(--primary)]/5 to-[var(--primary)]/10 px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-3">
              <span className="bg-[var(--primary)]/10 p-2 rounded-lg">
                <Search size={20} className="text-[var(--primary)]" />
              </span>
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
                    value={filtrosPainel.numero_serie || ""}
                    onChange={(e) =>
                      handleFilterChange("numero_serie", e.target.value)
                    }
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {filtrosPainel.numero_serie ? (
                      <button
                        type="button"
                        onClick={() => handleClearField("numero_serie")}
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
              <div className="space-y-2 hidden">
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

              {/* Garantia */}
              <div className="space-y-2 hidden">
                <label className="block text-sm font-semibold text-gray-700">
                  Garantia
                </label>
                <div className="relative">
                  <select
                    className="w-full px-3 py-3 appearance-none border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-gray-800 bg-white transition-all duration-200"
                    value={filtrosPainel.em_garantia || ""}
                    onChange={(e) =>
                      handleFilterChange("em_garantia", e.target.value)
                    }
                  >
                    <option value="">Listar Ambos</option>
                    <option value="S">Em garantia</option>
                    <option value="N">Fora de garantia</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-400">
                      <ChevronDown className="h-5 w-5" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Técnico */}
              <div className="space-y-2 hidden">
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

              {/* Número Interno */}
              <div className="space-y-2 hidden">
                <label className="block text-sm font-semibold text-gray-700">
                  Número Interno
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Digite o número interno"
                    className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-gray-800 placeholder:text-gray-400 transition-all duration-200"
                    value={filtrosPainel.numero_interno || ""}
                    onChange={(e) =>
                      handleFilterChange("numero_interno", e.target.value)
                    }
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {filtrosPainel.numero_interno ? (
                      <button
                        type="button"
                        onClick={() => handleClearField("numero_interno")}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        aria-label="Limpar número interno"
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

              {/* Status, Técnico, Número Interno e Motivo Atendimento */}
              <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                {/* Número Interno */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Número Interno
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Digite o número interno"
                      className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-gray-800 placeholder:text-gray-400 transition-all duration-200"
                      value={filtrosPainel.numero_interno || ""}
                      onChange={(e) =>
                        handleFilterChange("numero_interno", e.target.value)
                      }
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      {filtrosPainel.numero_interno ? (
                        <button
                          type="button"
                          onClick={() => handleClearField("numero_interno")}
                          className="text-gray-400 hover:text-gray-600 focus:outline-none"
                          aria-label="Limpar número interno"
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

                {/* Motivo de Atendimento */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Motivo de Atendimento
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-3 py-3 appearance-none border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-gray-800 bg-white transition-all duration-200"
                      value={filtrosPainel.id_motivo_atendimento || ""}
                      onChange={(e) =>
                        handleFilterChange(
                          "id_motivo_atendimento",
                          e.target.value
                        )
                      }
                    >
                      <option value="">Todos os Motivos</option>
                      {motivos.map((motivo) => (
                        <option key={motivo.id} value={motivo.id.toString()}>
                          {motivo.descricao}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      {loadingMotivos ? (
                        <div className="h-4 w-4 border-2 border-t-[var(--primary)] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin pointer-events-none" />
                      ) : filtrosPainel.id_motivo_atendimento ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleClearField("id_motivo_atendimento")
                          }
                          className="text-gray-400 hover:text-gray-600 focus:outline-none mr-5"
                          aria-label="Limpar motivo de atendimento"
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
              </div>

              {/* Tipo de Data, Data Inicial, Data Final e Garantia em uma linha */}
              <div className="col-span-1 lg:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    </div>
                  </div>

                  {/* Garantia */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Garantia
                    </label>
                    <div className="relative">
                      <select
                        className="w-full px-3 py-3 appearance-none border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-gray-800 bg-white transition-all duration-200"
                        value={filtrosPainel.em_garantia || ""}
                        onChange={(e) =>
                          handleFilterChange("em_garantia", e.target.value)
                        }
                      >
                        <option value="">Listar Todas</option>
                        <option value="S">Em garantia</option>
                        <option value="N">Fora de garantia</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-400">
                          <ChevronDown className="h-5 w-5" />
                        </span>
                      </div>
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
        <>
          {/* Cabeçalhos */}
          <div className="grid grid-cols-12 gap-x-1 px-3 py-2 bg-gray-50 rounded-md text-xs font-semibold text-gray-600 mb-0 shadow-sm">
            <div className="col-span-1">OS</div>
            <div
              className="col-span-3 md:col-span-2 flex items-center gap-1 cursor-pointer hover:text-[var(--primary)] transition-colors"
              onClick={() => handleSortToggle("cliente")}
              title="Clique para ordenar por cliente"
            >
              Cliente / Cidade
              {getSortIcon("cliente")}
            </div>
            <div className="col-span-4 md:col-span-4 lg:col-span-3">
              Descrição / Série
            </div>
            <div
              className="hidden md:flex md:col-span-2 text-center items-center justify-center gap-1 cursor-pointer hover:text-[var(--primary)] transition-colors"
              onClick={() => handleSortToggle("data")}
              title="Clique para ordenar por data"
            >
              Data
              {getSortIcon("data")}
            </div>
            <div className="col-span-3 md:col-span-2">Técnico</div>
            <div className="col-span-1 md:col-span-1 lg:col-span-2 text-right">
              Status
            </div>
          </div>

          <div className="space-y-1 mt-1 mb-4">
            {data.dados.map((item) => (
              <div
                key={item.id_os}
                className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 animate-fadeIn py-2 px-3 cursor-pointer group"
                onClick={() => handleRowNavigate(item)}
                tabIndex={0}
                role="button"
                aria-label={`Ver detalhes da OS ${item.id_os}`}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") &&
                  handleRowNavigate(item)
                }
              >
                <div className="grid grid-cols-12 gap-x-1 items-center">
                  {/* OS */}
                  <div className="col-span-1">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-[var(--primary)]">
                        #{item.id_os}
                      </span>
                      <div
                        className="w-5 h-5 flex items-center justify-center shrink-0 ml-2"
                        title={
                          item.em_garantia
                            ? "OS em garantia"
                            : "OS fora da garantia"
                        }
                      >
                        {item.em_garantia ? (
                          <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" />
                        ) : (
                          <ShieldX className="w-4.5 h-4.5 text-amber-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cliente */}
                  <div className="col-span-3 md:col-span-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-700 truncate">
                        {item.cliente?.nome ||
                          item.cliente?.nome_fantasia ||
                          "-"}
                      </span>
                      <span className="text-xs text-gray-500 truncate">
                        {item.cliente?.cidade
                          ? `${item.cliente.cidade}/${item.cliente.uf || ""}`
                          : "-"}
                      </span>
                    </div>
                  </div>

                  {/* Série / Descrição */}
                  <div className="col-span-4 md:col-span-4 lg:col-span-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-700 truncate">
                        {(item.maquina?.descricao || "-").substring(0, 80)}
                      </span>
                      <span className="text-xs text-gray-500 truncate">
                        {item.maquina?.numero_serie || "-"}
                      </span>
                    </div>
                  </div>

                  {/* Data (só md+) */}
                  <div className="hidden md:block md:col-span-2 text-center">
                    <span className="text-xs text-gray-700 whitespace-nowrap">
                      {item.abertura?.data_abertura
                        ? item.abertura.data_abertura
                        : item.data_abertura
                        ? item.data_abertura
                        : "-"}
                    </span>
                  </div>

                  {/* Técnico */}
                  <div className="col-span-3 md:col-span-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-700 truncate">
                        {item.tecnico?.nome || "-"}
                      </span>
                      {item.tecnico?.tipo && (
                        <div className="mt-0.5">
                          <TecnicoBadge tipo={item.tecnico.tipo} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status sempre na direita */}
                  <div className="col-span-1 md:col-span-1 lg:col-span-2 flex justify-end">
                    <StatusBadge
                      status={String(item.situacao_os?.codigo || item.status)}
                      mapping={statusMapping}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginação */}
          <div className="mt-4 mb-4">
            <Pagination
              currentPage={paginacao.paginaAtual}
              totalPages={paginacao.totalPaginas}
              totalRecords={paginacao.totalRegistros}
              recordsPerPage={paginacao.registrosPorPagina}
              onPageChange={handlePageChange}
              onRecordsPerPageChange={handleRecordsPerPageChange}
              recordsPerPageOptions={[10, 25, 50, 100]}
              showRecordsPerPage
            />
          </div>
        </>
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
    </>
  );
};

export default ConsultaOSPage;
