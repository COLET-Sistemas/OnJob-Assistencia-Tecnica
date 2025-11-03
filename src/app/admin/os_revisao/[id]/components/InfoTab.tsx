import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { OSDetalhadaV2 } from "@/api/services/ordensServicoService";

interface InfoTabProps {
  os: OSDetalhadaV2;
  observacoes: string;
  onObservacoesChange: (value: string) => void;
}

const InfoTab: React.FC<InfoTabProps> = ({ os }) => {
  const [expandedFatId, setExpandedFatId] = React.useState<number | null>(null);

  const handleRowClick = (fatId: number, canExpand: boolean) => {
    if (!canExpand) {
      return;
    }
    setExpandedFatId((prev) => (prev === fatId ? null : fatId));
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

                  const canExpand = detailItems.length > 0;
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
    </div>
  );
};

export default InfoTab;
