"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PageHeader from "@/components/admin/ui/PageHeader";
import { Loading } from "@/components/LoadingPersonalizado";
import Pagination from "@/components/admin/ui/Pagination";
import { useToast } from "@/components/admin/ui/ToastContainer";
import { maquinasService } from "@/api/services/maquinasService";
import {
  historicoService,
  HistoricoRegistro,
} from "@/api/services/historicoService";
import type { Maquina } from "@/types/admin/cadastro/maquinas";
import {
  AlertCircle,
  CalendarDays,
  FileText,
  Settings,
  ShieldCheck,
  Tag,
} from "lucide-react";

const HISTORICO_PAGE_SIZE_OPTIONS = [10, 25, 50];
const DEFAULT_HISTORICO_PAGE_SIZE = 50;

const situacaoStyles: Record<string, { label: string; className: string }> = {
  A: {
    label: "Ativa",
    className: "bg-emerald-50 border-emerald-100 text-emerald-700",
  },
  I: {
    label: "Inativa",
    className: "bg-rose-50 border-rose-100 text-rose-700",
  },
};

const formatDateOnly = (value?: string | null) => {
  if (!value) return "-";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.split("T")[0].split("-");
    return `${day}/${month}/${year}`;
  }
  return value;
};

const formatClienteEndereco = (cliente?: MaquinaDetalhe["cliente_atual"]) => {
  if (!cliente) return null;
  const linha1 = [cliente.endereco, cliente.numero]
    .filter(Boolean)
    .join(", ");
  const linha2 = [
    cliente.bairro,
    cliente.cidade && cliente.uf ? `${cliente.cidade}/${cliente.uf}` : cliente.cidade,
  ]
    .filter(Boolean)
    .join(" • ");
  const cep = cliente.cep?.trim();

  return [linha1, linha2, cep].filter(Boolean).join(" • ") || null;
};

const formatNumber = (value: number | undefined | null) => {
  if (value === undefined || value === null) return 0;
  return new Intl.NumberFormat("pt-BR").format(value);
};

const parseDateValue = (value?: string | null) => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return new Date(value.split("T")[0]);
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split("/");
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

type MaquinaDetalhe = Partial<Maquina> & {
  id_maquina?: number;
  id_cliente_atual?: number;
  numero_patrimonio?: string;
  data_instalacao?: string;
  cliente_atual?: {
    id_cliente?: number;
    nome_fantasia?: string;
    razao_social?: string;
    cidade?: string;
    uf?: string;
    telefone?: string;
    email?: string;
    endereco?: string;
    numero?: string;
    bairro?: string;
    cep?: string;
  };
};
const MaquinaDetalhesPage = () => {
  const params = useParams();
  const { showError } = useToast();

  const rawId = params?.id;
  const normalizedId = Array.isArray(rawId) ? rawId[0] : rawId;
  const maquinaIdParam = normalizedId ?? null;
  const maquinaIdNumber = useMemo(() => {
    if (!normalizedId) return null;
    const parsed = Number(normalizedId);
    return Number.isNaN(parsed) ? null : parsed;
  }, [normalizedId]);

  const [maquina, setMaquina] = useState<MaquinaDetalhe | null>(null);
  const [maquinaLoading, setMaquinaLoading] = useState(true);
  const [maquinaError, setMaquinaError] = useState<string | null>(null);

  const [historicoRegistros, setHistoricoRegistros] = useState<
    HistoricoRegistro[]
  >([]);
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [historicoError, setHistoricoError] = useState<string | null>(null);
  const [historicoPagina, setHistoricoPagina] = useState(1);
  const [historicoPageSize, setHistoricoPageSize] = useState(
    DEFAULT_HISTORICO_PAGE_SIZE
  );
  const [historicoTotalPaginas, setHistoricoTotalPaginas] = useState(1);
  const [historicoTotalRegistros, setHistoricoTotalRegistros] = useState(0);

  const fetchMaquina = useCallback(async () => {
    const requestId: number | string | null = maquinaIdNumber ?? maquinaIdParam;
    if (!requestId) {
      setMaquina(null);
      setMaquinaError("Identificador da maquina invalido.");
      setMaquinaLoading(false);
      return;
    }

    try {
      setMaquinaLoading(true);
      setMaquinaError(null);
      const response = await maquinasService.getById(requestId);
      const dados = (response as { dados?: MaquinaDetalhe[] })?.dados;
      const maquinaEncontrada = Array.isArray(dados)
        ? dados[0]
        : (response as MaquinaDetalhe | undefined);

      if (!maquinaEncontrada) {
        setMaquina(null);
        setMaquinaError("Maquina nao encontrada.");
        return;
      }

      setMaquina(maquinaEncontrada);
    } catch (error) {
      console.error("Erro ao carregar maquina:", error);
      setMaquina(null);
      setMaquinaError("Nao foi possivel carregar os dados da maquina.");
      showError(
        "Erro ao carregar maquina",
        "Verifique sua conexao e tente novamente."
      );
    } finally {
      setMaquinaLoading(false);
    }
  }, [maquinaIdNumber, maquinaIdParam, showError]);

  const fetchHistorico = useCallback(async () => {
    if (!maquinaIdNumber) {
      setHistoricoRegistros([]);
      setHistoricoTotalPaginas(1);
      setHistoricoTotalRegistros(0);
      setHistoricoLoading(false);
      setHistoricoError("Nao foi possivel carregar o historico desta maquina.");
      return;
    }

    try {
      setHistoricoLoading(true);
      setHistoricoError(null);
      const response = await historicoService.getHistorico({
        id_maquina: maquinaIdNumber,
        nro_pagina: historicoPagina,
        qtde_registros: historicoPageSize,
      });

      setHistoricoRegistros(response?.dados ?? []);
      setHistoricoTotalRegistros(response?.total_registros ?? 0);
      setHistoricoTotalPaginas(Math.max(response?.total_paginas ?? 1, 1));
    } catch (error) {
      console.error("Erro ao carregar historico da maquina:", error);
      setHistoricoRegistros([]);
      setHistoricoTotalRegistros(0);
      setHistoricoTotalPaginas(1);
      setHistoricoError("Nao foi possivel carregar o historico desta maquina.");
    } finally {
      setHistoricoLoading(false);
    }
  }, [maquinaIdNumber, historicoPagina, historicoPageSize]);

  useEffect(() => {
    fetchMaquina();
  }, [fetchMaquina]);

  useEffect(() => {
    fetchHistorico();
  }, [fetchHistorico]);

  const handleHistoricoPageChange = (page: number) => {
    if (page === historicoPagina) return;
    const nextPage = Math.min(
      Math.max(page, 1),
      Math.max(historicoTotalPaginas, 1)
    );
    setHistoricoPagina(nextPage);
  };

  const handleHistoricoPageSizeChange = (size: number) => {
    setHistoricoPagina(1);
    setHistoricoPageSize(size);
  };

  const clienteAtualId =
    maquina?.cliente_atual?.id_cliente ?? maquina?.id_cliente_atual ?? null;
  const clienteNomeFantasia = maquina?.cliente_atual?.nome_fantasia?.trim();
  const clienteRazaoSocial = maquina?.cliente_atual?.razao_social?.trim();
  const clienteNomeExibicao =
    clienteNomeFantasia ||
    clienteRazaoSocial ||
    (clienteAtualId
      ? `Cliente #${clienteAtualId}`
      : "Cliente nao identificado");
  const clienteRazaoExibicao =
    clienteRazaoSocial && clienteRazaoSocial !== clienteNomeExibicao
      ? clienteRazaoSocial
      : null;
  const clienteEnderecoCompleto = useMemo(
    () => formatClienteEndereco(maquina?.cliente_atual ?? undefined),
    [maquina?.cliente_atual]
  );

  const headerActions =
    maquinaIdParam !== null ? (
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/cadastro/maquinas/editar/${maquinaIdParam}`}
          className="inline-flex items-center gap-2 rounded-2xl border border-transparent bg-gradient-to-r from-[var(--primary)] to-[#6541D3] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[var(--primary)]/20 transition hover:opacity-90"
        >
          Editar maquina
        </Link>
      </div>
    ) : undefined;

  const situacaoInfo = useMemo(() => {
    if (maquina?.situacao && situacaoStyles[maquina.situacao]) {
      return situacaoStyles[maquina.situacao];
    }
    return {
      label: maquina?.situacao || "Nao informado",
      className: "bg-slate-100 border-slate-200 text-slate-600",
    };
  }, [maquina?.situacao]);

  const garantiaExpirationDate = parseDateValue(maquina?.data_final_garantia);
  const garantiaAtiva = useMemo(() => {
    if (maquina?.garantia) return true;
    if (!garantiaExpirationDate) return false;
    return garantiaExpirationDate >= new Date();
  }, [maquina?.garantia, garantiaExpirationDate]);

  const diasRestantesGarantia = useMemo(() => {
    if (!garantiaExpirationDate) return null;
    const diff =
      garantiaExpirationDate.getTime() - new Date().setHours(0, 0, 0, 0);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [garantiaExpirationDate]);

  const highlightItems = useMemo(
    () =>
      [
        {
          label: "Número de série",
          value: maquina?.numero_serie,
          icon: Tag,
        },
        {
          label: "Modelo",
          value: maquina?.modelo,
          icon: Settings,
        },
        {
          label: "Nota fiscal de venda",
          value: maquina?.nota_fiscal_venda,
          icon: FileText,
        },
        {
          label: "1° venda",
          value: maquina?.data_1a_venda
            ? formatDateOnly(maquina.data_1a_venda)
            : null,
          icon: CalendarDays,
        },
      ].filter((item) => Boolean(item.value)),
    [
      maquina?.data_1a_venda,
      maquina?.modelo,
      maquina?.nota_fiscal_venda,
      maquina?.numero_serie,
    ]
  );
  const renderEmptyState = (message: string) => (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-white to-slate-50 px-6 py-8 text-center">
      <AlertCircle className="h-5 w-5 text-slate-400" />
      <p className="text-sm text-slate-600">{message}</p>
    </div>
  );

  const renderHistoricoField = (
    label: string,
    value?: string | number | null,
    options?: { variant?: "success" | "danger" | "default" }
  ) => {
    if (!value) return null;

    const variant = options?.variant ?? "default";
    const { containerClasses, textClasses } = (() => {
      switch (variant) {
        case "success":
          return {
            containerClasses: "border-emerald-100 bg-emerald-50/80",
            textClasses: "text-emerald-700",
          };
        case "danger":
          return {
            containerClasses: "border-rose-100 bg-rose-50",
            textClasses: "text-rose-700",
          };
        default:
          return {
            containerClasses: "border-slate-100 bg-slate-50",
            textClasses: "text-slate-700",
          };
      }
    })();

    return (
      <div className={`rounded-lg border p-3 ${containerClasses}`}>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p
          className={`mt-1 text-sm leading-relaxed whitespace-pre-line ${textClasses}`}
        >
          {value}
        </p>
      </div>
    );
  };

  const renderHistoricoTab = () => {
    if (historicoLoading) {
      return (
        <div className="rounded-2xl border border-slate-100 bg-slate-50">
          <Loading text="Buscando historico da maquina..." />
        </div>
      );
    }

    if (historicoError) {
      return (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{historicoError}</p>
          </div>
        </div>
      );
    }

    if (historicoRegistros.length === 0) {
      return renderEmptyState(
        "Ainda não existem atendimentos registrados para esta máquina."
      );
    }

    return (
      <>
        <div className="space-y-3">
          {historicoRegistros.map((registro) => (
            <div
              key={`${registro.id_fat}-${registro.numero_os}-${registro.data_atendimento}`}
              className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3 text-sm text-slate-700">
                <span className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  OS #{registro.numero_os ?? "-"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  FAT #{registro.id_fat ?? "-"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                  Atendimento: {formatDateOnly(registro.data_atendimento)}
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-800">
                  {registro.descricao_maquina ||
                    registro.nome_cliente ||
                    "Cliente / maquina nao informados"}
                </span>
                {registro.numero_serie && (
                  <span className="text-sm text-slate-500">
                    / {registro.numero_serie}
                  </span>
                )}
                <span className="ml-auto text-sm font-semibold text-slate-900 whitespace-nowrap">
                  {registro.nome_tecnico || "Tecnico nao informado"}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-[0.9fr,1.1fr]">
                <div className="grid gap-3 sm:grid-cols-2">
                  {renderHistoricoField(
                    registro.motivo_atendimento
                      ? `Motivo do atendimento: ${registro.motivo_atendimento}`
                      : "Motivo do atendimento",
                    registro.motivo_atendimento
                  )}
                  {renderHistoricoField(
                    "Descricao do problema",
                    registro.descricao_problema,
                    { variant: "danger" }
                  )}
                  {renderHistoricoField(
                    "Solucao encontrada",
                    registro.solucao_encontrada,
                    { variant: "success" }
                  )}
                  {renderHistoricoField(
                    "Testes realizados",
                    registro.testes_realizados
                  )}
                  {renderHistoricoField("Sugestoes", registro.sugestoes)}
                  {renderHistoricoField("Observacoes", registro.observacoes)}
                </div>
                <div className="grid gap-3">
                  {renderHistoricoField(
                    "Observacoes do tecnico",
                    registro.observacoes_tecnico
                  )}
                  {renderHistoricoField(
                    "Observacoes da revisao",
                    registro.observacoes_revisao
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Pagination
            currentPage={historicoPagina}
            totalPages={Math.max(historicoTotalPaginas, 1)}
            totalRecords={historicoTotalRegistros}
            recordsPerPage={historicoPageSize}
            onPageChange={handleHistoricoPageChange}
            onRecordsPerPageChange={handleHistoricoPageSizeChange}
            recordsPerPageOptions={HISTORICO_PAGE_SIZE_OPTIONS}
            showRecordsPerPage
          />
        </div>
      </>
    );
  };
  return (
    <div>
      <PageHeader
        title="Detalhes da Maquina"
        config={{
          type: "form",
          useBackNavigation: true,
          backLabel: "Voltar para tela anterior",
          actions: headerActions,
        }}
      />

      {maquinaLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <Loading text="Carregando dados da maquina..." />
        </div>
      ) : maquina && !maquinaError ? (
        <div className="space-y-6">
          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-transparent bg-gradient-to-br from-white via-white to-violet-50 p-6 shadow-lg ring-1 ring-violet-100 lg:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">Maquina</p>
                  <h2 className="text-3xl font-semibold text-slate-900">
                    {maquina.descricao || maquina.modelo || "Maquina"}
                  </h2>
                  {maquina.numero_serie && (
                    <p className="text-sm text-slate-500">
                      No de serie: {maquina.numero_serie}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${situacaoInfo.className}`}
                  >
                    {situacaoInfo.label}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {highlightItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-inner shadow-white/40"
                    >
                      <span className="rounded-2xl bg-white p-2 shadow">
                        <Icon className="h-4 w-4 text-[var(--primary)]" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {item.label}
                        </p>
                        <p className="text-sm font-medium text-slate-900">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white/70 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Endere�o completo
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {clienteEnderecoCompleto || "Endere�o n�o informado"}
                </p>
              </div>

              <div className="mt-6 rounded-2xl bg-white/70 p-4 shadow-inner">
                <p className="text-sm font-semibold text-slate-700">
                  Cliente atual
                </p>
                {clienteAtualId ? (
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <div className="flex flex-col">
                      <span className="text-base font-semibold text-slate-900">
                        {clienteNomeExibicao}
                      </span>
                      {clienteRazaoExibicao && (
                        <span className="text-xs text-slate-500">
                          {clienteRazaoExibicao}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    Nenhum cliente esta vinculado a esta maquina no momento.
                  </p>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-transparent bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-lg ring-1 ring-slate-100">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Status da garantia
                  </p>
                  <p className="text-sm text-slate-500">
                    Acompanhe o ciclo de vida da máquina
                  </p>
                </div>
                <ShieldCheck
                  className={`h-8 w-8 ${
                    garantiaAtiva ? "text-emerald-500" : "text-slate-300"
                  }`}
                />
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Situação
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {garantiaAtiva ? "Máquina em Garantia" : "Fora da Garantia"}
                </p>
                {maquina?.data_final_garantia && (
                  <p className="text-xs text-slate-500">
                    Valida até {formatDateOnly(maquina.data_final_garantia)}
                  </p>
                )}
                {diasRestantesGarantia !== null && (
                  <p className="text-xs text-slate-500">
                    {diasRestantesGarantia > 0
                      ? `${diasRestantesGarantia} dia(s) restante(s)`
                      : "Garantia vencida"}
                  </p>
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Observações
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {maquina?.observacoes?.trim()
                    ? maquina.observacoes
                    : "Nenhuma observacao foi registrada para esta maquina."}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl ring-1 ring-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                  Dados vinculados a máquina
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Histórico de atendimentos
                </p>
                <p className="text-xs text-slate-500">
                  {formatNumber(historicoTotalRegistros)} registro(s)
                  encontrados
                </p>
              </div>
            </div>

            <div className="mt-6">{renderHistoricoTab()}</div>
          </section>
        </div>
      ) : (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-6 py-5 text-rose-700">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">
              {maquinaError || "Não foi possível carregar esta máquina."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaquinaDetalhesPage;
