import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  History,
  Loader2,
  X,
} from "lucide-react";
import {
  HistoricoRegistro,
  HistoricoResponse,
  HistoricoTipo,
  historicoService,
} from "@/api/services/historicoService";

interface HistoricoModalProps {
  isOpen: boolean;
  targetId: number | null;
  targetLabel?: string;
  tipo: HistoricoTipo | null;
  onClose: () => void;
}

const PAGE_SIZE = 50;

const HistoricoModal: React.FC<HistoricoModalProps> = ({
  isOpen,
  targetId,
  targetLabel,
  tipo,
  onClose,
}) => {
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [registros, setRegistros] = useState<HistoricoRegistro[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [maquinaInfo, setMaquinaInfo] = useState<
    HistoricoResponse["maquina"] | null
  >(null);
  const [clienteInfo, setClienteInfo] = useState<
    HistoricoResponse["cliente"] | null
  >(null);

  const tipoDescricao = useMemo(() => {
    if (tipo === "cliente") return "Histórico do Cliente";
    if (tipo === "maquina") return "Histórico da Máquina";
    return "Histórico";
  }, [tipo]);
  const isHistoricoCliente = tipo === "cliente";
  const isHistoricoMaquina = tipo === "maquina";

  const fetchHistorico = useCallback(async () => {
    if (!isOpen || !tipo || !targetId) return;

    try {
      setLoading(true);
      setErrorMessage(null);
      const response: HistoricoResponse = await historicoService.getHistorico({
        id_cliente: tipo === "cliente" ? targetId : undefined,
        id_maquina: tipo === "maquina" ? targetId : undefined,
        nro_pagina: pagina,
        qtde_registros: PAGE_SIZE,
      });

      setRegistros(response?.dados || []);
      setMaquinaInfo(response?.maquina || null);
      setClienteInfo(response?.cliente || null);
      setTotalPaginas(Math.max(response?.total_paginas || 1, 1));
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      setErrorMessage(
        "Não foi possível carregar o histórico. Tente novamente mais tarde."
      );
      setRegistros([]);
      setMaquinaInfo(null);
      setClienteInfo(null);
    } finally {
      setLoading(false);
    }
  }, [isOpen, pagina, targetId, tipo]);

  useEffect(() => {
    if (isOpen) {
      setPagina(1);
      setRegistros([]);
      setErrorMessage(null);
      setMaquinaInfo(null);
      setClienteInfo(null);
    }
  }, [isOpen, targetId, tipo]);

  useEffect(() => {
    fetchHistorico();
  }, [fetchHistorico]);

  if (!isOpen || !tipo || !targetId) {
    return null;
  }

  const handlePaginaAnterior = () => {
    setPagina((prev) => Math.max(prev - 1, 1));
  };

  const handleProximaPagina = () => {
    setPagina((prev) => Math.min(prev + 1, totalPaginas));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {tipoDescricao}
              </h3>
            </div>
            {isHistoricoMaquina ? (
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-semibold text-gray-900">
                  {maquinaInfo?.descricao ||
                    targetLabel?.replace("Máquina: ", "") ||
                    "Máquina"}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  {maquinaInfo?.numero_serie && (
                    <span>S/N {maquinaInfo.numero_serie}</span>
                  )}
                  {maquinaInfo?.modelo && (
                    <span>Modelo: {maquinaInfo.modelo}</span>
                  )}
                  {maquinaInfo?.data_final_garantia && (
                    <span>Garantia até {maquinaInfo.data_final_garantia}</span>
                  )}
                </div>
                {maquinaInfo?.observacoes && (
                  <p className="text-xs text-gray-500 italic">
                    {maquinaInfo.observacoes}
                  </p>
                )}
              </div>
            ) : isHistoricoCliente ? (
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-semibold text-gray-900">
                  {clienteInfo?.nome_fantasia ||
                    clienteInfo?.razao_social ||
                    targetLabel ||
                    "Cliente"}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  {clienteInfo?.razao_social && (
                    <span>{clienteInfo.razao_social}</span>
                  )}
                  {clienteInfo?.cnpj && <span>CNPJ: {clienteInfo.cnpj}</span>}
                </div>
              </div>
            ) : (
              targetLabel && (
                <p className="text-sm text-gray-500 mt-1">{targetLabel}</p>
              )
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4" />
              {errorMessage}
            </div>
          )}

          <div className="border border-gray-100 rounded-lg bg-gray-50 max-h-[65vh] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                Carregando histórico...
              </div>
            ) : registros.length === 0 ? (
              <div className="py-16 text-center text-gray-500">
                Nenhum registro encontrado.
              </div>
            ) : (
              <ul className="space-y-3 p-3">
                {registros.map((registro) => {
                  const garantiaAtiva = registro.em_garantia;
                  return (
                    <li
                      key={`${registro.id_fat}-${registro.numero_os}`}
                      className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="p-4 space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <span className="text-[14px] font-medium uppercase tracking-wide text-gray-500">
                                  OS
                                </span>
                                <span className="text-gray-800">
                                  #{registro.numero_os}
                                </span>
                              </span>

                              <span className="w-1 h-1 rounded-full bg-gray-400"></span>

                              <span className="flex items-center gap-1">
                                <span className="text-[14px] font-medium uppercase tracking-wide text-gray-500">
                                  FAT
                                </span>
                                <span className="text-gray-800">
                                  #{registro.id_fat}
                                </span>
                              </span>
                            </p>

                            <p className="text-xs text-gray-500">
                              Atendimento em {registro.data_atendimento}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 justify-end">
                            {registro.motivo_atendimento && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {registro.motivo_atendimento}
                              </span>
                            )}
                            {typeof registro.numero_ciclos === "number" && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                                Ciclos: {registro.numero_ciclos}
                              </span>
                            )}
                            <div
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${
                                garantiaAtiva
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  : "bg-amber-50 text-amber-700 border-amber-100"
                              }`}
                            >
                              {garantiaAtiva ? (
                                <CircleCheck className="w-3.5 h-3.5" />
                              ) : (
                                <CircleX className="w-3.5 h-3.5" />
                              )}
                              {garantiaAtiva
                                ? "Em garantia"
                                : "Fora de garantia"}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                          {isHistoricoMaquina && (
                            <div className="bg-gray-50 rounded-lg border border-gray-100 px-3 py-2">
                              <p className="text-xs uppercase tracking-wide text-gray-500">
                                Cliente
                              </p>
                              <p className="text-gray-800 font-medium mt-0.5">
                                {registro.nome_cliente || "—"}
                              </p>
                            </div>
                          )}
                          {isHistoricoCliente && (
                            <div className="bg-gray-50 rounded-lg border border-gray-100 px-3 py-2">
                              <p className="text-xs uppercase tracking-wide text-gray-500">
                                Máquina atendida
                              </p>
                              <p className="text-gray-800 font-medium mt-0.5">
                                {registro.descricao_maquina || "—"}
                              </p>
                              {registro.numero_serie && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  S/N {registro.numero_serie}
                                </p>
                              )}
                            </div>
                          )}
                          <div className="bg-gray-50 rounded-lg border border-gray-100 px-3 py-2">
                            <p className="text-xs uppercase tracking-wide text-gray-500">
                              Técnico responsável
                            </p>
                            <p className="text-gray-800 font-medium mt-0.5">
                              {registro.nome_tecnico || "—"}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 text-sm">
                          {registro.descricao_problema && (
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                              <p className="text-xs uppercase tracking-wide text-slate-500">
                                Descrição do problema
                              </p>
                              <p className="text-gray-800 whitespace-pre-wrap mt-1">
                                {registro.descricao_problema}
                              </p>
                            </div>
                          )}
                          {registro.solucao_encontrada && (
                            <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-100">
                              <p className="text-xs uppercase tracking-wide text-emerald-600">
                                Solução encontrada
                              </p>
                              <p className="text-gray-800 whitespace-pre-wrap mt-1">
                                {registro.solucao_encontrada}
                              </p>
                            </div>
                          )}

                          {registro.testes_realizados && (
                            <div className="p-3 bg-white rounded-lg border border-gray-100">
                              <p className="text-xs uppercase tracking-wide text-gray-500">
                                Testes realizados
                              </p>
                              <p className="text-gray-800 whitespace-pre-wrap mt-1">
                                {registro.testes_realizados}
                              </p>
                            </div>
                          )}
                          {registro.sugestoes && (
                            <div className="p-3 bg-white rounded-lg border border-gray-100">
                              <p className="text-xs uppercase tracking-wide text-gray-500">
                                Sugestões
                              </p>
                              <p className="text-gray-800 whitespace-pre-wrap mt-1">
                                {registro.sugestoes}
                              </p>
                            </div>
                          )}
                          {registro.observacoes && (
                            <div className="p-3 bg-white rounded-lg border border-gray-100">
                              <p className="text-xs uppercase tracking-wide text-gray-500">
                                Observações
                              </p>
                              <p className="text-gray-800 whitespace-pre-wrap mt-1">
                                {registro.observacoes}
                              </p>
                            </div>
                          )}

                          {registro.observacoes_tecnico && (
                            <div className="p-3 bg-white rounded-lg border border-gray-100">
                              <p className="text-xs uppercase tracking-wide text-gray-500">
                                Observações do técnico
                              </p>
                              <p className="text-gray-800 whitespace-pre-wrap mt-1">
                                {registro.observacoes_tecnico}
                              </p>
                            </div>
                          )}
                          {registro.observacoes_revisao && (
                            <div className="p-3 bg-white rounded-lg border border-gray-100">
                              <p className="text-xs uppercase tracking-wide text-gray-500">
                                Observações de revisão
                              </p>
                              <p className="text-gray-800 whitespace-pre-wrap mt-1">
                                {registro.observacoes_revisao}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <button
                onClick={handlePaginaAnterior}
                disabled={pagina === 1 || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              <span>
                Página {pagina} de {totalPaginas}
              </span>
              <button
                onClick={handleProximaPagina}
                disabled={pagina === totalPaginas || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoricoModal;
