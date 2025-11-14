"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, Mail, MailOpen } from "lucide-react";
import MobileHeader from "@/components/tecnico/MobileHeader";
import { notificacoesService } from "@/api/services/notificacoesService";
import { useNotificacoes } from "@/hooks";
import { useFeedback } from "@/context/FeedbackContext";
import { formatRelativeDate } from "@/utils/formatters";

interface Notificacao {
  id: number;
  titulo: string;
  mensagem: string;
  data_criacao: string;
  lida: boolean;
}

/**
 * Converte uma string de data (dd/mm/yyyy hh:mm ou ISO) em Date
 */
function parseNotificationDate(dateString: string): Date {
  if (dateString.includes("/")) {
    const [datePart, timePart] = dateString.split(" ");
    const [day, month, year] = datePart.split("/").map(Number);

    if (timePart) {
      const [hours, minutes] = timePart.split(":").map(Number);
      return new Date(year, month - 1, day, hours, minutes);
    }

    return new Date(year, month - 1, day);
  }

  return new Date(dateString);
}

type NotificationItemProps = {
  notificacao: Notificacao;
  onMarkAsRead: (id: number) => void;
};

const NotificationItem = memo(
  ({ notificacao, onMarkAsRead }: NotificationItemProps) => {
    const formattedDate = useMemo(() => {
      if (!notificacao.data_criacao) {
        return "";
      }

      return formatRelativeDate(
        parseNotificationDate(notificacao.data_criacao)
      );
    }, [notificacao.data_criacao]);

    const handleMarkAsRead = useCallback(() => {
      onMarkAsRead(notificacao.id);
    }, [notificacao.id, onMarkAsRead]);

    return (
      <div
        className={`border-b border-gray-100 p-4 transition-colors ${
          notificacao.lida
            ? "bg-white"
            : "bg-purple-50/80 border-l-4 border-l-[#7B54BE]"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-full mt-1 ${
              notificacao.lida
                ? "bg-gray-200 text-gray-500"
                : "bg-[#7B54BE] text-white"
            }`}
          >
            {notificacao.lida ? <MailOpen size={16} /> : <Mail size={16} />}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4
                className={`text-base ${
                  notificacao.lida
                    ? "font-medium text-gray-800"
                    : "font-semibold text-[#7B54BE]"
                }`}
              >
                {notificacao.titulo}
              </h4>

              {!notificacao.lida ? (
                <button
                  type="button"
                  onClick={handleMarkAsRead}
                  className="flex items-center gap-1 rounded-full border border-[#7B54BE] px-3 py-1 text-xs font-medium text-[#7B54BE] transition-colors hover:bg-[#7B54BE] hover:text-white"
                >
                  <CheckSquare size={14} />
                  Marcar como lida
                </button>
              ) : (
                <span className="flex items-center gap-1 text-xs font-semibold text-gray-400">
                  <CheckSquare size={12} />
                  Lida
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600">{notificacao.mensagem}</p>

            <div className="text-xs text-gray-400">{formattedDate}</div>
          </div>
        </div>
      </div>
    );
  }
);

NotificationItem.displayName = "NotificationItem";

export default function NotificacoesPage() {
  const router = useRouter();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(true);

  // removido 'notificacoesCount' pois não é usado
  const { updateCount, refreshCount, getNotificacoes } = useNotificacoes();
  const { showToast } = useFeedback();

  const hasUnread = useMemo(
    () => notificacoes.some((notif) => !notif.lida),
    [notificacoes]
  );

  const fetchNotificacoes = useCallback(
    async (pagina: number = 1, forceRefresh: boolean = false) => {
      setLoading(true);
      try {
        const response = await getNotificacoes(pagina, forceRefresh);

        if (!response || Object.keys(response).length === 0) {
          setNotificacoes([]);
          setTotalPaginas(1);
          setPaginaAtual(1);
          updateCount(0, 0);
          return;
        }

        if (Array.isArray(response.dados)) {
          const notificacoesAdaptadas = response.dados.map((item) => ({
            id: item.id,
            titulo: item.titulo,
            mensagem: item.mensagem,
            data_criacao: item.data,
            lida: item.lido,
          }));

          setNotificacoes((prev) =>
            pagina === 1
              ? notificacoesAdaptadas
              : [...prev, ...notificacoesAdaptadas]
          );

          setTotalPaginas(response.total_paginas || 1);
          setPaginaAtual(response.pagina_atual || pagina);

          updateCount(
            response.nao_lidas || 0,
            (response.total_notificacoes as number) ||
              response.dados.length ||
              0
          );
          return;
        }

        setNotificacoes([]);
        setTotalPaginas(1);
        setPaginaAtual(1);
      } catch (error) {
        console.error("Erro ao buscar notificacoes:", error);
        setNotificacoes([]);
      } finally {
        setLoading(false);
      }
    },
    [getNotificacoes, updateCount]
  );

  useEffect(() => {
    fetchNotificacoes(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const marcarComoLida = useCallback(
    async (id: number) => {
      try {
        const response = await notificacoesService.marcarComoLida(id);

        setNotificacoes((prev) =>
          prev.map((notif) =>
            notif.id === id ? { ...notif, lida: true } : notif
          )
        );

        if (typeof response?.nao_lidas === "number") {
          updateCount(response.nao_lidas, response.total_notificacoes);
        } else {
          refreshCount();
        }

        const toastMessage =
          response?.mensagem ||
          response?.message ||
          "Notificação marcada como lida.";
        const toastType = response?.sucesso === false ? "error" : "success";
        showToast(toastMessage, toastType);
      } catch (error) {
        console.error(`Erro ao marcar notificação ${id} como lida:`, error);
        showToast("Erro ao marcar notificação como lida.", "error");
      }
    },
    [refreshCount, showToast, updateCount]
  );

  const marcarTodasComoLidas = useCallback(async () => {
    if (!hasUnread) return;

    try {
      const response = await notificacoesService.marcarTodasComoLidas();

      setNotificacoes((prev) =>
        prev.map((notif) => ({ ...notif, lida: true }))
      );

      if (typeof response?.nao_lidas === "number") {
        updateCount(response.nao_lidas, response.total_notificacoes);
      } else {
        refreshCount();
      }

      const toastMessage =
        response?.mensagem ||
        response?.message ||
        "Notificações marcadas como lidas.";
      const toastType = response?.sucesso === false ? "error" : "success";
      showToast(toastMessage, toastType);
    } catch (error) {
      console.error('Erro ao marcar todas notificações como lidas:', error);
      showToast('Erro ao marcar todas notificações como lidas.', 'error');
    }
  }, [hasUnread, refreshCount, showToast, updateCount]);

  const carregarMaisNotificacoes = useCallback(() => {
    if (paginaAtual < totalPaginas && !loading) {
      fetchNotificacoes(paginaAtual + 1, false);
    }
  }, [fetchNotificacoes, loading, paginaAtual, totalPaginas]);

  const voltarParaPaginaAnterior = useCallback(() => {
    router.back();
  }, [router]);

  const renderNotificacoesVazias = () => (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="bg-gray-100 p-5 rounded-full mb-4">
        <MailOpen className="text-gray-400" size={48} />
      </div>
      <h3 className="text-lg font-medium text-gray-700 mb-2">
        Nenhuma notificação
      </h3>
      <p className="text-gray-500">
        Você não tem nenhuma notificação no momento.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader
        title="Notificações"
        onAddClick={voltarParaPaginaAnterior}
        leftVariant="back"
      />

      <div className="p-4">
        {hasUnread && (
          <div className="flex justify-end mb-4">
            <button
              onClick={marcarTodasComoLidas}
              className="text-sm text-[#7B54BE] font-medium flex items-center gap-1 rounded-full border border-[#7B54BE] px-4 py-2 transition-colors hover:bg-[#7B54BE] hover:text-white"
            >
              <CheckSquare size={16} />
              Marcar todas como lidas
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          {loading && (
            <div className="p-6 text-center text-gray-500">
              Carregando notificacoes...
            </div>
          )}

          {!loading && notificacoes.length === 0 && renderNotificacoesVazias()}

          {!loading &&
            notificacoes.length > 0 &&
            notificacoes.map((notificacao) => (
              <NotificationItem
                key={notificacao.id}
                notificacao={notificacao}
                onMarkAsRead={marcarComoLida}
              />
            ))}

          {!loading && paginaAtual < totalPaginas && (
            <div className="p-4 text-center">
              <button
                onClick={carregarMaisNotificacoes}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-full text-sm font-medium transition-colors"
              >
                {loading ? "Carregando..." : "Carregar mais notificacoes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
