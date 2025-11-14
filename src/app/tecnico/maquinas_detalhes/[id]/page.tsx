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
import { maquinasService } from "@/api/services/maquinasService";
import {
  historicoService,
  type HistoricoRegistro,
} from "@/api/services/historicoService";
import type { Maquina } from "@/types/admin/cadastro/maquinas";
import { MAQUINA_PREVIEW_CACHE_KEY } from "@/constants/storageKeys";
import {
  AlertTriangle,
  Settings,
  FileText,
  History,
  CircleCheck,
  CircleX,
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
    <div className="text-sm font-medium text-slate-900 whitespace-pre-wrap">
      {value ?? "-"}
    </div>
  </div>
);

const formatDateOnly = (value?: string | null) => {
  if (!value) return "-";
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.split("T")[0].split("-");
    return `${day}/${month}/${year}`;
  }
  return value;
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

export default function MaquinaDetalheTecnicoPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const normalizedId = Array.isArray(rawId) ? rawId[0] : rawId;
  const maquinaId = useMemo(() => {
    if (!normalizedId) return null;
    const parsed = Number(normalizedId);
    return Number.isNaN(parsed) ? null : parsed;
  }, [normalizedId]);

  const [maquina, setMaquina] = useState<Maquina | null>(null);
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
  const [prefetchedMaquina, setPrefetchedMaquina] =
    useState<Partial<Maquina> | null>(null);

  useEffect(() => {
    let active = true;

    const loadMaquina = async () => {
      if (!maquinaId) {
        setError("Máquina não encontrada.");
        setMaquina(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await maquinasService.getById(maquinaId);
        if (!active) return;
        setMaquina(response ?? null);
      } catch {
        if (active) {
          setError("Não foi possível carregar as informações da máquina.");
          setMaquina(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadMaquina();

    return () => {
      active = false;
    };
  }, [maquinaId, refreshKey]);

  const fetchHistorico = useCallback(async () => {
    if (!maquinaId) {
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
        id_maquina: maquinaId,
        nro_pagina: historicoPagina,
        qtde_registros: HISTORICO_PAGE_SIZE,
      });

      setHistoricoRegistros(response?.dados ?? []);
      setHistoricoTotalRegistros(response?.total_registros ?? 0);
    } catch (fetchError) {
      console.error("Erro ao carregar historico da maquina:", fetchError);
      setHistoricoRegistros([]);
      setHistoricoTotalRegistros(0);
      setHistoricoError("Não foi possível carregar o histórico da máquina.");
    } finally {
      setHistoricoLoading(false);
    }
  }, [maquinaId, historicoPagina]);

  useEffect(() => {
    fetchHistorico();
  }, [fetchHistorico]);

  useEffect(() => {
    setHistoricoPagina(1);
  }, [maquinaId]);

  useEffect(() => {
    if (!maquinaId || typeof window === "undefined") {
      setPrefetchedMaquina(null);
      return;
    }

    try {
      const storedValue = window.localStorage.getItem(
        `${MAQUINA_PREVIEW_CACHE_KEY}_${maquinaId}`
      );

      if (storedValue) {
        setPrefetchedMaquina(JSON.parse(storedValue) as Partial<Maquina>);
      } else {
        setPrefetchedMaquina(null);
      }
    } catch (previewError) {
      console.error("Erro ao carregar preview de mǭquina:", previewError);
      setPrefetchedMaquina(null);
    }
  }, [maquinaId]);

  const maquinaParaExibir = maquina ?? prefetchedMaquina;

  const situacaoLabel =
    maquinaParaExibir?.situacao === "A"
      ? "Máquina ativa"
      : maquinaParaExibir?.situacao === "I"
      ? "Máquina inativa"
      : maquinaParaExibir?.situacao;

  const shouldShowLoading = loading && !prefetchedMaquina;
  const historicoTotalPaginas = Math.max(
    1,
    Math.ceil(historicoTotalRegistros / HISTORICO_PAGE_SIZE)
  );
  const historicoTemMultiplasPaginas = historicoTotalPaginas > 1;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <MobileHeader
        title="Detalhes da Máquina"
        onAddClick={() => router.back()}
        leftVariant="back"
      />

      <main className="px-4 py-4 space-y-4">
        {shouldShowLoading ? (
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
        ) : maquinaParaExibir ? (
          <>
            <SectionCard
              title="Informações principais"
              icon={<Settings className="h-4 w-4" />}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold text-slate-900 truncate">
                    {maquinaParaExibir.numero_serie}
                  </p>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      maquinaParaExibir?.situacao === "A"
                        ? "bg-emerald-500"
                        : maquinaParaExibir?.situacao === "I"
                        ? "bg-rose-500"
                        : "bg-slate-400"
                    }`}
                    title={situacaoLabel}
                    aria-label={situacaoLabel}
                  />
                  <div className="flex items-start ml-auto mt-[-6px]">
                    {maquinaParaExibir?.garantia ? (
                      <CircleCheck
                        className="w-5 h-5 text-emerald-500"
                        aria-label="Em garantia"
                      />
                    ) : (
                      <CircleX
                        className="w-5 h-5 text-amber-500"
                        aria-label="Garantia vencida"
                      />
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {maquinaParaExibir.descricao}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InfoItem
                  label="Modelo"
                  value={
                    maquinaParaExibir.modelo &&
                    maquinaParaExibir.modelo.trim() !== ""
                      ? maquinaParaExibir.modelo
                      : "N/A"
                  }
                />
                {maquinaParaExibir?.data_1a_venda && (
                  <InfoItem
                    label="Data 1ª Venda"
                    value={formatDateOnly(maquinaParaExibir.data_1a_venda)}
                  />
                )}
              </div>

              {(maquinaParaExibir?.nota_fiscal_venda ||
                maquinaParaExibir?.data_final_garantia) && (
                <div className="grid grid-cols-2 gap-3">
                  {maquinaParaExibir?.nota_fiscal_venda && (
                    <InfoItem
                      label="Nota Fiscal Venda"
                      value={maquinaParaExibir.nota_fiscal_venda}
                    />
                  )}
                  {maquinaParaExibir?.data_final_garantia && (
                    <InfoItem
                      label="Data Final Garantia"
                      value={formatDateOnly(
                        maquinaParaExibir.data_final_garantia
                      )}
                    />
                  )}
                </div>
              )}

              {(maquinaParaExibir?.cliente_atual?.nome_fantasia ||
                maquinaParaExibir?.cliente_atual?.razao_social) && (
                <div className="grid grid-cols-1 gap-3">
                  {maquinaParaExibir?.cliente_atual?.razao_social && (
                    <InfoItem
                      label="Razão Social"
                      value={maquinaParaExibir.cliente_atual.razao_social}
                    />
                  )}
                </div>
              )}
            </SectionCard>

            {maquinaParaExibir?.observacoes && (
              <SectionCard
                title="Observações da Máquina"
                icon={<FileText className="h-4 w-4" />}
              >
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {maquinaParaExibir.observacoes}
                  </p>
                </div>
              </SectionCard>
            )}

            <SectionCard
              title="Histórico de atendimentos"
              icon={<History className="h-4 w-4" />}
            >
              {historicoLoading ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50">
                  <Loading text="Buscando histórico da máquina..." />
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
                  Nenhum atendimento registrado para esta máquina.
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
                            <span className="ml-auto font-semibold text-slate-900">
                              {registro.data_atendimento}
                            </span>
                          </div>

                          <div className="pt-2 text-sm text-slate-600">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              {/* ESQUERDA: Técnico + Ciclos */}
                              <div className="flex items-center gap-3">
                                <span>
                                  Ciclos: {registro.numero_ciclos ?? "-"}
                                </span>

                                <span className="text-slate-400">•</span>

                                <span>
                                  {registro.nome_tecnico ||
                                    "Técnico não informado"}
                                </span>
                              </div>

                              {/* DIREITA: Ícone de garantia */}
                              <div>
                                {registro.em_garantia ? (
                                  <CircleCheck
                                    className="w-4 h-4 text-emerald-500"
                                    aria-label="Em garantia"
                                  />
                                ) : (
                                  <CircleX
                                    className="w-4 h-4 text-amber-500"
                                    aria-label="Garantia vencida"
                                  />
                                )}
                              </div>
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
                            "Observações",
                            registro.observacoes
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
              Nenhuma informação foi encontrada para esta máquina.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
