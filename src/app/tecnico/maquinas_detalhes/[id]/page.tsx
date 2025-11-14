"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  Building,
  History,
  CircleCheck,
  CircleX,
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

  useEffect(() => {
    let active = true;

    if (!maquinaId) {
      setHistoricoRegistros([]);
      setHistoricoError(null);
      setHistoricoLoading(false);

      return () => {
        active = false;
      };
    }

    setHistoricoLoading(true);
    setHistoricoError(null);

    historicoService
      .getHistorico({ id_maquina: maquinaId })
      .then((response) => {
        if (!active) return;
        setHistoricoRegistros(response.dados ?? []);
      })
      .catch(() => {
        if (!active) return;
        setHistoricoError("Não foi possível carregar o histórico da máquina.");
        setHistoricoRegistros([]);
      })
      .finally(() => {
        if (active) {
          setHistoricoLoading(false);
        }
      });

    return () => {
      active = false;
    };
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

  const garantiaLabel = maquinaParaExibir?.garantia
    ? "Em garantia"
    : "Garantia encerrada";

  const shouldShowLoading = loading && !prefetchedMaquina;

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
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-base font-semibold text-slate-900">
                  {maquinaParaExibir.numero_serie}
                </p>
                <p className="text-sm text-slate-500">
                  {maquinaParaExibir.descricao}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <InfoItem
                  label="Modelo"
                  value={
                    maquinaParaExibir.modelo &&
                    maquinaParaExibir.modelo.trim() !== ""
                      ? maquinaParaExibir.modelo
                      : "N/A"
                  }
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {situacaoLabel && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      maquinaParaExibir?.situacao === "A"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {situacaoLabel}
                  </span>
                )}
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    maquinaParaExibir?.garantia
                      ? "bg-sky-50 text-sky-700"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {garantiaLabel}
                </span>
              </div>
            </SectionCard>

            {maquinaParaExibir?.cliente_atual && (
              <SectionCard
                title="Cliente atual"
                icon={<Building className="h-4 w-4" />}
              >
                <div className="rounded-2xl border border-slate-100 p-3">
                  <p className="font-semibold text-slate-900">
                    {maquinaParaExibir.cliente_atual?.nome_fantasia}
                  </p>
                  {maquinaParaExibir.cliente_atual?.razao_social && (
                    <p className="text-sm text-slate-600 mt-1">
                      {maquinaParaExibir.cliente_atual?.razao_social}
                    </p>
                  )}
                </div>
              </SectionCard>
            )}

            {maquinaParaExibir?.observacoes && (
              <SectionCard
                title="Observações da Máquina"
                icon={<FileText className="h-4 w-4" />}
              >
                <p className="text-sm leading-relaxed text-slate-700">
                  {maquinaParaExibir.observacoes}
                </p>
              </SectionCard>
            )}

            {/* Seção de Histórico */}
            <SectionCard
              title="Histórico de Atendimentos"
              icon={<History className="h-4 w-4" />}
            >
              {historicoLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loading />
                </div>
              ) : historicoError ? (
                <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-rose-700">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{historicoError}</span>
                  </div>
                </div>
              ) : historicoRegistros.length > 0 ? (
                <div className="space-y-3">
                  {historicoRegistros.map((registro) => (
                    <div
                      key={registro.id_fat}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">
                            OS #{registro.numero_os} - FAT #{registro.id_fat}
                          </p>
                          <p className="text-sm text-slate-500">
                            {formatDateOnly(registro.data_atendimento)} -{" "}
                            {registro.nome_tecnico}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {registro.em_garantia ? (
                            <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                              <CircleCheck className="h-3 w-3" />
                              Garantia
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                              <CircleX className="h-3 w-3" />
                              Sem garantia
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <InfoItem
                          label={`Motivo do atendimento: ${
                            registro.motivo_atendimento ?? "-"
                          }`}
                          value={registro.descricao_problema}
                        />
                        {registro.solucao_encontrada && (
                          <InfoItem
                            label="Solução encontrada"
                            value={registro.solucao_encontrada}
                          />
                        )}
                        {registro.testes_realizados && (
                          <InfoItem
                            label="Testes realizados"
                            value={registro.testes_realizados}
                          />
                        )}
                        {registro.numero_ciclos > 0 && (
                          <InfoItem
                            label="Número de ciclos"
                            value={registro.numero_ciclos.toLocaleString()}
                          />
                        )}
                        {registro.observacoes && (
                          <InfoItem
                            label="Observações"
                            value={registro.observacoes}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-slate-500">
                  <History className="mx-auto mb-2 h-8 w-8" />
                  <p className="text-sm font-medium">
                    Nenhum histórico de atendimento encontrado
                  </p>
                  <p className="text-xs">
                    Esta máquina ainda não possui registros de atendimento
                  </p>
                </div>
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
