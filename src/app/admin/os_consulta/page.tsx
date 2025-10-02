"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import PageHeader from "@/components/admin/ui/PageHeader";
import { EnhancedDataTable, StatusBadge } from "@/components/admin/common";
import { ordensServicoService } from "@/api/services/ordensServicoService";
import { usuariosService } from "@/api/services/usuariosService";
import { formatarData } from "@/utils/formatters";
import { LoadingSpinner } from "@/components/LoadingPersonalizado";
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
  const [showFilter, setShowFilter] = useState<boolean>(true); // Começar com filtros visíveis
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    dados: OSItemExtended[];
    total_registros: number;
  }>({ dados: [], total_registros: 0 });
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

  // Filtros
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

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
  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilterValues({});
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
  }, []);

  // Função para buscar dados com filtros
  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setShowFilter(false);

    // Scroll para os resultados suavemente
    window.scrollTo({
      top: document.querySelector(".page-header")?.clientHeight || 0,
      behavior: "smooth",
    });

    try {
      const params: Record<string, string | number | boolean> = {
        resumido: "s",
      };

      // Adicionar filtros válidos
      Object.entries(filterValues).forEach(([key, value]) => {
        // Pula campo_data pois esse é apenas para controle do frontend
        if (key === "campo_data") return;

        if (value && value.trim() !== "") {
          // Verifica se são os parâmetros de data e apenas os adiciona se o campo_data estiver preenchido
          if (
            (key === "data_ini" || key === "data_fim") &&
            filterValues.campo_data
          ) {
            params[key] = value.trim();
          }
          // Adicionar id_tecnico com o formato correto para o endpoint
          else if (key === "id_tecnico") {
            params["id_tecnico"] = value.trim();
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
      if (filterValues.campo_data && filterValues.campo_data.trim() !== "") {
        params["campo_data"] = filterValues.campo_data.trim();
      }

      const result = await ordensServicoService.getAll(params);

      // Handle both formats: array response or object with dados property
      let responseData;
      let total = 0;

      if (Array.isArray(result)) {
        // Direct array response as shown in your example
        console.log("API returned array response", result);
        responseData = result;
        total = result.length;
      } else if (result && result.dados && Array.isArray(result.dados)) {
        // Object with dados array property
        responseData = result.dados;
        total = result.total_registros || responseData.length;
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

      setData(mappedData);
    } catch (err) {
      setError("Refaça o filtro e tente novamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterValues]);

  // Função para lidar com o clique em uma linha da tabela
  const handleRowClick = (id: number | string) => {
    setExpandedRowId(expandedRowId === Number(id) ? null : Number(id));
  };

  // Adicionar suporte a navegação por teclado para acessibilidade
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Fechar o filtro com ESC
      if (e.key === "Escape" && showFilter) {
        setShowFilter(false);
      }
      // Abrir o filtro com F3
      if (e.key === "F3" && !showFilter) {
        e.preventDefault();
        setShowFilter(true);
      }
      // Pesquisar com Ctrl+Enter quando o filtro estiver aberto
      if (e.key === "Enter" && e.ctrlKey && showFilter) {
        e.preventDefault();
        handleSearch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showFilter, handleSearch]);

  // Função para navegar para a página de detalhes da OS
  const handleRowNavigate = useCallback((item: OSItemExtended) => {
    const osId = item.id_os;
    window.location.href = `/admin/os_detalhes/${osId}`;
  }, []);

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
          formatarData(
            item.abertura?.data_abertura ?? item.data_abertura ?? ""
          ) || "-",
        className: "whitespace-nowrap hidden md:table-cell",
      },
      {
        header: "Técnico",
        accessor: (item: OSItemExtended) => item.tecnico?.nome || "-",
        className: "hidden lg:table-cell",
        render: (item: OSItemExtended) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-800 truncate max-w-[150px]">
              {item.tecnico?.nome || "-"}
            </span>
            {item.tecnico?.tipo && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full inline-flex items-center w-fit mt-1"
                style={{
                  backgroundColor:
                    item.tecnico.tipo === "interno"
                      ? "rgba(var(--color-primary-rgb), 0.1)"
                      : item.tecnico.tipo === "terceiro"
                      ? "rgba(var(--color-warning-rgb), 0.1)"
                      : "rgba(var(--color-gray-rgb), 0.1)",
                  color:
                    item.tecnico.tipo === "interno"
                      ? "var(--primary)"
                      : item.tecnico.tipo === "terceiro"
                      ? "var(--color-warning)"
                      : "var(--color-gray)",
                }}
              >
                {item.tecnico.tipo === "interno"
                  ? "Interno"
                  : item.tecnico.tipo === "terceiro"
                  ? "Terceirizado"
                  : "Indefinido"}
              </span>
            )}
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
            showFilters: showFilter,
            onFilterToggle: () => {
              // Toggle com animação suave e melhor performance
              setShowFilter((prev) => !prev);
              // Se estiver abrindo os filtros, adicione um pequeno delay para focar no primeiro campo
              if (!showFilter) {
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
            activeFiltersCount: Object.values(filterValues || {}).filter(
              (v) => v && v !== ""
            ).length,
            newButton: {
              label: "Nova OS",
              link: "/admin/os_aberto/novo",
            },
          }}
        />
      </div>

      {/* Seção de Filtros */}
      <div
        className={`bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden transition-all duration-300 ease-in-out ${
          showFilter
            ? "opacity-100 max-h-[2000px]"
            : "opacity-0 max-h-0 mt-0 mb-0 border-0"
        }`}
        role="region"
        aria-label="Filtros de pesquisa"
      >
        <div aria-hidden={!showFilter}>
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
                    value={filterValues.id || ""}
                    onChange={(e) => handleFilterChange("id", e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-400">
                      <Search size={16} />
                    </span>
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
                    value={filterValues.cliente || ""}
                    onChange={(e) =>
                      handleFilterChange("cliente", e.target.value)
                    }
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-400">
                      <Search size={16} />
                    </span>
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
                    value={filterValues.maquina || ""}
                    onChange={(e) =>
                      handleFilterChange("maquina", e.target.value)
                    }
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-400">
                      <Search size={16} />
                    </span>
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
                    value={filterValues.status || ""}
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
                    value={filterValues.id_tecnico || ""}
                    onChange={(e) =>
                      handleFilterChange("id_tecnico", e.target.value)
                    }
                  >
                    <option value="">Todos os técnicos</option>
                    {tecnicos &&
                      tecnicos.map((tecnico) => (
                        <option
                          key={tecnico?.id || "unknown"}
                          value={tecnico?.id?.toString() || ""}
                        >
                          {tecnico?.nome || "Técnico sem nome"}
                        </option>
                      ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-400">
                      {loadingTecnicos ? (
                        <div className="h-4 w-4 border-2 border-t-[var(--primary)] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tipo de Data */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Tipo de Data
                </label>
                <div className="relative">
                  <select
                    className="w-full px-3 py-3 appearance-none border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-gray-800 bg-white transition-all duration-200"
                    value={filterValues.campo_data || ""}
                    onChange={(e) =>
                      handleFilterChange("campo_data", e.target.value)
                    }
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="abertura">Data de Abertura</option>
                    <option value="agendada">Data Agendada</option>
                    <option value="fechamento">Data de Fechamento</option>
                    <option value="revisao">Data de Revisão</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-400">
                      <ChevronDown className="h-5 w-5" />
                    </span>
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
                      !filterValues.campo_data
                        ? "bg-gray-100 cursor-not-allowed"
                        : ""
                    }`}
                    value={filterValues.data_ini || ""}
                    onChange={(e) =>
                      handleFilterChange("data_ini", e.target.value)
                    }
                    disabled={!filterValues.campo_data}
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
                      !filterValues.campo_data
                        ? "bg-gray-100 cursor-not-allowed"
                        : ""
                    }`}
                    value={filterValues.data_fim || ""}
                    onChange={(e) =>
                      handleFilterChange("data_fim", e.target.value)
                    }
                    disabled={!filterValues.campo_data}
                  />
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-wrap gap-3 mt-8 sm:justify-end justify-center">
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2 group"
                aria-label="Limpar todos os filtros"
              >
                <X className="h-4 w-4 group-hover:scale-110 transition-transform" />
                Limpar Filtros
              </button>
              <button
                type="button"
                onClick={handleSearch}
                className="px-6 py-2.5 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-all duration-200 shadow hover:shadow-md flex items-center gap-2 group"
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
              onClick={() => setShowFilter(true)}
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
          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-[var(--primary)]">
                <ClipboardList className="h-5 w-5" />
              </span>
              Resultados da Pesquisa
              <span className="ml-2 text-sm font-medium bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-1 rounded-full">
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
                      <span className="font-medium">
                        {item.tecnico?.nome || "Não atribuído"}
                      </span>
                      {item.tecnico?.tipo && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full inline-block mt-1"
                          style={{
                            backgroundColor:
                              item.tecnico.tipo === "interno"
                                ? "rgba(var(--color-primary-rgb), 0.1)"
                                : item.tecnico.tipo === "terceiro"
                                ? "rgba(var(--color-warning-rgb), 0.1)"
                                : "rgba(var(--color-gray-rgb), 0.1)",
                            color:
                              item.tecnico.tipo === "interno"
                                ? "var(--primary)"
                                : item.tecnico.tipo === "terceiro"
                                ? "var(--color-warning)"
                                : "var(--color-gray)",
                          }}
                        >
                          {item.tecnico.tipo === "interno"
                            ? "Interno"
                            : item.tecnico.tipo === "terceiro"
                            ? "Terceirizado"
                            : "Indefinido"}
                        </span>
                      )}
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
                                <span
                                  className="ml-2 text-xs px-2 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor:
                                      item.tecnico.tipo === "interno"
                                        ? "rgba(var(--color-primary-rgb), 0.1)"
                                        : item.tecnico.tipo === "terceiro"
                                        ? "rgba(var(--color-warning-rgb), 0.1)"
                                        : "rgba(var(--color-gray-rgb), 0.1)",
                                    color:
                                      item.tecnico.tipo === "interno"
                                        ? "var(--primary)"
                                        : item.tecnico.tipo === "terceiro"
                                        ? "var(--color-warning)"
                                        : "var(--color-gray)",
                                  }}
                                >
                                  {item.tecnico.tipo === "interno"
                                    ? "Interno"
                                    : item.tecnico.tipo === "terceiro"
                                    ? "Terceirizado"
                                    : "Indefinido"}
                                </span>
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
            onClick={() => setShowFilter(true)}
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
