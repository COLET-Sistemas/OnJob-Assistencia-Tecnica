"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ordensServicoService } from "@/api/services/ordensServicoService";
import { formatarDataHora } from "@/utils/formatters";
import { Loading } from "@/components/LoadingPersonalizado";
import { CheckCircle, AlertTriangle, FileText, Clock } from "lucide-react";

// Tipos
interface OrdemServico {
  id: number;
  numero_os: string;
  data_abertura: string;
  data_agendada?: string;
  data_fechamento?: string;
  data_revisao?: string;
  cliente: {
    id: number;
    nome_fantasia: string;
    endereco?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade: string;
    uf: string;
    cep?: string;
  };
  contato?: {
    nome: string;
    telefone: string;
    email?: string;
  };
  maquina: {
    id: number;
    numero_serie: string;
    descricao?: string;
    modelo?: string;
  };
  status: number; // Código do status
  status_descricao: string; // Descrição do status
  tecnico?: {
    id: number;
    nome: string;
  };
  motivo_atendimento: {
    id: number;
    descricao: string;
  };
  motivo_pendencia?: {
    id: number;
    descricao: string;
  };
  comentarios_pendencia?: string;
  em_garantia?: boolean;
  descricao_problema?: string;
  regiao: {
    id: number;
    nome: string;
  };
  historico: OSHistorico[];
  fats?: OSFat[];
  revisao?: OSRevisao;
}

interface OSHistorico {
  id: number;
  data_hora: string;
  usuario: {
    id: number;
    nome: string;
  };
  status_anterior: string;
  status_atual: string;
  comentario: string;
}

interface OSFat {
  id: number;
  data_inicio: string;
  data_fim: string;
  tecnico: {
    id: number;
    nome: string;
  };
  observacoes: string;
  pecas_utilizadas: OSPeca[];
}

interface OSPeca {
  id: number;
  peca: {
    id: number;
    nome: string;
  };
  quantidade: number;
  valor_unitario: number;
}

interface OSRevisao {
  id: number;
  data_revisao: string;
  usuario: {
    id: number;
    nome: string;
  };
  observacoes: string;
}

const ImprimirOS = () => {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0] || "";

  const [os, setOS] = useState<OrdemServico | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOS = async () => {
      try {
        if (!id) {
          setError("ID da OS não informado");
          setLoading(false);
          return;
        }

        const osData = await ordensServicoService.getById(Number(id));
        setOS(osData);

        // Após carregar os dados, acionar a impressão automaticamente
        setTimeout(() => {
          window.print();
        }, 1000);
      } catch (err) {
        console.error("Erro ao carregar OS:", err);
        setError("Erro ao carregar detalhes da ordem de serviço");
      } finally {
        setLoading(false);
      }
    };

    loadOS();
  }, [id]);

  if (loading) {
    return <Loading text="Carregando dados para impressão..." fullScreen />;
  }

  if (error || !os) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <h2 className="text-xl font-bold">Erro</h2>
          <p>{error || "Não foi possível carregar os dados da OS"}</p>
        </div>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 bg-gray-200 rounded-lg mt-4"
        >
          Fechar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto print:mx-0 print:max-w-none print:p-4">
      {/* Cabeçalho da Impressão */}
      <div className="flex items-center justify-between mb-8 print:mb-6 border-b pb-4">
        <div className="flex items-center gap-4">
          <div className="hidden print:block">
            <FileText size={40} className="text-gray-700" />
          </div>
          <div className="print:hidden">
            <FileText size={32} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 print:text-xl">
              Ordem de Serviço #{os.id}
            </h1>
            <p className="text-gray-600">
              Emitido em: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="print:hidden">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Status da OS */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold text-gray-800">Status da OS</h2>
          <div
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              os.status === 1
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : os.status === 2
                ? "bg-purple-100 text-purple-800 border border-purple-200"
                : os.status === 3
                ? "bg-amber-100 text-amber-800 border border-amber-200"
                : os.status === 4
                ? "bg-blue-100 text-blue-800 border border-blue-200"
                : os.status === 5
                ? "bg-red-100 text-red-800 border border-red-200"
                : os.status === 6
                ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                : os.status === 7
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-gray-100 text-gray-800 border border-gray-200"
            }`}
          >
            {os.status_descricao}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-md">
          <div>
            <p className="text-sm text-gray-600">Data de Abertura:</p>
            <p className="font-medium">
              {formatarDataHora(os.data_abertura)?.data || "N/A"}
            </p>
          </div>

          {os.data_agendada && (
            <div>
              <p className="text-sm text-gray-600">Data Agendada:</p>
              <p className="font-medium">
                {formatarDataHora(os.data_agendada)?.data || "N/A"}
              </p>
            </div>
          )}

          {os.data_fechamento && (
            <div>
              <p className="text-sm text-gray-600">Data de Fechamento:</p>
              <p className="font-medium">
                {formatarDataHora(os.data_fechamento)?.data || "N/A"}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm text-gray-600">Em Garantia:</p>
            <p className="font-medium">{os.em_garantia ? "Sim" : "Não"}</p>
          </div>
        </div>
      </div>

      {/* Informações do Cliente e Máquina */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="border rounded-md p-4">
          <h3 className="font-semibold text-gray-800 mb-3">
            Informações do Cliente
          </h3>
          <div className="space-y-2">
            <p>
              <span className="text-gray-600 text-sm">Nome:</span>{" "}
              <span className="font-medium">{os.cliente.nome_fantasia}</span>
            </p>

            {os.cliente.endereco && (
              <p>
                <span className="text-gray-600 text-sm">Endereço:</span>{" "}
                <span>
                  {os.cliente.endereco}, {os.cliente.numero}
                  {os.cliente.complemento && ` - ${os.cliente.complemento}`}
                  {os.cliente.bairro && `, ${os.cliente.bairro}`}
                </span>
              </p>
            )}

            <p>
              <span className="text-gray-600 text-sm">Cidade/UF:</span>{" "}
              <span>
                {os.cliente.cidade}/{os.cliente.uf}
              </span>
            </p>

            {os.cliente.cep && (
              <p>
                <span className="text-gray-600 text-sm">CEP:</span>{" "}
                <span>{os.cliente.cep}</span>
              </p>
            )}

            {os.contato && (
              <>
                <p>
                  <span className="text-gray-600 text-sm">Contato:</span>{" "}
                  <span>{os.contato.nome}</span>
                </p>
                <p>
                  <span className="text-gray-600 text-sm">Telefone:</span>{" "}
                  <span>{os.contato.telefone}</span>
                </p>
                {os.contato.email && (
                  <p>
                    <span className="text-gray-600 text-sm">Email:</span>{" "}
                    <span>{os.contato.email}</span>
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="border rounded-md p-4">
          <h3 className="font-semibold text-gray-800 mb-3">
            Informações da Máquina
          </h3>
          <div className="space-y-2">
            <p>
              <span className="text-gray-600 text-sm">Descrição:</span>{" "}
              <span className="font-medium">
                {os.maquina.descricao || os.maquina.modelo || "N/A"}
              </span>
            </p>
            <p>
              <span className="text-gray-600 text-sm">Número de Série:</span>{" "}
              <span>{os.maquina.numero_serie}</span>
            </p>
            <p>
              <span className="text-gray-600 text-sm">Região:</span>{" "}
              <span>{os.regiao.nome}</span>
            </p>
            {os.tecnico && (
              <p>
                <span className="text-gray-600 text-sm">
                  Técnico Responsável:
                </span>{" "}
                <span className="font-medium">{os.tecnico.nome}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Descrição do Problema e Motivo */}
      <div className="border rounded-md p-4 mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">
          Detalhes do Atendimento
        </h3>
        <div className="space-y-3">
          <p>
            <span className="text-gray-600 text-sm">
              Motivo do Atendimento:
            </span>{" "}
            <span className="font-medium">
              {os.motivo_atendimento.descricao}
            </span>
          </p>

          {os.descricao_problema && (
            <div>
              <p className="text-gray-600 text-sm mb-1">
                Descrição do Problema:
              </p>
              <p className="bg-gray-50 p-3 rounded border border-gray-100">
                {os.descricao_problema}
              </p>
            </div>
          )}

          {os.motivo_pendencia && (
            <div>
              <p className="text-amber-600 text-sm mb-1">
                Motivo da Pendência:
              </p>
              <p className="bg-amber-50 p-3 rounded border border-amber-100">
                {os.motivo_pendencia.descricao}
                {os.comentarios_pendencia && (
                  <span className="block mt-2 text-amber-800">
                    Observações: {os.comentarios_pendencia}
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FATs - Formulários de Atendimento Técnico */}
      {os.fats && os.fats.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">
            Formulários de Atendimento Técnico ({os.fats.length})
          </h3>

          <div className="space-y-4">
            {os.fats.map((fat, index) => (
              <div key={fat.id} className="border rounded-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800">
                    FAT #{index + 1} - ID: {fat.id}
                  </h4>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock size={14} />
                    <span>
                      {formatarDataHora(fat.data_inicio)?.data} -{" "}
                      {formatarDataHora(fat.data_fim)?.data}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <span className="text-gray-600 text-sm">Técnico:</span>{" "}
                  <span className="font-medium">{fat.tecnico.nome}</span>
                </div>

                {fat.observacoes && (
                  <div className="mb-3">
                    <span className="text-gray-600 text-sm">Observações:</span>
                    <p className="bg-gray-50 p-2 rounded mt-1 border border-gray-100">
                      {fat.observacoes}
                    </p>
                  </div>
                )}

                {/* Peças utilizadas */}
                {fat.pecas_utilizadas && fat.pecas_utilizadas.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      Peças Utilizadas
                    </h5>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-600">
                            Peça
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-center text-xs font-medium text-gray-600">
                            Qtd.
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-right text-xs font-medium text-gray-600">
                            Valor Unit.
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-right text-xs font-medium text-gray-600">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {fat.pecas_utilizadas.map((peca) => (
                          <tr key={peca.id}>
                            <td className="border border-gray-200 px-3 py-2 text-sm">
                              {peca.peca.nome}
                            </td>
                            <td className="border border-gray-200 px-3 py-2 text-sm text-center">
                              {peca.quantidade}
                            </td>
                            <td className="border border-gray-200 px-3 py-2 text-sm text-right">
                              R$ {peca.valor_unitario.toFixed(2)}
                            </td>
                            <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-right">
                              R${" "}
                              {(peca.quantidade * peca.valor_unitario).toFixed(
                                2
                              )}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td
                            colSpan={3}
                            className="border border-gray-200 px-3 py-2 text-sm font-medium text-right"
                          >
                            Total:
                          </td>
                          <td className="border border-gray-200 px-3 py-2 text-sm font-medium text-right">
                            R${" "}
                            {fat.pecas_utilizadas
                              .reduce(
                                (total, peca) =>
                                  total + peca.quantidade * peca.valor_unitario,
                                0
                              )
                              .toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informações de Revisão */}
      {os.revisao && (
        <div className="border rounded-md p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} className="text-green-600" />
            <h3 className="font-semibold text-gray-800">Revisão da OS</h3>
          </div>

          <div className="space-y-3">
            <p>
              <span className="text-gray-600 text-sm">Data da Revisão:</span>{" "}
              <span className="font-medium">
                {formatarDataHora(os.revisao.data_revisao)?.data || "N/A"}
              </span>
            </p>

            <p>
              <span className="text-gray-600 text-sm">Revisado por:</span>{" "}
              <span className="font-medium">{os.revisao.usuario.nome}</span>
            </p>

            {os.revisao.observacoes && (
              <div>
                <p className="text-gray-600 text-sm mb-1">Observações:</p>
                <p className="bg-gray-50 p-3 rounded border border-gray-100">
                  {os.revisao.observacoes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Histórico de Alterações */}
      <div className="border rounded-md p-4 mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">
          Histórico de Alterações
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-600">
                  Data/Hora
                </th>
                <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-600">
                  Usuário
                </th>
                <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-600">
                  De
                </th>
                <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-600">
                  Para
                </th>
                <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-600">
                  Comentário
                </th>
              </tr>
            </thead>
            <tbody>
              {os.historico && os.historico.length > 0 ? (
                os.historico.map((item) => (
                  <tr key={item.id}>
                    <td className="border border-gray-200 px-3 py-2 text-sm">
                      {formatarDataHora(item.data_hora)?.data || "N/A"}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-sm">
                      {item.usuario.nome}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-sm">
                      {item.status_anterior || "-"}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-sm">
                      {item.status_atual}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-sm">
                      {item.comentario || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="border border-gray-200 px-3 py-2 text-sm text-center text-gray-500"
                  >
                    Sem registros de histórico
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assinaturas */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-16 print:mt-8">
        <div className="text-center">
          <div className="border-t border-gray-300 pt-2 mx-auto w-48">
            <p className="text-gray-600 text-sm">Assinatura do Técnico</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-300 pt-2 mx-auto w-48">
            <p className="text-gray-600 text-sm">Assinatura do Cliente</p>
          </div>
        </div>
      </div>

      {/* Rodapé da página impressa */}
      <div className="mt-16 text-center text-gray-500 text-xs border-t border-gray-100 pt-4 print:mt-8">
        <p>Documento gerado em {new Date().toLocaleString()}</p>
        <p>Sistema de Gerenciamento de Assistência Técnica</p>
      </div>

      {/* Estilos para impressão */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm 10mm 10mm 10mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          button,
          .print-hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ImprimirOS;
