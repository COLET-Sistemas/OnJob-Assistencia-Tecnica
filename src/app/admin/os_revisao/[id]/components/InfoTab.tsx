import React from "react";
import { ChevronDown, ChevronUp, PauseCircle, X } from "lucide-react";
import type { OSDetalhadaV2 } from "@/api/services/ordensServicoService";
import type { OcorrenciaOSDetalhe } from "@/api/services/ocorrenciaOSService";
import { ocorrenciasOSService } from "@/api/services/ocorrenciaOSService";
import { useToast } from "@/components/admin/ui/ToastContainer";
import { getStatusInfo } from "@/utils/statusMapping";

interface InfoTabProps {
  os: OSDetalhadaV2;
  machineObservations: string;
  onRefresh?: () => Promise<void> | void;
}

const InfoTab: React.FC<InfoTabProps> = ({
  os,
  machineObservations,
  onRefresh,
}) => {
  const [expandedFatId, setExpandedFatId] = React.useState<number | null>(null);
  const [isPausaModalOpen, setIsPausaModalOpen] = React.useState(false);
  const [pausaSubmitting, setPausaSubmitting] = React.useState(false);
  const [selectedFatId, setSelectedFatId] = React.useState<number | null>(null);
  const [pausaForm, setPausaForm] = React.useState({
    hora_inicio: "",
    hora_fim: "",
    observacao: "",
  });
  const { showSuccess, showError } = useToast();
  const machineNotes =
    machineObservations.trim().length > 0
      ? machineObservations
      : os.maquina?.observacoes?.trim() ?? "";

  React.useEffect(() => {
    if (os?.fats && os.fats.length > 0) {
      setSelectedFatId(os.fats[0].id_fat ?? null);
    } else {
      setSelectedFatId(null);
    }
  }, [os?.fats]);

  const handleRowClick = (fatId: number, canExpand: boolean) => {
    if (!canExpand) {
      return;
    }
    setExpandedFatId((prev) => (prev === fatId ? null : fatId));
  };

  const resolveFatId = (fatId?: number | null) => {
    if (fatId) return fatId;
    if (selectedFatId) return selectedFatId;
    return os?.fats?.[0]?.id_fat ?? null;
  };

  const handleOpenPausaModal = (fatId?: number | null) => {
    setPausaForm({
      hora_inicio: "",
      hora_fim: "",
      observacao: "",
    });
    setSelectedFatId(resolveFatId(fatId));
    setIsPausaModalOpen(true);
  };

  const handleClosePausaModal = () => {
    setIsPausaModalOpen(false);
    setPausaSubmitting(false);
    setPausaForm({
      hora_inicio: "",
      hora_fim: "",
      observacao: "",
    });
  };

  const parseTimeToMinutes = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    return hours * 60 + minutes;
  };

  const getErrorMessage = (error: unknown) => {
    const extractMessage = (payload: unknown): string | undefined => {
      if (!payload) return undefined;
      if (typeof payload === "string") {
        // Try parsing JSON strings like {"erro":"..."} to avoid showing raw JSON
        try {
          const parsed = JSON.parse(payload);
          return extractMessage(parsed);
        } catch {
          return payload;
        }
      }
      if (typeof payload === "object") {
        const obj = payload as Record<string, unknown>;
        return (
          extractMessage(obj.mensagem) ||
          extractMessage(obj.message) ||
          extractMessage(obj.erro) ||
          extractMessage(obj.error)
        );
      }
      return undefined;
    };

    if (!error) return "Nao foi possivel registrar a pausa.";

    const anyErr = error as { response?: { data?: unknown }; message?: string };
    const dataMessage = extractMessage(anyErr.response?.data);
    const genericMessage = extractMessage(anyErr.message);

    return (
      dataMessage || genericMessage || "Nao foi possivel registrar a pausa."
    );
  };

  const handleRegistrarPausaManual = async () => {
    if (!selectedFatId) {
      showError("Selecione uma FAT para registrar a pausa.");
      return;
    }

    const horaInicio = pausaForm.hora_inicio.trim();
    const horaFim = pausaForm.hora_fim.trim();

    if (!horaInicio || !horaFim) {
      showError("Informe hora de inicio e fim da pausa.");
      return;
    }

    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!timeRegex.test(horaInicio) || !timeRegex.test(horaFim)) {
      showError("Use o formato hh:mm para os horários.");
      return;
    }

    const inicioMinutes = parseTimeToMinutes(horaInicio);
    const fimMinutes = parseTimeToMinutes(horaFim);

    if (
      inicioMinutes !== null &&
      fimMinutes !== null &&
      fimMinutes <= inicioMinutes
    ) {
      showError("A hora fim deve ser maior que a hora inicio.");
      return;
    }

    setPausaSubmitting(true);
    try {
      const response = await ocorrenciasOSService.registrarPausaManual({
        id_fat: selectedFatId,
        hora_inicio: horaInicio,
        hora_fim: horaFim,
        observacao: pausaForm.observacao.trim() || undefined,
      });
      showSuccess(response?.mensagem || "Pausa manual registrada com sucesso.");
      handleClosePausaModal();
      await onRefresh?.();
    } catch (error) {
      console.error("Erro ao registrar pausa manual:", error);
      showError(getErrorMessage(error));
    } finally {
      setPausaSubmitting(false);
    }
  };

  const renderOccurrences = (
    ocorrencias: OcorrenciaOSDetalhe[] | undefined,
    fatId: number
  ) => {
    const totalOcorrencias = ocorrencias?.length ?? 0;
    return (
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="mb-3 flex items-center gap-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Ocorrências ({totalOcorrencias})
          </p>
          <button
            type="button"
            onClick={() => handleOpenPausaModal(fatId)}
            className="inline-flex items-center gap-1.5 cursor-pointer rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
          >
            <PauseCircle className="h-4 w-4" />
            Registrar pausa
          </button>
        </div>
        {totalOcorrencias > 0 ? (
          <div className="space-y-2">
            {ocorrencias?.map((ocorrencia, index) => {
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
              const descricaoOcorrencia =
                ocorrencia.descricao_ocorrencia?.trim();
              const dataOcorrencia =
                ocorrencia.data_ocorrencia || ocorrencia.data || "N/A";

              return (
                <div
                  key={ocorrencia.id_ocorrencia || index}
                  className="flex items-center gap-2"
                >
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border w-40 ${statusInfo.className}`}
                  >
                    {statusInfo.icon}
                    <span className="font-medium whitespace-nowrap">
                      {situacaoDescricao}
                    </span>
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
        ) : (
          <p className="text-xs text-gray-500">
            Nenhuma ocorrencia registrada.
          </p>
        )}
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
          {os.descricao_problema || "Nenhuma descriço fornecida."}
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
                            {renderOccurrences(fat.ocorrencias, fat.id_fat)}
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

      {isPausaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Registrar pausa manual
                </p>
                <p className="text-sm text-gray-600">
                  Informe os horários da pausa.
                </p>
                {selectedFatId && (
                  <p className="text-xs font-semibold text-gray-700">
                    FAT selecionada: #{selectedFatId}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleClosePausaModal}
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 py-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Hora inicio
                  </label>
                  <input
                    type="time"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100"
                    value={pausaForm.hora_inicio}
                    required
                    onChange={(e) =>
                      setPausaForm((prev) => ({
                        ...prev,
                        hora_inicio: e.target.value,
                      }))
                    }
                    disabled={pausaSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Hora fim
                  </label>
                  <input
                    type="time"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100"
                    value={pausaForm.hora_fim}
                    required
                    onChange={(e) =>
                      setPausaForm((prev) => ({
                        ...prev,
                        hora_fim: e.target.value,
                      }))
                    }
                    disabled={pausaSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Observação (opcional)
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100"
                  placeholder="Descreva o motivo da pausa"
                  value={pausaForm.observacao}
                  onChange={(e) =>
                    setPausaForm((prev) => ({
                      ...prev,
                      observacao: e.target.value,
                    }))
                  }
                  disabled={pausaSubmitting}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-4 py-3">
              <button
                type="button"
                onClick={handleClosePausaModal}
                disabled={pausaSubmitting}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRegistrarPausaManual}
                disabled={
                  pausaSubmitting ||
                  !pausaForm.hora_inicio.trim() ||
                  !pausaForm.hora_fim.trim() ||
                  !selectedFatId
                }
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pausaSubmitting ? "Registrando..." : "Registrar pausa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoTab;
