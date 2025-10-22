import React from "react";
import { OrdemServico } from "../../../../types/OrdemServico";
import {
  Calendar,
  User,
  AlertOctagon,
  MapPin,
  AlertCircle,
  Settings,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  CircleX,
  AlertTriangle,
  MessageCircle,
  ExternalLink,
  CheckCircle,
  DollarSign,
  Edit,
  Clock,
  Bell,
  Car,
  Wrench,
  PauseCircle,
  FileX,
} from "lucide-react";
import { formatarDataHora, isDataAgendadaPassada } from "@/utils/formatters";

interface OSCardProps {
  os: OrdemServico;
  isExpanded: boolean;
  toggleCardExpansion: (osId: number) => void;
  getFormaAberturaTexto: (forma: string) => string;
  formatWhatsAppUrl: (telefone: string) => string;
  formatEmailUrl: (email: string) => string;
  formatGoogleMapsUrl: (cliente: OrdemServico["cliente"]) => string;
  onLiberarFinanceiramente?: (osId: number) => void;
  onAlterarPendencia?: (
    osId: number,
    currentMotivoId?: number,
    currentMotivoText?: string
  ) => void;
  onAdicionarTecnico?: (osId: number) => void;
  onAlterarTecnico?: (
    osId: number,
    currentTecnicoId?: number,
    currentTecnicoNome?: string
  ) => void;
  onEditarOS?: (osId: number) => void;
  onCancelarOS?: (osId: number) => void;
}

const OSCard: React.FC<OSCardProps> = ({
  os,
  isExpanded,
  toggleCardExpansion,
  getFormaAberturaTexto,
  formatWhatsAppUrl,
  formatEmailUrl,
  formatGoogleMapsUrl,
  onLiberarFinanceiramente,
  onAlterarPendencia,
  onAlterarTecnico,
  onEditarOS,
  onCancelarOS,
}) => {
  // Função para determinar a cor baseada no código da situação
  const getSituacaoColor = (codigo: number) => {
    switch (codigo) {
      case 1:
        return "bg-gray-500";
      case 2:
        return "bg-blue-500";
      case 3:
        return "bg-purple-500";
      case 4:
        return "bg-orange-500";
      default:
        return "bg-amber-500";
    }
  };

  // Função para obter o ícone baseado no código da situação
  const getSituacaoIcon = (codigo: number, size: "sm" | "md" = "sm") => {
    const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";
    const getSituacaoDescricao = (codigo: number) => {
      switch (codigo) {
        case 1:
          return "Pendente";
        case 2:
          return "A atender";
        case 3:
          return "Em deslocamento";
        case 4:
          return "Em atendimento";
        default:
          return "Atendimento interrompido";
      }
    };

    const title = getSituacaoDescricao(codigo);

    switch (codigo) {
      case 1:
        return (
          <span title={title}>
            <Clock className={`${iconSize} text-gray-500`} />
          </span>
        );
      case 2:
        return (
          <span title={title}>
            <Bell className={`${iconSize} text-blue-600`} />
          </span>
        );
      case 3:
        return (
          <span title={title}>
            <Car className={`${iconSize} text-purple-600`} />
          </span>
        );
      case 4:
        return (
          <span title={title}>
            <Wrench className={`${iconSize} text-orange-600`} />
          </span>
        );
      default:
        return (
          <span title={title}>
            <PauseCircle className={`${iconSize} text-amber-600`} />
          </span>
        );
    }
  };

  // Função para verificar se o técnico está indefinido
  const isTecnicoIndefinido = !os.tecnico.nome || os.tecnico.nome.trim() === "";

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-300 
                overflow-hidden animate-fadeIn ${
                  isExpanded
                    ? "border-indigo-200 translate-y-[-2px]"
                    : "border-gray-100 hover:translate-y-[-2px]"
                }`}
      onClick={() => toggleCardExpansion(os.id_os)}
      style={{ cursor: "pointer" }}
    >
      {/* Compact Header - Always Visible */}
      <div className="p-5">
        <div className="flex items-center justify-between">
          {/* Left side - Main info */}
          <div className="flex items-center space-x-4 lg:space-x-6 flex-1">
            {/* Status indicator and icon */}
            <div className="flex items-center">
              <div
                className={`w-2 h-16 rounded-sm hidden sm:block ${getSituacaoColor(
                  os.situacao_os.codigo
                )}`}
                aria-hidden="true"
              ></div>
              <div className="hidden sm:flex items-center justify-center ml-2">
                <span className="w-6 h-6 flex items-center justify-center">
                  {getSituacaoIcon(os.situacao_os.codigo, "md")}
                </span>
              </div>
            </div>

            {/* Primary Info Container */}
            <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-4 min-w-0">
              {/* OS Number - Left aligned */}
              <div className="md:col-span-1 flex items-center">
                <div className="flex flex-col">
                  <div className="text-lg font-semibold text-gray-700">
                    #{os.id_os}
                  </div>
                </div>
              </div>

              {/* Client Info - More prominent */}
              <div className="md:col-span-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Cliente / Cidade
                </div>
                <div className="font-semibold text-gray-900 truncate text-base mt-1">
                  {os.cliente.nome}
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 my-auto" />
                  <span className="my-auto">
                    {os.cliente.cidade}/{os.cliente.uf}
                  </span>
                </div>
              </div>

              {/* Equipment Info */}
              <div className="md:col-span-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Máquina / Série
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-gray-900 truncate text-base mt-1">
                    {os.maquina.modelo || os.maquina.descricao}
                  </div>
                  <div
                    className="w-4 h-4 flex items-center justify-center"
                    title={os.em_garantia ? "Em garantia" : "Fora da garantia"}
                  >
                    {os.em_garantia ? (
                      <CircleCheck className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <CircleX className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                  <Settings className="w-3.5 h-3.5 flex-shrink-0 my-auto" />
                  <span className="my-auto">{os.maquina.numero_serie}</span>
                </div>
              </div>

              {/* Date and Tech Info */}
              <div className="md:col-span-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <User className="w-3.5 h-3.5 flex-shrink-0 text-gray-500 my-auto" />
                    {isTecnicoIndefinido ? (
                      <div className="flex items-center gap-1.5 my-auto">
                        <span className="text-red-600 font-medium">
                          Técnico indefinido
                        </span>
                        {onAlterarTecnico && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAlterarTecnico(
                                os.id_os,
                                os.tecnico.id,
                                os.tecnico.nome
                              );
                            }}
                            className="flex-shrink-0 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 
                                      rounded transition-colors cursor-pointer"
                            title="Definir técnico"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 truncate my-auto flex-1 min-w-0">
                        <span className="font-bold text-md truncate">
                          {os.tecnico.nome}
                        </span>
                        {os.tecnico.tipo && (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                              os.tecnico.tipo === "interno"
                                ? "bg-blue-50 text-blue-600 border border-blue-100"
                                : os.tecnico.tipo === "terceiro"
                                ? "bg-amber-50 text-amber-600 border border-amber-100"
                                : ""
                            }`}
                          >
                            {os.tecnico.tipo === "interno"
                              ? "Interno"
                              : "Terceiro"}
                          </span>
                        )}
                        {onAlterarTecnico && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAlterarTecnico(
                                os.id_os,
                                os.tecnico.id,
                                os.tecnico.nome
                              );
                            }}
                            className="flex-shrink-0 p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-100 
                                      rounded transition-colors cursor-pointer"
                            title="Alterar técnico"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-gray-500 my-auto" />
                    <span className="font-medium my-auto">
                      Abertura:{" "}
                      {formatarDataHora(os.abertura.data_abertura)?.data}
                    </span>
                  </div>

                  {os.data_agendada && (
                    <div
                      className={`flex items-center gap-1.5 text-sm ${
                        isDataAgendadaPassada(os.data_agendada)
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0 my-auto" />
                      <span className="font-medium my-auto">
                        Agendado: {formatarDataHora(os.data_agendada)?.data}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Technician button and expand indicator */}
          <div className="flex flex-col items-center justify-center gap-2 ml-3">
            {/* Expand indicator */}
            <div className="flex items-center justify-center">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-indigo-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details - Animação de expansão */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 animate-expandY origin-top">
          <div className="p-4">
            {/* Problema e informações adicionais */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Descrição do Problema e Abertura */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 transform transition-transform animate-fadeIn">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-indigo-500" />
                    <h4 className="font-bold text-gray-700">
                      {os.abertura.motivo_atendimento}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {onEditarOS && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditarOS(os.id_os);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 
                                hover:bg-indigo-100 rounded-md text-xs font-medium transition-colors 
                                border border-indigo-200 transform hover:scale-105 active:scale-95 cursor-pointer"
                        title="Editar Ordem de Serviço"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Editar OS
                      </button>
                    )}
                    {onCancelarOS && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCancelarOS(os.id_os);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 
                                hover:bg-red-100 rounded-md text-xs font-medium transition-colors 
                                border border-red-200 transform hover:scale-105 active:scale-95 cursor-pointer"
                        title="Cancelar Ordem de Serviço"
                      >
                        <FileX className="w-3.5 h-3.5" />
                        Cancelar OS
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-gray-800 text-sm mb-3 break-words whitespace-pre-wrap max-h-[250px] overflow-y-auto custom-scrollbar">
                  {os.descricao_problema || "Sem descrição fornecida"}
                </div>

                {/* Informações de Abertura */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-between text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-gray-500" />
                      <span>
                        Aberto por:{" "}
                        <span className="font-medium">
                          {os.abertura.nome_usuario} - (
                          {getFormaAberturaTexto(os.abertura.forma_abertura)})
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Informação de Liberação Financeira */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {os.liberacao_financeira.liberada ? (
                        <span className="text-emerald-600 text-xs flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Liberação financeira:{" "}
                          <span className="font-medium">
                            {os.liberacao_financeira.nome_usuario_liberacao}
                            {" em "}
                            {os.liberacao_financeira.data_liberacao}
                          </span>
                        </span>
                      ) : (
                        <span className="text-red-600 text-xs flex items-center gap-1">
                          <AlertOctagon className="w-3 h-3" />
                          Aguardando liberação financeira
                        </span>
                      )}
                    </div>

                    {/* Botão Liberar quando estiver aguardando liberação financeira */}
                    {!os.liberacao_financeira.liberada &&
                      onLiberarFinanceiramente && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onLiberarFinanceiramente(os.id_os);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 
                                  hover:bg-green-100 rounded-md text-xs font-medium transition-colors 
                                  border border-green-200 transform hover:scale-105 active:scale-95 cursor-pointer"
                          title="Liberar financeiramente"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          Liberar
                        </button>
                      )}
                  </div>
                </div>

                {/* Motivo Pendência quando existir */}
                {os.situacao_os.motivo_pendencia && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between text-xs text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-gray-500" />
                        <span className="flex items-center gap-1 pt-0.5">
                          Motivo da Pendência:
                          <span className="text-gray-600 font-normal">
                            {os.situacao_os.motivo_pendencia}
                          </span>
                        </span>
                      </div>

                      {onAlterarPendencia && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAlterarPendencia(
                              os.id_os,
                              os.situacao_os.id_motivo_pendencia,
                              os.situacao_os.motivo_pendencia
                            );
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 
            hover:bg-amber-100 rounded-md text-xs font-medium transition-colors 
            border border-amber-200 transform hover:scale-105 active:scale-95 cursor-pointer"
                          title="Alterar pendência"
                        >
                          <Edit className="w-3 h-3" />
                          Alterar
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {/* Observações do técnico quando existirem */}
                {os.tecnico.observacoes && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-indigo-500" />
                      <h4 className="font-medium text-gray-700 flex items-center gap-2">
                        Observações do Técnico
                        {os.tecnico.tipo && (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                              os.tecnico.tipo === "interno"
                                ? "bg-blue-50 text-blue-600 border border-blue-100"
                                : os.tecnico.tipo === "terceiro"
                                ? "bg-amber-50 text-amber-600 border border-amber-100"
                                : ""
                            }`}
                          >
                            {os.tecnico.tipo === "interno"
                              ? "Interno"
                              : "Terceiro"}
                          </span>
                        )}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
                      {os.tecnico.observacoes}
                    </p>
                  </div>
                )}
              </div>

              {/* Endereço e Contato */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 transform transition-transform animate-fadeIn delay-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    <h4 className="font-medium text-gray-700">
                      Endereço Completo
                    </h4>
                  </div>
                  <a
                    href={`/admin/cadastro/clientes?focusClienteId=${os.cliente.id}`}
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Salvar os filtros na sessão
                      if (typeof window !== "undefined" && os.cliente.nome) {
                        try {
                          // Criar objeto de filtro para aplicar na tela de clientes
                          const filtro = {
                            nome: os.cliente.nome || "",
                            uf: "",
                            incluir_inativos: "",
                            id_regiao: "",
                          };

                          // Salvar o filtro na sessão para que seja aplicado quando a página de clientes carregar
                          const filterKey =
                            "filters_id_regiao_incluir_inativos_nome_uf";
                          const filterStateKey = `${filterKey}_state`;

                          const filterState = {
                            showMenu: false,
                            panelFilters: filtro,
                            appliedFilters: filtro,
                          };

                          sessionStorage.setItem(
                            filterStateKey,
                            JSON.stringify(filterState)
                          );
                          sessionStorage.setItem(
                            filterKey,
                            JSON.stringify(filtro)
                          );

                          // Salvar o ID do cliente - a página de clientes verificará
                          // se há contatos antes de expandir automaticamente
                          sessionStorage.setItem(
                            "expandClienteId",
                            String(os.cliente.id)
                          );
                        } catch (error) {
                          console.error(
                            "Erro ao salvar filtros na sessão:",
                            error
                          );
                        }
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 
                             hover:bg-indigo-100 rounded-md text-xs font-medium transition-colors 
                             border border-indigo-200 transform hover:scale-105 active:scale-95 cursor-pointer"
                    title="Editar dados do cliente"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Editar Cliente
                  </a>
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  {os.cliente.endereco ? (
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 flex-1">
                          <p>
                            {os.cliente.endereco}, {os.cliente.numero} -{" "}
                            {os.cliente.bairro}, {os.cliente.cidade}/
                            {os.cliente.uf}
                          </p>
                          {os.cliente.complemento && (
                            <p>Complemento: {os.cliente.complemento}</p>
                          )}
                          {os.cliente.cep && <p>CEP: {os.cliente.cep}</p>}
                        </div>

                        {/* Google Maps Button */}
                        <div className="ml-2 flex-shrink-0">
                          <a
                            href={formatGoogleMapsUrl(os.cliente)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 
                                      rounded-lg text-xs font-medium transition-colors border border-blue-200
                                      transform hover:scale-105 active:scale-95"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            Google Maps
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">
                      Endereço não cadastrado
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-indigo-500" />
                    <h4 className="font-medium text-gray-700">Contato</h4>
                  </div>

                  <div className="text-sm space-y-2">
                    {os.contato.nome && (
                      <div className="flex items-center gap-1.5 text-gray-600 mb-1">
                        <span className="">
                          {os.contato.nome}{" "}
                          {os.contato.cargo && ` - ${os.contato.cargo}`}
                        </span>
                      </div>
                    )}

                    {/* Telefone */}
                    {os.contato.telefone && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Phone className="w-3 h-3 text-gray-600" />
                          <span>{os.contato.telefone}</span>
                        </div>
                      </div>
                    )}

                    {/* WhatsApp Button */}
                    {os.contato.whatsapp && (
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <MessageCircle className="w-3 h-3 text-gray-600" />
                          <span>{os.contato.whatsapp}</span>
                        </div>
                        <a
                          href={formatWhatsAppUrl(os.contato.telefone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 
                                    hover:bg-emerald-100 rounded-md text-xs font-medium transition-colors 
                                    border border-emerald-200 transform hover:scale-105 active:scale-95"
                        >
                          <MessageCircle className="w-3 h-3" />
                          WhatsApp
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    )}

                    {/* Email */}
                    {os.contato.email && (
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Mail className="w-3 h-3 text-gray-600" />
                          <span>{os.contato.email}</span>
                        </div>

                        {/* Email Button */}
                        <a
                          href={formatEmailUrl(os.contato.email)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 
                                    hover:bg-blue-100 rounded-md text-xs font-medium transition-colors 
                                    border border-blue-200 transform hover:scale-105 active:scale-95"
                        >
                          <Mail className="w-3 h-3" />
                          Enviar email
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(OSCard);
