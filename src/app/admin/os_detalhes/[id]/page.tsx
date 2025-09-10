"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/admin/ui/PageHeader";
import { StatusBadge } from "@/components/admin/common";
import { ordensServicoService } from "@/api/services/ordensServicoService";
import { formatarData } from "@/utils/formatters";
import { LoadingSpinner } from "@/components/LoadingPersonalizado";
import { OSDetalhesResponse } from "@/types/OSDetalhesResponse";

// API Error interface definition
interface ApiError {
  erro?: string;
  error?: string;
  message?: string;
}

// Helper function for technician type badge - Temporarily unused but kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getTechnicianTypeBadge = (type: string) => {
  if (type === "interno") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <UserCheck className="w-3.5 h-3.5 mr-1" />
        Interno
      </span>
    );
  } else if (type === "terceiro") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
        <User className="w-3.5 h-3.5 mr-1" />
        Terceiro
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <Info className="w-3.5 h-3.5 mr-1" />
        {type || "Não definido"}
      </span>
    );
  }
};

import {
  ArrowLeft,
  Info,
  User,
  Laptop,
  ClipboardList,
  Wrench,
  CheckCircle,
  XCircle,
  ReceiptText,
  Phone,
  Mail,
  Building,
  MapPin,
  Tag,
  FileText,
  UserCheck,
} from "lucide-react";

const OSDetalhesPage = () => {
  const router = useRouter();
  const params = useParams();
  const osId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [osData, setOsData] = useState<OSDetalhesResponse | null>(null);

  // Status mapping
  const statusMapping = {
    "1": {
      label: "Pendente",
      className: "bg-gray-100 text-gray-700 border border-gray-200",
      icon: <span title="Pendente"></span>,
    },
    "2": {
      label: "A atender",
      className: "bg-blue-100 text-blue-700 border border-blue-200",
      icon: <span title="A atender"></span>,
    },
    "3": {
      label: "Em deslocamento",
      className: "bg-purple-100 text-purple-700 border border-purple-200",
      icon: <span title="Em deslocamento"></span>,
    },
    "4": {
      label: "Em atendimento",
      className: "bg-orange-100 text-orange-700 border border-orange-200",
      icon: <span title="Em atendimento"></span>,
    },
    "5": {
      label: "Atendimento interrompido",
      className: "bg-amber-100 text-amber-700 border border-amber-200",
      icon: <span title="Atendimento interrompido"></span>,
    },
    "6": {
      label: "Em Revisão",
      className: "bg-indigo-100 text-indigo-700 border border-indigo-200",
      icon: <span title="Em Revisão"></span>,
    },
    "7": {
      label: "Concluída",
      className: "bg-green-100 text-green-700 border border-green-200",
      icon: <span title="Concluída"></span>,
    },
    "8": {
      label: "Cancelada",
      className: "bg-red-100 text-red-700 border border-red-200",
      icon: <span title="Cancelada"></span>,
    },
    "9": {
      label: "Cancelada pelo Cliente",
      className: "bg-rose-100 text-rose-700 border border-rose-200",
      icon: <span title="Cancelada pelo Cliente"></span>,
    },
  };

  useEffect(() => {
    async function fetchOSDetails() {
      if (!osId) return;

      try {
        setLoading(true);
        const data = await ordensServicoService.getById(Number(osId));
        console.log("API response:", data); // Log the API response to help diagnose issues

        // Check if data has the expected structure
        if (!data || typeof data !== "object") {
          throw new Error("API returned an invalid response structure");
        }

        // Check if we received an error message from the API
        if ("erro" in data || "error" in data) {
          const apiErrorData = data as ApiError;
          const errorMessage =
            apiErrorData.erro ||
            apiErrorData.error ||
            apiErrorData.message ||
            "Unknown API error";
          throw new Error(errorMessage);
        }

        setOsData(data as unknown as OSDetalhesResponse);
      } catch (err) {
        console.error("Erro ao carregar dados da OS:", err);

        // Handle different error types
        if (err instanceof Error) {
          setError(`Erro: ${err.message}`);
        } else {
          setError(
            "Não foi possível carregar os detalhes da ordem de serviço."
          );
        }
      } finally {
        setLoading(false);
      }
    }

    fetchOSDetails();
  }, [osId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !osData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center my-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <Info className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Erro ao carregar dados
        </h2>
        <p className="text-gray-600 mb-6">
          {error || "Não foi possível encontrar a ordem de serviço solicitada."}
        </p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={`Ordem de Serviço #${osData?.id_os || osId}`}
        config={{
          type: "form",
          backLink: "/admin/os_consulta",
          backLabel: "Voltar",
        }}
      />

      {/* Status card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex flex-col">
            <div className="text-sm text-gray-500">Status atual</div>
            <div className="flex items-center mt-1">
              <StatusBadge
                status={String(osData?.situacao_os?.codigo || "")}
                mapping={statusMapping}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:text-right">
            <div>
              <div className="text-xs text-gray-500">Data de Abertura</div>
              <div className="font-medium">
                {formatarData(osData?.abertura?.data_abertura) || "-"}
              </div>
            </div>

            {osData.data_agendada && (
              <div>
                <div className="text-xs text-gray-500">Data Agendada</div>
                <div className="font-medium">
                  {formatarData(osData.data_agendada)}
                </div>
              </div>
            )}

            {osData.data_fechamento && (
              <div>
                <div className="text-xs text-gray-500">Data de Fechamento</div>
                <div className="font-medium">
                  {formatarData(osData.data_fechamento)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Cliente info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Building className="h-5 w-5 text-[var(--primary)]" />
              Dados do Cliente
            </h2>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Nome</div>
                <div className="mt-1">{osData.cliente?.nome || "-"}</div>
              </div>

              {(osData.cliente?.endereco || osData.cliente?.numero) && (
                <div>
                  <div className="text-sm font-medium text-gray-500">
                    Endereço
                  </div>
                  <div className="mt-1">
                    {[
                      osData.cliente?.endereco,
                      osData.cliente?.numero && `Nº ${osData.cliente.numero}`,
                      osData.cliente?.complemento,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-gray-500">
                  <MapPin className="h-4 w-4 inline-block mr-1 text-gray-400" />
                  Localização
                </div>
                <div className="mt-1">
                  {osData.cliente ? (
                    <>
                      {[osData.cliente?.cidade, osData.cliente?.uf]
                        .filter(Boolean)
                        .join("/")}
                      {osData.cliente?.cep && ` - CEP: ${osData.cliente.cep}`}
                    </>
                  ) : (
                    "-"
                  )}
                </div>
              </div>

              {osData.contato && (
                <>
                  <div className="border-t border-gray-100 pt-4 mt-4">
                    <div className="text-sm font-medium text-gray-500">
                      <User className="h-4 w-4 inline-block mr-1 text-gray-400" />
                      Contato
                    </div>
                    <div className="mt-1">{osData.contato.nome}</div>
                  </div>

                  {osData.contato.telefone && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        <Phone className="h-4 w-4 inline-block mr-1 text-gray-400" />
                        Telefone
                      </div>
                      <div className="mt-1">
                        <a
                          href={`tel:${osData.contato.telefone.replace(
                            /\D/g,
                            ""
                          )}`}
                          className="text-[var(--primary)]"
                        >
                          {osData.contato.telefone}
                        </a>
                      </div>
                    </div>
                  )}

                  {osData.contato.email && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        <Mail className="h-4 w-4 inline-block mr-1 text-gray-400" />
                        Email
                      </div>
                      <div className="mt-1">
                        <a
                          href={`mailto:${osData.contato.email}`}
                          className="text-[var(--primary)] break-words"
                        >
                          {osData.contato.email}
                        </a>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Máquina info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Laptop className="h-5 w-5 text-[var(--primary)]" />
              Dados da Máquina
            </h2>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500">
                  Número de Série
                </div>
                <div className="mt-1 font-medium">
                  {osData.maquina?.numero_serie || "-"}
                </div>
              </div>

              {osData.maquina?.modelo && (
                <div>
                  <div className="text-sm font-medium text-gray-500">
                    Modelo
                  </div>
                  <div className="mt-1">{osData.maquina.modelo}</div>
                </div>
              )}

              {osData.maquina?.descricao && (
                <div>
                  <div className="text-sm font-medium text-gray-500">
                    Descrição
                  </div>
                  <div className="mt-1">{osData.maquina.descricao}</div>
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-gray-500">
                  Em Garantia
                </div>
                <div className="mt-1">
                  {osData.em_garantia ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Sim
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Não
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Técnico info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-[var(--primary)]" />
              Dados do Atendimento
            </h2>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {osData.tecnico && (
                <div>
                  <div className="text-sm font-medium text-gray-500">
                    Técnico Responsável
                  </div>
                  <div className="mt-1">{osData.tecnico.nome}</div>
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-gray-500">Região</div>
                <div className="mt-1">Região</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500">
                  <Tag className="h-4 w-4 inline-block mr-1 text-gray-400" />
                  Motivo do Atendimento
                </div>
                <div className="mt-1">
                  {osData.abertura?.motivo_atendimento || "-"}
                </div>
              </div>

              {osData.situacao_os?.motivo_pendencia && (
                <div>
                  <div className="text-sm font-medium text-gray-500">
                    Motivo da Pendência
                  </div>
                  <div className="mt-1">
                    {osData.situacao_os?.motivo_pendencia || "-"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Descrição do problema */}
      {osData.descricao_problema && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[var(--primary)]" />
              Descrição do Problema
            </h2>
          </div>

          <div className="p-6">
            <div className="prose max-w-none">{osData.descricao_problema}</div>
          </div>
        </div>
      )}

      {/* Histórico da OS - Removed due to missing property in OSDetalhesResponse type */}

      {/* FATs (Faturamento) */}
      {osData.fats && osData.fats.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-[var(--primary)]" />
              Faturamento
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Período
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
                    Observações
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Peças Utilizadas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {osData.fats.map((fat) => (
                  <tr key={fat.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatarData(fat.data)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {fat.tecnico?.nome || "Técnico não identificado"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {fat.observacoes || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {fat.pecas && fat.pecas.length > 0 ? (
                        <ul className="list-disc list-inside">
                          {fat.pecas.map((peca) => (
                            <li key={peca.id}>
                              {peca.nome || "Peça não identificada"} -{" "}
                              {peca.quantidade} unid.
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-500">
                          Nenhuma peça utilizada
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Revisão */}
      {osData.revisao_os && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[var(--primary)]" />
              Informações de Revisão
            </h2>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500">
                  Data da Revisão
                </div>
                <div className="mt-1">
                  {formatarData(osData.revisao_os.data)}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500">Revisor</div>
                <div className="mt-1">
                  {osData.revisao_os.nome || "Usuário não identificado"}
                </div>
              </div>

              {osData.revisao_os.observacoes && (
                <div>
                  <div className="text-sm font-medium text-gray-500">
                    Observações
                  </div>
                  <div className="mt-1 text-gray-700">
                    {osData.revisao_os.observacoes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom actions */}
      <div className="flex justify-end gap-3 mt-8">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Consulta
        </button>
      </div>
    </>
  );
};

export default OSDetalhesPage;
