"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import PageHeader from "@/components/admin/ui/PageHeader";
import { clientesService } from "@/api/services/clientesService";
import {
  HistoricoRegistro,
  historicoService,
} from "@/api/services/historicoService";
import type { Cliente } from "@/types/admin/cadastro/clientes";
import { Loading } from "@/components/LoadingPersonalizado";
import { useToast } from "@/components/admin/ui/ToastContainer";
import Pagination from "@/components/admin/ui/Pagination";
import { formatDocumento } from "@/utils/formatters";
import { formatarCEP } from "@/utils/cepAPI";
import {
  AlertCircle,
  Bell,
  BellOff,
  CalendarDays,
  History,
  Settings,
  Mail,
  CircleCheck,
  CircleX,
  MessageCircle,
  Phone,
  ShieldCheck,
  Users,
} from "lucide-react";

const HISTORICO_PAGE_SIZE_OPTIONS = [10, 25, 50];
const DEFAULT_HISTORICO_PAGE_SIZE = 25;

type TabKey = "contatos" | "maquinas" | "historico";

const isValidTabKey = (value: string | null): value is TabKey =>
  value === "contatos" || value === "maquinas" || value === "historico";

const resolveTabFromParam = (value: string | null): TabKey =>
  isValidTabKey(value) ? value : "contatos";

const situacaoStyles: Record<string, { label: string; className: string }> = {
  A: {
    label: "Ativo",
    className: "bg-emerald-50 border-emerald-100 text-emerald-700",
  },
  I: {
    label: "Inativo",
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

const formatNumber = (value: number | undefined | null) => {
  if (value === undefined || value === null) return "-";
  return new Intl.NumberFormat("pt-BR").format(value);
};

const normalizePhoneForTel = (value?: string | null) => {
  if (!value) return "";
  return value.replace(/[^\d+]/g, "");
};

const buildTelHref = (value?: string | null) => {
  const normalized = normalizePhoneForTel(value);
  return normalized ? `tel:${normalized}` : null;
};

const buildWhatsAppHref = (value?: string | null) => {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
};

const ClientesDetalhesPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const { showError } = useToast();
  const rawId = params?.id;
  const normalizedId = Array.isArray(rawId) ? rawId[0] : rawId;
  const clienteId = useMemo(() => {
    if (!normalizedId) return null;
    const parsed = Number(normalizedId);
    return Number.isNaN(parsed) ? null : parsed;
  }, [normalizedId]);

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [clienteLoading, setClienteLoading] = useState(true);
  const [clienteError, setClienteError] = useState<string | null>(null);

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

  const [activeTab, setActiveTab] = useState<TabKey>(() =>
    resolveTabFromParam(searchParams?.get("tab") ?? null)
  );

  useEffect(() => {
    const tabParam = searchParams?.get("tab") ?? null;
    if (isValidTabKey(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const fetchCliente = useCallback(async () => {
    if (!clienteId) {
      setCliente(null);
      setClienteError("Identificador do cliente inválido.");
      setClienteLoading(false);
      return;
    }

    try {
      setClienteLoading(true);
      setClienteError(null);
      const response = await clientesService.getById(clienteId);
      const clienteEncontrado = response?.dados?.[0];

      if (!clienteEncontrado) {
        setCliente(null);
        setClienteError("Cliente não encontrado.");
        return;
      }

      setCliente(clienteEncontrado);
    } catch (error) {
      console.error("Erro ao carregar cliente:", error);
      setCliente(null);
      setClienteError("Não foi possível carregar os dados do cliente.");
      showError(
        "Erro ao carregar cliente",
        "Tente novamente em alguns instantes."
      );
    } finally {
      setClienteLoading(false);
    }
  }, [clienteId, showError]);

  const fetchHistorico = useCallback(async () => {
    if (!clienteId) {
      setHistoricoRegistros([]);
      setHistoricoTotalPaginas(1);
      setHistoricoTotalRegistros(0);
      setHistoricoLoading(false);
      setHistoricoError(
        "Não foi possível carregar o histórico para este cliente."
      );
      return;
    }

    try {
      setHistoricoLoading(true);
      setHistoricoError(null);
      const response = await historicoService.getHistorico({
        id_cliente: clienteId,
        nro_pagina: historicoPagina,
        qtde_registros: historicoPageSize,
      });

      setHistoricoRegistros(response?.dados ?? []);
      setHistoricoTotalRegistros(response?.total_registros ?? 0);
      setHistoricoTotalPaginas(Math.max(response?.total_paginas ?? 1, 1));
    } catch (error) {
      console.error("Erro ao carregar histórico do cliente:", error);
      setHistoricoRegistros([]);
      setHistoricoTotalRegistros(0);
      setHistoricoTotalPaginas(1);
      setHistoricoError("Não foi possível carregar o histórico deste cliente.");
    } finally {
      setHistoricoLoading(false);
    }
  }, [clienteId, historicoPagina, historicoPageSize]);

  useEffect(() => {
    fetchCliente();
  }, [fetchCliente]);

  useEffect(() => {
    fetchHistorico();
  }, [fetchHistorico]);

  const totalContatos =
    cliente?.qtd_contatos ??
    (cliente?.contatos ? cliente.contatos.length : undefined) ??
    0;
  const totalMaquinas =
    cliente?.qtd_maquinas ??
    (cliente?.maquinas ? cliente.maquinas.length : undefined) ??
    0;

  const headerActions =
    cliente && cliente.id_cliente ? (
      <Link
        href={`/admin/cadastro/clientes/editar/${cliente.id_cliente}`}
        className="inline-flex items-center gap-2 rounded-2xl border border-transparent bg-gradient-to-r from-[var(--primary)] to-[#6541D3] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[var(--primary)]/20 transition hover:opacity-90"
      >
        Editar cliente
      </Link>
    ) : undefined;

  const enderecoPrincipal = useMemo(() => {
    if (!cliente) return "";
    const partes = [
      cliente.endereco,
      cliente.numero,
      cliente.bairro,
      cliente.cidade && cliente.uf ? `${cliente.cidade} - ${cliente.uf}` : "",
    ].filter(Boolean);
    return partes.join(", ");
  }, [cliente]);

  const situacaoInfo =
    cliente?.situacao && situacaoStyles[cliente.situacao]
      ? situacaoStyles[cliente.situacao]
      : {
          label: cliente?.situacao || "Não informado",
          className: "bg-slate-100 border-slate-200 text-slate-600",
        };

  const hasCoordinates =
    cliente?.latitude !== undefined &&
    cliente?.longitude !== undefined &&
    cliente?.latitude !== null &&
    cliente?.longitude !== null;
  const mapsViewUrl =
    hasCoordinates && cliente?.latitude && cliente.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${cliente.latitude},${cliente.longitude}`
      : null;
  const mapsDirectionsUrl =
    hasCoordinates && cliente?.latitude && cliente.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${cliente.latitude},${cliente.longitude}`
      : null;
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const staticMapUrl =
    hasCoordinates &&
    googleMapsApiKey &&
    cliente?.latitude &&
    cliente?.longitude
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${cliente.latitude},${cliente.longitude}&zoom=17&size=640x360&scale=2&maptype=roadmap&markers=color:red%7C${cliente.latitude},${cliente.longitude}&key=${googleMapsApiKey}`
      : null;

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

  const renderEmptyState = (message: string) => (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-white to-slate-50 px-6 py-8 text-center">
      <AlertCircle className="h-5 w-5 text-slate-400" />
      <p className="text-sm text-slate-600">{message}</p>
    </div>
  );

  const renderHistoricoField = (
    label: string,
    value?: string | number,
    options?: { variant?: "success" | "default" }
  ) => {
    if (!value) return null;

    const variant = options?.variant ?? "default";
    const containerClasses =
      variant === "success"
        ? "border-emerald-100 bg-emerald-50/80"
        : "border-slate-100 bg-slate-50";
    const textClasses =
      variant === "success" ? "text-emerald-700" : "text-slate-700";

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

  const renderContatosTab = () => {
    if (!cliente?.contatos || cliente.contatos.length === 0) {
      return renderEmptyState("Nenhum contato cadastrado para este cliente.");
    }

    return (
      <div className="grid gap-3 lg:grid-cols-2">
        {cliente.contatos.map((contato) => {
          const contatoSituacao =
            contato.situacao && situacaoStyles[contato.situacao]
              ? situacaoStyles[contato.situacao]
              : {
                  label: contato.situacao || "Ativo",
                  className:
                    contato.situacao === "I"
                      ? "bg-rose-50 border-rose-100 text-rose-700"
                      : "bg-emerald-50 border-emerald-100 text-emerald-700",
                };
          const emailHref = contato.email ? `mailto:${contato.email}` : null;
          const telefoneHref = buildTelHref(contato.telefone);
          const whatsappHref = buildWhatsAppHref(contato.whatsapp);

          return (
            <div
              key={`${contato.id ?? contato.id_contato}-${contato.email}`}
              className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {contato.nome || contato.nome_completo || "Contato"}
                  </p>
                  {contato.cargo && (
                    <p className="text-xs text-slate-500">{contato.cargo}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[12px] font-semibold ${
                      contato.recebe_aviso_os
                        ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-100 text-slate-600"
                    }`}
                  >
                    {contato.recebe_aviso_os ? (
                      <Bell className="h-3.5 w-3.5" />
                    ) : (
                      <BellOff className="h-3.5 w-3.5" />
                    )}
                    {contato.recebe_aviso_os
                      ? "Recebe avisos de OS"
                      : "Não recebe avisos de OS"}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${contatoSituacao.className}`}
                  >
                    {contatoSituacao.label}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-5 text-sm text-slate-600">
                {contato.email && (
                  <a
                    href={emailHref || undefined}
                    className="flex items-center gap-1.5 rounded-md transition hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
                  >
                    <Mail className="h-4 w-4 text-slate-400" />
                    {contato.email}
                  </a>
                )}
                {contato.telefone && (
                  <a
                    href={telefoneHref || undefined}
                    className="flex items-center gap-1.5 rounded-md transition hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
                  >
                    <Phone className="h-4 w-4 text-slate-400" />
                    {contato.telefone}
                  </a>
                )}
                {contato.whatsapp && (
                  <a
                    href={whatsappHref || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-md transition hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
                  >
                    <MessageCircle className="h-4 w-4 text-green-500" />
                    {contato.whatsapp}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMaquinasTab = () => {
    if (!cliente?.maquinas || cliente.maquinas.length === 0) {
      return renderEmptyState("Nenhuma máquina está vinculada a este cliente.");
    }

    return (
      <div className="grid gap-3 lg:grid-cols-2">
        {cliente.maquinas.map((maquina) => (
          <div
            key={`${maquina.id ?? maquina.id_maquina}-${maquina.numero_serie}`}
            className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {maquina.descricao || maquina.modelo || "Máquina"}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {maquina.modelo && (
                    <span className="text-slate-700">
                      Modelo: {maquina.modelo}
                    </span>
                  )}
                  {maquina.numero_serie && (
                    <span>{`Número de Série: ${maquina.numero_serie}`}</span>
                  )}
                </div>
              </div>
              {maquina.situacao && (
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                      maquina.situacao === "I"
                        ? "border-rose-100 bg-rose-50 text-rose-700"
                        : "border-emerald-100 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {maquina.situacao === "I" ? "Inativa" : "Ativa"}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-[12px] font-semibold text-slate-600">
              {maquina.data_1a_venda && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
                  1ª venda: {formatDateOnly(maquina.data_1a_venda)}
                </span>
              )}
              {maquina.nota_fiscal_venda && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                  NF: {maquina.nota_fiscal_venda}
                </span>
              )}
              {maquina.data_final_garantia && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Garantia até: {formatDateOnly(maquina.data_final_garantia)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderHistoricoTab = () => {
    if (historicoLoading) {
      return (
        <div className="rounded-2xl border border-slate-100 bg-slate-50">
          <Loading text="Buscando histórico do cliente..." />
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
        "Ainda não existem atendimentos registrados para este cliente."
      );
    }

    return (
      <>
        <div className="space-y-3">
          {historicoRegistros.map((registro) => (
            <div
              key={`${registro.id_fat}-${registro.numero_os}-${registro.data_atendimento}`}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <p className="text-base font-semibold text-slate-900 flex flex-wrap items-center gap-3">
                    {/* OS */}
                    <span className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      OS #{registro.numero_os ?? "-"}
                    </span>

                    {/* FAT */}
                    <span className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      FAT #{registro.id_fat ?? "-"}
                    </span>

                    {/* MOTIVO */}
                    <span className="text-slate-700 font-medium leading-tight">
                      {registro.motivo_atendimento}
                    </span>
                  </p>

                  <div className="flex items-center gap-2 text-sm text-slate-700 flex-wrap">
                    {registro.em_garantia ? (
                      <CircleCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <CircleX className="w-4 h-4 text-amber-500 shrink-0" />
                    )}

                    <span className="text-slate-800 font-medium">
                      {registro.descricao_maquina ||
                        registro.nome_cliente ||
                        "Cliente / máquina não informados"}
                    </span>

                    {registro.numero_serie && (
                      <span className="text-sm text-slate-500">
                        / Número de Série: {registro.numero_serie}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-sm text-slate-600 items-start text-left md:items-end md:text-right">
                  <span className="text-sm font-semibold text-slate-900">
                    {registro.nome_tecnico || "Tecnico nao informado"}
                  </span>
                  <span className="text-xs text-slate-500">
                    Atendimento em {registro.data_atendimento}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[0.9fr,1.1fr]">
                <div className="grid gap-3 sm:grid-cols-2">
                  {renderHistoricoField(
                    "Descrição do problema",
                    registro.descricao_problema
                  )}
                  {renderHistoricoField(
                    "Solução encontrada",
                    registro.solucao_encontrada,
                    {
                      variant: "success",
                    }
                  )}
                  {renderHistoricoField(
                    "Testes realizados",
                    registro.testes_realizados
                  )}
                  {renderHistoricoField("Sugestões", registro.sugestoes)}
                  {renderHistoricoField("Observações", registro.observacoes)}
                  {renderHistoricoField(
                    "Observações do técnico",
                    registro.observacoes_tecnico
                  )}
                  {renderHistoricoField(
                    "Observações da revisão",
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

  const renderTabContent = () => {
    switch (activeTab) {
      case "maquinas":
        return renderMaquinasTab();
      case "historico":
        return renderHistoricoTab();
      default:
        return renderContatosTab();
    }
  };

  const tabConfig = useMemo(
    () => [
      {
        key: "maquinas" as TabKey,
        label: "Máquinas",
        count: totalMaquinas,
        icon: Settings,
      },
      {
        key: "contatos" as TabKey,
        label: "Contatos",
        count: totalContatos,
        icon: Users,
      },
      {
        key: "historico" as TabKey,
        label: "Histórico",
        count: historicoTotalRegistros,
        icon: History,
      },
    ],
    [totalContatos, totalMaquinas, historicoTotalRegistros]
  );

  return (
    <div>
      <PageHeader
        title="Detalhes do Cliente"
        config={{
          type: "form",
          useBackNavigation: true,
          backLabel: "Voltar para tela anterior",
          actions: headerActions,
        }}
      />

      {clienteLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <Loading text="Carregando dados do cliente..." />
        </div>
      ) : cliente && !clienteError ? (
        <div className="space-y-6">
          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-transparent bg-gradient-to-br from-white via-white to-violet-50 p-6 shadow-lg ring-1 ring-violet-100 lg:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">Cliente</p>
                  <h2 className="text-3xl font-semibold text-slate-900">
                    {cliente.nome_fantasia}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {cliente.razao_social}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${situacaoInfo.className}`}
                >
                  {situacaoInfo.label}
                </span>
              </div>

              <dl className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-sm text-slate-500">CNPJ</dt>
                  <dd className="text-base font-medium text-slate-900">
                    {cliente.cnpj ? formatDocumento(cliente.cnpj) : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Código ERP</dt>
                  <dd className="text-base font-medium text-slate-900">
                    {cliente.codigo_erp || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Região</dt>
                  <dd className="text-base font-medium text-slate-900">
                    {cliente.regiao?.nome || cliente.regiao?.nome_regiao || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Cidade / UF</dt>
                  <dd className="text-base font-medium text-slate-900">
                    {cliente.cidade && cliente.uf
                      ? `${cliente.cidade} - ${cliente.uf}`
                      : "-"}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 space-y-2 rounded-2xl bg-white/70 p-4 shadow-inner">
                <p className="text-sm font-semibold text-slate-700">Endereço</p>
                <p className="text-sm text-slate-600">
                  {enderecoPrincipal || "Não informado"}
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                  {cliente.cep && <span>CEP {formatarCEP(cliente.cep)}</span>}
                  {cliente.complemento && <span>{cliente.complemento}</span>}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-transparent bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-lg ring-1 ring-slate-100">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Localização
                  </p>
                  <p className="text-sm text-slate-500">
                    Pré-visualização do endereço cadastrado
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 h-64 relative">
                {staticMapUrl ? (
                  <Image
                    src={staticMapUrl}
                    alt="Localização no mapa"
                    fill
                    className="object-cover"
                    priority={false}
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-500">
                    Coordenadas do cliente indisponíveis. Atualize o endereço do
                    cliente para visualizar o mapa.
                  </div>
                )}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {mapsViewUrl ? (
                  <a
                    href={mapsViewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-2xl border border-[var(--primary)]/30 bg-white px-4 py-2 text-sm font-semibold text-[var(--primary)] shadow-sm transition hover:border-[var(--primary)] hover:bg-[var(--primary)]/10"
                  >
                    Ver mapa
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex cursor-not-allowed items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400"
                  >
                    Ver mapa
                  </button>
                )}
                {mapsDirectionsUrl ? (
                  <a
                    href={mapsDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-2xl border border-transparent bg-gradient-to-r from-[var(--primary)] to-[#6541D3] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[var(--primary)]/25 transition hover:opacity-90"
                  >
                    Traçar rota
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex cursor-not-allowed items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400"
                  >
                    Traçar rota
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl ring-1 ring-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                  Dados vinculados ao cliente
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {tabConfig.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex flex-1 min-w-[160px] items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                      isActive
                        ? "border-transparent bg-gradient-to-r from-[var(--primary)] to-[#6541D3] text-white shadow-lg shadow-[var(--primary)]/25"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-[var(--primary)]/40 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-2xl ${
                          isActive ? "bg-white/20" : "bg-white"
                        } p-2`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            isActive ? "text-white" : "text-[var(--primary)]"
                          }`}
                        />
                      </span>
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            isActive ? "text-white" : "text-slate-700"
                          }`}
                        >
                          {tab.label}
                        </p>
                        <p
                          className={`text-xs ${
                            isActive ? "text-white/80" : "text-slate-500"
                          }`}
                        >
                          {formatNumber(tab.count)} registro(s)
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8">{renderTabContent()}</div>
          </section>
        </div>
      ) : (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-6 py-5 text-rose-700">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">
              {clienteError || "Não foi possível carregar este cliente."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientesDetalhesPage;
