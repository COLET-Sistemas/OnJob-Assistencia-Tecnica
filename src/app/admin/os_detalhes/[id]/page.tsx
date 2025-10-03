"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  ordensServicoService,
  OSDetalhadaV2,
} from "@/api/services/ordensServicoService";
import PageHeader from "@/components/admin/ui/PageHeader";
import { StatusBadge } from "@/components/admin/common";
import { formatarData } from "@/utils/formatters";
import {
  Clock,
  Bell,
  Car,
  Wrench,
  PauseCircle,
  FileSearch,
  CheckCircle,
  XCircle,
  UserX,
  User,
  Laptop,
  Building,
  Phone,
  Mail,
  CalendarClock,
  FileText,
  Tag,
  AlertCircle,
  MapPin,
  ArrowLeft,
  Printer,
  CalendarRange,
} from "lucide-react";

// CSS para animações personalizadas
const fadeInAnimation = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease-in-out;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(var(--color-primary-rgb), 0.3);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}
`;

const OSDetalhesPage: React.FC = () => {
  const params = useParams();
  const osId = params.id as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [osData, setOsData] = useState<OSDetalhadaV2 | null>(null);

  // Definir status mapping para as ordens de serviço
  const statusMapping: Record<
    string,
    { label: string; className: string; icon: React.ReactNode }
  > = useMemo(
    () => ({
      "1": {
        label: "Pendente",
        className: "bg-gray-100 text-gray-700 border border-gray-200",
        icon: (
          <span title="Pendente">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
          </span>
        ),
      },
      "2": {
        label: "A atender",
        className: "bg-blue-100 text-blue-700 border border-blue-200",
        icon: (
          <span title="A atender">
            <Bell className="w-3.5 h-3.5 text-blue-600" />
          </span>
        ),
      },
      "3": {
        label: "Em deslocamento",
        className: "bg-purple-100 text-purple-700 border border-purple-200",
        icon: (
          <span title="Em deslocamento">
            <Car className="w-3.5 h-3.5 text-purple-600" />
          </span>
        ),
      },
      "4": {
        label: "Em atendimento",
        className: "bg-orange-100 text-orange-700 border border-orange-200",
        icon: (
          <span title="Em atendimento">
            <Wrench className="w-3.5 h-3.5 text-orange-600" />
          </span>
        ),
      },
      "5": {
        label: "Atendimento interrompido",
        className: "bg-amber-100 text-amber-700 border border-amber-200",
        icon: (
          <span title="Atendimento interrompido">
            <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
          </span>
        ),
      },
      "6": {
        label: "Em Revisão",
        className: "bg-indigo-100 text-indigo-700 border border-indigo-200",
        icon: (
          <span title="Em Revisão">
            <FileSearch className="w-3.5 h-3.5 text-indigo-600" />
          </span>
        ),
      },
      "7": {
        label: "Concluída",
        className: "bg-green-100 text-green-700 border border-green-200",
        icon: (
          <span title="Concluída">
            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
          </span>
        ),
      },
      "8": {
        label: "Cancelada",
        className: "bg-red-100 text-red-700 border border-red-200",
        icon: (
          <span title="Cancelada">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
          </span>
        ),
      },
      "9": {
        label: "Cancelada pelo Cliente",
        className: "bg-rose-100 text-rose-700 border border-rose-200",
        icon: (
          <span title="Cancelada pelo Cliente">
            <UserX className="w-3.5 h-3.5 text-rose-600" />
          </span>
        ),
      },
    }),
    []
  );

  // Carregar dados da OS
  useEffect(() => {
    const fetchOSData = async () => {
      if (!osId) return;

      try {
        setLoading(true);
        setError(null);
        const data = await ordensServicoService.getById(parseInt(osId, 10));
        console.log("Dados retornados da API:", data);

        // Verificar se os dados existem e têm a estrutura esperada
        if (data) {
          if (Array.isArray(data) && data.length > 0) {
            console.log("Dados encontrados no array:", data[0]);
            if (data[0] && typeof data[0] === "object" && "id_os" in data[0]) {
              setOsData(data[0]);
            } else {
              console.log("Dados do array não contêm id_os");
              setError("Estrutura de dados inválida");
            }
          } else if (typeof data === "object" && "id_os" in data) {
            console.log("Dados encontrados como objeto único:", data);
            setOsData(data);
          } else {
            console.log("Dados retornados com estrutura não reconhecida");
            setError("Estrutura de dados não reconhecida");
          }
        } else {
          console.log("Nenhum dado retornado da API");
          setError("Nenhum dado encontrado para esta OS");
        }
      } catch (err) {
        console.error("Erro ao carregar detalhes da OS:", err);
        setError(
          "Não foi possível carregar os detalhes da Ordem de Serviço. Tente novamente mais tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOSData();
  }, [osId]);

  const handleVoltar = () => {
    window.history.back();
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100 p-10 animate-fadeIn">
        <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">
          Erro ao carregar OS
        </h3>
        <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-8">
          {error}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleVoltar}
            className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </div>
      </div>
    );
  }

  console.log("Verificando osData antes de renderizar:", osData);

  if (!osData || !osData.id_os) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100 p-10 animate-fadeIn">
        <div className="w-20 h-20 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">
          Dados da OS incompletos
        </h3>
        <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-8">
          Os dados da OS parecem estar incompletos ou em formato incorreto.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleVoltar}
            className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </div>
      </div>
    );
  }

  console.log("Renderizando com dados:", osData);

  return (
    <>
      <style jsx global>
        {fadeInAnimation}
      </style>
      <div className="animate-fadeIn">
        <PageHeader
          title={`Ordem de Serviço #${osData.id_os}`}
          config={{
            type: "form",
            backLink: "/admin/os_consulta",
            backLabel: "Voltar para consulta de OS",
          }}
        />

        {/* Status Badge - separado já que o PageHeader não suporta isto diretamente */}
        <div className="flex justify-between mb-4">
          <div>
            {osData.situacao_os && osData.situacao_os.codigo && (
              <StatusBadge
                status={String(osData.situacao_os.codigo)}
                mapping={statusMapping}
              />
            )}
          </div>
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir OS
          </button>
        </div>

        {/* Status Summary Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                {osData.situacao_os && osData.situacao_os.codigo && (
                  <StatusBadge
                    status={String(osData.situacao_os.codigo)}
                    mapping={statusMapping}
                  />
                )}
                <span className="text-gray-500 text-sm">
                  Última atualização:{" "}
                  {formatarData(
                    (osData.situacao_os && osData.situacao_os.data_alteracao) ||
                      (osData.abertura && osData.abertura.data_abertura) ||
                      new Date().toISOString()
                  )}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">
                {osData.descricao_problema}
              </h2>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="bg-[var(--primary)]/5 px-4 py-2 rounded-lg">
                <p className="text-xs text-gray-500">Data de Abertura</p>
                <p className="font-medium">
                  {formatarData(osData.abertura.data_abertura)}
                </p>
              </div>

              {osData.data_agendada && (
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                  <p className="text-xs text-gray-500">Data Agendada</p>
                  <p className="font-medium">
                    {formatarData(osData.data_agendada)}
                  </p>
                </div>
              )}

              {osData.data_fechamento && (
                <div className="bg-green-50 px-4 py-2 rounded-lg">
                  <p className="text-xs text-gray-500">Data de Fechamento</p>
                  <p className="font-medium">
                    {formatarData(osData.data_fechamento)}
                  </p>
                </div>
              )}

              <div
                className={`px-4 py-2 rounded-lg ${
                  osData.em_garantia ? "bg-green-50" : "bg-gray-50"
                }`}
              >
                <p className="text-xs text-gray-500">Garantia</p>
                <p className="font-medium flex items-center">
                  {osData.em_garantia ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> Sim
                    </span>
                  ) : (
                    <span className="text-gray-500 flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5" /> Não
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Cliente e Máquina */}
          <div className="lg:col-span-1">
            {/* Client Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Building className="text-[var(--primary)] h-5 w-5" />
                  Cliente
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {/* Nome do cliente */}
                  {osData.cliente?.nome && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nome</p>
                      <p className="font-semibold text-gray-800">
                        {osData.cliente.nome}
                      </p>
                    </div>
                  )}

                  {/* Endereço */}
                  {(osData.cliente?.endereco ||
                    osData.cliente?.numero ||
                    osData.cliente?.bairro ||
                    osData.cliente?.cidade ||
                    osData.cliente?.uf ||
                    osData.cliente?.cep) && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Endereço
                      </p>
                      <p className="text-gray-800">
                        {osData.cliente.endereco}
                        {osData.cliente.numero
                          ? `, ${osData.cliente.numero}`
                          : ""}
                        {osData.cliente.complemento
                          ? `, ${osData.cliente.complemento}`
                          : ""}
                      </p>
                      <p className="text-gray-800">
                        {osData.cliente.bairro && `${osData.cliente.bairro}, `}
                        {osData.cliente.cidade}/{osData.cliente.uf} -{" "}
                        {osData.cliente.cep}
                      </p>
                    </div>
                  )}

                  {/* Contato */}
                  {(osData.contato?.nome ||
                    osData.contato?.telefone ||
                    osData.contato?.email) && (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-medium text-gray-500">
                        Contato
                      </p>
                      {osData.contato.nome && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-800">
                            {osData.contato.nome}
                          </span>
                        </div>
                      )}
                      {osData.contato.telefone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-800">
                            {osData.contato.telefone}
                            {osData.contato.whatsapp && (
                              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                WhatsApp
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      {osData.contato.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-800">
                            {osData.contato.email}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Localização */}
                  {osData.cliente?.latitude && osData.cliente?.longitude && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        Localização
                      </p>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Lat: {osData.cliente.latitude}, Long:{" "}
                          {osData.cliente.longitude}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Região */}
                  {osData.cliente?.nome_regiao && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Região
                      </p>
                      <p className="text-gray-800">
                        {osData.cliente.nome_regiao}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Máquina Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Laptop className="text-[var(--primary)] h-5 w-5" />
                  Máquina
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {/* Nº de Série */}
                  {osData.maquina?.numero_serie && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Nº de Série
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800">
                          {osData.maquina.numero_serie}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            osData.em_garantia
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {osData.em_garantia ? (
                            <>
                              <CheckCircle className="h-3.5 w-3.5" />
                              Garantia
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3.5 w-3.5" />
                              Sem Garantia
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Descrição */}
                  {osData.maquina?.descricao && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Descrição
                      </p>
                      <p className="text-gray-800">
                        {osData.maquina.descricao}
                      </p>
                    </div>
                  )}

                  {/* Modelo */}
                  {osData.maquina?.modelo && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Modelo
                      </p>
                      <p className="text-gray-800">{osData.maquina.modelo}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Informações da OS */}
          <div className="lg:col-span-2">
            {/* Card de Detalhes da OS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="text-[var(--primary)] h-5 w-5" />
                  Detalhes da Ordem de Serviço
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Abertura
                    </p>
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-800">
                        {formatarData(osData.abertura.data_abertura)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Por: {osData.abertura.nome_usuario}
                    </p>
                    <p className="text-sm text-gray-600">
                      Forma: {osData.abertura.forma_abertura}
                      {osData.abertura.origem_abertura === "T" && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          Técnico
                        </span>
                      )}
                    </p>
                  </div>

                  {osData.abertura.motivo_atendimento && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Motivo do Atendimento
                      </p>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-800">
                          {osData.abertura.motivo_atendimento}
                        </span>
                      </div>
                    </div>
                  )}

                  {osData.data_agendada && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Data Agendada
                      </p>
                      <div className="flex items-center gap-2">
                        <CalendarRange className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-800">
                          {formatarData(osData.data_agendada)}
                        </span>
                      </div>
                    </div>
                  )}

                  {osData.situacao_os && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Status
                      </p>
                      <StatusBadge
                        status={String(osData.situacao_os.codigo)}
                        mapping={statusMapping}
                      />
                      {osData.situacao_os.data_alteracao && (
                        <p className="text-xs text-gray-500 mt-1">
                          Atualizado em:{" "}
                          {formatarData(osData.situacao_os.data_alteracao)}
                        </p>
                      )}
                    </div>
                  )}

                  {osData.tecnico && osData.tecnico.id > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Técnico Responsável
                      </p>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-800">
                          {osData.tecnico.nome}
                        </span>
                      </div>
                      {osData.tecnico.tipo && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full inline-block mt-1"
                          style={{
                            backgroundColor:
                              osData.tecnico.tipo === "interno"
                                ? "rgba(var(--color-primary-rgb), 0.1)"
                                : osData.tecnico.tipo === "terceiro"
                                ? "rgba(var(--color-warning-rgb), 0.1)"
                                : "rgba(var(--color-gray-rgb), 0.1)",
                            color:
                              osData.tecnico.tipo === "interno"
                                ? "var(--primary)"
                                : osData.tecnico.tipo === "terceiro"
                                ? "var(--color-warning)"
                                : "var(--color-gray)",
                          }}
                        >
                          {osData.tecnico.tipo === "interno"
                            ? "Interno"
                            : osData.tecnico.tipo === "terceiro"
                            ? "Terceirizado"
                            : "Indefinido"}
                        </span>
                      )}
                      {osData.tecnico.observacoes && (
                        <p className="text-xs text-gray-600 mt-1">
                          Obs: {osData.tecnico.observacoes}
                        </p>
                      )}
                    </div>
                  )}

                  {osData.situacao_os.codigo === 1 &&
                    osData.situacao_os.motivo_pendencia &&
                    osData.situacao_os.motivo_pendencia !== "" && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Motivo da Pendência
                        </p>
                        <p className="text-gray-800">
                          {osData.situacao_os.motivo_pendencia}
                        </p>
                      </div>
                    )}

                  {osData.liberacao_financeira && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Liberação Financeira
                      </p>
                      <div className="flex items-center gap-2">
                        {osData.liberacao_financeira.liberada ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" /> Liberada
                          </span>
                        ) : (
                          <span className="text-gray-500 flex items-center gap-1">
                            <XCircle className="h-3.5 w-3.5" /> Não liberada
                          </span>
                        )}
                      </div>
                      {osData.liberacao_financeira.liberada &&
                        osData.liberacao_financeira.nome_usuario_liberacao && (
                          <p className="text-xs text-gray-600 mt-1">
                            Por:{" "}
                            {osData.liberacao_financeira.nome_usuario_liberacao}
                          </p>
                        )}
                      {osData.liberacao_financeira.liberada &&
                        osData.liberacao_financeira.data_liberacao && (
                          <p className="text-xs text-gray-600">
                            Em:{" "}
                            {formatarData(
                              osData.liberacao_financeira.data_liberacao
                            )}
                          </p>
                        )}
                    </div>
                  )}

                  {osData.revisao_os && osData.revisao_os.id_usuario > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Revisão
                      </p>
                      <div className="flex items-center gap-2">
                        <FileSearch className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-800">
                          {osData.revisao_os.nome}
                        </span>
                      </div>
                      {osData.revisao_os.data && (
                        <p className="text-xs text-gray-600 mt-1">
                          Em: {formatarData(osData.revisao_os.data)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Observações da revisão */}
                {osData.revisao_os && osData.revisao_os.observacoes && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      Observações da Revisão
                    </p>
                    <div className="bg-indigo-50 p-4 rounded-lg text-gray-800 whitespace-pre-wrap">
                      {osData.revisao_os.observacoes}
                    </div>
                  </div>
                )}

                {/* Observações do técnico */}
                {osData.tecnico && osData.tecnico.observacoes && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      Observações do Técnico
                    </p>
                    <div className="bg-amber-50 p-4 rounded-lg text-gray-800 whitespace-pre-wrap">
                      {osData.tecnico.observacoes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tabela de FATs - se tiver FATs */}
            {osData.fats && osData.fats.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Wrench className="text-[var(--primary)] h-5 w-5" />
                    Fichas de Atendimento Técnico ({osData.fats.length})
                  </h3>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            FAT #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Técnico
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {osData.fats.map((fat) => (
                          <tr
                            key={fat.id_fat}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() =>
                              (window.location.href = `/admin/fat/${fat.id_fat}`)
                            }
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {fat.id_fat}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {formatarData(fat.data_atendimento)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {fat.tecnico.nome}
                              {fat.tecnico.tipo && (
                                <span
                                  className="ml-2 text-xs px-1.5 py-0.5 rounded-full inline-block"
                                  style={{
                                    backgroundColor:
                                      fat.tecnico.tipo === "interno"
                                        ? "rgba(var(--color-primary-rgb), 0.1)"
                                        : fat.tecnico.tipo === "terceiro"
                                        ? "rgba(var(--color-warning-rgb), 0.1)"
                                        : "rgba(var(--color-gray-rgb), 0.1)",
                                    color:
                                      fat.tecnico.tipo === "interno"
                                        ? "var(--primary)"
                                        : fat.tecnico.tipo === "terceiro"
                                        ? "var(--color-warning)"
                                        : "var(--color-gray)",
                                  }}
                                >
                                  {fat.tecnico.tipo === "interno"
                                    ? "Interno"
                                    : fat.tecnico.tipo === "terceiro"
                                    ? "Terceirizado"
                                    : "Indefinido"}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  fat.aprovado
                                    ? "bg-green-100 text-green-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {fat.aprovado ? (
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                ) : (
                                  <Clock className="mr-1 h-3 w-3" />
                                )}
                                {fat.aprovado ? "Aprovado" : "Pendente"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default OSDetalhesPage;
