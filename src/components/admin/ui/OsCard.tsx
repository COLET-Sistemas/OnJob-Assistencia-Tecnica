"use client";

import React from "react";
import { formatarData } from "@/utils/formatters";
import {
  Clock,
  CloudDrizzle,
  Check,
  X,
  Eye,
  MapPin,
  Cpu,
  User,
  Calendar,
} from "lucide-react";

interface OrdemServico {
  id_os: number;
  descricao_problema: string;
  em_garantia: boolean;
  abertura: {
    data_abertura: string;
    forma_abertura: string;
    origem_abertura: string;
    nome_usuario: string;
    motivo_atendimento: string;
  };
  data_agendada: string;
  data_fechamento: string;
  cliente: {
    nome: string;
    endereco: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
    latitude: string;
    longitude: string;
  };
  contato: {
    nome: string;
    telefone: string;
    whatsapp: string;
    email: string;
  };
  maquina: {
    numero_serie: string;
    descricao: string;
    modelo: string;
  };
  situacao_os: {
    codigo: number;
    descricao: string;
    data_situacao?: string;
    motivo_pendencia: string;
  };
  tecnico: {
    nome: string;
    observacoes: string;
  };
  liberacao_financeira: {
    liberada: boolean;
    nome_usuario_liberacao: string;
  };
}

interface OsCardProps {
  os: OrdemServico;
}

const OsCard: React.FC<OsCardProps> = ({ os }) => {
  // Função para obter a cor baseada na situação
  const getStatusColor = (codigo: number): string => {
    switch (codigo) {
      case 1: // Pendente
        return "#F6C647";
      case 2: // Em Andamento
        return "#75FABD";
      case 3: // Concluída
        return "#4ADE80";
      case 4: // Cancelada
        return "#FF5757";
      case 5: // Em Espera
        return "#7C54BD";
      default:
        return "#6B7280";
    }
  };

  // Função para determinar o ícone da situação
  const getSituacaoIcon = () => {
    switch (os.situacao_os.codigo) {
      case 1: // Pendente
        return <Clock className="h-4 w-4" />;
      case 2: // Em Andamento
        return <CloudDrizzle className="h-4 w-4" />;
      case 3: // Concluída
        return <Check className="h-4 w-4" />;
      case 4: // Cancelada
        return <X className="h-4 w-4" />;
      case 5: // Em Espera
        return <Eye className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 h-full flex flex-col">
      {/* Cabeçalho com informações principais */}
      <div
        className="p-3 relative border-b"
        style={{ borderColor: `${getStatusColor(os.situacao_os.codigo)}40` }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-gray-700 text-lg">#{os.id_os}</span>
            <span
              className="font-bold text-gray-800 truncate max-w-[140px] sm:max-w-[180px]"
              title={os.cliente.nome}
            >
              {os.cliente.nome}
            </span>
          </div>

          <span
            className="px-2.5 py-1 rounded-md text-xs font-medium flex items-center"
            style={{
              backgroundColor: `${getStatusColor(os.situacao_os.codigo)}20`,
              color: getStatusColor(os.situacao_os.codigo),
              borderLeft: `3px solid ${getStatusColor(os.situacao_os.codigo)}`,
            }}
          >
            <span className="mr-1.5">{getSituacaoIcon()}</span>
            {os.situacao_os.descricao}
          </span>
        </div>

        {/* Localização */}
        <div className="flex items-center text-xs text-gray-500">
          <MapPin className="h-3.5 w-3.5 mr-1" />
          <span>
            {os.cliente.cidade}/{os.cliente.uf}
          </span>
        </div>
      </div>

      {/* Corpo do card com informações relevantes */}
      <div className="p-3 flex-1 flex flex-col">
        {/* Máquina */}
        <div className="mb-2">
          <div className="flex items-center">
            <Cpu className="h-3 w-3 mr-1.5 text-gray-500" />
            <p className="text-xs font-medium text-gray-800">
              {os.maquina.modelo || os.maquina.descricao}
              {os.maquina.numero_serie && (
                <span className="text-[10px] text-gray-500 ml-1">
                  (S/N: {os.maquina.numero_serie})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Técnico */}
        <div className="mb-2">
          <div className="flex items-center">
            <User className="h-3 w-3 mr-1.5 text-gray-500" />
            <p
              className={`text-xs font-medium ${
                os.tecnico?.nome ? "text-gray-800" : "text-red-500"
              }`}
            >
              {os.tecnico?.nome || "Indefinido"}
            </p>
          </div>
        </div>

        {/* Datas */}
        <div className="flex flex-wrap gap-3 mb-3">
          <div className="flex-grow min-w-[45%]">
            <div className="flex items-center text-xs text-gray-500 mb-1">
              <Calendar className="h-3 w-3 mr-1" />
              <span>ABERTURA</span>
            </div>
            <p className="text-xs font-medium text-gray-700">
              {os.abertura.data_abertura
                ? formatarData(os.abertura.data_abertura)
                : "-"}
            </p>
          </div>
          {os.data_agendada && (
            <div className="flex-grow min-w-[45%]">
              <div className="flex items-center text-xs text-gray-500 mb-1">
                <Calendar className="h-3 w-3 mr-1" />
                <span>AGENDADA</span>
              </div>
              <p className="text-xs font-medium text-gray-700">
                {formatarData(os.data_agendada)}
              </p>
            </div>
          )}
        </div>

        {/* Descrição do problema - sem título e com fundo diferente */}
        <div className="mt-auto">
          <div
            className="text-xs text-gray-700 bg-gray-50 p-2 rounded-md border border-gray-100 break-words whitespace-pre-wrap max-h-[80px] overflow-y-auto custom-scrollbar"
            title={os.descricao_problema}
          >
            {os.descricao_problema || "Sem descrição"}
          </div>
        </div>

        {/* Tags importantes */}
        <div className="flex flex-wrap gap-1 mt-2">
          {os.em_garantia && (
            <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
              Em Garantia
            </span>
          )}
          {!os.liberacao_financeira.liberada && (
            <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
              Pendência Financeira
            </span>
          )}
          {os.situacao_os.motivo_pendencia && (
            <span
              className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded truncate max-w-full"
              title={os.situacao_os.motivo_pendencia}
            >
              {os.situacao_os.motivo_pendencia}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default OsCard;
