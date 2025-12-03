"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import MobileHeader from "@/components/tecnico/MobileHeader";
import { Loading } from "@/components/LoadingPersonalizado";
import { clientesService } from "@/api/services/clientesService";
import {
  ordensServicoService,
  type OSDetalhadaV2,
  type OSFatDetalhado,
} from "@/api/services/ordensServicoService";
import type { Cliente, ClienteContato } from "@/types/admin/cadastro/clientes";
import StatusBadge from "@/components/tecnico/StatusBadge";
import {
  AlertTriangle,
  History,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Package,
  CircleCheck,
  CircleX,
  ShieldCheck,
  ShieldX,
  User,
  Wrench,
  X,
} from "lucide-react";

type FATFotoLike = {
  id_fat_foto?: number;
  nome_arquivo?: string;
  descricao?: string;
  data_cadastro?: string;
  url?: string;
};

const SectionCard = ({
  title,
  icon,
  children,
  right,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  right?: React.ReactNode;
}) => (
  <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 space-y-3">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <span className="text-slate-500">{icon}</span>
        <span>{title}</span>
      </div>
      {right ? <div className="flex-shrink-0">{right}</div> : null}
    </div>
    <div className="space-y-3 text-sm text-slate-700">{children}</div>
  </section>
);

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) => {
  if (value === null || value === undefined || value === "") return null;

  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="text-sm font-medium text-slate-900 break-words">
        {value}
      </div>
    </div>
  );
};

const formatDuration = (
  rawHours?: string | null,
  rawMinutes?: number | null | undefined
) => {
  if (rawHours && rawHours.trim()) {
    return rawHours.trim();
  }
  if (rawMinutes === null || rawMinutes === undefined) return "-";
  if (!Number.isFinite(Number(rawMinutes))) return "-";
  return `${rawMinutes} min`;
};

const DEFAULT_WHATSAPP_MESSAGE =
  "Teste de envio por WhatsApp.\nOnJob Assistência Técnica.";

const formatQuantidade = (value: unknown) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return null;
  return Number.isInteger(numericValue)
    ? numericValue.toString()
    : numericValue.toFixed(2);
};

const getFatPecas = (fat: OSFatDetalhado) => {
  const raw =
    (fat as { pecas?: unknown[] }).pecas ?? fat.pecas_utilizadas ?? [];
  return Array.isArray(raw) ? raw : [];
};

const buildWhatsappMessage = (
  os: OSDetalhadaV2,
  selectedFat?: OSFatDetalhado | null
) => {
  const lines: string[] = [];
  const osIdentifier = os.numero_os || os.id_os;
  const tecnicoName =
    selectedFat?.tecnico?.nome ||
    selectedFat?.nome_atendente ||
    os.tecnico?.nome ||
    os.abertura?.nome_usuario;
  const dataConclusao =
    selectedFat?.data_atendimento ||
    os.data_fechamento ||
    os.situacao_os?.data_situacao ||
    os.data_agendada;

  lines.push("*Conclusão de Ordem de Serviço:*");
  const resumoParts = [`Informamos que a OS nº *${osIdentifier}*`];
  if (tecnicoName) {
    resumoParts.push(`foi concluída pelo técnico *${tecnicoName}*`);
  }
  if (dataConclusao) {
    resumoParts.push(`em ${dataConclusao}`);
  }
  lines.push(`${resumoParts.join(" ")}.`);

  const revisorName = os.revisao_os?.nome;
  const dataRevisao = os.revisao_os?.data;
  lines.push(
    revisorName
      ? `Foi revisada por *${revisorName}*${
          dataRevisao ? ` em ${dataRevisao}` : ""
        }.`
      : "Ainda não foi revisada."
  );

  const equipamento = [os.maquina?.numero_serie, os.maquina?.descricao]
    .map((value) => (value ? String(value).trim() : ""))
    .filter(Boolean)
    .join(" - ");
  if (equipamento) {
    lines.push(`*Equipamento:* ${equipamento}`);
  }

  const motivoAtendimento = selectedFat?.motivo_atendimento?.trim();
  const problemaDescricao =
    selectedFat?.descricao_problema?.trim() ||
    os.descricao_problema?.trim() ||
    "";
  if (motivoAtendimento || problemaDescricao) {

    const problema = [
      motivoAtendimento ? `${motivoAtendimento}` : "",
      problemaDescricao,
    ]
      .filter(Boolean)
      .join(" - ");
    lines.push(`*Problema apresentado:* ${problema}`);
  }

  const fats =
    (os.fats ?? []).length > 0 ? os.fats : selectedFat ? [selectedFat] : [];

  if (fats.length) {
    lines.push("");
  }

  fats.forEach((fat, index) => {
    const fatLines: string[] = [];
    const headerParts = [`*— FAT ${fat.id_fat}:*`];
    if (fat.data_atendimento) headerParts.push(String(fat.data_atendimento));
    fatLines.push(headerParts.join(" ").trim());

    const addSection = (label: string, value?: string | null) => {
      if (value && value.toString().trim()) {
        fatLines.push(`*${label}:* ${value.toString().trim()}`);
      }
    };

    addSection("Solução encontrada", fat.solucao_encontrada);
    addSection("Testes realizados", fat.testes_realizados);
    addSection("Observações", fat.observacoes);

    const horaInicio = (fat as { hora_inicio?: string }).hora_inicio?.trim();
    if (horaInicio) fatLines.push(`${horaInicio} Início do atendimento`);
    const horaFim = (fat as { hora_fim?: string }).hora_fim?.trim();
    if (horaFim) fatLines.push(`${horaFim} Término do atendimento`);

    const pecas = getFatPecas(fat);
    if (pecas.length) {
      fatLines.push("*Lista de Peças consumidas:*");
      pecas.forEach((peca) => {
        const quantidade = formatQuantidade(
          (peca as { quantidade?: unknown }).quantidade
        );
        const unidade =
          (peca as { unidade?: string }).unidade ||
          (peca as { unidade_medida?: string }).unidade_medida ||
          "UN";
        const descricao =
          (peca as { descricao_peca?: string }).descricao_peca ||
          (peca as { descricao?: string }).descricao ||
          (peca as { nome?: string }).nome ||
          "Peça";
        const codigo =
          (peca as { codigo_peca?: string }).codigo_peca ||
          (peca as { codigo?: string }).codigo;
        const observacoes = (
          peca as { observacoes?: string }
        ).observacoes?.trim();

        const base = [
          quantidade ? `${quantidade} ${unidade}` : null,
          descricao,
          codigo ? `(${codigo})` : null,
        ]
          .filter(Boolean)
          .join(" ");

        fatLines.push(observacoes ? `${base} - ${observacoes}` : base);
      });
    }

    lines.push(...fatLines);
    if (index < fats.length - 1) {
      lines.push("");
    }
  });

  return lines.join("\n").trim() || DEFAULT_WHATSAPP_MESSAGE;
};
export default function ClienteOsFatDetalhePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const rawClienteId = params?.id;
  const rawOsId = (params as { osId?: string | string[] })?.osId;

  const clienteId = useMemo(() => {
    if (!rawClienteId) return null;
    const value = Array.isArray(rawClienteId) ? rawClienteId[0] : rawClienteId;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }, [rawClienteId]);

  const osId = useMemo(() => {
    if (!rawOsId) return null;
    const value = Array.isArray(rawOsId) ? rawOsId[0] : rawOsId;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }, [rawOsId]);

  const fatIdFromQuery = useMemo(() => {
    const value = searchParams?.get("fat");
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }, [searchParams]);

  const [osData, setOsData] = useState<OSDetalhadaV2 | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [selectedFatId, setSelectedFatId] = useState<number | null>(
    fatIdFromQuery
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContacts, setShowContacts] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      if (!clienteId || !osId) {
        setError("OS ou cliente inválido.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [osResponse, clienteResponse] = await Promise.all([
          ordensServicoService.getById(osId),
          clientesService.getById(clienteId),
        ]);

        if (!active) return;

        setOsData(osResponse ?? null);

        const clienteEncontrado = Array.isArray(clienteResponse?.dados)
          ? clienteResponse.dados[0] ?? null
          : null;
        setCliente(clienteEncontrado);

        const fats = (osResponse?.fats ?? []) as OSFatDetalhado[];
        setSelectedFatId((current) => {
          if (current) return current;

          if (fatIdFromQuery) {
            const fatQuery = fats.find(
              (fat) => Number(fat.id_fat) === Number(fatIdFromQuery)
            );
            if (fatQuery) return fatQuery.id_fat;
          }

          return fats[0]?.id_fat ?? null;
        });
      } catch (err) {
        console.error("Erro ao carregar detalhes da OS/FAT:", err);
        if (active) {
          setError("Não foi possível carregar as informações da OS e FAT.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [clienteId, fatIdFromQuery, osId, refreshKey]);

  const selectedFat = useMemo(() => {
    const fats = osData?.fats ?? [];
    if (fats.length === 0) return null;

    if (selectedFatId) {
      const found = fats.find(
        (fat) => Number(fat.id_fat) === Number(selectedFatId)
      );
      if (found) return found;
    }

    return fats[0];
  }, [osData?.fats, selectedFatId]);

  const contatosWhatsapp = useMemo(
    () =>
      (cliente?.contatos ?? []).filter((contato) => {
        const numeroLimpo = (contato.whatsapp ?? "").replace(/\D/g, "").trim();
        const situacaoAtiva =
          typeof contato.situacao === "string" &&
          contato.situacao.toUpperCase() === "A";
        const recebeAvisoOs = contato.recebe_aviso_os === true;

        return numeroLimpo.length >= 10 && situacaoAtiva && recebeAvisoOs;
      }),
    [cliente?.contatos]
  );

  const fatPecas = useMemo(() => {
    const raw =
      (selectedFat as { pecas?: unknown[] })?.pecas ??
      selectedFat?.pecas_utilizadas ??
      [];
    return Array.isArray(raw) ? raw : [];
  }, [selectedFat]);

  const fatDeslocamentos = useMemo(() => {
    const raw = (selectedFat as { deslocamentos?: unknown[] })?.deslocamentos;
    return Array.isArray(raw) ? raw : [];
  }, [selectedFat]);

  const fatFotos = useMemo(() => {
    const raw = (selectedFat as { fotos?: FATFotoLike[] })?.fotos;
    return Array.isArray(raw) ? raw : [];
  }, [selectedFat]);

  const fatOcorrencias = useMemo(() => {
    const raw = (selectedFat as { ocorrencias?: unknown[] })?.ocorrencias;
    return Array.isArray(raw) ? raw : [];
  }, [selectedFat]);

  const whatsappMessage = useMemo(() => {
    if (!osData) return DEFAULT_WHATSAPP_MESSAGE;
    return buildWhatsappMessage(osData, selectedFat);
  }, [osData, selectedFat]);

  const handleRetry = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  const handleSendWhatsapp = useCallback(
    (contato: ClienteContato) => {
      const numeroLimpo = (contato.whatsapp || contato.telefone || "")
        .replace(/\D/g, "")
        .trim();

      if (!numeroLimpo) {
        window.alert("Contato selecionado não possui número de WhatsApp.");
        return;
      }

      const numeroComDdi = numeroLimpo.startsWith("55")
        ? numeroLimpo
        : `55${numeroLimpo}`;

      const url = `https://wa.me/${numeroComDdi}?text=${encodeURIComponent(
        whatsappMessage || DEFAULT_WHATSAPP_MESSAGE
      )}`;

      window.open(url, "_blank");
      setShowContacts(false);
    },
    [whatsappMessage]
  );

  const osStatus = osData?.situacao_os;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <MobileHeader
          title="Detalhes da OS"
          onAddClick={() => router.back()}
          leftVariant="back"
        />
        <div className="flex h-[70vh] items-center justify-center">
          <Loading text="Carregando OS e FAT..." />
        </div>
      </div>
    );
  }

  if (error || !osData) {
    return (
      <div className="min-h-screen bg-slate-100">
        <MobileHeader
          title="Detalhes da OS"
          onAddClick={() => router.back()}
          leftVariant="back"
        />
        <div className="px-4 py-6">
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-rose-700 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              <span>{error ?? "Dados não encontrados."}</span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-rose-700 ring-1 ring-rose-100 transition hover:bg-white/70"
                onClick={() => router.back()}
              >
                Voltar
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500"
                onClick={handleRetry}
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <MobileHeader
        title={`OS #${osData.id_os}`}
        onAddClick={() => router.back()}
        leftVariant="back"
      />

      <main className="px-4 py-4 space-y-4">
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">
                  OS #{osData.id_os}
                </p>
                {osData.em_garantia !== undefined &&
                  (osData.em_garantia ? (
                    <ShieldCheck
                      className="h-4 w-4 text-emerald-500"
                      aria-label="Em garantia"
                    />
                  ) : (
                    <ShieldX
                      className="h-4 w-4 text-amber-500"
                      aria-label="Fora da garantia"
                    />
                  ))}
              </div>
              {osStatus?.codigo !== undefined && (
                <StatusBadge
                  status={String(osStatus.codigo)}
                  descricao={osStatus.descricao}
                />
              )}
            </div>

            <p className="text-sm text-slate-700 leading-relaxed">
              {osData.abertura?.motivo_atendimento
                ? `${osData.abertura.motivo_atendimento}: ${osData.descricao_problema}`
                : osData.descricao_problema}
            </p>

            <div className="grid grid-cols-1 gap-2 text-sm text-slate-700">
              <div className="space-y-0.5">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  Cliente
                </p>
                <p className="font-semibold text-slate-900">
                  {osData.cliente?.nome_fantasia || osData.cliente?.nome}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                {osData.cliente?.cidade && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {osData.cliente.cidade}/{osData.cliente.uf}
                  </span>
                )}
                {osData.contato?.nome && (
                  <span className="flex items-center gap-1 ml-auto">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    {osData.contato.nome}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  Máquina
                </p>

                {/* Descrição + ícone ao lado */}
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {osData.maquina?.descricao || "Máquina não informada"}
                  </p>

                  {osData.maquina?.em_garantia ?? osData.em_garantia ? (
                    <CircleCheck
                      className="h-4 w-4 text-emerald-500 shrink-0"
                      aria-label="Em garantia"
                    />
                  ) : (
                    <CircleX
                      className="h-4 w-4 text-amber-500 shrink-0"
                      aria-label="Fora da garantia"
                    />
                  )}
                </div>

                {osData.maquina?.numero_serie && (
                  <p className="text-xs text-slate-600">
                    Número de Série: {osData.maquina.numero_serie}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowContacts(true)}
              disabled={contatosWhatsapp.length === 0}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <MessageCircle className="h-4 w-4" />
              Enviar OS por WhatsApp
            </button>
          </div>
        </section>

        {(osData.fats?.length ?? 0) > 1 && (
          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <label className="text-xs font-semibold text-slate-600">
              Selecionar FAT
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-[#7B54BE] focus:outline-none focus:ring-2 focus:ring-[#7B54BE]/20"
              value={selectedFat?.id_fat ?? ""}
              onChange={(event) => {
                const value = Number(event.target.value);
                setSelectedFatId(Number.isFinite(value) ? value : null);
              }}
            >
              {(osData.fats ?? []).map((fat) => (
                <option key={fat.id_fat} value={fat.id_fat}>
                  FAT #{fat.id_fat}
                </option>
              ))}
            </select>
          </section>
        )}

        {selectedFat && (
          <SectionCard
            title={`FAT #${selectedFat.id_fat}`}
            icon={<Wrench className="h-4 w-4" />}
            right={
              selectedFat.situacao ? (
                <StatusBadge
                  status={String(selectedFat.situacao)}
                  descricao={selectedFat.descricao_situacao}
                />
              ) : undefined
            }
          >
            <InfoRow
              label="Motivo do atendimento"
              value={selectedFat.motivo_atendimento}
            />
            <InfoRow
              label="Data do atendimento"
              value={selectedFat.data_atendimento}
            />
            <InfoRow
              label="Nome do atendente"
              value={selectedFat.nome_atendente}
            />
            <InfoRow
              label="Problema relatado"
              value={selectedFat.descricao_problema}
            />
            <InfoRow
              label="Solução encontrada"
              value={selectedFat.solucao_encontrada}
            />
            <InfoRow
              label="Testes realizados"
              value={selectedFat.testes_realizados}
            />
            <InfoRow label="Sugestões" value={selectedFat.sugestoes} />
            <InfoRow label="Observações" value={selectedFat.observacoes} />
            <InfoRow
              label="Número de ciclos"
              value={
                selectedFat.numero_ciclos
                  ? String(selectedFat.numero_ciclos)
                  : undefined
              }
            />
          </SectionCard>
        )}

        <SectionCard title="Peças" icon={<Package className="h-4 w-4" />}>
          {fatPecas.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma peça cadastrada.</p>
          ) : (
            <div className="space-y-2">
              {fatPecas.map((peca, index) => {
                const key =
                  (peca as { id_fat_peca?: number }).id_fat_peca ?? index;
                const descricao =
                  (peca as { descricao_peca?: string }).descricao_peca ||
                  (peca as { descricao?: string }).descricao ||
                  (peca as { nome?: string }).nome ||
                  "Peça";
                const codigo =
                  (peca as { codigo_peca?: string }).codigo_peca ||
                  (peca as { codigo?: string }).codigo;
                const quantidade =
                  (peca as { quantidade?: number }).quantidade ?? 0;
                const observacoes = (peca as { observacoes?: string })
                  .observacoes;

                return (
                  <div
                    key={key}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
                      <span>Código: {codigo || "-"}</span>
                      <span className="text-xs font-semibold text-slate-700">
                        Qtd: {quantidade}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {descricao}
                    </p>
                    {observacoes && (
                      <p className="text-xs text-slate-500 mt-1">
                        Obs: {observacoes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Deslocamentos"
          icon={<MapPin className="h-4 w-4" />}
        >
          {fatDeslocamentos.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhum deslocamento registrado.
            </p>
          ) : (
            <div className="space-y-3">
              {fatDeslocamentos.map((desloc, index) => {
                const item = desloc as {
                  id_deslocamento?: number;
                  km_ida?: number;
                  km_volta?: number;
                  tempo_ida_min?: number;
                  tempo_volta_min?: number;
                  tempo_ida_horas?: string | null;
                  tempo_volta_horas?: string | null;
                  observacoes?: string;
                };

                return (
                  <div
                    key={item.id_deslocamento ?? index}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm"
                  >
                    <div className="grid grid-cols-2 gap-1 text-sm text-slate-800">
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">
                          KM ida
                        </p>
                        <p className="font-semibold">{item.km_ida ?? "-"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">
                          KM volta
                        </p>
                        <p className="font-semibold">{item.km_volta ?? "-"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">
                          Tempo ida
                        </p>
                        <p className="font-semibold">
                          {formatDuration(
                            item.tempo_ida_horas,
                            item.tempo_ida_min
                          )}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">
                          Tempo volta
                        </p>
                        <p className="font-semibold">
                          {formatDuration(
                            item.tempo_volta_horas,
                            item.tempo_volta_min
                          )}
                        </p>
                      </div>
                    </div>
                    {item.observacoes && (
                      <p className="mt-2  text-xs text-slate-600">
                        {item.observacoes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Fotos" icon={<ImageIcon className="h-4 w-4" />}>
          {fatFotos.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma foto enviada.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {fatFotos.map((foto, index) => (
                <div
                  key={foto.id_fat_foto ?? index}
                  className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50 shadow-sm"
                >
                  {foto.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={foto.url}
                      alt={foto.descricao || foto.nome_arquivo || "Foto da FAT"}
                      className="h-28 w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-28 items-center justify-center text-slate-400">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div className="px-3 py-2 text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-800 line-clamp-2">
                      {foto.descricao || foto.nome_arquivo || "Foto"}
                    </p>
                    {foto.data_cadastro && <p>{foto.data_cadastro}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Ocorrências" icon={<History className="h-4 w-4" />}>
          {fatOcorrencias.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhuma ocorrência registrada para esta FAT.
            </p>
          ) : (
            <div className="space-y-3">
              {fatOcorrencias.map((ocorrencia, index) => {
                const item = ocorrencia as {
                  id_ocorrencia?: number;
                  descricao_ocorrencia?: string;
                  data_ocorrencia?: string;
                  usuario?: { nome?: string };
                  nova_situacao?: {
                    codigo?: string | number;
                    descricao?: string;
                  };
                };

                return (
                  <div
                    key={item.id_ocorrencia ?? index}
                    className="border-l-2 border-blue-200 pl-3"
                  >
                    <div className="flex justify-end">
                      <span className="text-xs text-slate-500">
                        {item.data_ocorrencia || "Data indisponível"}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 leading-snug">
                      {item.descricao_ocorrencia || "Ocorrência sem descrição."}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Por: {item.usuario?.nome || "Sistema"}
                    </p>
                    {item.nova_situacao?.codigo && (
                      <div className="mt-2">
                        <StatusBadge
                          status={String(item.nova_situacao.codigo)}
                          descricao={item.nova_situacao.descricao}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </main>

      {showContacts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowContacts(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl mx-4 border border-emerald-600">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-emerald-700">
                  Enviar por WhatsApp
                </p>
                <p className="text-sm font-semibold text-emerald-900">
                  Contatos do cliente
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowContacts(false)}
                className="text-emerald-700 hover:text-emerald-900"
                aria-label="Fechar lista de contatos"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 space-y-2 max-h-80 overflow-y-auto pr-1">
              {contatosWhatsapp.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhum contato com WhatsApp encontrado para este cliente.
                </p>
              ) : (
                contatosWhatsapp.map((contato) => (
                  <button
                    key={contato.id ?? contato.id_contato ?? contato.whatsapp}
                    type="button"
                    onClick={() => handleSendWhatsapp(contato)}
                    className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-left transition hover:border-emerald-500 hover:bg-white"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {contato.nome || contato.nome_completo || "Contato"}
                    </p>
                    <p className="text-xs text-slate-600">
                      {contato.whatsapp || contato.telefone}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
