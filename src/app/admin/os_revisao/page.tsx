"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ordensServicoService,
  type OSItem,
} from "@/api/services/ordensServicoService";
import { LoadingSpinner as Loading } from "@/components/LoadingPersonalizado";
import PageHeader from "@/components/admin/ui/PageHeaderSimple";
import { AlertCircle, CheckCircle, XCircle, RefreshCcw } from "lucide-react";
import Pagination from "@/components/admin/ui/Pagination";

// Componente para exibir badge de garantia
const WarrantyBadge = ({ inWarranty }: { inWarranty: boolean }) => {
  return (
    <div
      className={`flex items-center gap-1 px-1 py-1 rounded-md ${
        inWarranty ? "text-green-500" : "text-amber-500"
      }`}
      title={inWarranty ? "Em Garantia" : "Fora da Garantia"}
    >
      {inWarranty ? (
        <CheckCircle className="w-5 h-5" />
      ) : (
        <XCircle className="w-5 h-5" />
      )}
    </div>
  );
};

export default function RevisaoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ordens, setOrdens] = useState<OSItem[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Carregar ordens com situação 6 (Aguardando revisão)
  const fetchOrdens = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string | number> = {
        situacao: "6",
        nro_pagina: page,
        qtde_registros: 10,
        resumido: "S",
      };

      const response = await ordensServicoService.getAll(params);

      setOrdens(response.dados);
      setTotalRegistros(response.total_registros);
      setCurrentPage(page);
    } catch (err) {
      console.error("Erro ao buscar ordens de serviço:", err);
      setError(
        "Não foi possível carregar as ordens de serviço. Por favor, tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  // Navegar para a página de detalhes
  const handleViewDetails = (id: number) => {
    router.push(`/admin/os_revisao/${id}`);
  };

  // Efetuar a paginação
  const handlePageChange = (page: number) => {
    fetchOrdens(page);
  };

  // Carregar ordens na inicialização do componente
  useEffect(() => {
    fetchOrdens();
  }, []);

  return (
    <>
      <PageHeader
        title="Ordens de Serviço para Revisão"
        config={{
          type: "list",
          itemCount: totalRegistros,
          refreshButton: {
            onClick: () => fetchOrdens(1),
          },
          newButton: {
            label: "",
            onClick: () => {},
          },
        }}
      />

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Ordens */}
      {loading ? (
        <div className="flex justify-center my-12">
          <Loading />
        </div>
      ) : ordens.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  N° OS
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Cliente
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Máquina
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Técnico
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Data Situação
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ordens.map((ordem) => (
                <tr
                  key={ordem.id_os}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleViewDetails(ordem.id_os)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    #{ordem.id_os}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ordem.cliente.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <span>
                        {ordem.maquina.modelo} - {ordem.maquina.numero_serie}
                      </span>
                      <WarrantyBadge inWarranty={ordem.em_garantia} />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ordem.tecnico ? (
                      <div className="flex items-center gap-2">
                        <span>{ordem.tecnico.nome}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                          Interno
                        </span>
                      </div>
                    ) : (
                      "Não atribuído"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ordem.situacao_os.data_situacao || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginação */}
          {totalRegistros > 10 && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalRegistros / 10)}
              totalRecords={totalRegistros}
              recordsPerPage={10}
              onPageChange={handlePageChange}
              onRecordsPerPageChange={() => {}}
              recordsPerPageOptions={[10, 25, 50, 100]}
              showRecordsPerPage={false}
            />
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">
            Não há ordens de serviço aguardando revisão no momento.
          </p>
          <button
            onClick={() => fetchOrdens(1)}
            className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Atualizar
          </button>
        </div>
      )}
    </>
  );
}
