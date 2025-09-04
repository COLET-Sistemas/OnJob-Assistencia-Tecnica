"use client";

import React, { useState, useEffect } from "react";
import {
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  Printer,
  FileText,
} from "lucide-react";
import { useTitle } from "@/context/TitleContext";
import { Loading } from "@/components/LoadingPersonalizado";
import { ordensServicoService } from "@/api/services/ordensServicoService";
import { clientesService } from "@/api/services/clientesService";
import { usuariosService } from "@/api/services/usuariosService";
import { maquinasService } from "@/api/services/maquinasService";
import { formatarDataHora } from "@/utils/formatters";
import { TableList } from "@/components/admin/common";
import { StatusBadge } from "@/components/admin/common";

// Interfaces para os tipos de dados usados na página
interface Cliente {
  id: number | undefined;
  nome: string;
}

interface Maquina {
  id: number;
  numero_serie: string;
  descricao: string;
}

interface Tecnico {
  id: number;
  nome: string;
}

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
  };
  maquina: {
    id: number;
    numero_serie: string;
    descricao?: string;
  };
  status: string | number;
  status_descricao: string;
  tecnico?: {
    id: number;
    nome: string;
  };
}

// Interface para a resposta da API com os itens para mapeamento
interface ApiItem {
  id: number;
  numero_os?: string;
  data_abertura: string;
  data_agendada?: string;
  data_fechamento?: string;
  data_revisao?: string;
  cliente: {
    id: number;
    nome_fantasia: string;
  };
  maquina: {
    id: number;
    numero_serie: string;
    descricao?: string;
  };
  status?: string | number;
  situacao_os?: {
    codigo: number | string;
    descricao: string;
  };
  status_descricao?: string;
  tecnico?: {
    id: number;
    nome: string;
  };
  motivo_atendimento?: {
    id: number;
    descricao: string;
  };
  motivo_pendencia?: {
    id: number;
    descricao: string;
  };
  comentarios_pendencia?: string;
  regiao?: {
    id: number;
    nome: string;
  };
  historico?: OSHistorico[];
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

interface OSDetalhada extends OrdemServico {
  motivo_atendimento: {
    id: number;
    descricao: string;
  };
  motivo_pendencia?: {
    id: number;
    descricao: string;
  };
  comentarios_pendencia?: string;
  regiao: {
    id: number;
    nome: string;
  };
  historico: OSHistorico[];
  fats: OSFat[];
  revisao?: OSRevisao;
}

interface FilterValues {
  status: string;
  cliente: string;
  maquina: string;
  tecnico: string;
  campo_data: string;
  data_inicial: string;
  data_final: string;
  numero_os: string;
  [key: string]: string; // Index signature para permitir acesso dinâmico
}

// Mapeamento de status para cores e estilos
const statusMapping: Record<
  string | number,
  { label: string; className: string }
> = {
  // Number-based status codes (new API)
  1: {
    label: "Pendente",
    className: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  },
  2: {
    label: "A Atender",
    className: "bg-purple-100 text-purple-800 border border-purple-200",
  },
  3: {
    label: "Em Deslocamento",
    className: "bg-amber-100 text-amber-800 border border-amber-200",
  },
  4: {
    label: "Em Atendimento",
    className: "bg-blue-100 text-blue-800 border border-blue-200",
  },
  5: {
    label: "Atendimento Interrompido",
    className: "bg-red-100 text-red-800 border border-red-200",
  },
  6: {
    label: "Em Revisão",
    className: "bg-indigo-100 text-indigo-800 border border-indigo-200",
  },
  7: {
    label: "Concluída",
    className: "bg-green-100 text-green-800 border border-green-200",
  },
  8: {
    label: "Cancelada",
    className: "bg-gray-100 text-gray-800 border border-gray-200",
  },
  9: {
    label: "Cancelada pelo Cliente",
    className: "bg-gray-100 text-gray-800 border border-gray-200",
  },

  // Letter-based status codes (old API)
  A: {
    label: "Aberta",
    className: "bg-purple-100 text-purple-800 border border-purple-200",
  },
  P: {
    label: "Pendente",
    className: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  },
  E: {
    label: "Em Execução",
    className: "bg-blue-100 text-blue-800 border border-blue-200",
  },
  F: {
    label: "Finalizada",
    className: "bg-green-100 text-green-800 border border-green-200",
  },
  C: {
    label: "Cancelada",
    className: "bg-gray-100 text-gray-800 border border-gray-200",
  },
};

const ConsultaOSPage: React.FC = () => {
  const { setTitle } = useTitle();
  const [loading, setLoading] = useState<boolean>(true);
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([]);
  const [osDetalhada, setOSDetalhada] = useState<OSDetalhada | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showFilter, setShowFilter] = useState<boolean>(false);

  // Listas para os selects
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);

  // Filtros
  const [filterValues, setFilterValues] = useState<FilterValues>({
    status: "",
    cliente: "",
    maquina: "",
    tecnico: "",
    campo_data: "abertura",
    data_inicial: "",
    data_final: "",
    numero_os: "",
  });

  useEffect(() => {
    setTitle("Consulta de Ordens de Serviço");
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setTitle]);

  // Função para mapear dados da API para o formato OrdemServico
  const mapToOrdemServico = (item: ApiItem): OrdemServico => {
    return {
      id: item.id,
      numero_os: item.numero_os || String(item.id),
      data_abertura: item.data_abertura,
      data_agendada: item.data_agendada,
      data_fechamento: item.data_fechamento,
      data_revisao: item.data_revisao,
      cliente: item.cliente,
      maquina: item.maquina,
      status: item.status || item.situacao_os?.codigo || 0,
      status_descricao:
        item.status_descricao || item.situacao_os?.descricao || "Desconhecido",
      tecnico: item.tecnico,
    };
  };

  // Função para mapear dados da API para o formato OSDetalhada
  const mapToOSDetalhada = (
    item: ApiItem,
    baseOS: OrdemServico
  ): OSDetalhada => {
    return {
      ...baseOS,
      motivo_atendimento: item.motivo_atendimento || {
        id: 0,
        descricao: "N/A",
      },
      motivo_pendencia: item.motivo_pendencia,
      comentarios_pendencia: item.comentarios_pendencia,
      regiao: item.regiao || { id: 0, nome: "N/A" },
      historico: item.historico || [],
      fats: item.fats || [],
      revisao: item.revisao,
    };
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Carregar dados para os filtros
      const [clientesResponse, tecnicosResponse] = await Promise.all([
        clientesService.getAll(),
        usuariosService.getAllTecnicos(),
      ]);

      // Mapear clientes para o formato esperado
      const clientesMapeados: Cliente[] = (clientesResponse.dados || []).map(
        (cliente) => ({
          id: cliente.id,
          nome:
            cliente.nome_fantasia || cliente.razao_social || "Cliente sem nome",
        })
      );

      setClientes(clientesMapeados);
      setTecnicos(tecnicosResponse.dados || []);

      // Buscar ordens de serviço (inicialmente sem filtros)
      const response = await ordensServicoService.getAll();

      // Transformar os dados da API para o formato OrdemServico
      const ordensFormatadas: OrdemServico[] = (response.dados || []).map(
        (item: ApiItem) => mapToOrdemServico(item)
      );

      setOrdensServico(ordensFormatadas);
    } catch (error) {
      console.error("Erro ao carregar dados iniciais:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMaquinasByCliente = async (clienteId: string) => {
    if (!clienteId) {
      setMaquinas([]);
      return;
    }

    try {
      const response = await maquinasService.getByClienteId(Number(clienteId));

      // Se a resposta for um array direto, usar como está, caso contrário acessar o campo dados
      const maquinasData = Array.isArray(response)
        ? response
        : response?.dados || [];

      setMaquinas(maquinasData);
    } catch (error) {
      console.error("Erro ao carregar máquinas do cliente:", error);
      setMaquinas([]);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filterValues, [key]: value };
    setFilterValues(newFilters);

    // Se o cliente mudar, carregamos as máquinas desse cliente
    if (key === "cliente") {
      loadMaquinasByCliente(value);
      // Limpar o filtro de máquina quando trocar o cliente
      setFilterValues({ ...newFilters, maquina: "" });
    }
  };

  const handleClearFilters = () => {
    setFilterValues({
      status: "",
      cliente: "",
      maquina: "",
      tecnico: "",
      campo_data: "abertura",
      data_inicial: "",
      data_final: "",
      numero_os: "",
    });
    setMaquinas([]);
  };

  const handleApplyFilters = async () => {
    try {
      setLoading(true);

      const params: Record<string, string | number> = {};

      if (filterValues.numero_os) {
        params.numero_os = filterValues.numero_os;
      } else {
        if (filterValues.status) params.situacao = filterValues.status;
        if (filterValues.cliente) params.id_cliente = filterValues.cliente;
        if (filterValues.maquina) params.id_maquina = filterValues.maquina;
        if (filterValues.tecnico) params.id_tecnico = filterValues.tecnico;

        if (filterValues.data_inicial && filterValues.campo_data) {
          params.campo_data = filterValues.campo_data;
          params.data_ini = filterValues.data_inicial;
        }

        if (filterValues.data_final && filterValues.campo_data) {
          params.campo_data = filterValues.campo_data;
          params.data_fim = filterValues.data_final;
        }
      }

      const response = await ordensServicoService.getAll(params);

      // Transformar os dados da API para o formato OrdemServico
      const ordensFormatadas: OrdemServico[] = (response.dados || []).map(
        (item: ApiItem) => mapToOrdemServico(item)
      );

      setOrdensServico(ordensFormatadas);
      setShowFilter(false);
    } catch (error) {
      console.error("Erro ao aplicar filtros:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (os: OrdemServico) => {
    try {
      setLoading(true);
      const response = await ordensServicoService.getById(os.id);

      // Transforme a resposta da API para o formato esperado pela interface OSDetalhada
      const detalhesOS = mapToOSDetalhada(response, os);

      setOSDetalhada(detalhesOS);
      setShowModal(true);
    } catch (error) {
      console.error("Erro ao carregar detalhes da OS:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintOS = (os: OSDetalhada) => {
    import("@/utils/printUtils").then(({ preparePrintableOS, printOS }) => {
      // Convert number status to string for the print utility
      const printData = {
        ...os,
        status: os.status.toString(),
      };
      const printableData = preparePrintableOS(printData);
      printOS(printableData);
    });
  };

  const filterOptions = [
    {
      id: "numero_os",
      label: "Número da OS",
      type: "text" as const,
      placeholder: "Digite o número da OS",
    },
    {
      id: "status",
      label: "Situação",
      type: "select" as const,
      options: [
        { value: "", label: "Todas as situações" },
        { value: "1", label: "Pendente" },
        { value: "2", label: "A Atender" },
        { value: "3", label: "Em Deslocamento" },
        { value: "4", label: "Em Atendimento" },
        { value: "5", label: "Atendimento Interrompido" },
        { value: "6", label: "Em Revisão" },
        { value: "7", label: "Concluída" },
        { value: "8", label: "Cancelada" },
        { value: "9", label: "Cancelada pelo Cliente" },
        { value: "1,2,3,4,5", label: "Todas Abertas" },
        { value: "6,7", label: "Todas Finalizadas" },
        { value: "8,9", label: "Todas Canceladas" },
      ],
    },
    {
      id: "cliente",
      label: "Cliente",
      type: "select" as const,
      options: [
        { value: "", label: "Todos os clientes" },
        ...clientes.map((cliente) => ({
          value: cliente.id?.toString() || "",
          label: cliente.nome,
        })),
      ],
    },
    {
      id: "maquina",
      label: "Máquina",
      type: "select" as const,
      options: [
        { value: "", label: "Todas as máquinas" },
        ...maquinas.map((maquina) => ({
          value: maquina.id.toString(),
          label: `${maquina.descricao} (${maquina.numero_serie})`,
        })),
      ],
    },
    {
      id: "tecnico",
      label: "Técnico",
      type: "select" as const,
      options: [
        { value: "", label: "Todos os técnicos" },
        ...tecnicos.map((tecnico) => ({
          value: tecnico.id.toString(),
          label: tecnico.nome,
        })),
      ],
    },
    {
      id: "campo_data",
      label: "Tipo de Data",
      type: "select" as const,
      options: [
        { value: "abertura", label: "Data de Abertura" },
        { value: "agendada", label: "Data Agendada" },
        { value: "fechamento", label: "Data de Fechamento" },
        { value: "revisao", label: "Data de Revisão" },
      ],
    },
    {
      id: "data_inicial",
      label: "Data Inicial",
      type: "text" as const,
      placeholder: "YYYY-MM-DD",
    },
    {
      id: "data_final",
      label: "Data Final",
      type: "text" as const,
      placeholder: "YYYY-MM-DD",
    },
  ];

  // Colunas para o TableList
  const columns = [
    {
      header: "OS #",
      accessor: (os: OrdemServico) => os.id,
      render: (os: OrdemServico) => (
        <span className="font-medium text-black">{os.id}</span>
      ),
    },
    {
      header: "Cliente",
      accessor: (os: OrdemServico) => os.cliente.nome_fantasia,
      render: (os: OrdemServico) => (
        <span className="text-black">{os.cliente.nome_fantasia}</span>
      ),
    },
    {
      header: "Máquina",
      accessor: (os: OrdemServico) => os.maquina.numero_serie,
      render: (os: OrdemServico) => (
        <div className="flex flex-col">
          <span className="text-black">{os.maquina.descricao || "N/A"}</span>
          <span className="text-xs text-black">{os.maquina.numero_serie}</span>
        </div>
      ),
    },
    {
      header: "Técnico",
      accessor: (os: OrdemServico) => os.tecnico?.nome || "Não atribuído",
      render: (os: OrdemServico) => (
        <span className="text-black">
          {os.tecnico?.nome || "Não atribuído"}
        </span>
      ),
    },
    {
      header: "Abertura",
      accessor: (os: OrdemServico) => os.data_abertura,
      render: (os: OrdemServico) => (
        <span className="text-black">
          {formatarDataHora(os.data_abertura)?.data || "N/A"}
        </span>
      ),
    },
    {
      header: "Situação",
      accessor: (os: OrdemServico) => os.status,
      render: (os: OrdemServico) => (
        <StatusBadge status={os.status.toString()} mapping={statusMapping} />
      ),
    },
  ];

  const renderActions = (os: OrdemServico) => (
    <div className="flex gap-2 justify-end">
      <button
        onClick={() => handleViewDetails(os)}
        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100 hover:bg-indigo-100 transition-colors"
      >
        Detalhes
      </button>
    </div>
  );

  return (
    <>
      {/* Cabeçalho personalizado */}
      <div className="mb-5 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <FileText size={24} className="text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              Consulta de Ordens de Serviço
            </h2>
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100"
          >
            <Filter size={16} />
            <span>Filtros</span>
          </button>
        </div>
      </div>

      {loading ? (
        <Loading text="Carregando ordens de serviço..." />
      ) : (
        <TableList
          title="Ordens de Serviço"
          items={ordensServico}
          keyField="id"
          columns={columns}
          renderActions={renderActions}
          showFilter={showFilter}
          filterOptions={filterOptions}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          onApplyFilters={handleApplyFilters}
          onFilterToggle={() => setShowFilter(!showFilter)}
          emptyStateProps={{
            title: "Nenhuma ordem de serviço encontrada",
            description: "Tente ajustar os filtros ou criar uma nova OS.",
          }}
        />
      )}

      {/* Modal de Detalhes da OS */}
      {showModal && osDetalhada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <FileText size={24} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Detalhes da OS #{osDetalhada.id}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {osDetalhada.cliente.nome_fantasia}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePrintOS(osDetalhada)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100"
                >
                  <Printer size={16} />
                  <span>Imprimir</span>
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Dados principais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3 border-b border-gray-200 pb-2">
                    Informações Gerais
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Status:</span>
                      <StatusBadge
                        status={osDetalhada.status.toString()}
                        mapping={statusMapping}
                      />
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Abertura:</span>{" "}
                      <span className="font-medium">
                        {formatarDataHora(osDetalhada.data_abertura)?.data ||
                          "N/A"}
                      </span>
                    </div>
                    {osDetalhada.data_agendada && (
                      <div>
                        <span className="text-sm text-gray-600">Agendada:</span>{" "}
                        <span className="font-medium">
                          {formatarDataHora(osDetalhada.data_agendada)?.data ||
                            "N/A"}
                        </span>
                      </div>
                    )}
                    {osDetalhada.data_fechamento && (
                      <div>
                        <span className="text-sm text-gray-600">
                          Fechamento:
                        </span>{" "}
                        <span className="font-medium">
                          {formatarDataHora(osDetalhada.data_fechamento)
                            ?.data || "N/A"}
                        </span>
                      </div>
                    )}
                    {osDetalhada.motivo_atendimento && (
                      <div>
                        <span className="text-sm text-gray-600">Motivo:</span>{" "}
                        <span className="font-medium">
                          {osDetalhada.motivo_atendimento.descricao}
                        </span>
                      </div>
                    )}
                    {osDetalhada.motivo_pendencia && (
                      <div className="bg-amber-50 p-2 rounded border border-amber-100">
                        <span className="text-sm text-amber-800">
                          Motivo da Pendência:
                        </span>{" "}
                        <span className="font-medium text-amber-800">
                          {osDetalhada.motivo_pendencia.descricao}
                        </span>
                        {osDetalhada.comentarios_pendencia && (
                          <p className="text-sm text-amber-700 mt-1">
                            {osDetalhada.comentarios_pendencia}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3 border-b border-gray-200 pb-2">
                    Cliente e Máquina
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Cliente:</span>{" "}
                      <span className="font-medium">
                        {osDetalhada.cliente.nome_fantasia}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Máquina:</span>{" "}
                      <span className="font-medium">
                        {osDetalhada.maquina.descricao || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">
                        Número de Série:
                      </span>{" "}
                      <span className="font-medium">
                        {osDetalhada.maquina.numero_serie}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Região:</span>{" "}
                      <span className="font-medium">
                        {osDetalhada.regiao?.nome || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3 border-b border-gray-200 pb-2">
                    Técnico
                  </h4>
                  {osDetalhada.tecnico ? (
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-600">Nome:</span>{" "}
                        <span className="font-medium">
                          {osDetalhada.tecnico.nome}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-amber-600 flex items-center gap-2">
                      <AlertTriangle size={16} />
                      <span>Técnico não atribuído</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Histórico de Alterações */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-3 border-b border-gray-200 pb-2">
                  Histórico de Alterações
                </h4>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Data/Hora
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Usuário
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Status Anterior
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Status Atual
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Comentário
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {osDetalhada.historico?.length > 0 ? (
                          osDetalhada.historico.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                {formatarDataHora(item.data_hora)?.data ||
                                  "N/A"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                {item.usuario.nome}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                {item.status_anterior || "-"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                {item.status_atual}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {item.comentario || "-"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-3 text-center text-sm text-gray-500"
                            >
                              Sem registros de histórico
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* FATs - Formulários de Atendimento Técnico */}
              {osDetalhada.fats && osDetalhada.fats.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-800 mb-3 border-b border-gray-200 pb-2">
                    Formulários de Atendimento Técnico (FATs)
                  </h4>
                  <div className="space-y-4">
                    {osDetalhada.fats.map((fat) => (
                      <div
                        key={fat.id}
                        className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-800">
                            FAT #{fat.id}
                          </h5>
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-gray-600" />
                            <span className="text-sm text-gray-600">
                              {formatarDataHora(fat.data_inicio)?.data} até{" "}
                              {formatarDataHora(fat.data_fim)?.data}
                            </span>
                          </div>
                        </div>
                        <div className="mb-3">
                          <span className="text-sm text-gray-600">
                            Técnico:
                          </span>{" "}
                          <span className="font-medium">
                            {fat.tecnico.nome}
                          </span>
                        </div>
                        <div className="mb-3">
                          <span className="text-sm text-gray-600">
                            Observações:
                          </span>
                          <p className="text-sm text-gray-800 bg-white p-2 rounded mt-1 border border-gray-200">
                            {fat.observacoes || "Sem observações"}
                          </p>
                        </div>

                        {/* Peças utilizadas */}
                        {fat.pecas_utilizadas &&
                          fat.pecas_utilizadas.length > 0 && (
                            <div>
                              <h6 className="text-sm font-medium text-gray-700 mb-2">
                                Peças Utilizadas
                              </h6>
                              <div className="bg-white rounded border border-gray-200 overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                        Peça
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                        Qtd.
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                        Valor Unit.
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                        Total
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {fat.pecas_utilizadas.map((peca) => (
                                      <tr key={peca.id}>
                                        <td className="px-3 py-2 text-sm text-gray-700">
                                          {peca.peca.nome}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-700 text-center">
                                          {peca.quantidade}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-700 text-right">
                                          R$ {peca.valor_unitario.toFixed(2)}
                                        </td>
                                        <td className="px-3 py-2 text-sm font-medium text-gray-900 text-right">
                                          R${" "}
                                          {(
                                            peca.quantidade *
                                            peca.valor_unitario
                                          ).toFixed(2)}
                                        </td>
                                      </tr>
                                    ))}
                                    <tr className="bg-gray-50">
                                      <td
                                        colSpan={3}
                                        className="px-3 py-2 text-sm font-medium text-gray-800 text-right"
                                      >
                                        Total:
                                      </td>
                                      <td className="px-3 py-2 text-sm font-medium text-gray-900 text-right">
                                        R${" "}
                                        {fat.pecas_utilizadas
                                          .reduce(
                                            (total, peca) =>
                                              total +
                                              peca.quantidade *
                                                peca.valor_unitario,
                                            0
                                          )
                                          .toFixed(2)}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Informações de Revisão */}
              {osDetalhada.revisao && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-800 mb-3 border-b border-gray-200 pb-2">
                    Revisão da OS
                  </h4>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle size={18} className="text-green-600" />
                      <span className="font-medium text-green-800">
                        OS Revisada em{" "}
                        {
                          formatarDataHora(osDetalhada.revisao.data_revisao)
                            ?.data
                        }
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="text-sm text-gray-600">
                        Revisado por:
                      </span>{" "}
                      <span className="font-medium">
                        {osDetalhada.revisao.usuario.nome}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">
                        Observações:
                      </span>
                      <p className="text-sm text-gray-800 bg-white p-2 rounded mt-1 border border-gray-200">
                        {osDetalhada.revisao.observacoes || "Sem observações"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConsultaOSPage;
