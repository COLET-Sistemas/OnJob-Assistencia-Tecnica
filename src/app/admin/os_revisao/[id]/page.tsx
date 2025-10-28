"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ordensServicoService,
  type OSDetalhadaV2,
  type OSDeslocamento,
  type OSPecaUtilizada,
} from "@/api/services/ordensServicoService";
import { LoadingSpinner as Loading } from "@/components/LoadingPersonalizado";
import PageHeader from "@/components/admin/ui/PageHeaderSimple";
import {
  ArrowLeft,
  Save,
  Clipboard,
  ClipboardCheck,
  Package,
  Car,
  Wrench,
  FileText,
  Settings,
  Clock,
  Calendar,
  MapPin,
  X,
  Plus,
  Trash2,
  Edit,
} from "lucide-react";

import StatusBadge from "@/components/tecnico/StatusBadge";

// Interface para os deslocamentos revisados
interface DeslocamentoRevisado extends OSDeslocamento {
  id_fat?: number;
  isEditing?: boolean;
  isDeleted?: boolean;
  isNew?: boolean;
}

// Interface para as peças revisadas
interface PecaRevisada extends OSPecaUtilizada {
  id_fat?: number;
  isEditing?: boolean;
  isDeleted?: boolean;
  isNew?: boolean;
}

export default function OSRevisaoPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [os, setOS] = useState<OSDetalhadaV2 | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deslocamentos, setDeslocamentos] = useState<DeslocamentoRevisado[]>(
    []
  );
  const [pecas, setPecas] = useState<PecaRevisada[]>([]);
  const [activeTab, setActiveTab] = useState<
    "info" | "deslocamentos" | "pecas"
  >("info");
  const [observacoes, setObservacoes] = useState("");
  const [tabTotalizado, setTabTotalizado] = useState({
    deslocamento: 0,
    pecas: 0,
    total: 0,
  });

  // Calcular totais
  const calcularTotais = useCallback(
    (deslocamentosArr: DeslocamentoRevisado[], pecasArr: PecaRevisada[]) => {
      // Valor total dos deslocamentos (assumindo que cada deslocamento tem km_ida e km_volta)
      const totalDeslocamento = deslocamentosArr
        .filter((d) => !d.isDeleted)
        .reduce((sum, d) => {
          const kmTotal = (d.km_ida || 0) + (d.km_volta || 0);
          // Assume um valor padrão por km caso não tenha valor definido
          const valorKm = d.valor_km || 1.5;
          return sum + kmTotal * valorKm;
        }, 0);

      // Valor total das peças
      const totalPecas = pecasArr
        .filter((p) => !p.isDeleted)
        .reduce((sum, p) => {
          // Calcula valor_total se não estiver definido
          const valorTotal =
            p.valor_total || (p.valor_unitario || 0) * (p.quantidade || 0);
          return sum + valorTotal;
        }, 0);

      setTabTotalizado({
        deslocamento: totalDeslocamento,
        pecas: totalPecas,
        total: totalDeslocamento + totalPecas,
      });
    },
    []
  );

  // Carregar dados da OS
  const fetchOS = useCallback(async () => {
    if (!params?.id) {
      setError("ID da OS não fornecido");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const osId = Number(params.id);
      const response = await ordensServicoService.getById(osId, true); // Forçar atualização
      setOS(response);
      setObservacoes(response.revisao_os?.observacoes || "");

      // Processar deslocamentos de todas as FATs
      let todosDeslocamentos: DeslocamentoRevisado[] = [];
      let todasPecas: PecaRevisada[] = [];

      // Para cada FAT, extrair deslocamentos e peças
      response.fats.forEach((fat) => {
        // Processar deslocamentos
        if (fat.deslocamentos && Array.isArray(fat.deslocamentos)) {
          const deslocamentosFat = fat.deslocamentos.map((d) => ({
            ...d,
            id_fat: fat.id_fat,
            isEditing: false,
            isDeleted: false,
          }));
          todosDeslocamentos = [...todosDeslocamentos, ...deslocamentosFat];
        }

        // Processar peças
        if (fat.pecas_utilizadas && Array.isArray(fat.pecas_utilizadas)) {
          const pecasFat = fat.pecas_utilizadas.map((p) => ({
            ...p,
            id_fat: fat.id_fat,
            isEditing: false,
            isDeleted: false,
          }));
          todasPecas = [...todasPecas, ...pecasFat];
        }
      });

      setDeslocamentos(todosDeslocamentos);
      setPecas(todasPecas);

      // Calcular totais
      calcularTotais(todosDeslocamentos, todasPecas);
    } catch (err) {
      console.error("Erro ao carregar OS:", err);
      setError(
        "Não foi possível carregar os detalhes da OS. Por favor, tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }, [params?.id, calcularTotais]);

  // Carregar dados na inicialização
  useEffect(() => {
    fetchOS();
  }, [fetchOS]);

  // Manipuladores para deslocamentos
  const handleEditDeslocamento = (index: number) => {
    setDeslocamentos((prev) =>
      prev.map((d, i) => (i === index ? { ...d, isEditing: true } : d))
    );
  };

  const handleSaveDeslocamento = (index: number) => {
    setDeslocamentos((prev) => {
      const updated = prev.map((d, i) =>
        i === index ? { ...d, isEditing: false } : d
      );
      calcularTotais(updated, pecas);
      return updated;
    });
  };

  const handleCancelDeslocamento = (index: number) => {
    setDeslocamentos((prev) => {
      // Se for um novo deslocamento, removê-lo
      if (prev[index].isNew) {
        const filtered = prev.filter((_, i) => i !== index);
        calcularTotais(filtered, pecas);
        return filtered;
      }

      // Caso contrário, apenas cancela a edição
      return prev.map((d, i) => (i === index ? { ...d, isEditing: false } : d));
    });
  };

  const handleDeleteDeslocamento = (index: number) => {
    setDeslocamentos((prev) => {
      const updated = prev.map((d, i) =>
        i === index ? { ...d, isDeleted: true } : d
      );
      calcularTotais(updated, pecas);
      return updated;
    });
  };

  const handleRestoreDeslocamento = (index: number) => {
    setDeslocamentos((prev) => {
      const updated = prev.map((d, i) =>
        i === index ? { ...d, isDeleted: false } : d
      );
      calcularTotais(updated, pecas);
      return updated;
    });
  };

  const handleAddDeslocamento = () => {
    setDeslocamentos((prev) => {
      const newDeslocamento: DeslocamentoRevisado = {
        id_deslocamento: Math.floor(Math.random() * -1000),
        km_ida: 0,
        km_volta: 0,
        tempo_ida_min: 0,
        tempo_volta_min: 0,
        observacoes: "",
        isEditing: true,
        isNew: true,
      };
      return [...prev, newDeslocamento];
    });
  };

  const handleDeslocamentoChange = (
    index: number,
    field: keyof OSDeslocamento,
    value: number | string
  ) => {
    setDeslocamentos((prev) => {
      const updated = prev.map((d, i) =>
        i === index ? { ...d, [field]: value } : d
      );
      return updated;
    });
  };

  // Manipuladores para peças
  const handleEditPeca = (index: number) => {
    setPecas((prev) =>
      prev.map((p, i) => (i === index ? { ...p, isEditing: true } : p))
    );
  };

  const handleSavePeca = (index: number) => {
    setPecas((prev) => {
      const updated = prev.map((p, i) =>
        i === index ? { ...p, isEditing: false } : p
      );
      calcularTotais(deslocamentos, updated);
      return updated;
    });
  };

  const handleCancelPeca = (index: number) => {
    setPecas((prev) => {
      // Se for uma nova peça, removê-la
      if (prev[index].isNew) {
        const filtered = prev.filter((_, i) => i !== index);
        calcularTotais(deslocamentos, filtered);
        return filtered;
      }

      // Caso contrário, apenas cancela a edição
      return prev.map((p, i) => (i === index ? { ...p, isEditing: false } : p));
    });
  };

  const handleDeletePeca = (index: number) => {
    setPecas((prev) => {
      const updated = prev.map((p, i) =>
        i === index ? { ...p, isDeleted: true } : p
      );
      calcularTotais(deslocamentos, updated);
      return updated;
    });
  };

  const handleRestorePeca = (index: number) => {
    setPecas((prev) => {
      const updated = prev.map((p, i) =>
        i === index ? { ...p, isDeleted: false } : p
      );
      calcularTotais(deslocamentos, updated);
      return updated;
    });
  };

  const handleAddPeca = () => {
    setPecas((prev) => {
      const newPeca: PecaRevisada = {
        id: Math.floor(Math.random() * -1000),
        descricao: "",
        codigo: "",
        quantidade: 1,
        valor_unitario: 0,
        valor_total: 0,
        isEditing: true,
        isNew: true,
      };
      return [...prev, newPeca];
    });
  };

  const handlePecaChange = (
    index: number,
    field: keyof OSPecaUtilizada,
    value: number | string
  ) => {
    setPecas((prev) => {
      const updated = prev.map((p, i) => {
        if (i !== index) return p;

        const updatedPeca = { ...p, [field]: value };

        // Atualizar valor_total se quantidade ou valor_unitario mudar
        if (field === "quantidade" || field === "valor_unitario") {
          updatedPeca.valor_total =
            (updatedPeca.quantidade || 0) * (updatedPeca.valor_unitario || 0);
        }

        return updatedPeca;
      });
      return updated;
    });
  };

  // Salvar revisão
  const handleSalvarRevisao = async () => {
    if (!os) return;

    try {
      setSaving(true);

      // Chamada à API para salvar a revisão
      const response = await ordensServicoService.salvarRevisaoOS(os.id_os, {
        deslocamentos: deslocamentos
          .filter((d) => !d.isDeleted)
          .map((d) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { isEditing, isDeleted, isNew, id_fat, ...resto } = d;
            return resto;
          }),

        pecas: pecas
          .filter((p) => !p.isDeleted)
          .map((p) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { isEditing, isDeleted, isNew, id_fat, ...resto } = p;
            return resto;
          }),

        observacoes,
      });

      alert(response.message || "Revisão salva com sucesso!");
      router.push("/admin/os_revisao");
    } catch (err) {
      console.error("Erro ao salvar revisão:", err);
      alert("Erro ao salvar a revisão. Por favor, tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loading />
      </div>
    );
  }

  if (error || !os) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error || "Ocorreu um erro ao carregar os dados da OS."}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push("/admin/os_revisao")}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para lista
        </button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={`Revisão de OS #${os.id_os}`}
        config={{
          type: "form",
          backLink: "/admin/os_revisao",
          backLabel: "Voltar para a lista",
        }}
      />

      {/* Header da OS - Design mais compacto e profissional */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {/* Lado esquerdo: cliente e localização */}
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  OS #{os.id_os}
                </h3>
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-gray-700 font-medium">
                  {os.cliente.nome}
                </span>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <button
                    onClick={() => {
                      const empresa = JSON.parse(
                        localStorage.getItem("empresa") || "{}"
                      );
                      const lat = empresa.latitude;
                      const lng = empresa.longitude;
                      const destino = encodeURIComponent(
                        `${os.cliente.cidade}, ${os.cliente.uf}`
                      );
                      const url =
                        lat && lng
                          ? `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${destino}`
                          : `https://www.google.com/maps/search/?api=1&query=${destino}`;
                      window.open(url, "_blank");
                    }}
                    title="Ver rota no Google Maps"
                    className="text-gray-500 cursor-pointer hover:text-purple-900 transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                  </button>
                  <span>
                    {os.cliente.cidade} / {os.cliente.uf}
                  </span>
                </div>
              </div>

              {/* Bloco da máquina mais à direita */}
              <div className="ml-8 flex flex-col text-sm text-gray-600 min-w-[180px]">
                {os.maquina?.numero_serie && (
                  <span className="font-medium text-gray-700 truncate">
                    Número de Série: {os.maquina.numero_serie}
                  </span>
                )}
                {os.maquina?.descricao && (
                  <span className="text-xs text-gray-500 truncate">
                    {os.maquina.descricao}
                  </span>
                )}
              </div>
            </div>

            {/* Status à direita */}
            <StatusBadge status={os.situacao_os.codigo.toString()} />
          </div>
        </div>

        <div className="px-6 py-3 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-500 shrink-0" />
            <div className="overflow-hidden">
              <p className="font-medium text-gray-700 truncate">
                Motivo Atendimento
              </p>
              <p className="text-xs text-gray-600 truncate">
                {os.abertura.motivo_atendimento}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-gray-500 shrink-0" />
            <div className="overflow-hidden">
              <p className="font-medium text-gray-700 truncate">Técnico</p>
              <p className="text-xs text-gray-600 truncate">
                {os.tecnico?.nome || "Não atribuído"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500 shrink-0" />
            <div className="overflow-hidden">
              <p className="font-medium text-gray-700 truncate">Abertura</p>
              <p className="text-xs text-gray-600">
                {os.abertura.data_abertura}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500 shrink-0" />
            <div className="overflow-hidden">
              <p className="font-medium text-gray-700 truncate">Agendamento</p>
              <p className="text-xs text-gray-600">{os.data_agendada || "-"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clipboard className="h-4 w-4 text-gray-500 shrink-0" />
            <div className="overflow-hidden">
              <p className="font-medium text-gray-700 truncate">Conclusão</p>
              <p className="text-xs text-gray-600">
                {os.data_fechamento || "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="mb-6 flex border-b border-gray-200">
        <button
          className={`py-3 px-5 text-sm font-medium flex items-center gap-2 ${
            activeTab === "info"
              ? "border-b-2 border-[var(--primary)] text-[var(--primary)]"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("info")}
        >
          <FileText className="h-4 w-4" />
          Informações
        </button>
        <button
          className={`py-3 px-5 text-sm font-medium flex items-center gap-2 ${
            activeTab === "deslocamentos"
              ? "border-b-2 border-[var(--primary)] text-[var(--primary)]"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("deslocamentos")}
        >
          <Car className="h-4 w-4" />
          Deslocamentos ({deslocamentos.filter((d) => !d.isDeleted).length})
        </button>
        <button
          className={`py-3 px-5 text-sm font-medium flex items-center gap-2 ${
            activeTab === "pecas"
              ? "border-b-2 border-[var(--primary)] text-[var(--primary)]"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("pecas")}
        >
          <Package className="h-4 w-4" />
          Peças ({pecas.filter((p) => !p.isDeleted).length})
        </button>
      </div>

      {/* Conteúdo da aba selecionada */}
      <div className="bg-white rounded-lg shadow mb-6">
        {/* Aba de informações */}
        {activeTab === "info" && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Informações da Ordem de Serviço
            </h3>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Problema Relatado
              </h4>
              <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                {os.descricao_problema || "Nenhuma descrição fornecida."}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                FATs Associadas
              </h4>

              {os.fats && os.fats.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          FAT #
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Data Atendimento
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Técnico
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Motivo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {os.fats.map((fat) => (
                        <tr key={fat.id_fat}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{fat.id_fat}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {fat.data_atendimento || ""}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {fat.tecnico?.nome || "-"}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            {fat.motivo_atendimento || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Nenhuma FAT associada a esta OS.
                </p>
              )}
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Observações da Revisão
              </h4>
              <textarea
                className="w-full border border-gray-300 rounded-md p-3 text-sm 
               text-gray-800 placeholder-gray-400
               focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                rows={5}
                placeholder="Adicione observações sobre a revisão..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Aba de deslocamentos */}
        {activeTab === "deslocamentos" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Deslocamentos
              </h3>

              <button
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90"
                onClick={handleAddDeslocamento}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </button>
            </div>

            {deslocamentos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        FAT
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        KM Ida
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        KM Volta
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Tempo Ida
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Tempo Volta
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Observações
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {deslocamentos.map((deslocamento, index) => (
                      <tr
                        key={deslocamento.id_deslocamento}
                        className={`${
                          deslocamento.isDeleted ? "bg-red-50" : ""
                        }`}
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          #{deslocamento.id_fat || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {deslocamento.isEditing ? (
                            <input
                              type="number"
                              className="w-20 border border-gray-300 rounded-md px-2 py-1"
                              value={deslocamento.km_ida || 0}
                              onChange={(e) =>
                                handleDeslocamentoChange(
                                  index,
                                  "km_ida",
                                  Number(e.target.value)
                                )
                              }
                            />
                          ) : (
                            deslocamento.km_ida
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {deslocamento.isEditing ? (
                            <input
                              type="number"
                              className="w-20 border border-gray-300 rounded-md px-2 py-1"
                              value={deslocamento.km_volta || 0}
                              onChange={(e) =>
                                handleDeslocamentoChange(
                                  index,
                                  "km_volta",
                                  Number(e.target.value)
                                )
                              }
                            />
                          ) : (
                            deslocamento.km_volta
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {deslocamento.isEditing ? (
                            <input
                              type="number"
                              className="w-20 border border-gray-300 rounded-md px-2 py-1"
                              value={deslocamento.tempo_ida_min || 0}
                              onChange={(e) =>
                                handleDeslocamentoChange(
                                  index,
                                  "tempo_ida_min",
                                  Number(e.target.value)
                                )
                              }
                            />
                          ) : (
                            deslocamento.tempo_ida_min
                          )}{" "}
                          min
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {deslocamento.isEditing ? (
                            <input
                              type="number"
                              className="w-20 border border-gray-300 rounded-md px-2 py-1"
                              value={deslocamento.tempo_volta_min || 0}
                              onChange={(e) =>
                                handleDeslocamentoChange(
                                  index,
                                  "tempo_volta_min",
                                  Number(e.target.value)
                                )
                              }
                            />
                          ) : (
                            deslocamento.tempo_volta_min
                          )}{" "}
                          min
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {deslocamento.isEditing ? (
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded-md px-2 py-1"
                              value={deslocamento.observacoes || ""}
                              onChange={(e) =>
                                handleDeslocamentoChange(
                                  index,
                                  "observacoes",
                                  e.target.value
                                )
                              }
                            />
                          ) : (
                            deslocamento.observacoes || "-"
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                          {deslocamento.isDeleted ? (
                            <button
                              className="text-green-600 hover:text-green-900"
                              onClick={() => handleRestoreDeslocamento(index)}
                            >
                              Restaurar
                            </button>
                          ) : deslocamento.isEditing ? (
                            <div className="flex gap-2 justify-end">
                              <button
                                className="text-green-600 hover:text-green-900"
                                onClick={() => handleSaveDeslocamento(index)}
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-900"
                                onClick={() => handleCancelDeslocamento(index)}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-end">
                              <button
                                className="text-blue-600 hover:text-blue-900"
                                onClick={() => handleEditDeslocamento(index)}
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-900"
                                onClick={() => handleDeleteDeslocamento(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-md">
                <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Nenhum deslocamento registrado.</p>
                <button
                  className="mt-2 text-[var(--primary)] hover:underline text-sm"
                  onClick={handleAddDeslocamento}
                >
                  Adicionar deslocamento
                </button>
              </div>
            )}
          </div>
        )}

        {/* Aba de peças */}
        {activeTab === "pecas" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Peças</h3>

              <button
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90"
                onClick={handleAddPeca}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </button>
            </div>

            {pecas.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        FAT
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Código
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Descrição
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Qtd
                      </th>

                      <th
                        scope="col"
                        className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pecas.map((peca, index) => (
                      <tr
                        key={peca.id || index}
                        className={`${peca.isDeleted ? "bg-red-50" : ""}`}
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          #{peca.id_fat || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {peca.isEditing ? (
                            <input
                              type="text"
                              className="w-24 border border-gray-300 rounded-md px-2 py-1"
                              value={peca.codigo || ""}
                              onChange={(e) =>
                                handlePecaChange(
                                  index,
                                  "codigo",
                                  e.target.value
                                )
                              }
                              placeholder="Código"
                            />
                          ) : (
                            peca.codigo || "-"
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {peca.isEditing ? (
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded-md px-2 py-1"
                              value={peca.descricao || ""}
                              onChange={(e) =>
                                handlePecaChange(
                                  index,
                                  "descricao",
                                  e.target.value
                                )
                              }
                              placeholder="Descrição"
                            />
                          ) : (
                            peca.descricao || "-"
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {peca.isEditing ? (
                            <input
                              type="number"
                              className="w-16 border border-gray-300 rounded-md px-2 py-1"
                              value={peca.quantidade || 0}
                              onChange={(e) =>
                                handlePecaChange(
                                  index,
                                  "quantidade",
                                  Number(e.target.value)
                                )
                              }
                              min="1"
                            />
                          ) : (
                            peca.quantidade
                          )}
                        </td>

                        <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                          {peca.isDeleted ? (
                            <button
                              className="text-green-600 hover:text-green-900"
                              onClick={() => handleRestorePeca(index)}
                            >
                              Restaurar
                            </button>
                          ) : peca.isEditing ? (
                            <div className="flex gap-2 justify-end">
                              <button
                                className="text-green-600 hover:text-green-900"
                                onClick={() => handleSavePeca(index)}
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-900"
                                onClick={() => handleCancelPeca(index)}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-end">
                              <button
                                className="text-blue-600 hover:text-blue-900"
                                onClick={() => handleEditPeca(index)}
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-900"
                                onClick={() => handleDeletePeca(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-md">
                <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Nenhuma peça registrada.</p>
                <button
                  className="mt-2 text-[var(--primary)] hover:underline text-sm"
                  onClick={handleAddPeca}
                >
                  Adicionar peça
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rodapé com totais e botões de ação */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Totais da Revisão
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Deslocamentos</p>
                <p className="text-lg font-medium text-gray-900">
                  R$ {tabTotalizado.deslocamento.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Peças</p>
                <p className="text-lg font-medium text-gray-900">
                  R$ {tabTotalizado.pecas.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-lg font-medium text-[var(--primary)]">
                  R$ {tabTotalizado.total.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => router.push("/admin/os_revisao")}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </button>
            <button
              onClick={handleSalvarRevisao}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Salvar Revisão
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
