"use client";
import { Loading } from "@/components/LoadingPersonalizado";
import { TableList, TableStatusColumn } from "@/components/admin/common";
import { useToast } from "@/components/admin/ui/ToastContainer";
import { useDataFetch } from "@/hooks";
import type { Maquina } from "@/types/admin/cadastro/maquinas";
import { useCallback, useEffect, useState, useRef } from "react";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EditButton } from "@/components/admin/ui/EditButton";
import PageHeader from "@/components/admin/ui/PageHeader";
import Pagination from "@/components/admin/ui/Pagination";
import { useFilters } from "@/hooks/useFilters";
import { maquinasService } from "@/api/services/maquinasService";
import { CircleCheck, CircleX } from "lucide-react";

interface MaquinasFilters {
  numero_serie: string;
  descricao: string;
  incluir_inativos: string;
  modelo: string;
  garantia: string;
  data_venda_ini: string;
  data_venda_fim: string;
  [key: string]: string;
}

const INITIAL_MAQUINAS_FILTERS: MaquinasFilters = {
  numero_serie: "",
  descricao: "",
  incluir_inativos: "",
  modelo: "",
  garantia: "",
  data_venda_ini: "",
  data_venda_fim: "",
};

const formatDateForApi = (value: string) => {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  if (year && month && day) {
    return `${day}.${month}.${year}`;
  }
  return value;
};

interface PaginacaoInfo {
  paginaAtual: number;
  totalPaginas: number;
  totalRegistros: number;
  registrosPorPagina: number;
}

const CadastroMaquinas = () => {
  const { showSuccess, showError } = useToast();
  const [localShowFilters, setLocalShowFilters] = useState(false);
  const isReloadingRef = useRef(false);

  // Estado para gerenciar as opções de modelo retornadas pela API
  const [modelosOptions, setModelosOptions] = useState<string[]>([]);
  const [isLoadingModelos, setIsLoadingModelos] = useState(false);

  const {
    filtrosPainel,
    filtrosAplicados,
    activeFiltersCount,
    handleFiltroChange,
    limparFiltros,
    aplicarFiltros,
    toggleFilters,
  } = useFilters(INITIAL_MAQUINAS_FILTERS);

  const [paginacao, setPaginacao] = useState<PaginacaoInfo>({
    paginaAtual: 1,
    totalPaginas: 1,
    totalRegistros: 0,
    registrosPorPagina: 25,
  });

  // Busca lista de modelos para o filtro de modelo
  const loadModelos = useCallback(async () => {
    setIsLoadingModelos(true);
    try {
      const modelos = await maquinasService.getModelos();
      setModelosOptions(modelos);
    } catch (err) {
      console.error("Erro ao buscar modelos:", err);
      setModelosOptions([]);
    } finally {
      setIsLoadingModelos(false);
    }
  }, []);

  useEffect(() => {
    loadModelos();
  }, [loadModelos]);

  const handleApplyFilters = () => {
    const dataVendaIni = filtrosPainel.data_venda_ini?.trim();
    const dataVendaFim = filtrosPainel.data_venda_fim?.trim();
    const hasPartialDate =
      (dataVendaIni && !dataVendaFim) || (!dataVendaIni && dataVendaFim);

    if (hasPartialDate) {
      showError(
        "Filtro incompleto",
        "Informe a data inicial e final da venda para aplicar o filtro."
      );
      return;
    }

    setLocalShowFilters(false);
    isReloadingRef.current = true;
    aplicarFiltros();
  };

  const handleClearFilters = () => {
    setLocalShowFilters(false);
    isReloadingRef.current = true;
    limparFiltros();
  };

  const handleToggleFilters = () => {
    if (!isReloadingRef.current) {
      setLocalShowFilters(!localShowFilters);
    }
    toggleFilters();
  };

  const fetchMaquinas = useCallback(async (): Promise<Maquina[]> => {
    isReloadingRef.current = true;

    try {
      const dataVendaIniFilter = filtrosAplicados.data_venda_ini?.trim();
      const dataVendaFimFilter = filtrosAplicados.data_venda_fim?.trim();
      const shouldApplyDateFilter = Boolean(
        dataVendaIniFilter && dataVendaFimFilter
      );

      const garantiaFilter =
        filtrosAplicados.garantia === "true" ||
        filtrosAplicados.garantia === "false"
          ? filtrosAplicados.garantia
          : "";

      const response = await maquinasService.getAll(
        paginacao.paginaAtual,
        paginacao.registrosPorPagina,
        filtrosAplicados.incluir_inativos === "true",
        filtrosAplicados.numero_serie?.trim() || undefined,
        filtrosAplicados.modelo?.trim() || undefined,
        filtrosAplicados.descricao?.trim() || undefined,
        shouldApplyDateFilter && dataVendaIniFilter
          ? formatDateForApi(dataVendaIniFilter)
          : undefined,
        shouldApplyDateFilter && dataVendaFimFilter
          ? formatDateForApi(dataVendaFimFilter)
          : undefined,
        garantiaFilter || undefined
      );

      setPaginacao((prev) => ({
        ...prev,
        totalPaginas: response.total_paginas || 1,
        totalRegistros: response.total_registros || 0,
      }));

      return response.dados || [];
    } catch (error) {
      console.error("Erro ao buscar máquinas:", error);
      return [];
    } finally {
      setTimeout(() => {
        isReloadingRef.current = false;
      }, 500);
    }
  }, [filtrosAplicados, paginacao.paginaAtual, paginacao.registrosPorPagina]);

  const {
    data: maquinas,
    loading,
    refetch,
  } = useDataFetch<Maquina[]>(fetchMaquinas, [fetchMaquinas]);

  const handlePageChange = useCallback((novaPagina: number) => {
    setPaginacao((prev) => ({ ...prev, paginaAtual: novaPagina }));
  }, []);

  const handleRecordsPerPageChange = useCallback((novoValor: number) => {
    setPaginacao((prev) => ({
      ...prev,
      registrosPorPagina: novoValor,
      paginaAtual: 1,
    }));
  }, []);

  useEffect(() => {
    setPaginacao((prev) => ({ ...prev, paginaAtual: 1 }));
  }, [filtrosAplicados]);

  useEffect(() => {
    if (isReloadingRef.current) {
      setLocalShowFilters(false);
    }
  }, [maquinas]);

  if (loading) {
    return (
      <Loading
        fullScreen={true}
        preventScroll={false}
        text="Carregando máquinas..."
        size="large"
      />
    );
  }

  const columns = [
    {
      header: "Máquina",
      accessor: "numero_serie" as keyof Maquina,
      render: (maquina: Maquina) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 flex items-center justify-center shrink-0"
              title={maquina.garantia ? "Em garantia" : "Fora da garantia"}
            >
              {maquina.garantia ? (
                <CircleCheck className="w-5 h-5 text-emerald-500" />
              ) : (
                <CircleX className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <div className="text-gray-900">
              <span className="font-bold text-sm">{maquina.numero_serie}</span>
              {" - "}
              <span className="text-xs">{maquina.modelo}</span>
            </div>
          </div>
          <div className="text-sm font-bold text-gray-600 mt-1 line-clamp-1">
            {maquina.descricao}
          </div>
        </div>
      ),
    },
    {
      header: "Cliente Atual",
      accessor: "cliente_atual" as keyof Maquina,
      render: (maquina: Maquina) => (
        <span className="text-sm text-gray-600">
          {maquina.cliente_atual?.nome_fantasia || "-"}
        </span>
      ),
    },
    {
      header: "Data 1ª Venda",
      accessor: "data_1a_venda" as keyof Maquina,
      render: (maquina: Maquina) => (
        <span className="text-sm text-gray-600">{maquina.data_1a_venda}</span>
      ),
    },
    {
      header: "Nota Fiscal",
      accessor: "nota_fiscal_venda" as keyof Maquina,
      render: (maquina: Maquina) => (
        <span className="text-sm text-gray-600 font-medium">
          {maquina.nota_fiscal_venda || "-"}
        </span>
      ),
    },
    {
      header: "Data Final Garantia",
      accessor: "data_final_garantia" as keyof Maquina,
      render: (maquina: Maquina) => (
        <span className="text-sm text-gray-600">
          {maquina.data_final_garantia}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "situacao" as keyof Maquina,
      render: (maquina: Maquina) => (
        <TableStatusColumn status={maquina.situacao} />
      ),
    },
  ];

  const handleDelete = async (id: number) => {
    try {
      await maquinasService.delete(id);
      setLocalShowFilters(false);
      isReloadingRef.current = true;
      showSuccess("Sucesso", "Máquina inativada com sucesso!");
      await refetch();
    } catch (error) {
      console.error("Erro ao inativar máquina:", error);
      showError("Erro ao inativar", error as Record<string, unknown>);
    } finally {
      setTimeout(() => {
        isReloadingRef.current = false;
      }, 500);
    }
  };

  const renderActions = (maquina: Maquina) => (
    <div className="flex gap-2">
      <EditButton id={maquina.id} editRoute="/admin/cadastro/maquinas/editar" />
      <DeleteButton
        id={maquina.id}
        onDelete={handleDelete}
        confirmText="Deseja realmente inativar esta máquina?"
        confirmTitle="Inativação de Máquina"
        itemName={`${maquina.numero_serie} - ${
          maquina.descricao || "Sem descrição"
        }`}
      />
    </div>
  );

  const handleFiltroChangeCustom = (campo: string, valor: string) => {
    if (campo === "incluir_inativos") {
      valor = valor === "true" ? "true" : "";
    }

    handleFiltroChange(campo, valor);
  };

  const filterOptions = [
    {
      id: "numero_serie",
      label: "Número de Série",
      type: "text" as const,
      placeholder: "Buscar por número de série...",
    },
    {
      id: "descricao",
      label: "Descrição",
      type: "text" as const,
      placeholder: "Buscar por descrição...",
    },
    {
      id: "modelo",
      label: "Modelo",
      type: "select" as const,
      placeholder: isLoadingModelos
        ? "Carregando modelos..."
        : "Selecione o modelo",
      options: [
        {
          value: "",
          label: isLoadingModelos ? "Carregando modelos..." : "Todos",
        },
        ...modelosOptions.map((modelo) => ({
          value: modelo,
          label: modelo,
        })),
      ],
    },
    {
      id: "garantia",
      label: "Garantia",
      type: "select" as const,
      placeholder: "Selecione o status da garantia",
      options: [
        { value: "", label: "Todas" },
        { value: "true", label: "Em garantia" },
        { value: "false", label: "Fora da garantia" },
      ],
    },
    {
      id: "data_venda_ini",
      label: "Data inicial da venda",
      type: "date" as const,
      placeholder: "Selecione a data inicial",
    },
    {
      id: "data_venda_fim",
      label: "Data final da venda",
      type: "date" as const,
      placeholder: "Selecione a data final",
    },
    {
      id: "incluir_inativos",
      label: "Exibir Inativos",
      type: "checkbox" as const,
      placeholder: "Exibir máquinas inativas",
    },
  ];

  return (
    <>
      <PageHeader
        title="Lista de Máquinas"
        config={{
          type: "list",
          itemCount: paginacao.totalRegistros,
          onFilterToggle: handleToggleFilters,
          showFilters: localShowFilters,
          activeFiltersCount: activeFiltersCount,
          newButton: {
            label: "Nova Máquina",
            link: "/admin/cadastro/maquinas/novo",
          },
        }}
      />

      <TableList
        title="Lista de Máquinas"
        items={maquinas || []}
        keyField="id"
        columns={columns}
        renderActions={renderActions}
        showFilter={localShowFilters}
        filterOptions={filterOptions}
        filterValues={filtrosPainel}
        onFilterChange={handleFiltroChangeCustom}
        onClearFilters={handleClearFilters}
        onApplyFilters={handleApplyFilters}
        onFilterToggle={handleToggleFilters}
        emptyStateProps={{
          title: "Nenhuma máquina encontrada",
          description:
            activeFiltersCount > 0
              ? "Não encontramos máquinas com os filtros aplicados. Tente ajustar os critérios de busca."
              : "Não há máquinas cadastradas. Clique em 'Nova Máquina' para cadastrar.",
        }}
      />

      <Pagination
        currentPage={paginacao.paginaAtual}
        totalPages={paginacao.totalPaginas}
        totalRecords={paginacao.totalRegistros}
        recordsPerPage={paginacao.registrosPorPagina}
        onPageChange={handlePageChange}
        onRecordsPerPageChange={handleRecordsPerPageChange}
        recordsPerPageOptions={[10, 20, 25, 50, 100]}
        showRecordsPerPage={true}
      />
    </>
  );
};

export default CadastroMaquinas;
