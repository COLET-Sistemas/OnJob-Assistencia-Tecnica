"use client";

import React from "react";
import { formatarData } from "@/utils/formatters";

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
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 2: // Em Andamento
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
            />
          </svg>
        );
      case 3: // Concluída
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 4: // Cancelada
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 5: // Em Espera
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 h-full flex flex-col">
      {/* Cabeçalho com informações principais */}
      <div
        className="p-4 relative border-b"
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
        <div className="flex items-center text-xs text-gray-500 mt-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>
            {os.cliente.cidade}/{os.cliente.uf}
          </span>
        </div>
      </div>

      {/* Corpo do card com informações relevantes */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Máquina */}
        <div className="mb-3">
          <div className="flex items-center text-xs text-gray-500 mb-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
              />
            </svg>
            <span>MÁQUINA</span>
          </div>
          <p className="text-sm font-medium text-gray-800">
            {os.maquina.modelo || os.maquina.descricao}
            {os.maquina.numero_serie && (
              <span className="text-xs text-gray-500 ml-1">
                (S/N: {os.maquina.numero_serie})
              </span>
            )}
          </p>
        </div>

        {/* Técnico */}
        <div className="mb-3">
          <div className="flex items-center text-xs text-gray-500 mb-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span>TÉCNICO</span>
          </div>
          <p className="text-sm font-medium text-gray-800">
            {os.tecnico.nome || "Não atribuído"}
          </p>
        </div>

        {/* Datas */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="flex items-center text-xs text-gray-500 mb-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5 mr-1.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>ABERTURA</span>
            </div>
            <p className="text-xs font-medium text-gray-700">
              {os.abertura.data_abertura
                ? formatarData(os.abertura.data_abertura)
                : "-"}
            </p>
          </div>
          <div>
            <div className="flex items-center text-xs text-gray-500 mb-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5 mr-1.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>AGENDADA</span>
            </div>
            <p className="text-xs font-medium text-gray-700">
              {os.data_agendada
                ? formatarData(os.data_agendada)
                : "Não agendada"}
            </p>
          </div>
        </div>

        {/* Descrição do problema */}
        <div className="mt-auto">
          <div className="flex items-center text-xs text-gray-500 mb-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>PROBLEMA</span>
          </div>
          <p
            className="text-sm line-clamp-2 text-gray-700"
            title={os.descricao_problema}
          >
            {os.descricao_problema || "Sem descrição"}
          </p>
        </div>

        {/* Tags importantes */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {os.em_garantia && (
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
              Em Garantia
            </span>
          )}
          {!os.liberacao_financeira.liberada && (
            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
              Pendência Financeira
            </span>
          )}
          {os.situacao_os.motivo_pendencia && (
            <span
              className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded truncate max-w-full"
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
