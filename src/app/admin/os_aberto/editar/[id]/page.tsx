"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { LoadingSpinner as Loading } from "@/components/LoadingPersonalizado";
import PageHeader from "@/components/admin/ui/PageHeader";
import {
  CustomSelect,
  TextAreaField,
  DateTimeField,
  type MachineOptionType,
} from "@/components/admin/form";
import { maquinaSelectComponents } from "./MaquinaItem";
import { clientesService } from "@/api/services/clientesService";
import { maquinasService } from "@/api/services/maquinasService";
import { motivosPendenciaService } from "@/api/services/motivosPendenciaService";
import { motivosAtendimentoService } from "@/api/services/motivosAtendimentoService";
import { Cliente, ClienteContato } from "@/types/admin/cadastro/clientes";
import { MotivoPendencia } from "@/types/admin/cadastro/motivos_pendencia";
import { Maquina } from "@/types/admin/cadastro/maquinas";
import type {
  UsuarioComRegioes,
  UsuariosRegioesResponse,
} from "@/types/admin/cadastro/usuarios";
import { OptionType } from "@/components/admin/form/CustomSelect";
import useDebouncedCallback from "@/hooks/useDebouncedCallback";
import { useToast } from "@/components/admin/ui/ToastContainer";
import api from "@/api/api";
import MaquinaClienteConfirmModal from "@/app/admin/os_aberto/components/MaquinaClienteConfirmModal";

// Interface para a resposta da API de OS
interface OrdemServicoResponse {
  id_os: number;
  descricao_problema: string;
  em_garantia: boolean;
  data_agendada: string;
  data_fechamento: string;
  cliente: {
    id: number;
    codigo_erp: string;
    razao_social: string;
    nome: string;
    nome_fantasia?: string;
    endereco: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
    latitude: string;
    longitude: string;
    id_regiao: number;
    nome_regiao: string;
  };
  contato: {
    id: number;
    nome: string;
    telefone: string;
    whatsapp: string;
    email: string;
  };
  maquina: {
    id: number;
    numero_serie: string;
    descricao: string;
    modelo: string;
  };
  abertura: {
    data_abertura: string;
    forma_abertura: string;
    origem_abertura: string;
    id_usuario: number;
    nome_usuario: string;
    id_motivo_atendimento: number;
    motivo_atendimento: string;
  };
  situacao_os: {
    codigo: number;
    descricao: string;
    data_situacao?: string;
    id_motivo_pendencia: number;
    motivo_pendencia: string;
  };
  tecnico: {
    id: number;
    nome: string;
    tipo: string;
    observacoes: string;
  };
  liberacao_financeira?: {
    liberada: boolean;
    id_usuario_liberacao: number;
    nome_usuario_liberacao: string;
    data_liberacao: string;
  };
  revisao_os?: {
    id_usuario: number;
    nome: string;
    data: string;
    observacoes: string;
  };
  pecas_corrigidas?: Array<Record<string, unknown>>;
  deslocamentos_corrigidos?: Array<Record<string, unknown>>;
  fats?: Array<Record<string, unknown>>;
}

// Importar componentes do formulário de criação para reuso
import FormContainer from "../../novo/components/FormContainer";
import FormActions from "../../novo/components/FormActions";
import CustomContatoForm from "../../novo/components/CustomContatoForm";
import { clienteSelectComponents } from "../../novo/components/ClienteItem";
import { contatoSelectComponents } from "../../novo/components/ContatoItem";

interface ClienteOption extends OptionType {
  value: number;
  cidade?: string;
  uf?: string;
  nome_fantasia?: string;
  razao_social?: string;
  codigo_erp?: string;
  regiaoId?: number | null;
  regiaoNome?: string | null;
}

interface MaquinaOption extends MachineOptionType {
  value: number;
}

interface MotivoPendenciaOption extends OptionType {
  value: number;
}

interface TecnicoOption extends OptionType {
  value: number;
}

// Defining our option type for this component
interface ContatoOption {
  value: number;
  label: string;
  contato: ClienteContato;
}

interface FormaAberturaOption extends OptionType {
  value: string;
  label: string;
}

const EXPANDED_STORAGE_KEY = "osAbertoExpandedId";

const EditarOrdemServico = () => {
  const params = useParams();
  const osId = params.id as string;
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [clienteOptions, setClienteOptions] = useState<ClienteOption[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<ClienteOption | null>(
    null
  );
  const [maquinaOptions, setMaquinaOptions] = useState<MaquinaOption[]>([]);
  const [selectedMaquina, setSelectedMaquina] = useState<MaquinaOption | null>(
    null
  );
  const [isSearchingMaquinas, setIsSearchingMaquinas] = useState(false);
  const [motivosPendenciaOptions, setMotivosPendenciaOptions] = useState<
    MotivoPendenciaOption[]
  >([]);
  const [selectedMotivoPendencia, setSelectedMotivoPendencia] =
    useState<MotivoPendenciaOption | null>(null);
  const [motivosAtendimentoOptions, setMotivosAtendimentoOptions] = useState<
    MotivoPendenciaOption[]
  >([]);
  const [selectedMotivoAtendimento, setSelectedMotivoAtendimento] =
    useState<MotivoPendenciaOption | null>(null);
  const [descricaoProblema, setDescricaoProblema] = useState("");
  const [formaAbertura, setFormaAbertura] = useState<FormaAberturaOption>({
    value: "Telefone",
    label: "Telefone",
  });
  const [dataAgendada, setDataAgendada] = useState("");
  const formaAberturaOptions = useMemo(
    () => [
      { value: "Email", label: "Email" },
      { value: "Telefone", label: "Telefone" },
      { value: "WhatsApp", label: "WhatsApp" },
    ],
    []
  );
  const [isSearchingClientes, setIsSearchingClientes] = useState(false);
  const [clienteInput, setClienteInput] = useState("");
  const [loadingMaquinas, setLoadingMaquinas] = useState(false);
  const [maquinaInput, setMaquinaInput] = useState("");
  const [maquinaConfirmModal, setMaquinaConfirmModal] = useState<{
    isOpen: boolean;
    maquina: MaquinaOption | null;
  }>({
    isOpen: false,
    maquina: null,
  });
  const [contatoOptions, setContatoOptions] = useState<ContatoOption[]>([]);
  const [selectedContato, setSelectedContato] = useState<ContatoOption | null>(
    null
  );
  const [loadingContatos, setLoadingContatos] = useState(false);
  const [customContatoNome, setCustomContatoNome] = useState("");
  const [customContatoNomeCompleto, setCustomContatoNomeCompleto] =
    useState("");
  const [customContatoCargo, setCustomContatoCargo] = useState("");
  const [customContatoEmail, setCustomContatoEmail] = useState("");
  const [customContatoTelefone, setCustomContatoTelefone] = useState("");
  const [customContatoWhatsapp, setCustomContatoWhatsapp] = useState("");
  const [recebeAvisoOS, setRecebeAvisoOS] = useState(false);
  const [useCustomContato, setUseCustomContato] = useState(false);
  const [saveToClient, setSaveToClient] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (osId) {
      window.sessionStorage.setItem(EXPANDED_STORAGE_KEY, osId.toString());
    }
  }, [osId]);
  const [tecnicosOptions, setTecnicosOptions] = useState<TecnicoOption[]>([]);
  const [selectedTecnico, setSelectedTecnico] = useState<TecnicoOption | null>(
    null
  );
  const [clienteRegiaoId, setClienteRegiaoId] = useState<number | null>(null);
  const [clienteRegiaoNome, setClienteRegiaoNome] = useState<string | null>(
    null
  );
  const [showAllTecnicos, setShowAllTecnicos] = useState(false);
  const [tecnicoError, setTecnicoError] = useState<string | null>(null);
  const [loadingTecnicos, setLoadingTecnicos] = useState(false);
  const [showNameError, setShowNameError] = useState(false);

  // Estado para controlar validação de campos
  const [errors, setErrors] = useState<{
    cliente?: boolean;
    maquina?: boolean;
    contato?: boolean;
    motivoPendencia?: boolean;
    motivoAtendimento?: boolean;
    descricaoProblema?: boolean;
    formaAbertura?: boolean;
    customContatoNome?: boolean;
  }>({});

  // Refs para controlar chamadas à API
  const motivosPendenciaLoaded = useRef(false);
  const osDataLoaded = useRef(false);
  const [tecnicosLoaded, setTecnicosLoaded] = useState(false);

  // Carregar dados da OS existente
  useEffect(() => {
    const fetchOSData = async () => {
      try {
        setIsLoading(true);
        // Usando a API diretamente para obter os dados da OS pelo ID na rota
        const response = await api.get(`/ordens_servico?id=${osId}`);

        let osArray;
        if (response && typeof response === "object") {
          if ("data" in response) {
            osArray = response.data;
          } else {
            osArray = response;
          }
        }

        if (!osArray || !Array.isArray(osArray) || osArray.length === 0) {
          console.error("Resposta da API inválida:", response);
          throw new Error("Nenhum dado de OS encontrado na resposta da API");
        }

        const os = osArray[0] as OrdemServicoResponse;

        if (os) {
          const clienteRazaoSocial =
            os.cliente.razao_social && os.cliente.razao_social.trim().length > 0
              ? os.cliente.razao_social
              : os.cliente.nome_fantasia || "Cliente sem razão social";
          const clienteNomeFantasia =
            os.cliente.nome_fantasia &&
            os.cliente.nome_fantasia.trim().length > 0
              ? os.cliente.nome_fantasia
              : undefined;
          const clienteCodigoErp =
            os.cliente.codigo_erp && os.cliente.codigo_erp.length > 0
              ? ` (${os.cliente.codigo_erp})`
              : " (-)";

          const clienteOption = {
            value: os.cliente.id || 0,
            label: `${clienteRazaoSocial}${clienteCodigoErp}`,
            cidade: os.cliente.cidade,
            uf: os.cliente.uf,
            nome_fantasia: clienteNomeFantasia,
            razao_social: os.cliente.razao_social || "",
            codigo_erp: os.cliente.codigo_erp || "",
            regiaoId: os.cliente.id_regiao ?? null,
            regiaoNome: os.cliente.nome_regiao ?? null,
          };
          setSelectedCliente(clienteOption);
          setClienteRegiaoId(os.cliente.id_regiao ?? null);
          setClienteRegiaoNome(os.cliente.nome_regiao ?? null);
          setShowAllTecnicos(false);
          setTecnicosLoaded(false);
          setTecnicoError(null);

          if (os.cliente.id) {
            setLoadingMaquinas(true);
            maquinasService
              .getByClienteId(os.cliente.id, 15)
              .then((response) => {
                const machineOptions =
                  response && response.dados
                    ? response.dados.map((maquina: Maquina) => {
                        const baseDescricao =
                          maquina.descricao || maquina.modelo || "";
                        const labelDescricao = baseDescricao
                          ? ` - ${baseDescricao}`
                          : "";

                        return {
                          value: maquina.id,
                          label: `${maquina.numero_serie}${labelDescricao}`,
                          isInWarranty: maquina.situacao === "G",
                          data_final_garantia:
                            maquina.data_final_garantia || "",
                          numero_serie: maquina.numero_serie || "",
                          descricao: baseDescricao,
                          clienteNomeFantasia:
                            maquina.cliente_atual?.nome_fantasia || "",
                          clienteAtualId: maquina.cliente_atual?.id_cliente ?? null,
                        };
                      })
                    : [];
                machineOptions.push({
                  value: -1,
                  label: "Buscar outra máquina...",
                  isInWarranty: false,
                  data_final_garantia: "",
                  numero_serie: "",
                  descricao: "",
                  clienteNomeFantasia: "",
                  clienteAtualId: null,
                });

                setMaquinaOptions(machineOptions as MaquinaOption[]);
              })
              .catch((error) =>
                console.error("Erro ao buscar máquinas:", error)
              )
              .finally(() => setLoadingMaquinas(false));
          }

          // Máquina
          const baseDescricao = os.maquina.descricao || os.maquina.modelo || "";
          const labelDescricao = baseDescricao ? ` - ${baseDescricao}` : "";
          const maquinaOption = {
            value: os.maquina.id || 0,
            label: `${os.maquina.numero_serie}${labelDescricao}`,
            isInWarranty: os.em_garantia,
            data_final_garantia: "",
            numero_serie: os.maquina.numero_serie || "",
            descricao: baseDescricao,
            clienteNomeFantasia:
              os.cliente?.nome || os.cliente?.razao_social || "",
            clienteAtualId: os.cliente?.id ?? null,
          };
          setSelectedMaquina(maquinaOption);

          // Contato
          if (os.contato) {
            const contatoCompleto = {
              ...os.contato,
              situacao: "A",
              recebe_aviso_os: false,
              cargo: "",
              nome_completo: os.contato.nome,
            };

            const contatoOption = {
              value: os.contato.id || 0,
              label: os.contato.nome,
              contato: contatoCompleto,
            };

            setSelectedContato(contatoOption as ContatoOption);

            // Pré-carregar contatos do cliente para garantir que a lista de contatos esteja disponível
            if (os.cliente.id) {
              setLoadingContatos(true);
              clientesService
                .getContacts(os.cliente.id)
                .then((response) => {
                  const contatos =
                    response && response.contatos ? response.contatos : [];
                  const options =
                    contatos.length > 0
                      ? contatos.map((contato: ClienteContato) => ({
                          value: contato.id,
                          label: contato.nome,
                          contato: {
                            ...contato,
                            situacao: "A",
                          },
                        }))
                      : [];

                  options.push({
                    value: -1,
                    label: "Adicionar novo contato...",
                    contato: {
                      id: -1,
                      nome: "",
                      email: "",
                      telefone: "",
                      whatsapp: "",
                      situacao: "A",
                      recebe_aviso_os: false,
                    } as ClienteContato,
                  });

                  setContatoOptions(options as ContatoOption[]);
                })
                .catch((error) =>
                  console.error("Erro ao buscar contatos:", error)
                )
                .finally(() => setLoadingContatos(false));
            }
          }
          if (os.situacao_os && os.situacao_os.id_motivo_pendencia) {
            const motivoPendenciaOption = {
              value: os.situacao_os.id_motivo_pendencia,
              label: os.situacao_os.motivo_pendencia,
            };
            setSelectedMotivoPendencia(motivoPendenciaOption);
          }

          // Motivo de Atendimento
          if (os.abertura && os.abertura.id_motivo_atendimento) {
            const motivoAtendimentoOption = {
              value: os.abertura.id_motivo_atendimento,
              label: os.abertura.motivo_atendimento,
            };
            setSelectedMotivoAtendimento(motivoAtendimentoOption);
          }

          // Descrição do problema
          setDescricaoProblema(os.descricao_problema);

          // Forma de abertura - convertendo para o formato correto para corresponder às opções do select
          if (os.abertura && os.abertura.forma_abertura) {
            const formaCapitalizada =
              os.abertura.forma_abertura.charAt(0).toUpperCase() +
              os.abertura.forma_abertura.slice(1).toLowerCase();

            const availableOptions = [
              { value: "Email", label: "Email" },
              { value: "Telefone", label: "Telefone" },
              { value: "WhatsApp", label: "WhatsApp" },
            ];

            const formaExistente = availableOptions.find(
              (option) =>
                option.value.toLowerCase() === formaCapitalizada.toLowerCase()
            );

            if (formaExistente) {
              setFormaAbertura(formaExistente);
            } else {
              setFormaAbertura({
                value: formaCapitalizada,
                label: formaCapitalizada,
              });
            }
          }

          // Data agendada
          if (os.data_agendada) {
            try {
              const parts = os.data_agendada.split(" ");
              if (parts.length === 2) {
                const dateParts = parts[0].split("/");
                if (dateParts.length === 3) {
                  const day = dateParts[0];
                  const month = dateParts[1];
                  const year = dateParts[2];
                  const time = parts[1];

                  const formattedDate = `${year}-${month.padStart(
                    2,
                    "0"
                  )}-${day.padStart(2, "0")}T${time}`;
                  setDataAgendada(formattedDate);
                } else {
                  console.error("Formato de data inválido:", os.data_agendada);
                  setDataAgendada(os.data_agendada);
                }
              } else {
                console.error(
                  "Formato de data e hora inválido:",
                  os.data_agendada
                );
                setDataAgendada(os.data_agendada);
              }
            } catch (error) {
              console.error("Erro ao formatar data:", error);
              setDataAgendada(os.data_agendada);
            }
          }

          // Técnico
          if (os.tecnico && os.tecnico.id) {
            const tecnicoOption = {
              value: os.tecnico.id,
              label: os.tecnico.nome,
            };
            setSelectedTecnico(tecnicoOption);
          }

          osDataLoaded.current = true;
        }
      } catch (error) {
        console.error("Erro ao carregar dados da OS:", error);

        try {
          const testResponse = await api.get(`/ordens_servico?id=${osId}`);

          if (testResponse) {
            const responseObj = testResponse as Record<string, unknown>;
            const hasDataProp =
              responseObj &&
              typeof responseObj === "object" &&
              "data" in responseObj;

            if (hasDataProp) {
              const data = responseObj.data;

              if (Array.isArray(data)) {
                console.log("Debug - Tamanho do array:", data.length);
                if (data.length > 0) {
                  console.log("Debug - Primeiro item:", data[0]);
                }
              }
            }
          }
        } catch (debugError) {
          console.error("Debug request failed:", debugError);
        }

        showError("Erro ao carregar dados da OS");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOSData();
  }, [osId, showError]);

  const fetchTecnicos = useCallback(
    async (fetchAll = false) => {
      if (!fetchAll && !clienteRegiaoId) {
        setTecnicosOptions([]);
        setTecnicosLoaded(false);
        setTecnicoError(null);
        return;
      }

      setTecnicosLoaded(false);
      setLoadingTecnicos(true);
      setTecnicoError(null);

      try {
        const response = await api.get<
          UsuariosRegioesResponse | UsuarioComRegioes[]
        >(
          "/usuarios_regioes",
          fetchAll
            ? undefined
            : {
                params: clienteRegiaoId ? { id_regiao: clienteRegiaoId } : {},
              }
        );

        let usuarios: UsuarioComRegioes[] = [];

        if (Array.isArray(response)) {
          usuarios = response;
        } else if (response && Array.isArray(response.dados)) {
          usuarios = response.dados;
        }

        const filteredUsuarios = fetchAll
          ? usuarios
          : usuarios.filter((usuario) =>
              usuario.regioes?.some(
                (regiao) => regiao.id_regiao === clienteRegiaoId
              )
            );

        const options = filteredUsuarios.map((usuario) => ({
          value: usuario.id_usuario,
          label: usuario.nome_usuario,
        }));

        if (options.length === 0) {
          setTecnicoError(
            fetchAll
              ? "Nenhum tecnico encontrado."
              : "Nenhum tecnico encontrado para esta regiao."
          );
        }

        let mergedOptions = options;

        if (selectedTecnico) {
          const withoutSelected = options.filter(
            (option) => option.value !== selectedTecnico.value
          );
          mergedOptions = [selectedTecnico, ...withoutSelected];
        }

        setTecnicosOptions(mergedOptions);
        setTecnicosLoaded(true);
      } catch (error) {
        console.error("Erro ao carregar tecnicos:", error);
        setTecnicoError(
          error instanceof Error
            ? `Erro ao carregar tecnicos: ${error.message}`
            : "Erro ao carregar tecnicos."
        );
        setTecnicosOptions([]);
        setTecnicosLoaded(false);
      } finally {
        setLoadingTecnicos(false);
      }
    },
    [clienteRegiaoId, selectedTecnico]
  );

  // Define handleClienteChange before it's referenced
  const handleClienteChange = useCallback(
    async (selectedOption: ClienteOption | null) => {
      setSelectedCliente(selectedOption);
      setClienteInput("");
      setSelectedContato(null);
      setUseCustomContato(false);

      if (selectedOption) {
        setShowAllTecnicos(false);
        setTecnicosOptions([]);
        setTecnicoError(null);
        setSelectedTecnico(null);

        let regiaoId = selectedOption.regiaoId ?? null;
        let regiaoNome = selectedOption.regiaoNome ?? null;

        if (!regiaoId) {
          try {
            const clienteDetalhes = await clientesService.getById(
              selectedOption.value
            );
            const clienteDados =
              clienteDetalhes && Array.isArray(clienteDetalhes.dados)
                ? clienteDetalhes.dados[0]
                : null;

            if (clienteDados) {
              const clienteComRegiao = clienteDados as {
                id_regiao?: number;
                nome_regiao?: string;
                regiao?: {
                  id?: number;
                  nome?: string;
                  id_regiao?: number;
                  nome_regiao?: string;
                };
              };

              const regiaoInfo = clienteComRegiao.regiao;

              regiaoId =
                regiaoId ??
                regiaoInfo?.id ??
                regiaoInfo?.id_regiao ??
                clienteComRegiao.id_regiao ??
                null;

              regiaoNome =
                regiaoNome ??
                regiaoInfo?.nome ??
                regiaoInfo?.nome_regiao ??
                clienteComRegiao.nome_regiao ??
                null;
            }
          } catch (error) {
            console.error("Erro ao carregar regiao do cliente:", error);
          }
        }

        setClienteRegiaoId(regiaoId ?? null);
        setClienteRegiaoNome(regiaoNome ?? null);
        setTecnicosLoaded(false);

        setLoadingMaquinas(true);
        try {
          const maquinasResponse = await maquinasService.getByClienteId(
            selectedOption.value,
            15
          );

          const machineOptions =
            maquinasResponse && maquinasResponse.dados
              ? maquinasResponse.dados.map((maquina: Maquina) => ({
                  value: maquina.id,
                  label: `${maquina.modelo || maquina.descricao} (${
                    maquina.numero_serie
                  })`,
                  isInWarranty: maquina.situacao === "G",
                  data_final_garantia: maquina.data_final_garantia || "",
                }))
              : [];

          machineOptions.push({
            value: -1,
            label: "Buscar outra máquina...",
            isInWarranty: false,
            data_final_garantia: "",
          });

          setMaquinaOptions(machineOptions as MaquinaOption[]);
          if (!osDataLoaded.current) {
            setSelectedMaquina(null);
          }
        } catch (error) {
          console.error("Erro ao buscar máquinas:", error);
        } finally {
          setLoadingMaquinas(false);
        }

        // Carregar contatos do cliente
        setLoadingContatos(true);
        try {
          const contatosResponse = await clientesService.getContacts(
            selectedOption.value
          );

          const contatos =
            contatosResponse && contatosResponse.contatos
              ? contatosResponse.contatos
              : [];

          const options =
            contatos.length > 0
              ? contatos.map((contato: ClienteContato) => ({
                  value: contato.id,
                  label: contato.nome,
                  contato,
                }))
              : [];

          options.push({
            value: -1,
            label: "Adicionar novo contato...",
            contato: {
              id: -1,
              nome: "",
              email: "",
              telefone: "",
              whatsapp: "",
              situacao: "A",
              recebe_aviso_os: false,
            } as ClienteContato,
          });

          const validOptions = options.map((option) => {
            return {
              ...option,
              label: option.label || "",
              contato: {
                ...option.contato,
                situacao: "A",
              },
            };
          });
          setContatoOptions(validOptions as ContatoOption[]);
          if (!osDataLoaded.current) {
            setSelectedContato(null);
          }
        } catch (error) {
          console.error("Erro ao buscar contatos:", error);
        } finally {
          setLoadingContatos(false);
        }
      } else {
        setMaquinaOptions([]);
        setMaquinaInput("");
        setContatoOptions([]);
        setClienteRegiaoId(null);
        setClienteRegiaoNome(null);
        setShowAllTecnicos(false);
        setTecnicosOptions([]);
        setSelectedTecnico(null);
        setTecnicoError(null);
        setTecnicosLoaded(false);
      }
    },
    []
  );

  // Adaptadores de tipo para os handlers de mudança de select (memoizados)
  const handleClienteSelectChange = useCallback(
    (option: OptionType | null) => {
      handleClienteChange(option as ClienteOption | null);
      // Limpar o input quando um cliente for selecionado
      if (option) {
        setClienteInput("");
        setCustomContatoNome("");
        setCustomContatoNomeCompleto("");
        setCustomContatoCargo("");
        setCustomContatoEmail("");
        setCustomContatoTelefone("");
        setCustomContatoWhatsapp("");
        setRecebeAvisoOS(false);
        setSaveToClient(false);
      }
    },
    [handleClienteChange]
  );

  const handleContatoSelectChange = useCallback((option: OptionType | null) => {
    const contatoOption = option as ContatoOption | null;
    setSelectedContato(contatoOption);
    setUseCustomContato(contatoOption?.contato.id === -1 || false);

    if (option) {
      setErrors((prev) => ({
        ...prev,
        contato: false,
        customContatoNome: false,
      }));
      setShowNameError(false);
    }
  }, []);

  const focusMaquinaField = useCallback(() => {
    if (typeof document === "undefined") {
      return;
    }
    const maquinaInputElement =
      document.querySelector<HTMLInputElement>("#maquina input");
    if (maquinaInputElement) {
      setTimeout(() => maquinaInputElement.focus(), 0);
    }
  }, []);

  const handleMaquinaSelectChange = useCallback(
    (option: OptionType | null) => {
      const maquinaOption = option as MaquinaOption | null;

      if (!maquinaOption) {
        setSelectedMaquina(null);
        return;
      }

      if (maquinaOption.value === -1) {
        setSelectedMaquina(null);
        return;
      }

      const maquinaClienteId = maquinaOption.clienteAtualId;
      const isMaquinaDeOutroCliente =
        selectedCliente !== null &&
        maquinaClienteId !== null &&
        maquinaClienteId !== undefined &&
        maquinaClienteId !== 1 &&
        maquinaClienteId !== selectedCliente.value;

      if (isMaquinaDeOutroCliente) {
        setMaquinaConfirmModal({
          isOpen: true,
          maquina: maquinaOption,
        });
        return;
      }

      setSelectedMaquina(maquinaOption);
      setMaquinaInput("");
    },
    [selectedCliente]
  );

  const handleConfirmMaquinaVinculo = useCallback(() => {
    if (!maquinaConfirmModal.maquina || !selectedCliente) {
      setMaquinaConfirmModal({ isOpen: false, maquina: null });
      return;
    }

    setSelectedMaquina(maquinaConfirmModal.maquina);
    setMaquinaInput("");
    setMaquinaConfirmModal({ isOpen: false, maquina: null });
  }, [maquinaConfirmModal, selectedCliente]);

  const handleCancelMaquinaVinculo = useCallback(() => {
    setSelectedMaquina(null);
    setMaquinaInput("");
    setMaquinaConfirmModal({ isOpen: false, maquina: null });
    focusMaquinaField();
  }, [focusMaquinaField]);

  const handleMotivoPendenciaSelectChange = useCallback(
    (option: OptionType | null) => {
      setSelectedMotivoPendencia(option as MotivoPendenciaOption | null);
    },
    []
  );

  // Handler para motivo de atendimento
  const handleMotivoAtendimentoSelectChange = useCallback(
    (option: OptionType | null) => {
      setSelectedMotivoAtendimento(option as MotivoPendenciaOption | null);
    },
    []
  );

  const handleTecnicoSelectChange = useCallback((option: OptionType | null) => {
    setSelectedTecnico(option as TecnicoOption | null);
  }, []);

  const handleMostrarTodosTecnicos = useCallback(() => {
    setShowAllTecnicos(true);
    setTecnicoError(null);
    setTecnicosLoaded(false);
  }, []);

  const handleFiltrarTecnicosPorRegiao = useCallback(() => {
    setShowAllTecnicos(false);
    setTecnicoError(null);
    setTecnicosLoaded(false);
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        if (!motivosPendenciaLoaded.current) {
          const motivosResponse = await motivosPendenciaService.getAll();
          const motivos = motivosResponse.map((motivo: MotivoPendencia) => ({
            value: motivo.id,
            label: motivo.descricao,
          }));
          setMotivosPendenciaOptions(motivos);
          motivosPendenciaLoaded.current = true;
        }

        // Carregar motivos de atendimento
        const motivosAtendimentoResponse =
          await motivosAtendimentoService.getAll();
        const motivosAtendimento = motivosAtendimentoResponse.map(
          (motivo: { id: number; descricao: string }) => ({
            value: motivo.id,
            label: motivo.descricao,
          })
        );
        setMotivosAtendimentoOptions(motivosAtendimento);
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (showAllTecnicos) {
      fetchTecnicos(true);
      return;
    }

    if (clienteRegiaoId) {
      fetchTecnicos(false);
    } else {
      setTecnicosOptions([]);
      setTecnicosLoaded(false);
      setTecnicoError(null);
    }
  }, [clienteRegiaoId, showAllTecnicos, fetchTecnicos]);

  // Função para buscar clientes (memoizada)
  const searchClientes = useCallback(
    async (term: string) => {
      if (term.length < 3) return;

      try {
        setIsSearchingClientes(true);
        const response = await clientesService.search(term);

        // Acessa os dados dos clientes no array 'dados' com verificação de nulo
        const options =
          response && response.dados
            ? response.dados.map((cliente: Cliente) => {
                const razaoSocial =
                  cliente.razao_social && cliente.razao_social.trim().length > 0
                    ? cliente.razao_social
                    : cliente.nome_fantasia || "Cliente sem razão social";
                const nomeFantasia =
                  cliente.nome_fantasia &&
                  cliente.nome_fantasia.trim().length > 0
                    ? cliente.nome_fantasia
                    : undefined;
                const codigoErp =
                  cliente.codigo_erp && cliente.codigo_erp.trim().length > 0
                    ? ` (${cliente.codigo_erp})`
                    : " (-)";

                return {
                  value: cliente.id_cliente || cliente.id || 0,
                  label: `${razaoSocial}${codigoErp}`,
                  cidade: cliente.cidade,
                  uf: cliente.uf,
                  nome_fantasia: nomeFantasia,
                  razao_social: cliente.razao_social || "",
                  codigo_erp: cliente.codigo_erp || "",
                  regiaoId:
                    cliente.regiao?.id ??
                    cliente.regiao?.id_regiao ??
                    (cliente as { id_regiao?: number }).id_regiao ??
                    null,
                  regiaoNome:
                    cliente.regiao?.nome ??
                    cliente.regiao?.nome_regiao ??
                    (cliente as { nome_regiao?: string }).nome_regiao ??
                    null,
                };
              })
            : [];

        // Se tiver um cliente selecionado e ele não estiver nas opções, adicione-o
        if (
          selectedCliente &&
          !options.some((option) => option.value === selectedCliente.value)
        ) {
          setClienteOptions([...options]);
        } else {
          setClienteOptions(options);
        }
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
      } finally {
        setIsSearchingClientes(false);
      }
    },
    [selectedCliente]
  );

  // Handler para o input de cliente com debounce usando hook customizado
  const debouncedSearchClientes = useDebouncedCallback((term: string) => {
    if (term.length >= 3) {
      searchClientes(term);
    } else {
      setClienteOptions([]);
      setIsSearchingClientes(false);
    }
  }, 500);

  // Verificar se há técnicos disponíveis quando necessário
  useEffect(() => {
    console.log("Estado atual dos técnicos:", {
      opcoes: tecnicosOptions.length,
      carregando: loadingTecnicos,
      carregado: tecnicosLoaded,
    });
  }, [tecnicosOptions, loadingTecnicos, tecnicosLoaded]);

  const handleClienteInputChange = useCallback(
    (inputValue: string) => {
      // Atualizar o valor do input no estado
      setClienteInput(inputValue);

      if (inputValue.length >= 3) {
        setIsSearchingClientes(true);
        debouncedSearchClientes(inputValue);
      } else {
        setClienteOptions([]);
        setIsSearchingClientes(false);
      }
    },
    [debouncedSearchClientes]
  );

  const searchMaquinas = useCallback(async (term: string) => {
    if (term.length < 3) return;

    try {
      const response = await maquinasService.searchByNumeroSerie(term);

      const machineOptions = response.dados.map((maquina: Maquina) => {
        const dataFinalGarantia = maquina.data_final_garantia || "";
        const isInWarranty =
          maquina.garantia !== undefined
            ? maquina.garantia
            : dataFinalGarantia
            ? new Date(dataFinalGarantia) > new Date()
            : maquina.situacao === "G";
        const baseDescricao = maquina.descricao || maquina.modelo || "";
        const labelDescricao = baseDescricao ? ` - ${baseDescricao}` : "";

        return {
          value: maquina.id,
          label: `${maquina.numero_serie}${labelDescricao}`,
          isInWarranty,
          data_final_garantia: dataFinalGarantia,
          numero_serie: maquina.numero_serie || "",
          descricao: baseDescricao,
          clienteNomeFantasia: maquina.cliente_atual?.nome_fantasia || "",
          clienteAtualId: maquina.cliente_atual?.id_cliente ?? null,
        };
      });

      machineOptions.push({
        value: -1,
        label: "Buscar outra máquina...",
        isInWarranty: false,
        data_final_garantia: "",
        numero_serie: "",
        descricao: "",
        clienteNomeFantasia: "",
        clienteAtualId: null,
      });

      setMaquinaOptions(machineOptions as MaquinaOption[]);
    } catch (error) {
      console.error("Erro ao buscar máquinas:", error);
    } finally {
      setIsSearchingMaquinas(false);
    }
  }, []);

  // Usando o hook de debounce para otimizar a busca de máquinas
  const debouncedSearchMaquinas = useDebouncedCallback((term: string) => {
    if (term.length >= 3) {
      searchMaquinas(term);
    }
  }, 500);

  const handleMaquinaInputChange = useCallback(
    (inputValue: string) => {
      setMaquinaInput(inputValue);
      if (inputValue.length >= 3) {
        setIsSearchingMaquinas(true);
        debouncedSearchMaquinas(inputValue);
      } else {
        setIsSearchingMaquinas(false);
      }
    },
    [debouncedSearchMaquinas]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Objeto para armazenar os erros de validação
    const validationErrors: {
      cliente?: boolean;
      maquina?: boolean;
      contato?: boolean;
      motivoPendencia?: boolean;
      motivoAtendimento?: boolean;
      descricaoProblema?: boolean;
      formaAbertura?: boolean;
      customContatoNome?: boolean;
    } = {};

    // Validar cliente
    if (!selectedCliente) {
      validationErrors.cliente = true;
    }

    // Validar máquina
    if (!selectedMaquina) {
      validationErrors.maquina = true;
    }

    // Validar descrição do problema
    if (!descricaoProblema.trim()) {
      validationErrors.descricaoProblema = true;
    }

    // Validar forma de abertura
    if (!formaAbertura || !formaAbertura.value) {
      validationErrors.formaAbertura = true;
    }

    // Validar contato
    if (!selectedContato) {
      validationErrors.contato = true;
    } else if (selectedContato.contato.id === -1 && !customContatoNome.trim()) {
      validationErrors.customContatoNome = true;
      setShowNameError(true);
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      const firstErrorField = document.querySelector(".campo-erro");
      if (firstErrorField) {
        (firstErrorField as HTMLElement).scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }

      return;
    }

    setErrors({});
    setIsSaving(true);

    try {
      if (!selectedCliente || !selectedMaquina || !formaAbertura) {
        console.error("Dados obrigatórios faltando");
        return;
      }

      const osData: {
        id_cliente: number;
        id_maquina: number;
        id_motivo_pendencia?: number;
        id_motivo_atendimento?: number;
        descricao_problema: string;
        origem_abertura: string;
        forma_abertura: string;
        em_garantia: boolean;
        data_agendada?: string;
        id_usuario_tecnico?: number;
        id_contato_abertura?: number;
        nome_contato_abertura?: string;
        telefone_contato_abertura?: string;
        whatsapp_contato_abertura?: string;
        email_contato_abertura?: string;
        id_regiao: number;
      } = {
        id_cliente: selectedCliente.value,
        id_maquina: selectedMaquina.value,
        descricao_problema: descricaoProblema,
        origem_abertura: "I",
        forma_abertura: formaAbertura.value,
        em_garantia: selectedMaquina.isInWarranty || false,
        id_regiao: clienteRegiaoId ?? 1,
      };

      // Adicione id_motivo_atendimento apenas se selecionado
      if (selectedMotivoAtendimento && selectedMotivoAtendimento.value) {
        osData.id_motivo_atendimento = selectedMotivoAtendimento.value;
      }

      // Adicione data_agendada apenas se não estiver vazia
      if (dataAgendada && dataAgendada.trim() !== "") {
        osData.data_agendada = dataAgendada;
      }

      // Adicionar informações de contato com os novos campos
      if (selectedContato) {
        if (selectedContato.contato.id === -1) {
          osData.nome_contato_abertura = customContatoNome;
          osData.telefone_contato_abertura = customContatoTelefone;
          osData.whatsapp_contato_abertura = customContatoWhatsapp || "";
          osData.email_contato_abertura = customContatoEmail;

          if (saveToClient && selectedCliente) {
            const novoContato = {
              id_cliente: selectedCliente.value,
              nome: customContatoNome,
              nome_completo: customContatoNomeCompleto,
              cargo: customContatoCargo,
              telefone: customContatoTelefone,
              whatsapp: customContatoWhatsapp,
              email: customContatoEmail,
              situacao: "A",
              recebe_aviso_os: recebeAvisoOS,
            };

            try {
              const response = await clientesService.createContact(
                selectedCliente.value.toString(),
                novoContato
              );
              if (response && response.id) {
                // Use the ID directly from the response
                osData.id_contato_abertura = response.id;
              } else if (response && response.contato && response.contato.id) {
                // Fallback to previous structure if available
                osData.id_contato_abertura = response.contato.id;
              }
            } catch (error) {
              console.error("Erro ao salvar contato:", error);
              if (error && typeof error === "object" && "id" in error) {
                // Se o erro contém um ID, usar esse ID diretamente
                const errorWithId = error as { id?: number };
                if (errorWithId.id) {
                  osData.id_contato_abertura = errorWithId.id;
                  console.log(`Usando ID ${errorWithId.id} do erro da API`);
                  return;
                }
              }

              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "Ocorreu um erro ao salvar o contato.";

              if (
                errorMessage.includes("cadastrado com sucesso") ||
                errorMessage.includes("sucesso") ||
                errorMessage.toLowerCase().includes("contato criado")
              ) {
                if (selectedCliente) {
                  try {
                    const contactsResponse = await clientesService.getContacts(
                      selectedCliente.value
                    );
                    const lastContact =
                      contactsResponse.contatos[
                        contactsResponse.contatos.length - 1
                      ];
                    if (lastContact) {
                      osData.id_contato_abertura = lastContact.id;
                    }
                  } catch (fetchError) {
                    console.error(
                      "Erro ao buscar contato recém-criado:",
                      fetchError
                    );
                  }
                }
              }
            }
          }
        } else {
          osData.id_contato_abertura = selectedContato.contato.id;
        }
      }

      // Adicionar motivo de pendência, se selecionado
      if (selectedMotivoPendencia) {
        osData.id_motivo_pendencia = selectedMotivoPendencia.value;
      }

      // Adicionar técnico, se selecionado
      if (selectedTecnico) {
        osData.id_usuario_tecnico = selectedTecnico.value;
        console.log(
          `Técnico selecionado: ID ${selectedTecnico.value}, Nome: ${selectedTecnico.label}`
        );
      } else {
        console.log("Nenhum técnico selecionado");
      }

      try {
        const response = await api.put(
          `/ordens_servico?id=${parseInt(osId)}`,
          osData
        );

        if (response && typeof response === "object") {
          console.log("Chaves na resposta:", Object.keys(response));
        }

        let apiMessage = "Ordem de serviço atualizada com sucesso!";

        // Definir tipos para evitar erros de compilação
        type ApiResponseType = {
          message?: string;
          mensagem?: string;
          msg?: string;
          data?: {
            message?: string;
            mensagem?: string;
            msg?: string;
          };
        };

        if (response) {
          if (typeof response === "object") {
            const responseObj = response as ApiResponseType;

            if (responseObj.message) {
              apiMessage = responseObj.message;
            } else if (responseObj.mensagem) {
              apiMessage = responseObj.mensagem;
            } else if (responseObj.msg) {
              apiMessage = responseObj.msg;
            } else if (responseObj.data) {
              const dataObj = responseObj.data;

              if (dataObj.message) {
                apiMessage = dataObj.message;
              } else if (dataObj.mensagem) {
                apiMessage = dataObj.mensagem;
              } else if (dataObj.msg) {
                apiMessage = dataObj.msg;
              }
            }
          } else if (typeof response === "string") {
            apiMessage = response;
          }
        }

        showSuccess("Sucesso", apiMessage);

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(EXPANDED_STORAGE_KEY, osId.toString());
        }

        setTimeout(() => {
          router.push("/admin/os_aberto");
        }, 500);
      } catch (apiError) {
        console.error("Erro específico da API:", apiError);

        let errorMessage = "Ocorreu um erro ao atualizar a ordem de serviço";

        if (apiError && typeof apiError === "object") {
          type ErrorResponseType = {
            message?: string;
            mensagem?: string;
            error?: string | Record<string, unknown>;
            response?: {
              data?:
                | string
                | {
                    message?: string;
                    mensagem?: string;
                    error?: string;
                  };
            };
          };

          const errorObj = apiError as ErrorResponseType;
          if (errorObj.message) {
            errorMessage = errorObj.message;
          } else if (errorObj.mensagem) {
            errorMessage = errorObj.mensagem;
          } else if (errorObj.error) {
            errorMessage =
              typeof errorObj.error === "string"
                ? errorObj.error
                : "Erro na atualização";
          } else if (errorObj.response && errorObj.response.data) {
            const responseData = errorObj.response.data;
            if (typeof responseData === "string") {
              errorMessage = responseData;
            } else if (typeof responseData === "object") {
              if (responseData.message) {
                errorMessage = responseData.message;
              } else if (responseData.mensagem) {
                errorMessage = responseData.mensagem;
              } else if (responseData.error) {
                errorMessage = responseData.error;
              }
            }
          }
        }

        showError("Erro ao atualizar ordem de serviço", errorMessage);
        return;
      }
    } catch (error) {
      console.error("Erro ao atualizar ordem de serviço:", error);

      const errorMessage =
        "Ocorreu um erro ao atualizar a ordem de serviço. Por favor, tente novamente.";
      showError("Erro ao atualizar ordem de serviço", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  return (
    <>
      <PageHeader
        title={`Editar Ordem de Serviço #${osId}`}
        config={{
          type: "form",
          backLink: "/admin/os_aberto",
          backLabel: "Voltar para Ordens de Serviço",
        }}
      />

      <FormContainer onSubmit={handleSubmit}>
        <div className="mb-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cliente */}
            <div className="col-span-2 md:col-span-1">
              <div className="mb-6">
                <CustomSelect
                  id="cliente"
                  label="Cliente"
                  placeholder="Buscar cliente..."
                  value={selectedCliente}
                  inputValue={clienteInput}
                  onChange={handleClienteSelectChange}
                  onInputChange={handleClienteInputChange}
                  options={
                    selectedCliente &&
                    !clienteOptions.find(
                      (option) => option.value === selectedCliente.value
                    )
                      ? [selectedCliente, ...clienteOptions]
                      : clienteOptions
                  }
                  isSearchable
                  isLoading={isSearchingClientes}
                  noOptionsMessageFn={({ inputValue }) =>
                    !inputValue || inputValue.length < 3
                      ? "Digite pelo menos 3 caracteres para buscar"
                      : "Nenhum cliente encontrado"
                  }
                  filterOption={() => true}
                  className={errors.cliente ? "campo-erro" : ""}
                  components={
                    clienteSelectComponents as unknown as React.ComponentProps<
                      typeof CustomSelect
                    >["components"]
                  }
                />
                {errors.cliente && (
                  <div className="text-red-500 text-sm mt-1">
                    Selecione um cliente
                  </div>
                )}
              </div>
            </div>
            {/* Contato */}
            <div className="col-span-2 md:col-span-1">
              <div className="mb-6">
                <CustomSelect
                  id="contato"
                  label="Contato"
                  placeholder={
                    selectedCliente
                      ? "Selecione um contato..."
                      : "Selecione um cliente primeiro..."
                  }
                  value={selectedContato}
                  onChange={handleContatoSelectChange}
                  options={contatoOptions}
                  isSearchable
                  isLoading={loadingContatos}
                  isDisabled={!selectedCliente}
                  className={errors.contato ? "campo-erro" : ""}
                  components={
                    contatoSelectComponents as unknown as React.ComponentProps<
                      typeof CustomSelect
                    >["components"]
                  }
                />
                {errors.contato && (
                  <div className="text-red-500 text-sm mt-1">
                    Selecione um contato
                  </div>
                )}
              </div>
            </div>
          </div>
          {useCustomContato && (
            <div className="mb-6 w-full">
              <CustomContatoForm
                customContatoNome={customContatoNome}
                setCustomContatoNome={setCustomContatoNome}
                customContatoNomeCompleto={customContatoNomeCompleto}
                setCustomContatoNomeCompleto={setCustomContatoNomeCompleto}
                customContatoCargo={customContatoCargo}
                setCustomContatoCargo={setCustomContatoCargo}
                customContatoEmail={customContatoEmail}
                setCustomContatoEmail={setCustomContatoEmail}
                customContatoTelefone={customContatoTelefone}
                setCustomContatoTelefone={setCustomContatoTelefone}
                customContatoWhatsapp={customContatoWhatsapp}
                setCustomContatoWhatsapp={setCustomContatoWhatsapp}
                recebeAvisoOS={recebeAvisoOS}
                setRecebeAvisoOS={setRecebeAvisoOS}
                saveToClient={saveToClient}
                setSaveToClient={setSaveToClient}
                showNameError={showNameError}
                clienteId={selectedCliente?.value}
                onContactSaved={(contact) => {
                  // Adicionar o novo contato às opções
                  const newContactOption = {
                    value: contact.id || 0,
                    label: contact.nome || contact.nome_completo || "Contato",
                    contato: contact,
                  };

                  const filteredOptions = contatoOptions.filter(
                    (option) => option.value !== -1
                  );

                  const newOptions = [
                    ...filteredOptions,
                    newContactOption,
                    {
                      value: -1,
                      label: "Adicionar novo contato...",
                      contato: {
                        id: -1,
                        nome: "",
                        email: "",
                        telefone: "",
                        whatsapp: "",
                        situacao: "A",
                        recebe_aviso_os: false,
                      } as ClienteContato,
                    },
                  ];

                  setContatoOptions(newOptions);
                  setSelectedContato(newContactOption);
                  setUseCustomContato(false);
                  setCustomContatoNome("");
                  setCustomContatoNomeCompleto("");
                  setCustomContatoCargo("");
                  setCustomContatoEmail("");
                  setCustomContatoTelefone("");
                  setCustomContatoWhatsapp("");
                  setRecebeAvisoOS(false);
                  setSaveToClient(false);
                }}
              />
            </div>
          )}
        </div>

        <div className="mb-2">
          {/* Segunda linha: Forma de Abertura / Motivo de Pendência / Data Agendada */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Forma de Abertura */}
            <div>
              <CustomSelect
                id="formaAbertura"
                label="Forma de Abertura"
                placeholder="Selecione a forma de abertura..."
                value={formaAbertura}
                onChange={(option) =>
                  setFormaAbertura(option as FormaAberturaOption)
                }
                options={formaAberturaOptions}
                className={errors.formaAbertura ? "campo-erro" : ""}
              />
              {errors.formaAbertura && (
                <div className="text-red-500 text-sm mt-1">
                  Selecione a forma de abertura
                </div>
              )}
            </div>

            {/* Motivo de Pendência */}
            <div>
              <CustomSelect
                id="motivoPendencia"
                label="Motivo de Pendência (opcional)"
                placeholder="Caso a OS deva ficar pendente, informe o motivo"
                value={selectedMotivoPendencia}
                onChange={handleMotivoPendenciaSelectChange}
                options={motivosPendenciaOptions}
                isSearchable
                className={errors.motivoPendencia ? "campo-erro" : ""}
                isClearable
              />
            </div>

            {/* Data Agendada */}
            <div>
              <DateTimeField
                id="dataAgendada"
                label="Data Agendada (opcional)"
                value={dataAgendada}
                onChange={(e) => setDataAgendada(e.target.value)}
              />
            </div>
          </div>

          {/* Terceira linha: Máquina / Motivo de Atendimento / Técnico */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Máquina */}
            <div>
              <CustomSelect
                id="maquina"
                label="Máquina"
                placeholder={
                  selectedCliente
                    ? "Selecione ou busque por número de série..."
                    : "Selecione um cliente primeiro..."
                }
                value={selectedMaquina}
                onChange={handleMaquinaSelectChange}
                onInputChange={handleMaquinaInputChange}
                options={maquinaOptions}
                isSearchable={true}
                inputValue={maquinaInput}
                isLoading={loadingMaquinas || isSearchingMaquinas}
                isDisabled={!selectedCliente}
                className={errors.maquina ? "campo-erro" : ""}
                components={
                  maquinaSelectComponents as unknown as React.ComponentProps<
                    typeof CustomSelect
                  >["components"]
                }
              />
              {errors.maquina && (
                <div className="text-red-500 text-sm mt-1">
                  Selecione uma máquina
                </div>
              )}
            </div>

            {/* Motivo de Atendimento */}
            <div>
              <CustomSelect
                id="motivoAtendimento"
                label="Motivo de Atendimento (opcional)"
                placeholder="Selecione um motivo de atendimento..."
                value={selectedMotivoAtendimento}
                onChange={handleMotivoAtendimentoSelectChange}
                options={motivosAtendimentoOptions}
                isSearchable
                className={errors.motivoAtendimento ? "campo-erro" : ""}
                isClearable
              />
            </div>

            {/* Técnico Designado */}
            <div>
              <CustomSelect
                id="tecnico"
                label="Técnico Designado (opcional)"
                placeholder="Selecione um técnico..."
                value={selectedTecnico}
                onChange={handleTecnicoSelectChange}
                options={tecnicosOptions}
                isSearchable
                isLoading={loadingTecnicos}
                isClearable
                noOptionsMessageFn={() =>
                  tecnicosOptions.length > 0
                    ? "Digite para filtrar técnicos"
                    : "Nenhum técnico disponível"
                }
              />
              <div className="mt-2 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {showAllTecnicos
                      ? "Exibindo todos os técnicos"
                      : clienteRegiaoNome
                      ? `Região: ${clienteRegiaoNome}`
                      : "Selecione um cliente para filtrar por região"}
                  </span>
                  <button
                    type="button"
                    onClick={
                      showAllTecnicos
                        ? handleFiltrarTecnicosPorRegiao
                        : handleMostrarTodosTecnicos
                    }
                    className={
                      showAllTecnicos
                        ? "text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-1 hover:bg-gray-100 transition-colors"
                        : "text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md px-3 py-1 hover:bg-blue-100 transition-colors"
                    }
                    disabled={
                      loadingTecnicos || (!clienteRegiaoId && !showAllTecnicos)
                    }
                  >
                    {showAllTecnicos
                      ? "Filtrar por região"
                      : "Ver todos os técnicos"}
                  </button>
                </div>
                {tecnicoError && (
                  <span className="text-xs text-red-600">{tecnicoError}</span>
                )}
              </div>
            </div>
          </div>

          {/* Descrição do Problema */}
          <div className="mb-6">
            <TextAreaField
              id="descricaoProblema"
              label="Descrição do Problema"
              value={descricaoProblema}
              onChange={(e) => setDescricaoProblema(e.target.value)}
              placeholder="Detalhe o problema reportado..."
              rows={5}
              className={errors.descricaoProblema ? "campo-erro" : ""}
            />
            {errors.descricaoProblema && (
              <div className="text-red-500 text-sm mt-1">
                Digite a descrição do problema
              </div>
            )}
          </div>
        </div>

        <FormActions isSaving={isSaving} />

        <MaquinaClienteConfirmModal
          isOpen={maquinaConfirmModal.isOpen}
          machineName={
            maquinaConfirmModal.maquina?.numero_serie ||
            maquinaConfirmModal.maquina?.label ||
            ""
          }
          clienteNome={
            maquinaConfirmModal.maquina?.clienteNomeFantasia ||
            (maquinaConfirmModal.maquina?.clienteAtualId
              ? `ID ${maquinaConfirmModal.maquina?.clienteAtualId}`
              : "não identificado")
          }
          onConfirm={handleConfirmMaquinaVinculo}
          onCancel={handleCancelMaquinaVinculo}
        />
      </FormContainer>
    </>
  );
};

export default EditarOrdemServico;
