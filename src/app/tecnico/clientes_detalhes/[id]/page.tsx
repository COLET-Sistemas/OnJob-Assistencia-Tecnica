"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useParams, useRouter } from "next/navigation";
import MobileHeader from "@/components/tecnico/MobileHeader";
import { Loading } from "@/components/LoadingPersonalizado";
import { clientesService } from "@/api/services/clientesService";
import {
  historicoService,
  HistoricoRegistro,
} from "@/api/services/historicoService";
import type { Cliente } from "@/types/admin/cadastro/clientes";
import { formatDocumento } from "@/utils/formatters";
import {
  AlertTriangle,
  Building,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  History,
} from "lucide-react";
import { useLicenca } from "@/hooks";
import {
  ocorrenciasOSService,
  type OcorrenciaOSDetalhe,
} from "@/api/services/ocorrenciaOSService";
import StatusBadge from "@/components/tecnico/StatusBadge";

type SectionCardProps = {
  title: string;
  icon: ReactNode;
  children: ReactNode;
};

const SectionCard = ({ title, icon, children }: SectionCardProps) => (
  <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
      <span className="text-slate-500">{icon}</span>
      <span>{title}</span>
    </div>
    <div className="mt-3 space-y-3 text-sm text-slate-600">{children}</div>
  </section>
);

const InfoItem = ({ label, value }: { label: string; value?: ReactNode }) => (
  <div>
    <p className="text-[11px] uppercase tracking-wide text-slate-400">
      {label}
    </p>
    <div className="text-sm font-medium text-slate-900 break-words">
      {value ?? "-"}
    </div>
  </div>
);

const formatAddress = (cliente: Cliente | null) => {
  if (!cliente) return "";

  const partes = [
    cliente.endereco && cliente.numero
      ? `${cliente.endereco}, ${cliente.numero}`
      : cliente.endereco,
    cliente.bairro,
    cliente.cidade && cliente.uf
      ? `${cliente.cidade}/${cliente.uf}`
      : cliente.cidade,
  ];

  return partes.filter(Boolean).join(" • ");
};

const HISTORICO_PAGE_SIZE = 10;

const renderHistoricoField = (
  label: string,
  value?: string | number | null
): ReactNode => {
  const normalizedValue = value?.toString().trim();
  if (!normalizedValue) return null;

  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="text-sm text-slate-700 whitespace-pre-wrap">
        {normalizedValue}
      </div>
    </div>
  );
};

export default function ClienteDetalheTecnicoPage() {
  const router = useRouter();
  const params = useParams();
  const { licencaTipo, loading: licencaLoading } = useLicenca();
  const historicoClienteBloqueado = licencaTipo === "S";
  const rawId = params?.id;
  const normalizedId = Array.isArray(rawId) ? rawId[0] : rawId;
  const clienteId = useMemo(() => {
    if (!normalizedId) return null;
    const parsed = Number(normalizedId);
    return Number.isNaN(parsed) ? null : parsed;
  }, [normalizedId]);

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [historicoRegistros, setHistoricoRegistros] = useState<
    HistoricoRegistro[]
  >([]);
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [historicoError, setHistoricoError] = useState<string | null>(null);
  const [historicoTotalRegistros, setHistoricoTotalRegistros] = useState(0);
  const [historicoPagina, setHistoricoPagina] = useState(1);
  const [ocorrenciasPorOs, setOcorrenciasPorOs] = useState<
    Record<number, OcorrenciaOSDetalhe[]>
  >({});
  const [ocorrenciasLoading, setOcorrenciasLoading] = useState<
    Record<number, boolean>
  >({});
  const [ocorrenciasError, setOcorrenciasError] = useState<
    Record<number, string | null>
  >({});
  const [ocorrenciasExpanded, setOcorrenciasExpanded] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    let active = true;

    const loadCliente = async () => {
      if (!clienteId || historicoClienteBloqueado) {
        setError("Cliente não encontrado.");
        setCliente(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await clientesService.getById(clienteId);
        if (!active) return;
        const registros = Array.isArray(response?.dados) ? response.dados : [];
        const encontrado = registros[0] ?? null;

        if (!encontrado) {
          setError("Cliente não encontrado.");
        }

        setCliente(encontrado);
      } catch {
        if (active) {
          setError("Não foi possível carregar os dados do cliente.");
          setCliente(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCliente();

    return () => {
      active = false;
    };
  }, [clienteId, historicoClienteBloqueado, refreshKey]);

  const fetchHistorico = useCallback(async () => {
    if (!clienteId || historicoClienteBloqueado) {
      setHistoricoRegistros([]);
      setHistoricoTotalRegistros(0);
      setHistoricoError(null);
      setHistoricoLoading(false);
      return;
    }

    try {
      setHistoricoLoading(true);
      setHistoricoError(null);
      const response = await historicoService.getHistorico({
        id_cliente: clienteId,
        nro_pagina: historicoPagina,
        qtde_registros: HISTORICO_PAGE_SIZE,
      });

      setHistoricoRegistros(response?.dados ?? []);
      setHistoricoTotalRegistros(response?.total_registros ?? 0);
    } catch (fetchError) {
      console.error("Erro ao carregar historico do cliente:", fetchError);
      setHistoricoRegistros([]);
      setHistoricoTotalRegistros(0);
      setHistoricoError("Não foi possível carregar o histórico do cliente.");
    } finally {
      setHistoricoLoading(false);
    }
  }, [clienteId, historicoClienteBloqueado, historicoPagina]);

  useEffect(() => {
    if (!historicoClienteBloqueado) {
      fetchHistorico();
    }
  }, [fetchHistorico, historicoClienteBloqueado]);

  useEffect(() => {
    setHistoricoPagina(1);
  }, [clienteId]);

  useEffect(() => {
    setOcorrenciasPorOs({});
    setOcorrenciasLoading({});
    setOcorrenciasError({});
    setOcorrenciasExpanded({});
  }, [clienteId]);

  useEffect(() => {
    setOcorrenciasPorOs((prev) => {
      const next = { ...prev };

      historicoRegistros.forEach((registro) => {
        const numeroOs = Number(registro.numero_os);
        if (
          Number.isFinite(numeroOs) &&
          Array.isArray(registro.ocorrencias) &&
          registro.ocorrencias.length > 0
        ) {
          next[numeroOs] = registro.ocorrencias;
        }
      });

      return next;
    });
  }, [historicoRegistros]);

  const getOcorrenciaStatusInfo = useCallback(
    (ocorrencia: OcorrenciaOSDetalhe) => {
      const statusSource =
        ocorrencia.nova_situacao ??
        ocorrencia.situacao ??
        ocorrencia.situacao_atual;

      const codigo =
        typeof statusSource === "object" && statusSource?.codigo !== undefined
          ? statusSource.codigo
          : typeof statusSource === "number" || typeof statusSource === "string"
          ? statusSource
          : null;

      const descricao =
        (typeof statusSource === "object" && statusSource?.descricao) ||
        ocorrencia.descricao_situacao ||
        undefined;

      return {
        codigo: codigo !== null && codigo !== undefined ? String(codigo) : null,
        descricao,
      };
    },
    []
  );

  const getOcorrenciaUsuario = useCallback(
    (ocorrencia: OcorrenciaOSDetalhe) => {
      if (ocorrencia.usuario?.nome) {
        return ocorrencia.usuario.nome;
      }
      if (ocorrencia.usuario_nome) {
        return ocorrencia.usuario_nome;
      }
      if (
        typeof ocorrencia.id_usuario === "number" &&
        Number.isFinite(ocorrencia.id_usuario)
      ) {
        return `Usuario #${ocorrencia.id_usuario}`;
      }
      return "Sistema";
    },
    []
  );

  const carregarOcorrencias = useCallback(
    async (numeroOs: number, idFat?: number | null) => {
      if (!Number.isFinite(numeroOs)) return;

      setOcorrenciasLoading((prev) => ({ ...prev, [numeroOs]: true }));
      setOcorrenciasError((prev) => ({ ...prev, [numeroOs]: null }));

      try {
        const response = await ocorrenciasOSService.listarPorOS(
          numeroOs,
          idFat ?? -1
        );

        setOcorrenciasPorOs((prev) => ({
          ...prev,
          [numeroOs]: response ?? [],
        }));
      } catch (fetchError) {
        console.error("Erro ao carregar ocorrências da OS:", fetchError);
        setOcorrenciasPorOs((prev) => ({ ...prev, [numeroOs]: [] }));
        setOcorrenciasError((prev) => ({
          ...prev,
          [numeroOs]: "Não foi possível carregar as ocorrências.",
        }));
      } finally {
        setOcorrenciasLoading((prev) => ({ ...prev, [numeroOs]: false }));
      }
    },
    []
  );

  const toggleOcorrencias = useCallback(
    (
      expandKey: string,
      numeroOs: number,
      idFat?: number | null,
      inlineOcorrencias?: OcorrenciaOSDetalhe[]
    ) => {
      setOcorrenciasExpanded((prev) => {
        const willExpand = !prev[expandKey];
        const nextExpanded: Record<string, boolean> = {};

        if (willExpand) {
          if (
            inlineOcorrencias &&
            Array.isArray(inlineOcorrencias) &&
            inlineOcorrencias.length > 0
          ) {
            setOcorrenciasPorOs((current) => ({
              ...current,
              [numeroOs]: inlineOcorrencias,
            }));
          } else if (!ocorrenciasPorOs[numeroOs]) {
            void carregarOcorrencias(numeroOs, idFat);
          }

          nextExpanded[expandKey] = true;
        } else {
          nextExpanded[expandKey] = false;
        }

        return nextExpanded;
      });
    },
    [carregarOcorrencias, ocorrenciasPorOs]
  );

  const handleAbrirOsFat = useCallback(
    (numeroOs?: number, idFat?: number | null) => {
      if (!clienteId || !Number.isFinite(numeroOs)) return;

      const query = idFat ? `?fat=${idFat}` : "";
      router.push(
        `/tecnico/clientes_detalhes/${clienteId}/os/${numeroOs}${query}`
      );
    },
    [clienteId, router]
  );

  const documentoFormatado = cliente?.cnpj
    ? formatDocumento(cliente.cnpj)
    : null;
  const enderecoFormatado = formatAddress(cliente);
  const situacaoCliente = cliente?.situacao;
  const historicoTotalPaginas = Math.max(
    1,
    Math.ceil(historicoTotalRegistros / HISTORICO_PAGE_SIZE)
  );
  const historicoTemMultiplasPaginas = historicoTotalPaginas > 1;
  const isClienteAtivo = situacaoCliente === "A";
  const statusIndicatorColor = situacaoCliente
    ? isClienteAtivo
      ? "bg-emerald-500"
      : "bg-rose-500"
    : "bg-slate-400";
  const statusIndicatorTitle = situacaoCliente
    ? isClienteAtivo
      ? "Cliente ativo"
      : "Cliente inativo"
    : "Situação não informada";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <MobileHeader
        title="Detalhes do Cliente"
        onAddClick={() => router.back()}
        leftVariant="back"
      />

      <main className="px-4 py-4 space-y-4">
        {licencaLoading ? (
          <div className="flex h-[60vh] items-center justify-center">
            <Loading text="Carregando permissões..." />
          </div>
        ) : historicoClienteBloqueado ? (
          <div className="rounded-2xl border border-dashed border-amber-200 bg-white p-6 text-sm text-amber-700 shadow-sm">
            O histórico de clientes não está disponível para o seu plano atual.
          </div>
        ) : loading ? (
          <div className="flex h-[60vh] items-center justify-center">
            <Loading />
          </div>
        ) : error ? (
          <div className="space-y-3 rounded-2xl border border-rose-100 bg-rose-50 p-5 text-rose-700">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              className="w-full rounded-xl bg-white/80 px-4 py-2 text-sm font-semibold text-rose-700 ring-1 ring-rose-100 transition hover:bg-white"
            >
              Tentar novamente
            </button>
          </div>
        ) : cliente ? (
          <>
            <SectionCard
              title="Informações principais"
              icon={<Building className="h-4 w-4" />}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold text-slate-900 truncate">
                    {cliente.nome_fantasia}
                  </p>

                  <span
                    className={`h-2.5 w-2.5 rounded-full ${statusIndicatorColor}`}
                    title={statusIndicatorTitle}
                    aria-label={statusIndicatorTitle}
                  />
                </div>

                <p className="text-xs text-slate-500 truncate">
                  {cliente.razao_social}
                </p>
              </div>

              {cliente?.regiao?.nome && (
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-200/60 px-3 py-1 text-xs font-semibold text-slate-700">
                    {cliente.regiao.nome}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {documentoFormatado && (
                  <InfoItem label="CNPJ" value={documentoFormatado} />
                )}
                {cliente?.codigo_erp && (
                  <InfoItem label="Código ERP" value={cliente.codigo_erp} />
                )}
                {enderecoFormatado && (
                  <div className="col-span-2">
                    <InfoItem
                      label="Endereço completo"
                      value={enderecoFormatado}
                    />
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Histórico de atendimentos"
              icon={<CalendarDays className="h-4 w-4" />}
            >
              {historicoLoading ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50">
                  <Loading text="Buscando histórico do cliente..." />
                </div>
              ) : historicoError ? (
                <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-rose-700">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{historicoError}</span>
                  </div>
                </div>
              ) : historicoRegistros.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhum atendimento registrado para este cliente.
                </p>
              ) : (
                <>
                  <div className="space-y-0">
                    {historicoRegistros.map((registro) => {
                      const numeroOs = Number(registro.numero_os);
                      const inlineOcorrencias = registro.ocorrencias;
                      const expandKey = `${numeroOs || "os"}-${
                        registro.id_fat ?? "fat"
                      }`;
                      const ocorrencias =
                        (Array.isArray(inlineOcorrencias) &&
                        inlineOcorrencias.length > 0
                          ? inlineOcorrencias
                          : null) ??
                        (Number.isFinite(numeroOs) && ocorrenciasPorOs[numeroOs]
                          ? ocorrenciasPorOs[numeroOs]
                          : []);
                      const ocorrenciasCount = ocorrencias.length;
                      const expanded = ocorrenciasExpanded[expandKey] ?? false;
                      const ocorrenciaCarregando =
                        ocorrenciasLoading[numeroOs] ?? false;
                      const ocorrenciaErro = ocorrenciasError[numeroOs] ?? null;

                      return (
                        <article
                          key={`${registro.id_fat}-${registro.numero_os}-${registro.data_atendimento}`}
                          className="mb-3 grid gap-4 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm md:grid-cols-2"
                        >
                          {/* COLUNA ESQUERDA */}
                          <div>
                            <button
                              type="button"
                              onClick={() =>
                                handleAbrirOsFat(numeroOs, registro.id_fat)
                              }
                              disabled={
                                !clienteId || !Number.isFinite(numeroOs)
                              }
                              className="flex w-full flex-wrap items-center gap-2 border-b border-slate-100 pb-3 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <span className="font-semibold text-slate-900">
                                OS #{registro.numero_os ?? "-"}
                              </span>
                              <span className="font-semibold text-slate-900">
                                FAT #{registro.id_fat ?? "-"}
                              </span>
                              <span className="ml-auto font-semibold text-slate-900">
                                {registro.data_atendimento}
                              </span>
                            </button>

                            <div className="space-y-1 pt-2 text-sm text-slate-600">
                              <div className="flex items-center gap-2">
                                {registro.em_garantia ? (
                                  <CircleCheck className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <CircleX className="h-4 w-4 text-amber-500" />
                                )}
                                <p className="text-xs font-semibold text-slate-900">
                                  {registro.descricao_maquina ||
                                    "M?quina n?o informada"}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                                {registro.numero_serie && (
                                  <span>{registro.numero_serie}</span>
                                )}
                                {"-"}
                                <span>
                                  Ciclos: {registro.numero_ciclos ?? "-"}
                                </span>
                                {"-"}
                                <span>
                                  {registro.nome_tecnico ||
                                    "Tecnico nao informado"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* COLUNA DIREITA */}
                          <div className="grid gap-3">
                            {renderHistoricoField(
                              `Motivo do atendimento: ${
                                registro.motivo_atendimento ?? "-"
                              }`,
                              registro.descricao_problema
                            )}
                            {renderHistoricoField(
                              "Solução encontrada",
                              registro.solucao_encontrada
                            )}
                            {renderHistoricoField(
                              "Testes realizados",
                              registro.testes_realizados
                            )}
                            {renderHistoricoField(
                              "Sugestões",
                              registro.sugestoes
                            )}
                            {renderHistoricoField(
                              "Observações",
                              registro.observacoes
                            )}
                            {renderHistoricoField(
                              "Observações do técnico",
                              registro.observacoes_tecnico
                            )}
                          </div>

                          <div className="border-t border-slate-100 pt-3 md:col-span-2">
                            <button
                              type="button"
                              onClick={() =>
                                toggleOcorrencias(
                                  expandKey,
                                  numeroOs,
                                  registro.id_fat,
                                  inlineOcorrencias
                                )
                              }
                              disabled={!Number.isFinite(numeroOs)}
                              className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                              aria-expanded={expanded}
                            >
                              <span className="flex items-center gap-2">
                                <History className="h-4 w-4 text-slate-500" />
                                <span>Ocorrências ({ocorrenciasCount})</span>
                              </span>
                              <ChevronDown
                                className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                                  expanded ? "rotate-180" : ""
                                }`}
                              />
                            </button>

                            {expanded && (
                              <div className="mt-3 space-y-3">
                                {ocorrenciaCarregando ? (
                                  <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" />
                                    Carregando ocorrencias...
                                  </div>
                                ) : ocorrenciaErro ? (
                                  <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                                    {ocorrenciaErro}
                                  </div>
                                ) : ocorrenciasCount === 0 ? (
                                  <p className="text-xs text-slate-500">
                                    Nenhuma ocorrencia registrada para esta OS.
                                  </p>
                                ) : (
                                  ocorrencias.map((ocorrencia, index) => {
                                    const statusInfo =
                                      getOcorrenciaStatusInfo(ocorrencia);
                                    const dataOcorrencia =
                                      ocorrencia.data_ocorrencia;
                                    const usuarioNome =
                                      getOcorrenciaUsuario(ocorrencia);
                                    const descricaoOcorrencia =
                                      ocorrencia.descricao_ocorrencia?.trim() ||
                                      ocorrencia.ocorrencia ||
                                      "Ocorrencia sem descricao.";

                                    return (
                                      <div
                                        key={
                                          ocorrencia.id_ocorrencia ??
                                          `ocorrencia-${numeroOs}-${index}`
                                        }
                                        className="border-l-2 border-blue-200 pl-3"
                                      >
                                        <div className="flex justify-end">
                                          <span className="text-xs text-slate-500">
                                            {dataOcorrencia ||
                                              "Data indisponivel"}
                                          </span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-900 leading-snug">
                                          {descricaoOcorrencia}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                          Por: {usuarioNome}
                                        </p>
                                        {statusInfo.codigo && (
                                          <div className="mt-2">
                                            <StatusBadge
                                              status={statusInfo.codigo}
                                              descricao={statusInfo.descricao}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  {historicoTotalRegistros > 0 && (
                    <div className="mt-5 rounded-2xl border border-slate-100 bg-gradient-to-r from-white via-slate-50 to-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-wide text-slate-400">
                        <span>
                          Exibindo {historicoRegistros.length} de{" "}
                          {historicoTotalRegistros}
                        </span>
                        <span className="font-semibold text-slate-700">
                          Página {historicoPagina} de {historicoTotalPaginas}
                        </span>
                      </div>
                      {historicoTemMultiplasPaginas && (
                        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setHistoricoPagina((page) =>
                                Math.max(1, page - 1)
                              )
                            }
                            disabled={historicoPagina <= 1}
                            className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            <ChevronLeft className="h-3 w-3" />
                            Anterior
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setHistoricoPagina((page) =>
                                Math.min(historicoTotalPaginas, page + 1)
                              )
                            }
                            disabled={historicoPagina >= historicoTotalPaginas}
                            className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-700"
                          >
                            Próxima
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </SectionCard>
          </>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <p className="font-medium">
              Nenhuma informação foi encontrada para este cliente.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
