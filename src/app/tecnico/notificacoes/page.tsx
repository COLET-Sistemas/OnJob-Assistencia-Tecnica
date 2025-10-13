"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, ChevronLeft, Mail, MailOpen } from "lucide-react";
import MobileHeader from "@/components/tecnico/MobileHeader";
import { notificacoesService } from "@/api/services/notificacoesService";
import { useNotificacoes } from "@/hooks";
import { formatRelativeDate } from "@/utils/formatters";

// Interface para o componente local
interface Notificacao {
  id: number;
  titulo: string;
  mensagem: string;
  link?: string;
  data_criacao: string;
  lida: boolean;
}

/**
 * Converte uma string de data em vários formatos possíveis para um objeto Date
 * Suporta formatos como "13/10/2025 11:24" ou ISO "2025-10-13T11:24:00"
 */
function parseNotificationDate(dateString: string): Date {
  // Verificar se é formato dd/mm/yyyy hh:mm
  if (dateString.includes("/")) {
    const [datePart, timePart] = dateString.split(" ");
    const [day, month, year] = datePart.split("/").map(Number);

    if (timePart) {
      const [hours, minutes] = timePart.split(":").map(Number);
      return new Date(year, month - 1, day, hours, minutes);
    }

    return new Date(year, month - 1, day);
  }

  // Caso contrário, assume que é formato ISO
  return new Date(dateString);
}

export default function NotificacoesPage() {
  const router = useRouter();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(true);
  // Usar o hook atualizado com suporte a cache
  const { updateCount, refreshCount, getNotificacoes, totalNotificacoes } =
    useNotificacoes();

  // Função para buscar notificações (agora usando o cache do hook)
  const fetchNotificacoes = async (
    pagina: number = 1,
    forceRefresh: boolean = false
  ) => {
    setLoading(true);
    try {
      // Usar o hook para buscar notificações com suporte a cache
      const response = await getNotificacoes(pagina, forceRefresh);

      // Se a API retornou um objeto vazio {}, significa que não há notificações
      if (!response || Object.keys(response).length === 0) {
        setNotificacoes([]);
        setTotalPaginas(1);
        setPaginaAtual(1);
        updateCount(0);
      }
      // Verificar se response e response.dados são válidos
      else if (Array.isArray(response.dados)) {
        // Adaptar o formato da API para o formato usado no componente
        const notificacoesAdaptadas = response.dados.map((item) => ({
          id: item.id,
          titulo: item.titulo,
          mensagem: item.mensagem,
          link: item.link,
          data_criacao: item.data, // Mapeamento de data para data_criacao
          lida: !item.lido, // Mapeamento inverso de lido para lida
        }));

        // Se for página 1, substitui as notificações. Se não, concatena com as existentes.
        if (pagina === 1) {
          setNotificacoes(notificacoesAdaptadas);
        } else {
          setNotificacoes((prev) => [...prev, ...notificacoesAdaptadas]);
        }

        setTotalPaginas(response.total_paginas || 1);
        setPaginaAtual(response.pagina_atual || 1);
        // Atualizar tanto o contador de não lidas quanto o total de notificações
        updateCount(
          response.nao_lidas || 0,
          (response.total_notificacoes as number) || response.dados.length || 0
        );
      } else {
        // Não vamos tratar como erro, apenas definir valores padrão
        setNotificacoes([]);
        setTotalPaginas(1);
        setPaginaAtual(1);
      }
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      setNotificacoes([]);
    } finally {
      setLoading(false);
    }
  };

  // Carregar notificações ao montar o componente
  useEffect(() => {
    // Forçar refresh ao carregar a página de notificações
    // mas não chamar fetchNotificacoesCount() que já é feito pelo NotificacoesUpdater
    fetchNotificacoes(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Função para marcar uma notificação como lida
  const marcarComoLida = async (id: number) => {
    try {
      await notificacoesService.marcarComoLida(id);

      // Atualizar a notificação localmente como lida
      setNotificacoes((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, lida: true } : notif
        )
      );

      // Atualizar contagem no hook
      refreshCount();
    } catch (error) {
      console.error(`Erro ao marcar notificação ${id} como lida:`, error);
    }
  };

  // Função para marcar todas as notificações como lidas
  const marcarTodasComoLidas = async () => {
    try {
      await notificacoesService.marcarTodasComoLidas();

      // Atualizar todas as notificações localmente como lidas
      setNotificacoes((prev) =>
        prev.map((notif) => ({ ...notif, lida: true }))
      );

      // Atualizar contagem no hook - manter o total de notificações, mas zerar as não lidas
      updateCount(0, totalNotificacoes);
    } catch (error) {
      console.error("Erro ao marcar todas notificações como lidas:", error);
    }
  };

  // Função para carregar mais notificações
  const carregarMaisNotificacoes = () => {
    if (paginaAtual < totalPaginas && !loading) {
      // Não forçamos refresh para paginação
      fetchNotificacoes(paginaAtual + 1, false);
    }
  };

  // Função para navegar para o link da notificação, se existir
  const navegarParaLink = (notificacao: Notificacao) => {
    // Se já estiver lida, apenas navega
    if (notificacao.lida) {
      if (notificacao.link) {
        router.push(notificacao.link);
      }
      return;
    }

    // Se não estiver lida, marca como lida e depois navega
    marcarComoLida(notificacao.id).then(() => {
      if (notificacao.link) {
        router.push(notificacao.link);
      }
    });
  };

  // Voltar para a página anterior
  const voltarParaPaginaAnterior = () => {
    router.back();
  };

  // Renderizar notificações vazias
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
        onMenuClick={() => {}}
        onAddClick={() => voltarParaPaginaAnterior()}
      />

      <div className="p-4">
        {/* Cabeçalho da página */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={voltarParaPaginaAnterior}
            className="flex items-center text-gray-600"
          >
            <ChevronLeft size={20} />
            <span className="ml-1">Voltar</span>
          </button>

          {notificacoes.length > 0 && (
            <button
              onClick={marcarTodasComoLidas}
              className="text-sm text-[#7B54BE] font-medium flex items-center"
            >
              <CheckSquare size={16} className="mr-1" />
              <span>Marcar todas como lidas</span>
            </button>
          )}
        </div>

        {/* Lista de notificações */}
        <div className="bg-white rounded-lg shadow">
          {loading && (
            <div className="p-6 text-center text-gray-500">
              Carregando notificações...
            </div>
          )}

          {!loading &&
            (!notificacoes || notificacoes.length === 0) &&
            renderNotificacoesVazias()}

          {!loading &&
            notificacoes &&
            notificacoes.length > 0 &&
            notificacoes.map((notificacao) => (
              <div
                key={notificacao.id}
                className={`border-b border-gray-100 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !notificacao.lida ? "bg-purple-50/50" : ""
                }`}
                onClick={() => navegarParaLink(notificacao)}
              >
                <div className="flex items-start gap-3">
                  {/* Ícone de notificação */}
                  <div
                    className={`p-2 rounded-full mt-1 ${
                      notificacao.lida
                        ? "bg-gray-100 text-gray-500"
                        : "bg-purple-100 text-[#7B54BE]"
                    }`}
                  >
                    {notificacao.lida ? (
                      <MailOpen size={16} />
                    ) : (
                      <Mail size={16} />
                    )}
                  </div>

                  {/* Conteúdo da notificação */}
                  <div className="flex-1">
                    {/* Título */}
                    <h4
                      className={`text-base ${
                        !notificacao.lida
                          ? "font-semibold text-[#7B54BE]"
                          : "font-medium text-gray-800"
                      }`}
                    >
                      {notificacao.titulo}
                    </h4>

                    {/* Mensagem */}
                    <p className="text-sm text-gray-600 mt-1">
                      {notificacao.mensagem}
                    </p>

                    {/* Data */}
                    <div className="text-xs text-gray-400 mt-2">
                      {notificacao.data_criacao
                        ? formatRelativeDate(
                            parseNotificationDate(notificacao.data_criacao)
                          )
                        : ""}
                    </div>

                    {/* Indicador de link */}
                    {notificacao.link && (
                      <div className="mt-2">
                        <span className="text-xs text-[#7B54BE] font-medium">
                          Acessar →
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

          {/* Botão para carregar mais */}
          {!loading && paginaAtual < totalPaginas && (
            <div className="p-4 text-center">
              <button
                onClick={carregarMaisNotificacoes}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors"
              >
                {loading ? "Carregando..." : "Carregar mais notificações"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
