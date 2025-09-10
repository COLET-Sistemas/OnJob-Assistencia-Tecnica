"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import PageHeader from "@/components/admin/ui/PageHeader";
import DataTable from "@/components/admin/common/DataTable";
import { StatusBadge } from "@/components/admin/common";
import {
  ordensServicoService,
  OSItem,
} from "@/api/services/ordensServicoService";
import { usuariosService } from "@/api/services/usuariosService";
import { formatarData } from "@/utils/formatters";
import { LoadingSpinner } from "@/components/LoadingPersonalizado";
import { Search, ChevronDown, X, Eye, Info, ClipboardList } from "lucide-react";

// Interface estendida para suportar os campos adicionais do exemplo da API
interface OSItemExtended extends OSItem {
  id_os?: number;
  descricao_problema?: string;
  em_garantia?: boolean;
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
  };
}

const ConsultaOSPage: React.FC = () => {
  const [showFilter, setShowFilter] = useState<boolean>(true); // Começar com filtros visíveis
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    dados: OSItem[];
    total_registros: number;
  } | null>(null);
  const [tecnicos, setTecnicos] = useState<
    Array<{
      id: number;
      nome: string;
      login: string;
      perfil_tecnico_proprio: boolean;
      perfil_tecnico_terceirizado: boolean;
    }>
  >([]);
  const [loadingTecnicos, setLoadingTecnicos] = useState<boolean>(false);

  // Filtros
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // Buscar técnicos ao carregar o componente
  useEffect(() => {
    const fetchTecnicos = async () => {
      try {
        setLoadingTecnicos(true);
        const response = await usuariosService.getAll({ apenas_tecnicos: "S" });

        // A API retorna diretamente o array de técnicos
        if (Array.isArray(response)) {
          // Filtrando apenas usuários que são técnicos (próprios ou terceirizados)
          const tecnicosFiltrados = response.filter(
            (user) =>
              user.perfil_tecnico_proprio || user.perfil_tecnico_terceirizado
          );
          setTecnicos(tecnicosFiltrados);
        } else if (response.sucesso && response.dados) {
          // Mantemos a compatibilidade com o formato anterior caso mude
          setTecnicos(response.dados);
        }
      } catch (err) {
        console.error("Erro ao buscar técnicos:", err);
      } finally {
        setLoadingTecnicos(false);
      }
    };

    fetchTecnicos();
  }, []);

  // Definir status mapping para as ordens de serviço
  const statusMapping: Record<string, { label: string; className: string }> =
    useMemo(
      () => ({
        "1": {
          label: "Aberta",
          className: "bg-blue-50 text-blue-700 border border-blue-100",
        },
        "2": {
          label: "Agendada",
          className: "bg-indigo-50 text-indigo-700 border border-indigo-100",
        },
        "3": {
          label: "Em Execução",
          className: "bg-amber-50 text-amber-700 border border-amber-100",
        },
        "4": {
          label: "Pendente",
          className: "bg-orange-50 text-orange-700 border border-orange-100",
        },
        "5": {
          label: "Finalizada",
          className: "bg-green-50 text-green-700 border border-green-100",
        },
        "6": {
          label: "Em Revisão",
          className: "bg-purple-50 text-purple-700 border border-purple-100",
        },
        "7": {
          label: "Aprovada",
          className: "bg-emerald-50 text-emerald-700 border border-emerald-100",
        },
        "8": {
          label: "Cancelada",
          className: "bg-red-50 text-red-700 border border-red-100",
        },
        "9": {
          label: "Rejeitada",
          className: "bg-rose-50 text-rose-700 border border-rose-100",
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
  }, []);

  // Função para buscar dados com filtros
  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Esconder a seção de filtros após pesquisar
    setShowFilter(false);

    try {
      // Transformar os filtros para o formato que a API espera
      const params: Record<string, string | number | boolean> = {
        resumido: "s",
        situacao: "1,2,3,4,5,6,7,8,9",
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
      setData(result);
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

  // Definição das colunas da tabela
  const columns = useMemo(
    () => [
      {
        header: "OS",
        accessor: (item: OSItemExtended) => item.id_os || "-",
        className: "font-medium text-gray-900",
      },
      {
        header: "Cliente",
        accessor: (item: OSItemExtended) =>
          item.cliente?.nome || item.cliente?.nome_fantasia || "-",
        className: "max-w-[180px] truncate",
      },
      {
        header: "Máquina",
        accessor: (item: OSItem) => item.maquina?.numero_serie || "-",
        className: "hidden md:table-cell",
      },
      {
        header: "Data Abertura",
        accessor: (item: OSItemExtended) =>
          formatarData(item.abertura?.data_abertura || item.data_abertura) ||
          "-",
        className: "whitespace-nowrap hidden md:table-cell",
      },
      {
        header: "Técnico",
        accessor: (item: OSItemExtended) => item.tecnico?.nome || "-",
        className: "hidden lg:table-cell max-w-[150px] truncate",
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
      <PageHeader
        title="Consulta de Ordens de Serviço"
        config={{
          type: "list",
          itemCount: data?.total_registros || 0,
          showFilters: showFilter,
          onFilterToggle: () => {
            // Adiciona um timeout curto para criar uma animação suave
            if (showFilter) {
              setShowFilter(false);
            } else {
              setShowFilter(true);
            }
          },
          activeFiltersCount: Object.values(filterValues).filter(
            (v) => v !== ""
          ).length,
          newButton: {
            label: "Nova OS",
            link: "/admin/os_aberto/novo",
          },
        }}
      />

      {/* Seção de Filtros */}
      <div
        className={`bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden transition-all duration-300 ease-in-out ${
          showFilter
            ? "opacity-100 max-h-[2000px]"
            : "opacity-0 max-h-0 mt-0 mb-0 border-0"
        }`}
      >
        <div className="bg-gradient-to-r from-[var(--primary)]/5 to-[var(--primary)]/10 px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-3">
            <div className="bg-[var(--primary)]/10 p-2 rounded-lg">
              <Search size={20} className="text-[var(--primary)]" />
            </div>
            Filtros de Pesquisa
          </h2>
        </div>
        <div className="p-6">
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
              <label className="block text-sm font-semibold text-gray-700">
                Status
              </label>
              <div className="relative">
                <select
                  className="w-full px-3 py-3 appearance-none border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] text-gray-800 bg-white transition-all duration-200"
                  value={filterValues.status || ""}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  <option value="">Todos os status</option>
                  <option value="1">Pendente</option>
                  <option value="2">A atender</option>
                  <option value="3">Em deslocamento</option>
                  <option value="4">Em atendimento</option>
                  <option value="5">Atendimento interrompido</option>
                  <option value="6">Em Revisão</option>
                  <option value="7">Concluída</option>
                  <option value="8">Cancelada</option>
                  <option value="9">Cancelada pelo Cliente</option>
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
                  {tecnicos.map((tecnico) => (
                    <option key={tecnico.id} value={tecnico.id.toString()}>
                      {tecnico.nome}
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
          <div className="flex flex-wrap gap-3 mt-8 justify-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Limpar Filtros
            </button>
            <button
              type="button"
              onClick={handleSearch}
              className="px-6 py-2.5 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-all duration-200 shadow hover:shadow-md flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Pesquisar
            </button>
          </div>
        </div>
      </div>

      {/* Exibição dos resultados da pesquisa */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100 p-10">
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Nenhum registro encontrado
          </h3>
          <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-8">
            {error}
          </p>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-[var(--primary)] text-white font-medium rounded-md hover:bg-[var(--primary-dark)] focus:outline-none"
          >
            Tentar Novamente
          </button>
        </div>
      ) : data && data.dados ? (
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
          <DataTable
            columns={columns}
            data={data.dados || []}
            keyField="id"
            expandedRowId={expandedRowId}
            onRowExpand={handleRowClick}
            renderExpandedRow={(item: OSItemExtended) => (
              <div className="p-5 bg-gradient-to-r from-gray-50 to-white border-t border-b border-gray-100">
                <h3 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                  <span className="text-[var(--primary)]">
                    <Info className="h-5 w-5" />
                  </span>
                  Detalhes da OS #{item.numero_os}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                  {/* Coluna da esquerda */}
                  <div>
                    <div className="mb-5">
                      <h4 className="text-sm font-semibold text-gray-700 border-b pb-1 mb-3 border-gray-200">
                        Informações do Cliente
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        <p className="text-sm flex flex-wrap items-baseline gap-2">
                          <span className="font-medium text-gray-700 min-w-[120px]">
                            Nome:
                          </span>{" "}
                          <span className="text-gray-800">
                            {item.cliente?.nome_fantasia}
                          </span>
                        </p>
                        <p className="text-sm flex flex-wrap items-baseline gap-2">
                          <span className="font-medium text-gray-700 min-w-[120px]">
                            Cidade/UF:
                          </span>{" "}
                          <span className="text-gray-800">
                            {item.cliente?.cidade || "-"}/
                            {item.cliente?.uf || "-"}
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
                          </span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 border-b pb-1 mb-3 border-gray-200">
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
                              <span className="text-green-600 font-medium">
                                Sim
                              </span>
                            ) : (
                              <span className="text-gray-500">Não</span>
                            )}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Coluna da direita */}
                  <div>
                    <div className="mb-5">
                      <h4 className="text-sm font-semibold text-gray-700 border-b pb-1 mb-3 border-gray-200">
                        Detalhes do Atendimento
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        <p className="text-sm flex flex-wrap items-baseline gap-2">
                          <span className="font-medium text-gray-700 min-w-[120px]">
                            Data Abertura:
                          </span>{" "}
                          <span className="text-gray-800">
                            {formatarData(item.data_abertura)}
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
                        <p className="text-sm flex flex-wrap items-baseline gap-2">
                          <span className="font-medium text-gray-700 min-w-[120px]">
                            Data Agendada:
                          </span>{" "}
                          <span className="text-gray-800">
                            {item.data_agendada || "-"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 border-b pb-1 mb-3 border-gray-200">
                        Técnico e Problema
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {item.tecnico && (
                          <p className="text-sm flex flex-wrap items-baseline gap-2">
                            <span className="font-medium text-gray-700 min-w-[120px]">
                              Técnico:
                            </span>{" "}
                            <span className="text-gray-800">
                              {item.tecnico.nome}
                              {item.tecnico?.tipo && (
                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                  {item.tecnico.tipo === "interno"
                                    ? "Interno"
                                    : "Terceirizado"}
                                </span>
                              )}
                            </span>
                          </p>
                        )}
                        <p className="text-sm flex flex-wrap items-baseline gap-2">
                          <span className="font-medium text-gray-700 min-w-[120px]">
                            Descrição:
                          </span>{" "}
                          <span className="text-gray-800">
                            {item.descricao_problema || "-"}
                          </span>
                        </p>
                        <p className="text-sm flex flex-wrap items-baseline gap-2">
                          <span className="font-medium text-gray-700 min-w-[120px]">
                            Liberada Financ.:
                          </span>{" "}
                          <span className="text-gray-800">
                            {item.liberacao_financeira?.liberada ? (
                              <span className="text-green-600 font-medium">
                                Sim
                              </span>
                            ) : (
                              <span className="text-gray-500">Não</span>
                            )}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-3">
                  <a
                    href={`/admin/os_aberto/${item.id}`}
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
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100 p-10">
          <div className="w-20 h-20 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search size={32} className="text-[var(--primary)]" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Nenhuma pesquisa realizada
          </h3>
          <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-8">
            Selecione os filtros acima e clique em &quot;Pesquisar&quot; para
            buscar ordens de serviço.
          </p>
        </div>
      )}
    </>
  );
};

export default ConsultaOSPage;
