"use client";

import React, { useState, useMemo } from "react";
import PageHeader from "@/components/admin/ui/PageHeader";
import DataTable from "@/components/admin/common/DataTable";
import { StatusBadge } from "@/components/admin/common";
import {
  ordensServicoService,
  OSItem,
} from "@/api/services/ordensServicoService";
import useDataFetch from "@/hooks/useDataFetch";
import { formatarData } from "@/utils/formatters";
import { LoadingSpinner } from "@/components/LoadingPersonalizado";

const ConsultaOSPage: React.FC = () => {
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

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

  // Fazer requisição para a API
  const { data, loading, error } = useDataFetch<{
    dados: OSItem[];
    total_registros: number;
  }>(() =>
    ordensServicoService.getAll({
      resumido: "s",
      situacao: "1,2,3,4,5,6,7,8,9",
    } as { resumido: string; situacao: string })
  );

  // Função para lidar com o clique em uma linha da tabela
  const handleRowClick = (id: number | string) => {
    setExpandedRowId(expandedRowId === Number(id) ? null : Number(id));
  };

  // Definição das colunas da tabela
  const columns = useMemo(
    () => [
      {
        header: "Número OS",
        accessor: (item: OSItem) => item.numero_os || "-",
      },
      {
        header: "Data Abertura",
        accessor: (item: OSItem) => item.data_abertura || "-",
      },
      {
        header: "Cliente",
        accessor: (item: OSItem) => item.cli  "-",
      },
      {
        header: "Máquina",
        accessor: (item: OSItem) => item.maquina?.numero_serie || "-",
      },
      {
        header: "Técnico",
        accessor: (item: OSItem) => item.tecnico?.nome || "-",
      },
      {
        header: "Status",
        accessor: (item: OSItem) => String(item.status),
        render: (item: OSItem) => (
          <StatusBadge status={String(item.status)} mapping={statusMapping} />
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
          onFilterToggle: () => setShowFilter(!showFilter),
          activeFiltersCount: 0,
          newButton: {
            label: "Nova OS",
            link: "/admin/os_aberto/novo",
          },
        }}
      />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100 p-10">
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Erro ao carregar os dados
          </h3>
          <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-8">
            Ocorreu um erro ao buscar as ordens de serviço. Por favor, tente
            novamente.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <DataTable
            columns={columns}
            data={data?.dados || []}
            keyField="id"
            expandedRowId={expandedRowId}
            onRowExpand={handleRowClick}
            renderExpandedRow={(item: OSItem) => (
              <div className="p-4 bg-gray-50">
                <h3 className="font-semibold mb-2">
                  Detalhes da OS #{item.numero_os}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">Cliente:</span>{" "}
                      {item.cliente?.nome_fantasia}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Máquina:</span>{" "}
                      {item.maquina?.numero_serie}
                    </p>
                    {item.tecnico && (
                      <p className="text-sm">
                        <span className="font-medium">Técnico:</span>{" "}
                        {item.tecnico.nome}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">Data de Abertura:</span>{" "}
                      {formatarData(item.data_abertura)}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Status:</span>{" "}
                      {statusMapping[String(item.status)]?.label ||
                        "Desconhecido"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <a
                    href={`/admin/os_aberto/${item.id}`}
                    className="px-4 py-2 bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-dark)] transition-colors"
                  >
                    Ver Completo
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
      )}
    </>
  );
};

export default ConsultaOSPage;
