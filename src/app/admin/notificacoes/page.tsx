"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CheckSquare,
  Eye,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import PageHeader from "@/components/admin/ui/PageHeader";
import { useNotificacoes } from "@/hooks";
import {
  notificacoesService,
  type Notificacao as NotificacaoApi,
} from "@/api/services/notificacoesService";
import { formatRelativeDate } from "@/utils/formatters";
import { parseNotificationDate } from "@/utils/notifications";

interface Notificacao {
  id: number;
  titulo: string;
  mensagem: string;
  link?: string;
  data_criacao: string;
  lida: boolean;
}

const ITENS_POR_PAGINA = 20;

const FILTRO_DIAS_OPCOES = [
  { value: 30, label: "Ultimos 30 dias" },
  { value: 60, label: "Ultimos 60 dias" },
  { value: 90, label: "Ultimos 90 dias" },
  { value: 180, label: "Ultimos 180 dias" },
  { value: 365, label: "Ultimos 12 meses" },
];

export default function NotificacoesPage() {
  const router = useRouter();
  const { notificacoesCount, totalNotificacoes, updateCount } =
    useNotificacoes();

  const notificacoesCountRef = useRef(notificacoesCount);
  const totalNotificacoesRef = useRef(totalNotificacoes);
  const updateCountRef = useRef(updateCount);

  useEffect(() => {
    notificacoesCountRef.current = notificacoesCount;
  }, [notificacoesCount]);

  useEffect(() => {
    totalNotificacoesRef.current = totalNotificacoes;
  }, [totalNotificacoes]);

  useEffect(() => {
    updateCountRef.current = updateCount;
  }, [updateCount]);

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filtroDias, setFiltroDias] = useState(FILTRO_DIAS_OPCOES[0].value);
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [marcandoTodas, setMarcandoTodas] = useState(false);
  const [erroMensagem, setErroMensagem] = useState<string | null>(null);
  const [marcandoIds, setMarcandoIds] = useState<Set<number>>(new Set());

  const atualizarMarcandoId = (id: number, ativo: boolean) => {
    setMarcandoIds((prev) => {
      const novo = new Set(prev);
      if (ativo) {
        novo.add(id);
      } else {
        novo.delete(id);
      }
      return novo;
    });
  };

  const mapearNotificacoes = useCallback(
    (dados?: NotificacaoApi[]): Notificacao[] => {
      if (!Array.isArray(dados)) {
        return [];
      }

      return dados.map(
        (item): Notificacao => ({
          id: item.id,
          titulo: item.titulo,
          mensagem: item.mensagem,
          link: item.link,
          data_criacao: item.data,
          lida: item.lido,
        })
      );
    },
    []
  );

  const applyUpdateCount = useCallback((naoLidas: number, total?: number) => {
    updateCountRef.current?.(naoLidas, total);
  }, []);

  const carregarPagina = useCallback(
    async (pagina: number, reset: boolean = false, diasOverride?: number) => {
      setErroMensagem(null);
      if (reset) {
        setCarregandoLista(true);
      } else {
        setCarregandoMais(true);
      }

      try {
        const diasConsulta = diasOverride ?? filtroDias;
        const response = await notificacoesService.getNotificacoes(
          pagina,
          ITENS_POR_PAGINA,
          true,
          diasConsulta
        );

        const adaptadas = mapearNotificacoes(response?.dados);

        setPaginaAtual(response?.pagina_atual ?? pagina);
        setTotalPaginas(response?.total_paginas ?? 1);
        setNotificacoes((prev) => {
          if (reset) {
            return adaptadas;
          }

          const existente = new Map<number, Notificacao>();
          prev.forEach((item) => existente.set(item.id, item));
          adaptadas.forEach((item) => {
            if (!existente.has(item.id)) {
              existente.set(item.id, item);
            }
          });
          return Array.from(existente.values());
        });

        if (response) {
          const naoLidas =
            typeof response.nao_lidas === "number"
              ? response.nao_lidas
              : notificacoesCountRef.current;
          const total =
            typeof response.total_notificacoes === "number"
              ? response.total_notificacoes
              : totalNotificacoesRef.current;

          applyUpdateCount(naoLidas, total);
        }
      } catch (error) {
        console.error("Erro ao carregar notificacoes:", error);
        setErroMensagem("Nao foi possivel carregar as notificacoes.");
      } finally {
        setCarregandoLista(false);
        setCarregandoMais(false);
      }
    },
    [filtroDias, mapearNotificacoes, applyUpdateCount]
  );

  useEffect(() => {
    carregarPagina(1, true);
  }, [carregarPagina]);

  const marcarNotificacaoComoLida = useCallback(
    async (id: number): Promise<void> => {
      const alvo = notificacoes.find((item) => item.id === id);
      if (!alvo || alvo.lida || marcandoIds.has(id)) {
        return;
      }

      setErroMensagem(null);
      atualizarMarcandoId(id, true);
      try {
        const response = await notificacoesService.marcarComoLida(id);
        setNotificacoes((prev) =>
          prev.map((notif) =>
            notif.id === id ? { ...notif, lida: true } : notif
          )
        );

        if (response) {
          applyUpdateCount(response.nao_lidas, response.total_notificacoes);
        } else {
          applyUpdateCount(
            Math.max(0, notificacoesCountRef.current - 1),
            totalNotificacoesRef.current
          );
        }
      } catch (error) {
        console.error(`Erro ao marcar notificacao ${id} como lida:`, error);
        setErroMensagem("Nao foi possivel marcar a notificacao como lida.");
      } finally {
        atualizarMarcandoId(id, false);
      }
    },
    [marcandoIds, notificacoes, applyUpdateCount]
  );

  const marcarTodasComoLidas = useCallback(async () => {
    if (marcandoTodas || notificacoes.length === 0) {
      return;
    }

    setErroMensagem(null);
    setMarcandoTodas(true);
    try {
      const response = await notificacoesService.marcarTodasComoLidas();
      setNotificacoes((prev) =>
        prev.map((notif) => ({ ...notif, lida: true }))
      );

      if (response) {
        applyUpdateCount(response.nao_lidas, response.total_notificacoes);
      } else {
        applyUpdateCount(0, totalNotificacoesRef.current);
      }
    } catch (error) {
      console.error("Erro ao marcar todas notificacoes como lidas:", error);
      setErroMensagem("Nao foi possivel marcar todas as notificacoes.");
    } finally {
      setMarcandoTodas(false);
    }
  }, [marcandoTodas, notificacoes.length, applyUpdateCount]);

  const abrirNotificacao = useCallback(
    async (notificacao: Notificacao) => {
      if (!notificacao.lida) {
        await marcarNotificacaoComoLida(notificacao.id);
      }

      if (!notificacao.link) {
        return;
      }

      const isExternal =
        notificacao.link.startsWith("http://") ||
        notificacao.link.startsWith("https://");

      if (isExternal) {
        if (typeof window !== "undefined") {
          window.location.href = notificacao.link;
        }
      } else {
        router.push(notificacao.link);
      }
    },
    [marcarNotificacaoComoLida, router]
  );

  const handleFiltroChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const novoValor = Number(event.target.value);
    setFiltroDias(novoValor);
    carregarPagina(1, true, novoValor);
  };

  const handleCarregarMais = () => {
    if (paginaAtual < totalPaginas && !carregandoMais) {
      carregarPagina(paginaAtual + 1, false);
    }
  };

  const loadingInicial = carregandoLista && notificacoes.length === 0;

  const resumoTexto = useMemo(() => {
    if (totalNotificacoes === 0) {
      return "Nenhuma notificacao registrada.";
    }

    return `${notificacoesCount} nao lidas de ${totalNotificacoes} notificacoes.`;
  }, [notificacoesCount, totalNotificacoes]);

  const headerActions = useMemo(
    () => (
      <button
        type="button"
        onClick={() => carregarPagina(1, true)}
        className="inline-flex items-center cursor-pointer gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:border-[#7B54BE] hover:text-[#7B54BE]"
        disabled={carregandoLista}
      >
        {carregandoLista ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCcw className="h-4 w-4" />
        )}
        Atualizar
      </button>
    ),
    [carregandoLista, carregarPagina]
  );

  const headerConfig = useMemo(
    () => ({
      type: "list" as const,
      itemCount: totalNotificacoes,
      actions: headerActions,
    }),
    [headerActions, totalNotificacoes]
  );

  return (
    <>
      <PageHeader title="Notificações" config={headerConfig} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600">
          {resumoTexto}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <label htmlFor="filtro-periodo" className="sr-only">
              Periodo
            </label>
            <select
              id="filtro-periodo"
              value={filtroDias}
              onChange={handleFiltroChange}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-[#7B54BE] focus:outline-none focus:ring-1 focus:ring-[#7B54BE]"
            >
              {FILTRO_DIAS_OPCOES.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={marcarTodasComoLidas}
            className="inline-flex items-center cursor-pointer gap-2 rounded-md bg-[#7B54BE] px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#6a45a7] disabled:cursor-not-allowed disabled:bg-gray-300"
            disabled={marcandoTodas || notificacoesCount === 0}
          >
            {marcandoTodas ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckSquare className="h-4 w-4" />
            )}
            Marcar todas como lidas
          </button>
        </div>
      </div>

      {erroMensagem && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erroMensagem}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {loadingInicial && (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-12 text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Carregando notificacoes...
          </div>
        )}

        {!loadingInicial && notificacoes.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center text-sm text-gray-500">
            Nenhuma notificacao encontrada para o periodo selecionado.
          </div>
        )}

        {!loadingInicial &&
          notificacoes.map((notificacao) => {
            const emMarcacao = marcandoIds.has(notificacao.id);
            const dataFormatada = notificacao.data_criacao
              ? formatRelativeDate(
                  parseNotificationDate(notificacao.data_criacao)
                )
              : "";

            return (
              <div
                key={notificacao.id}
                className={`rounded-lg border px-4 py-4 shadow-sm transition-colors ${
                  notificacao.lida
                    ? "border-gray-200 bg-white"
                    : "border-[#7B54BE]/40 bg-purple-50/40"
                }`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex items-start gap-2">
                      {!notificacao.lida && (
                        <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#7B54BE]" />
                      )}
                      <button
                        type="button"
                        onClick={() => abrirNotificacao(notificacao)}
                        className="text-left text-sm font-semibold text-gray-800 hover:text-[#7B54BE] transition-colors"
                      >
                        {notificacao.titulo}
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-line">
                      {notificacao.mensagem}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-3 text-xs text-gray-400 md:items-end">
                    <span>{dataFormatada}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {!notificacao.lida && (
                        <button
                          type="button"
                          onClick={() =>
                            marcarNotificacaoComoLida(notificacao.id)
                          }
                          className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-transparent bg-white px-2 py-1 text-xs font-medium text-[#7B54BE] shadow-sm transition-colors hover:border-[#7B54BE] disabled:cursor-not-allowed disabled:opacity-70"
                          disabled={emMarcacao}
                        >
                          {emMarcacao ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          Marcar como lida
                        </button>
                      )}

                      {notificacao.link && (
                        <button
                          type="button"
                          onClick={() => abrirNotificacao(notificacao)}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium cursor-pointer text-gray-600 shadow-sm transition-colors hover:border-[#7B54BE] hover:text-[#7B54BE]"
                        >
                          <Eye className="h-3 w-3" />
                          Abrir
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {paginaAtual < totalPaginas && notificacoes.length > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleCarregarMais}
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:border-[#7B54BE] hover:text-[#7B54BE] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={carregandoMais}
          >
            {carregandoMais ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : (
              <>Carregar mais notificacoes</>
            )}
          </button>
        </div>
      )}
    </>
  );
}
