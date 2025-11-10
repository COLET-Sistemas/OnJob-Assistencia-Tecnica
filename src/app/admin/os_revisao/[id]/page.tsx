"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ordensServicoService,
  type OSDetalhadaV2,
  type OSDeslocamento,
  type OSPecaUtilizada,
} from "@/api/services/ordensServicoService";
import { fatFotosService } from "@/api/services/fatFotosService";
import { LoadingSpinner as Loading } from "@/components/LoadingPersonalizado";
import PageHeader from "@/components/admin/ui/PageHeaderSimple";
import {
  ArrowLeft,
  Clipboard,
  ClipboardCheck,
  Package,
  Car,
  Wrench,
  FileText,
  Settings,
  Clock,
  Calendar,
  Camera,
  MapPin,
  X,
} from "lucide-react";

import StatusBadge from "@/components/tecnico/StatusBadge";
import InfoTab from "./components/InfoTab";
import DeslocamentosTab from "./components/DeslocamentosTab";
import PecasTab from "./components/PecasTab";
import FotosTab from "./components/FotosTab";
import RevisaoTab from "./components/RevisaoTab";
import type {
  DeslocamentoOriginal,
  DeslocamentoRevisado,
  PecaOriginal,
  PecaRevisada,
  PecaCatalogo,
} from "./types";
import { useToast } from "@/components/admin/ui/ToastContainer";

export default function OSRevisaoPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [os, setOS] = useState<OSDetalhadaV2 | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deslocamentosOriginais, setDeslocamentosOriginais] = useState<
    DeslocamentoOriginal[]
  >([]);
  const [deslocamentosRevisados, setDeslocamentosRevisados] = useState<
    DeslocamentoRevisado[]
  >([]);
  const [pecasOriginais, setPecasOriginais] = useState<PecaOriginal[]>([]);
  const [pecasRevisadas, setPecasRevisadas] = useState<PecaRevisada[]>([]);
  const [fotosCount, setFotosCount] = useState(0);
  type TabType = "info" | "deslocamentos" | "pecas" | "fotos" | "revisao";
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [observacoesRevisao, setObservacoesRevisao] = useState("");
  const [observacoesMaquina, setObservacoesMaquina] = useState("");
  const [editarObservacoesMaquina, setEditarObservacoesMaquina] =
    useState(false);
  const [isSubmittingRevisao, setIsSubmittingRevisao] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<
    "save" | "conclude" | null
  >(null);
  const { showSuccess, showError } = useToast();

  const loadFotosCount = useCallback(async (osId: number) => {
    if (!osId) {
      setFotosCount(0);
      return;
    }

    try {
      const fotos = await fatFotosService.listar(osId);
      setFotosCount(fotos.length);
    } catch (err) {
      console.error("Erro ao carregar quantidade de fotos:", err);
      setFotosCount(0);
    }
  }, []);

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
      setObservacoesRevisao(response.revisao_os?.observacoes || "");
      setObservacoesMaquina(response.maquina?.observacoes ?? "");
      setEditarObservacoesMaquina(false);
      void loadFotosCount(response.id_os);

      // Processar deslocamentos de todas as FATs
      let todosDeslocamentosOriginais: DeslocamentoOriginal[] = [];
      let todosDeslocamentosRevisados: DeslocamentoRevisado[] = [];
      let todasPecasOriginais: PecaOriginal[] = [];
      let todasPecasRevisadas: PecaRevisada[] = [];

      // Para cada FAT, extrair deslocamentos e peças
      response.fats.forEach((fat) => {
        // Processar deslocamentos
        if (fat.deslocamentos && Array.isArray(fat.deslocamentos)) {
          const deslocamentosFat = fat.deslocamentos.map((d) => ({
            ...d,
            id_fat: fat.id_fat,
          }));
          todosDeslocamentosOriginais = [
            ...todosDeslocamentosOriginais,
            ...deslocamentosFat,
          ];
        }

        // Processar peças
        if (fat.pecas_utilizadas && Array.isArray(fat.pecas_utilizadas)) {
          const pecasFat = fat.pecas_utilizadas.map((p) => ({
            ...p,
            id_fat: fat.id_fat,
          }));
          todasPecasOriginais = [...todasPecasOriginais, ...pecasFat];
        }
      });

      if (
        response.deslocamentos_corrigidos &&
        Array.isArray(response.deslocamentos_corrigidos)
      ) {
        todosDeslocamentosRevisados = response.deslocamentos_corrigidos.map(
          (deslocamento) => ({
            id_deslocamento:
              deslocamento.id ?? Math.floor(Math.random() * -1000),
            km_ida: deslocamento.km_ida ?? 0,
            km_volta: deslocamento.km_volta ?? 0,
            tempo_ida_min: deslocamento.tempo_ida_min ?? 0,
            tempo_volta_min: deslocamento.tempo_volta_min ?? 0,
            observacoes: deslocamento.observacoes ?? "",
            valor_km: deslocamento.valor_km,
            valor_total: deslocamento.valor ?? 0,
            id_corrigido: deslocamento.id,
            isEditing: false,
            isDeleted: false,
            isNew: false,
          })
        );
      }

      if (
        response.pecas_corrigidas &&
        Array.isArray(response.pecas_corrigidas)
      ) {
        todasPecasRevisadas = response.pecas_corrigidas.map((peca) => {
          const quantidade = peca.quantidade ?? 0;
          const valorUnitario = peca.valor_unitario ?? 0;
          const valorTotal =
            peca.valor_total ?? Number((quantidade * valorUnitario).toFixed(2));
          const unidadeMedida = (peca.unidade_medida ?? "").toString().trim();
          const unidade = (peca.unidade ?? unidadeMedida).toString().trim();
          const codigo = peca.codigo ?? "";
          const descricaoBase = (peca.descricao ?? peca.nome ?? "")
            .toLowerCase()
            .trim();
          const origemKey =
            peca.id != null
              ? `id:${peca.id}`
              : peca.id_peca != null
              ? `catalog:${peca.id_peca}`
              : `fat:${peca.id_fat ?? "na"}:${descricaoBase}:${quantidade}`;

          return {
            id: peca.id ?? Math.floor(Math.random() * -1000),
            id_peca: peca.id_peca,
            id_fat: peca.id_fat,
            nome: peca.nome ?? peca.descricao,
            descricao: peca.descricao ?? peca.nome ?? "",
            codigo,
            quantidade,
            unidade_medida: unidadeMedida,
            unidade,
            valor_unitario: valorUnitario,
            valor_total: valorTotal,
            id_corrigida: peca.id,
            origemIdPeca: origemKey,
            data_correcao: peca.data_correcao,
            isEditing: codigo.trim().length === 0,
            isDeleted: false,
            isNew: false,
          };
        });
      }

      setDeslocamentosOriginais(todosDeslocamentosOriginais);
      setDeslocamentosRevisados(todosDeslocamentosRevisados);
      setPecasOriginais(todasPecasOriginais);
      setPecasRevisadas(todasPecasRevisadas);
    } catch (err) {
      console.error("Erro ao carregar OS:", err);
      setFotosCount(0);
      setError(
        "Não foi possí­vel carregar os detalhes da OS. Por favor, tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }, [loadFotosCount, params?.id]);

  // Carregar dados na inicialização
  useEffect(() => {
    fetchOS();
  }, [fetchOS]);

  // Manipuladores para deslocamentos
  const handleEditDeslocamento = (index: number) => {
    setDeslocamentosRevisados((prev) =>
      prev.map((d, i) => (i === index ? { ...d, isEditing: true } : d))
    );
  };

  const handleSaveDeslocamento = (index: number) => {
    setDeslocamentosRevisados((prev) => {
      const updated = prev.map((d, i) =>
        i === index ? { ...d, isEditing: false } : d
      );
      return updated;
    });
  };

  const handleCancelDeslocamento = (index: number) => {
    setDeslocamentosRevisados((prev) => {
      // Se for um novo deslocamento
      if (prev[index].isNew) {
        const filtered = prev.filter((_, i) => i !== index);
        return filtered;
      }

      // Caso contrário, apenas cancela a edição
      return prev.map((d, i) => (i === index ? { ...d, isEditing: false } : d));
    });
  };

  const handleDeleteDeslocamento = (index: number) => {
    setDeslocamentosRevisados((prev) => {
      const updated = prev.map((d, i) =>
        i === index ? { ...d, isDeleted: true } : d
      );
      return updated;
    });
  };

  const handleRestoreDeslocamento = (index: number) => {
    setDeslocamentosRevisados((prev) => {
      const updated = prev.map((d, i) =>
        i === index ? { ...d, isDeleted: false } : d
      );
      return updated;
    });
  };

  const handleAddDeslocamento = () => {
    setDeslocamentosRevisados((prev) => {
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
    setDeslocamentosRevisados((prev) => {
      const updated = prev.map((d, i) =>
        i === index ? { ...d, [field]: value } : d
      );
      return updated;
    });
  };

  const convertOriginalToRevisado = (
    deslocamento: DeslocamentoOriginal
  ): DeslocamentoRevisado => {
    const fallbackId =
      deslocamento.id_deslocamento ?? Math.floor(Math.random() * -1000);
    return {
      id_deslocamento: fallbackId,
      id_fat: deslocamento.id_fat,
      km_ida: deslocamento.km_ida,
      km_volta: deslocamento.km_volta,
      tempo_ida_min: deslocamento.tempo_ida_min,
      tempo_volta_min: deslocamento.tempo_volta_min,
      observacoes: deslocamento.observacoes,
      valor_km: deslocamento.valor_km,
      valor_total: deslocamento.valor_total,
      origemIdDeslocamento: deslocamento.id_deslocamento,
      isEditing: false,
      isDeleted: false,
      isNew: false,
    };
  };

  const handleAcceptDeslocamento = (deslocamento: DeslocamentoOriginal) => {
    if (!deslocamento) return;

    setDeslocamentosRevisados((prev) => {
      const origemId = deslocamento.id_deslocamento;
      const exists =
        origemId !== undefined &&
        prev.some(
          (item) =>
            item.origemIdDeslocamento === origemId ||
            item.id_deslocamento === origemId
        );

      if (exists) {
        return prev;
      }

      return [...prev, convertOriginalToRevisado(deslocamento)];
    });
  };

  const handleAcceptAllDeslocamentos = () => {
    setDeslocamentosRevisados((prev) => {
      const existingIds = new Set(
        prev
          .map((item) => item.origemIdDeslocamento ?? item.id_deslocamento)
          .filter((id): id is number => typeof id === "number")
      );

      const novos = deslocamentosOriginais
        .filter((deslocamento) => {
          if (deslocamento.id_deslocamento === undefined) {
            return true;
          }

          return !existingIds.has(deslocamento.id_deslocamento);
        })
        .map(convertOriginalToRevisado);

      if (novos.length === 0) {
        return prev;
      }

      return [...prev, ...novos];
    });
  };

  function getPecaOrigemKey(peca: PecaOriginal): string {
    if (peca.id != null) {
      return `id:${peca.id}`;
    }

    if (peca.id_peca != null) {
      return `catalog:${peca.id_peca}`;
    }

    const descricao = (peca.descricao ?? peca.nome ?? "").toLowerCase().trim();
    const quantidade = peca.quantidade ?? 0;
    const fat = peca.id_fat ?? "na";

    return `fat:${fat}:${descricao}:${quantidade}`;
  }

  const convertOriginalToRevisada = (peca: PecaOriginal): PecaRevisada => {
    const baseId = peca.id ?? peca.id_peca;
    const fallbackId = baseId ?? Math.floor(Math.random() * -1000);
    const quantidade = peca.quantidade ?? 0;
    const valorUnitario = peca.valor_unitario ?? 0;
    const valorTotal = peca.valor_total ?? quantidade * valorUnitario;
    const unidadeMedida = (peca.unidade_medida ?? "").toString().trim();
    const unidade = (peca.unidade ?? unidadeMedida).toString().trim();
    const codigo = peca.codigo ?? "";
    const origemKey = getPecaOrigemKey(peca);

    return {
      id: fallbackId,
      id_peca: peca.id_peca,
      id_fat: peca.id_fat,
      nome: peca.nome ?? peca.descricao,
      descricao: peca.descricao ?? peca.nome ?? "",
      descricaoOriginal: peca.descricao ?? peca.nome ?? "",
      codigo,
      codigoOriginal: peca.codigo ?? null,
      quantidade,
      unidade_medida: unidadeMedida,
      unidade,
      valor_unitario: valorUnitario,
      valor_total: valorTotal,
      origemIdPeca: origemKey,
      isEditing: codigo.trim().length === 0,
      isDeleted: false,
      isNew: false,
    };
  };

  const handleAcceptPeca = (peca: PecaOriginal) => {
    if (!peca) return;

    const origemKey = getPecaOrigemKey(peca);

    setPecasRevisadas((prev) => {
      const exists = prev.some((item) => {
        const itemKey =
          item.origemIdPeca != null
            ? String(item.origemIdPeca)
            : item.id != null
            ? `id:${item.id}`
            : null;

        return itemKey === origemKey;
      });

      if (exists) {
        return prev;
      }

      return [...prev, convertOriginalToRevisada(peca)];
    });
  };

  const handleAcceptAllPecas = () => {
    setPecasRevisadas((prev) => {
      const existingKeys = new Set(
        prev
          .map((item) => {
            if (item.origemIdPeca != null) {
              return String(item.origemIdPeca);
            }

            if (item.id != null) {
              return `id:${item.id}`;
            }

            return null;
          })
          .filter((key): key is string => key !== null)
      );

      const novas = pecasOriginais
        .filter((peca) => {
          const origemKey = getPecaOrigemKey(peca);
          return !existingKeys.has(origemKey);
        })
        .map(convertOriginalToRevisada);

      if (novas.length === 0) {
        return prev;
      }

      return [...prev, ...novas];
    });
  };

  // Manipuladores para peças
  const handleEditPeca = (index: number) => {
    setPecasRevisadas((prev) =>
      prev.map((p, i) => (i === index ? { ...p, isEditing: true } : p))
    );
  };

  const handleSavePeca = (index: number) => {
    setPecasRevisadas((prev) => {
      const item = prev[index];
      if (!item) {
        return prev;
      }

      if (!item.codigo || item.codigo.trim().length === 0) {
        return prev.map((p, i) =>
          i === index ? { ...p, isEditing: true } : p
        );
      }

      return prev.map((p, i) =>
        i === index ? { ...p, isEditing: false, isNew: false } : p
      );
    });
  };

  const handleCancelPeca = (index: number) => {
    setPecasRevisadas((prev) => {
      const item = prev[index];
      if (!item) {
        return prev;
      }

      if (item.isNew) {
        return prev.filter((_, i) => i !== index);
      }

      return prev.map((p, i) => (i === index ? { ...p, isEditing: false } : p));
    });
  };

  const handleDeletePeca = (index: number) => {
    setPecasRevisadas((prev) => {
      const updated = prev.map((p, i) =>
        i === index ? { ...p, isDeleted: true } : p
      );
      return updated;
    });
  };

  const handleRestorePeca = (index: number) => {
    setPecasRevisadas((prev) => {
      const updated = prev.map((p, i) =>
        i === index ? { ...p, isDeleted: false } : p
      );
      return updated;
    });
  };

  const handleAddPeca = () => {
    setPecasRevisadas((prev) => {
      const newPeca: PecaRevisada = {
        id: Math.floor(Math.random() * -1000),
        descricao: "",
        descricaoOriginal: "",
        codigo: "",
        codigoOriginal: "",
        quantidade: 1,
        unidade_medida: "",
        unidade: "",
        valor_unitario: 0,
        valor_total: 0,
        isEditing: true,
        isDeleted: false,
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
    setPecasRevisadas((prev) => {
      const updated = prev.map((p, i) => {
        if (i !== index) return p;

        const updatedPeca = { ...p, [field]: value };

        if (field === "unidade_medida") {
          updatedPeca.unidade =
            typeof value === "string"
              ? value.trim()
              : String(value ?? "").trim();
        }

        // Atualizar valor_total se quantidade ou valor_unitario mudar
        if (field === "quantidade" || field === "valor_unitario") {
          const quantidade = Number(updatedPeca.quantidade) || 0;
          const valorUnitario = Number(updatedPeca.valor_unitario) || 0;
          updatedPeca.valor_total = quantidade * valorUnitario;
        }

        return updatedPeca;
      });
      return updated;
    });
  };

  const handlePecaCatalogSelect = (
    index: number,
    catalogItem: PecaCatalogo
  ) => {
    setPecasRevisadas((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;

        return {
          ...p,
          id_peca: catalogItem.id,
          codigo: catalogItem.codigo,
          descricao: catalogItem.descricao,
          nome: catalogItem.descricao,
          unidade_medida: catalogItem.unidade_medida,
          unidade: catalogItem.unidade_medida,
        };
      })
    );
  };

  const sanitizeDeslocamentosParaEnvio = (
    deslocamentos: DeslocamentoRevisado[]
  ): OSDeslocamento[] =>
    deslocamentos
      .filter((deslocamento) => !deslocamento.isDeleted)
      .map((deslocamento) => ({
        id_deslocamento: deslocamento.id_deslocamento,
        km_ida: Number(deslocamento.km_ida ?? 0),
        km_volta: Number(deslocamento.km_volta ?? 0),
        tempo_ida_min: Number(deslocamento.tempo_ida_min ?? 0),
        tempo_volta_min: Number(deslocamento.tempo_volta_min ?? 0),
        valor_km:
          deslocamento.valor_km != null
            ? Number(deslocamento.valor_km)
            : undefined,
        valor_total:
          deslocamento.valor_total != null
            ? Number(deslocamento.valor_total)
            : undefined,
        observacoes: deslocamento.observacoes ?? "",
      }));

  const sanitizePecasParaEnvio = (pecas: PecaRevisada[]): OSPecaUtilizada[] =>
    pecas
      .filter((peca) => !peca.isDeleted)
      .map((peca) => ({
        id: peca.id,
        id_peca: peca.id_peca,
        nome: peca.nome,
        descricao: peca.descricao ?? "",
        codigo: peca.codigo ?? "",
        quantidade: Number(peca.quantidade ?? 0),
        unidade_medida: (peca.unidade_medida ?? "").toString().trim(),
        unidade: (peca.unidade ?? peca.unidade_medida ?? "").toString().trim(),
        valor_total: Number(peca.valor_total ?? 0),
      }));

  const handleSubmitRevisao = async (concluirOs: boolean) => {
    if (isSubmittingRevisao) {
      return;
    }

    if (!os) {
      showError("Erro na revisao", "OS nao encontrada para revisao.");
      return;
    }

    setIsSubmittingRevisao(true);
    setSubmittingAction(concluirOs ? "conclude" : "save");

    try {
      const deslocamentosParaEnvio = sanitizeDeslocamentosParaEnvio(
        deslocamentosRevisados
      );
      const pecasParaEnvio = sanitizePecasParaEnvio(pecasRevisadas);

      const response = await ordensServicoService.salvarRevisaoOS(os.id_os, {
        observacoesRevisao,
        observacoesMaquina: editarObservacoesMaquina
          ? observacoesMaquina
          : undefined,
        pecas: pecasParaEnvio,
        deslocamentos: deslocamentosParaEnvio,
        concluir_os: concluirOs,
      });

      const successTitle = concluirOs ? "Revisao concluida" : "Revisao salva";
      const successMessage =
        response?.mensagem ??
        response?.message ??
        (concluirOs
          ? "Revisao concluida com sucesso."
          : "Revisao salva para continuar mais tarde.");

      showSuccess(successTitle, successMessage);

      router.push("/admin/os_revisao");
    } catch (error: unknown) {
      console.error("Erro ao salvar revisao da OS:", error);
      let message = "Erro ao salvar revisao da OS.";
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } })
          .response?.data?.message === "string"
      ) {
        message = String(
          (error as { response?: { data?: { message?: string } } }).response
            ?.data?.message
        );
      } else if (error instanceof Error && error.message) {
        message = error.message;
      }
      showError("Erro ao salvar revisao da OS", message);
    } finally {
      setIsSubmittingRevisao(false);
      setSubmittingAction(null);
    }
  };

  const handleCancelarRevisao = () => {
    router.push("/admin/os_revisao");
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
            {/* Lado esquerdo: cliente e localizacao */}
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

              <div className="ml-8 flex flex-col text-sm text-gray-600 min-w-[180px]">
                {os.maquina?.numero_serie && (
                  <span className="font-medium text-gray-700 truncate">
                    Numero de Serie: {os.maquina.numero_serie}
                  </span>
                )}
                {os.maquina?.descricao && (
                  <span className="text-xs text-gray-500 truncate">
                    {os.maquina.descricao}
                  </span>
                )}
              </div>
            </div>

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
                {os.tecnico?.nome || "Nao atribuido"}
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
                {os.situacao_os.data_situacao || "-"}
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
          Deslocamentos (
          {deslocamentosOriginais.length} |{" "}
          {deslocamentosRevisados.filter((d) => !d.isDeleted).length})
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
          Peças ({pecasOriginais.length} |{" "}
          {pecasRevisadas.filter((p) => !p.isDeleted).length})
        </button>
        <button
          className={`py-3 px-5 text-sm font-medium flex items-center gap-2 ${
            activeTab === "fotos"
              ? "border-b-2 border-[var(--primary)] text-[var(--primary)]"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("fotos")}
        >
          <Camera className="h-4 w-4" />
          Fotos ({fotosCount})
        </button>
        <button
          className={`py-3 px-5 text-sm font-medium flex items-center gap-2 ${
            activeTab === "revisao"
              ? "border-b-2 border-[var(--primary)] text-[var(--primary)]"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("revisao")}
        >
          <ClipboardCheck className="h-4 w-4" />
          Revisão
        </button>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        {activeTab === "info" && (
          <InfoTab
            os={os}
            machineObservations={observacoesMaquina}
          />
        )}

        {activeTab === "deslocamentos" && (
          <DeslocamentosTab
            originais={deslocamentosOriginais}
            revisados={deslocamentosRevisados}
            onAccept={handleAcceptDeslocamento}
            onAcceptAll={handleAcceptAllDeslocamentos}
            onAdd={handleAddDeslocamento}
            onChange={handleDeslocamentoChange}
            onEdit={handleEditDeslocamento}
            onSave={handleSaveDeslocamento}
            onCancel={handleCancelDeslocamento}
            onDelete={handleDeleteDeslocamento}
            onRestore={handleRestoreDeslocamento}
          />
        )}

        {activeTab === "pecas" && (
          <PecasTab
            originais={pecasOriginais}
            revisadas={pecasRevisadas}
            onAccept={handleAcceptPeca}
            onAcceptAll={handleAcceptAllPecas}
            onAdd={handleAddPeca}
            onChange={handlePecaChange}
            onSelectCatalogItem={handlePecaCatalogSelect}
            onEdit={handleEditPeca}
            onSave={handleSavePeca}
            onCancel={handleCancelPeca}
            onDelete={handleDeletePeca}
            onRestore={handleRestorePeca}
          />
        )}

        {activeTab === "fotos" && (
          <FotosTab
            osId={os.id_os}
            fats={os.fats ?? []}
            onCountChange={setFotosCount}
          />
        )}

        {activeTab === "revisao" && (
          <RevisaoTab
            observacoesRevisao={observacoesRevisao}
            onObservacoesRevisaoChange={setObservacoesRevisao}
            observacoesMaquina={observacoesMaquina}
            isEditandoObservacoesMaquina={editarObservacoesMaquina}
            onToggleEditarObservacoesMaquina={setEditarObservacoesMaquina}
            onObservacoesMaquinaChange={setObservacoesMaquina}
            onSubmit={handleSubmitRevisao}
            onCancel={handleCancelarRevisao}
            isSubmitting={isSubmittingRevisao}
            submittingAction={submittingAction}
          />
        )}
      </div>
    </>
  );
}
