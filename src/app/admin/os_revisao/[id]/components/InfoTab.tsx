import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { OSDetalhadaV2 } from "@/api/services/ordensServicoService";
import type { OcorrenciaOSDetalhe } from "@/api/services/ocorrenciaOSService";
import { getStatusInfo } from "@/utils/statusMapping";

interface InfoTabProps {
  os: OSDetalhadaV2;
  machineObservations: string;
}

const InfoTab: React.FC<InfoTabProps> = ({ os, machineObservations }) => {
  const [expandedFatId, setExpandedFatId] = React.useState<number | null>(null);
  const machineNotes =
    machineObservations.trim().length > 0
      ? machineObservations
      : os.maquina?.observacoes?.trim() ?? "";

  const handleRowClick = (fatId: number, canExpand: boolean) => {
    if (!canExpand) {
      return;
    }
    setExpandedFatId((prev) => (prev === fatId ? null : fatId));
  };

  const renderOccurrences = (ocorrencias: OcorrenciaOSDetalhe[]) => {
    if (!ocorrencias || ocorrencias.length === 0) {
      return null;
    }

    return (
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          Ocorrências ({ocorrencias.length})
        </p>
        <div className="space-y-2">
          {ocorrencias.map((ocorrencia, index) => {
            // Extract status code from different possible formats
            let statusCode: number | undefined;
            if (
              typeof ocorrencia.nova_situacao === "object" &&
              ocorrencia.nova_situacao?.codigo !== undefined
            ) {
              statusCode = Number(ocorrencia.nova_situacao.codigo);
            } else if (
              typeof ocorrencia.situacao === "object" &&
              ocorrencia.situacao?.codigo !== undefined
            ) {
              statusCode = Number(ocorrencia.situacao.codigo);
            } else if (typeof ocorrencia.nova_situacao === "number") {
              statusCode = ocorrencia.nova_situacao;
            } else if (typeof ocorrencia.nova_situacao === "string") {
              statusCode = Number(ocorrencia.nova_situacao);
            }

            const statusInfo = getStatusInfo(statusCode || 1);
            const situacaoDescricao =
              (typeof ocorrencia.nova_situacao === "object" &&
                ocorrencia.nova_situacao?.descricao) ||
              (typeof ocorrencia.situacao === "object" &&
                ocorrencia.situacao?.descricao) ||
              statusInfo.label;
            const descricaoOcorrencia = ocorrencia.descricao_ocorrencia?.trim();
            const dataOcorrencia =
              ocorrencia.data_ocorrencia || ocorrencia.data || "N/A";

            return (
              <div
                key={ocorrencia.id_ocorrencia || index}
                className="flex items-center gap-2"
              >
                <div
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border ${statusInfo.className}`}
                >
                  {statusInfo.icon}
                  <span className="font-medium">{situacaoDescricao}</span>
                </div>
                <span className="text-xs text-gray-500 font-mono">
                  {dataOcorrencia}
                </span>
                {descricaoOcorrencia && (
                  <span className="text-xs text-gray-600">
                    {descricaoOcorrencia}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Informações da Ordem de Serviço
      </h3>

      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Problema Relatado
        </h4>
        <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-700">
          {os.descricao_problema || "Nenhuma descricao fornecida."}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          FATs Associadas
        </h4>

        {os.fats && os.fats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    FAT #
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Data Atendimento
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Técnico
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Motivo
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Atendente
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {/* Indicador de expansao */}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {os.fats.map((fat) => {
                  const detailItems = [
                    {
                      label: "Solução encontrada",
                      value: fat.solucao_encontrada,
                    },
                    {
                      label: "Testes realizados",
                      value: fat.testes_realizados,
                    },
                    {
                      label: "Sugestões",
                      value: fat.sugestoes,
                    },
                    {
                      label: "Observações",
                      value: fat.observacoes,
                    },
                    {
                      label: "Número de ciclos",
                      value:
                        typeof fat.numero_ciclos === "number" &&
                        !Number.isNaN(fat.numero_ciclos)
                          ? fat.numero_ciclos
                          : null,
                    },
                  ].filter((item) => {
                    if (item.value === null || item.value === undefined) {
                      return false;
                    }
                    if (typeof item.value === "string") {
                      return item.value.trim().length > 0;
                    }
                    return true;
                  });

                  const hasOcorrencias =
                    fat.ocorrencias && fat.ocorrencias.length > 0;
                  const canExpand =
                    detailItems.length > 0 || Boolean(hasOcorrencias);
                  const isExpanded = expandedFatId === fat.id_fat;

                  return (
                    <React.Fragment key={fat.id_fat}>
                      <tr
                        className={`transition-colors ${
                          canExpand ? "cursor-pointer" : ""
                        } ${isExpanded ? "bg-gray-50" : "hover:bg-gray-50"}`}
                        onClick={() => handleRowClick(fat.id_fat, canExpand)}
                        aria-expanded={isExpanded}
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{fat.id_fat}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {fat.data_atendimento || ""}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {fat.tecnico?.nome || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {fat.motivo_atendimento || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {fat.nome_atendente || "-"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {canExpand ? (
                            <span className="inline-flex items-center justify-center text-gray-400">
                              {isExpanded ? (
                                <ChevronUp aria-hidden className="h-4 w-4" />
                              ) : (
                                <ChevronDown aria-hidden className="h-4 w-4" />
                              )}
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center text-gray-200">
                              <ChevronDown aria-hidden className="h-4 w-4" />
                            </span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && canExpand && (
                        <tr>
                          <td
                            colSpan={6}
                            className="bg-gray-50 px-3 py-4 text-sm text-gray-700"
                          >
                            <div className="grid gap-4 sm:grid-cols-2">
                              {detailItems.map((item) => (
                                <div key={item.label}>
                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    {item.label}
                                  </p>
                                  <p className="mt-1 whitespace-pre-line">
                                    {item.value}
                                  </p>
                                </div>
                              ))}
                            </div>
                            {renderOccurrences(fat.ocorrencias || [])}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Nenhuma FAT associada a esta OS.
          </p>
        )}
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Observação da máquina
        </h4>
        <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-700 whitespace-pre-line">
          {machineNotes.length > 0
            ? machineNotes
            : "Nenhuma observação cadastrada para a máquina."}
        </div>
      </div>
    </div>
  );
};

export default InfoTab;
