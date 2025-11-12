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
import { formatarCEP } from "@/utils/cepAPI";
import { AlertTriangle, Building, CalendarDays } from "lucide-react";

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
    <div className="text-sm font-medium text-slate-900">{value ?? "-"}</div>
  </div>
);

const formatAddress = (cliente: Cliente | null) => {
  if (!cliente) return "";
  const linha1 = [cliente.endereco, cliente.numero].filter(Boolean).join(", ");
  const linha2 = [
    cliente.bairro,
    cliente.cidade && cliente.uf
      ? `${cliente.cidade}/${cliente.uf}`
      : cliente.cidade,
  ]
    .filter(Boolean)
    .join(" • ");
  const cep = cliente.cep ? formatarCEP(cliente.cep) : null;

  return [linha1, linha2, cep].filter(Boolean).join(" • ");
};

const HISTORICO_PAGE_SIZE = 5;

const formatDateOnly = (value?: string | null) => {
  if (!value) return "-";
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.split("T")[0].split("-");
    if (day && month && year) {
      return `${day}/${month}/${year}`;
    }
  }
  return value;
};

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
      <p className="text-sm text-slate-700">{normalizedValue}</p>
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
        nro_pagina: 1,
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
  }, [clienteId]);

  useEffect(() => {
    fetchHistorico();
  }, [fetchHistorico]);

  const documentoFormatado = cliente?.cnpj
    ? formatDocumento(cliente.cnpj)
    : null;
  const enderecoFormatado = formatAddress(cliente);
  const statusLabel =
    cliente?.situacao === "A"
      ? "Cliente ativo"
      : cliente?.situacao === "I"
      ? "Cliente inativo"
      : cliente?.situacao;

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
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-base font-semibold text-slate-900">
                  {cliente.nome_fantasia}
                </p>
                <p className="text-sm text-slate-500">{cliente.razao_social}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {statusLabel && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      cliente?.situacao === "A"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {statusLabel}
                  </span>
                )}
                {cliente?.regiao?.nome && (
                  <span className="rounded-full bg-slate-200/60 px-3 py-1 text-xs font-semibold text-slate-700">
                    {cliente.regiao.nome}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                {documentoFormatado && (
                  <InfoItem label="Documento" value={documentoFormatado} />
                )}
                {cliente?.codigo_erp && (
                  <InfoItem label="Código ERP" value={cliente.codigo_erp} />
                )}
                {enderecoFormatado && (
                  <InfoItem
                    label="Endereço completo"
                    value={enderecoFormatado}
                  />
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
                  <div className="space-y-3">
                    {historicoRegistros.map((registro) => (
                      <article
                        key={`${registro.id_fat}-${registro.numero_os}-${registro.data_atendimento}`}
                        className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                      >
                        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3 text-sm text-slate-700">
                          <span className="font-semibold text-slate-900">
                            OS #{registro.numero_os ?? "-"}
                          </span>
                          <span className="text-xs text-slate-500">
                            FAT #{registro.id_fat ?? "-"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatDateOnly(registro.data_atendimento)}
                          </span>
                          <span className="ml-auto text-xs font-semibold text-slate-900">
                            {registro.nome_tecnico || "Tecnico nao informado"}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
                  {historicoTotalRegistros > HISTORICO_PAGE_SIZE && (
                    <p className="text-xs text-slate-500">
                      Mostrando {historicoRegistros.length} dos{" "}
                      {historicoTotalRegistros} atendimentos mais recentes.
                    </p>
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
