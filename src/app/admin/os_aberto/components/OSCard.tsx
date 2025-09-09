import React from "react";
import { OrdemServico } from "../../../../types/OrdemServico";
import {
  Calendar,
  User,
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
}) => {
  // Função para determinar a cor baseada no código da situação
  const getSituacaoColor = (codigo: number) => {
    switch (codigo) {
      case 1:
        return "bg-emerald-500";
      case 2:
        return "bg-purple-500";
      case 3:
        return "bg-amber-500";
      case 4:
        return "bg-blue-500";
      default:
        return "bg-red-500";
    }
  };

  // Função para determinar a cor da badge de situação
  const getSituacaoBadgeColor = (codigo: number) => {
    switch (codigo) {
      case 1:
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case 2:
        return "bg-purple-100 text-purple-800 border border-purple-200";
      case 3:
        return "bg-amber-100 text-amber-800 border border-amber-200";
      case 4:
        return "bg-blue-100 text-blue-800 border border-blue-200";
      default:
        return "bg-red-100 text-red-800 border border-red-200";
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-300 
                overflow-hidden animate-fadeIn ${
                  isExpanded
                    ? "border-indigo-200 translate-y-[-2px]"
                    : "border-gray-100 hover:translate-y-[-2px]"
                }`}
    >
      {/* Compact Header - Always Visible */}
      <div className="p-5">
        <div className="flex items-center justify-between">
          {/* Left side - Main info */}
          <div className="flex items-center space-x-4 lg:space-x-6 flex-1">
            {/* Status indicator */}
            <div
              className={`w-2 h-16 rounded-sm hidden sm:block ${getSituacaoColor(
                os.situacao_os.codigo
              )}`}
              aria-hidden="true"
            ></div>

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
                    {os.tecnico.nome ? (
                      <div className="flex items-center gap-1.5 truncate my-auto">
                        <span className="font-bold text-md truncate">
                          {os.tecnico.nome}
                        </span>
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
                      </div>
                    ) : (
                      <span className="text-red-600 font-medium my-auto">
                        Técnico indefinido
                      </span>
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

          {/* Right side - Status and Actions */}
          <div className="flex flex-col items-end gap-2 ml-3">
            <div className="flex flex-wrap gap-2 justify-end">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${getSituacaoBadgeColor(
                  os.situacao_os.codigo
                )}`}
              >
                <span className="my-auto">{os.situacao_os.descricao}</span>
              </span>
            </div>

            <button
              onClick={() => toggleCardExpansion(os.id_os)}
              className={`cursor-pointer p-2 rounded-lg transition-all duration-200 flex items-center justify-center ${
                isExpanded
                  ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-transparent"
              }`}
              aria-label={isExpanded ? "Esconder detalhes" : "Mostrar detalhes"}
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 my-auto cursor-pointer" />
              ) : (
                <ChevronDown className="w-5 h-5 my-auto cursor-pointer" />
              )}
            </button>
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
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-indigo-500" />
                  <h4 className="font-medium text-gray-700">
                    Descrição do Problema
                  </h4>
                </div>
                <p className="text-gray-800 text-sm mb-3">
                  {os.descricao_problema || "Sem descrição fornecida"}
                </p>

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
                          </span>
                        </span>
                      ) : (
                        <span className="text-amber-600 text-xs flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
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
                    <div className="text-xs text-gray-700 mb-1 font-medium">
                      Motivo da Pendência:
                    </div>
                    <div className="px-3 py-1.5 bg-orange-50 border border-orange-100 rounded text-orange-700 text-xs">
                      {os.situacao_os.motivo_pendencia}
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
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                  <h4 className="font-medium text-gray-700">
                    Endereço Completo
                  </h4>
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
                    <Phone className="w-4 h-4 text-indigo-500" />
                    <h4 className="font-medium text-gray-700">Contato</h4>
                  </div>

                  <div className="text-sm space-y-2">
                    <div className="flex items-center justify-between">
                      {os.contato.telefone && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Phone className="w-3 h-3 text-gray-600" />
                          <span>{os.contato.telefone}</span>
                          {os.contato.whatsapp && (
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </div>
                      )}
                      {/* WhatsApp Button */}
                      {os.contato.whatsapp && (
                        <a
                          href={formatWhatsAppUrl(os.contato.telefone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 
                                    hover:bg-emerald-100 rounded-md text-xs font-medium transition-colors 
                                    border border-emerald-200 transform hover:scale-105 active:scale-95"
                        >
                          <MessageCircle className="w-3 h-3" />
                          WhatsApp
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>

                    {os.contato.email && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Mail className="w-3 h-3 text-gray-600" />
                          <span>{os.contato.email}</span>
                        </div>

                        {/* Email Button */}
                        <a
                          href={formatEmailUrl(os.contato.email)}
                          target="_blank"
                          rel="noopener noreferrer"
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
