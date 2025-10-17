import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo, memo } from "react";
import { Bell, CheckSquare, CheckCircle } from "lucide-react";
import { notificacoesService } from "@/api/services/notificacoesService";
import { useNotificacoes } from "@/hooks";
import { formatRelativeDate } from "@/utils/formatters";
import {
  getNotificationTimestamp,
  parseNotificationDate,
} from "@/utils/notifications";

// Interface local para o componente, adaptada à nossa UI
interface Notificacao {
  id: number;
  titulo: string;
  mensagem: string;
  link?: string;
  data_criacao: string;
  lida: boolean;
}

interface NotificacoesDropdownProps {
  onNotificationRead?: () => void;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const NotificacoesDropdown = memo(
  ({ onNotificationRead }: NotificacoesDropdownProps) => {
    const router = useRouter();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [todasNotificacoes, setTodasNotificacoes] = useState<Notificacao[]>(
      []
    );
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Utilizamos o hook personalizado para gerenciar as notificações
    const {
      notificacoesCount,
      totalNotificacoes,
      updateCount,
      getNotificacoes,
    } = useNotificacoes();
    const [loading, setLoading] = useState(false);

    // Função otimizada para buscar notificações com cache
    const fetchNotificacoes = async (
      pagina: number = 1,
      forceRefresh: boolean = false
    ) => {
      setLoading(true);
      try {
        // Usar a função de cache do nosso hook
        // getNotificacoes já inclui a atualização da contagem de notificações
        const response = await getNotificacoes(pagina, forceRefresh);

        // Se não há resposta ou API retornou um objeto vazio {}, significa que não há notificações
        if (!response || Object.keys(response).length === 0) {
          setTodasNotificacoes([]);
          setTotalPaginas(1);
          setPaginaAtual(1);
          updateCount(0, 0);
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
            lida: item.lido,
          }));

          // Se for página 1, substitui as notificações. Se não, concatena com as existentes.
          if (pagina === 1) {
            setTodasNotificacoes(notificacoesAdaptadas);
          } else {
            setTodasNotificacoes((prev) => [...prev, ...notificacoesAdaptadas]);
          }

          setTotalPaginas(response.total_paginas || 1);
          setPaginaAtual(response.pagina_atual || 1);
          // Atualizar tanto o contador de não lidas quanto o total de notificações
          updateCount(
            response.nao_lidas || 0,
            (response.total_notificacoes as number) ||
              response.dados.length ||
              0
          );
        } else {
          // Não vamos tratar como erro, apenas definir valores padrão
          setTodasNotificacoes([]);
          setTotalPaginas(1);
          setPaginaAtual(1);
        }
      } catch (error) {
        console.error("Erro ao buscar notificações:", error);
        setTodasNotificacoes([]);
      } finally {
        setLoading(false);
      }
    }; // Efeito para buscar notificações assim que o componente for montado
    useEffect(() => {
      // Buscar as notificações para garantir que temos os dados mais recentes
      // quando o dropdown é montado pela primeira vez
      fetchNotificacoes(1, true);

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Removemos o segundo useEffect que atualizava o contador
    // O NotificacoesUpdater é responsável pelo polling centralizado    // Efeito para fechar dropdown quando clicar fora dele
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setDropdownOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Função para alternar o estado do dropdown
    const toggleDropdown = () => {
      const novoEstado = !dropdownOpen;
      setDropdownOpen(novoEstado);

      // Se estiver abrindo o dropdown, buscar notificações com refresh forçado
      if (novoEstado) {
        fetchNotificacoes(1, true); // Força refresh ao clicar no ícone
        // Removido refreshCount e fetchNotificacoesCount pois já são chamados dentro de fetchNotificacoes
      }
    };

    const abrirTelaNotificacoes = () => {
      setDropdownOpen(false);
      router.push("/admin/notificacoes");
    };
    // Função para marcar uma notificação como lida
    const marcarComoLida = async (id: number) => {
      try {
        // O serviço agora retorna o novo contador
        const response = await notificacoesService.marcarComoLida(id);

        // Atualizar a notificação localmente como lida
        setTodasNotificacoes((prev) =>
          prev.map((notif) =>
            notif.id === id ? { ...notif, lida: true } : notif
          )
        );

        // Atualizar o contador com os valores mais recentes da API
        if (response) {
          updateCount(response.nao_lidas, response.total_notificacoes);
        } else {
          // Fallback se não houver resposta da API
          updateCount(Math.max(0, notificacoesCount - 1), totalNotificacoes);
        }

        // Callback opcional para informar o componente pai
        if (onNotificationRead) {
          onNotificationRead();
        }
      } catch (error) {
        console.error(`Erro ao marcar notificação ${id} como lida:`, error);
      }
    };

    // Função para marcar todas as notificações como lidas
    const marcarTodasComoLidas = async () => {
      try {
        // O serviço agora retorna o novo contador
        const response = await notificacoesService.marcarTodasComoLidas();

        // Atualizar todas as notificações localmente como lidas
        setTodasNotificacoes((prev) =>
          prev.map((notif) => ({ ...notif, lida: true }))
        );

        // Atualizar o contador com os valores mais recentes da API
        if (response) {
          updateCount(response.nao_lidas, response.total_notificacoes);
        } else {
          // Fallback se não houver resposta da API
          updateCount(0, totalNotificacoes);
        }

        // Callback opcional para informar o componente pai
        if (onNotificationRead) {
          onNotificationRead();
        }
      } catch (error) {
        console.error("Erro ao marcar todas notificações como lidas:", error);
      }
    };

    // Função para carregar mais notificações
    const carregarMaisNotificacoes = () => {
      if (paginaAtual < totalPaginas && !loading) {
        fetchNotificacoes(paginaAtual + 1, false); // Não força refresh para paginação
      }
    };

    // Funcao para navegar para o link da notificacao, se existir
    const navegarParaLink = (notificacao: Notificacao) => {
      const navegar = (link?: string) => {
        if (!link) {
          return;
        }
        const isExternal =
          link.startsWith("http://") || link.startsWith("https://");
        if (isExternal) {
          if (typeof window !== "undefined") {
            window.location.href = link;
          }
        } else {
          router.push(link);
        }
      };

      const marcarPromise = notificacao.lida
        ? Promise.resolve()
        : marcarComoLida(notificacao.id);

      marcarPromise.finally(() => {
        navegar(notificacao.link);
        if (onNotificationRead) {
          onNotificationRead();
        }
      });
    };

    const notificacoesVisiveis = useMemo(() => {
      const naoLidas = todasNotificacoes.filter((notif) => !notif.lida);

      if (naoLidas.length >= 5) {
        return naoLidas;
      }

      const agora = Date.now();
      const lidasRecentes = todasNotificacoes
        .filter((notif) => notif.lida)
        .map((notif) => ({
          notif,
          timestamp: getNotificationTimestamp(notif.data_criacao),
        }))
        .filter(
          ({ timestamp }) =>
            timestamp !== null && agora - timestamp <= THIRTY_DAYS_MS
        )
        .sort((a, b) => {
          const timeA = a.timestamp ?? 0;
          const timeB = b.timestamp ?? 0;
          return timeB - timeA;
        })
        .slice(0, 3)
        .map(({ notif }) => notif);

      return [...naoLidas, ...lidasRecentes];
    }, [todasNotificacoes]);

    return (
      <div className="relative" ref={dropdownRef}>
        {/* Botão de Notificações */}
        <button
          className="p-2 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
          onClick={toggleDropdown}
          aria-label="Notificações"
        >
          <Bell
            className="text-gray-700 hover:text-[#7B54BE] transition-colors cursor-pointer"
            size={20}
          />
          {notificacoesCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#7B54BE] text-white font-bold text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
              {notificacoesCount > 99 ? "99+" : notificacoesCount}
            </span>
          )}
        </button>

        {/* Dropdown de Notificações */}
        <div
          className={`absolute right-0 top-full mt-2 w-96 max-w-[95vw] bg-white rounded-lg shadow-xl border border-gray-200/60 overflow-hidden z-30 transition-all duration-250 ease-out origin-top-right ${
            dropdownOpen
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
          }`}
        >
          {/* Cabeçalho */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <button
              type="button"
              onClick={abrirTelaNotificacoes}
              className="text-md font-semibold text-gray-700 hover:text-[#7B54BE] transition-colors cursor-pointer"
            >
              Notificações
            </button>

            {notificacoesCount > 0 && (
              <button
                onClick={marcarTodasComoLidas}
                className="text-sm text-[#7B54BE] hover:text-[#9333ea] font-medium flex items-center"
              >
                <CheckSquare size={14} className="mr-1" />
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Lista de Notificações */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading && (
              <div className="p-6 text-center text-gray-500">
                Carregando notificações...
              </div>
            )}

            {!loading &&
              (!notificacoesVisiveis || notificacoesVisiveis.length === 0) && (
                <div className="p-6 text-center text-gray-500">
                  Nenhuma notificação encontrada.
                </div>
              )}

            {!loading &&
              notificacoesVisiveis &&
              notificacoesVisiveis.length > 0 && (
                <div>
                  {notificacoesVisiveis.map((notificacao) => (
                    <div
                      key={notificacao.id}
                      className={`border-b border-gray-100 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors relative ${
                        !notificacao.lida ? "bg-purple-50/50" : ""
                      }`}
                      onClick={() => navegarParaLink(notificacao)}
                    >
                      {/* Título e Botão de Marcar como Lida */}
                      <div className="flex justify-between items-start mb-1">
                        <h4
                          className={`text-sm font-semibold ${
                            !notificacao.lida
                              ? "text-[#7B54BE]"
                              : "text-gray-800"
                          }`}
                        >
                          {notificacao.titulo}
                        </h4>

                        {/* Indicador não-lida ou botão marcar como lida */}
                        {!notificacao.lida && (
                          <button
                            className="text-[#7B54BE] hover:text-[#9333ea] p-1 rounded-full hover:bg-purple-100/50 transition-colors cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              marcarComoLida(notificacao.id);
                            }}
                            title="Marcar como lida"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                      </div>

                      {/* Mensagem */}
                      <p className="text-sm text-gray-600 mb-1">
                        {notificacao.mensagem}
                      </p>

                      {/* Data */}
                      <div className="text-xs text-gray-400 mt-1">
                        {notificacao.data_criacao
                          ? formatRelativeDate(
                              parseNotificationDate(notificacao.data_criacao)
                            )
                          : ""}
                      </div>
                    </div>
                  ))}

                  {/* Botão para carregar mais */}
                  {paginaAtual < totalPaginas && (
                    <div className="p-3 text-center">
                      <button
                        onClick={carregarMaisNotificacoes}
                        disabled={loading}
                        className="text-sm text-[#7B54BE] hover:text-[#9333ea] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading
                          ? "Carregando..."
                          : "Carregar mais notificações"}
                      </button>
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>
    );
  }
);

NotificacoesDropdown.displayName = "NotificacoesDropdown";

export default NotificacoesDropdown;
