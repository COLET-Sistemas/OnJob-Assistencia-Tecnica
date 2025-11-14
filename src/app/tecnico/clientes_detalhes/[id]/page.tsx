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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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

  useEffect(() => {
    let active = true;

    const loadCliente = async () => {
      if (!clienteId) {
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
  }, [clienteId, refreshKey]);

  const fetchHistorico = useCallback(async () => {
    if (!clienteId) {
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
      setHistoricoError("Nao foi possivel carregar o historico do cliente.");
    } finally {
      setHistoricoLoading(false);
    }
  }, [clienteId, historicoPagina]);

  useEffect(() => {
    fetchHistorico();
  }, [fetchHistorico]);

  useEffect(() => {
    setHistoricoPagina(1);
  }, [clienteId]);

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
        {loading ? (
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
                    {historicoRegistros.map((registro) => (
                      <article
                        key={`${registro.id_fat}-${registro.numero_os}-${registro.data_atendimento}`}
                        className="mb-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm
             grid gap-4 md:grid-cols-2"
                      >
                        {/* COLUNA ESQUERDA */}
                        <div>
                          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3 text-sm text-slate-700">
                            <span className="font-semibold text-slate-900">
                              OS #{registro.numero_os ?? "-"}
                            </span>
                            <span className="font-semibold text-slate-900">
                              FAT #{registro.id_fat ?? "-"}
                            </span>
                            <span className="font-semibold text-slate-900">
                              {registro.data_atendimento}
                            </span>
                            <span className="ml-auto text-xs  text-slate-500">
                              {registro.nome_tecnico || "Tecnico nao informado"}
                            </span>
                          </div>

                          <div className="space-y-1 pt-2 text-sm text-slate-600">
                            <p className="text-xs font-semibold text-slate-900">
                              {registro.descricao_maquina ||
                                "Máquina não informada"}
                            </p>
                            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                              {registro.numero_serie && (
                                <span>Série: {registro.numero_serie}</span>
                              )}
                              <span>
                                Ciclos: {registro.numero_ciclos ?? "-"}
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
                      </article>
                    ))}
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
