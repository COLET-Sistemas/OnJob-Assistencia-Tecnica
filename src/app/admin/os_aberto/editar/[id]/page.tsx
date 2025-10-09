"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
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
// Removed ordensServicoService import as we're using API directly
import { usuariosService } from "@/api/services/usuariosService";
import { Cliente, ClienteContato } from "@/types/admin/cadastro/clientes";
import { MotivoPendencia } from "@/types/admin/cadastro/motivos_pendencia";
import { Maquina } from "@/types/admin/cadastro/maquinas";
import { Usuario } from "@/types/admin/cadastro/usuarios";
import { OptionType } from "@/components/admin/form/CustomSelect";
import useDebouncedCallback from "@/hooks/useDebouncedCallback";
import { feedback } from "@/utils/feedback";
import api from "@/api/api";

// Interface para a resposta da API de OS
interface OrdemServicoResponse {
  id_os: number;
  descricao_problema: string;
  em_garantia: boolean;
  data_agendada: string;
  data_fechamento: string;
  cliente: {
    id: number;
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

const EditarOrdemServico = () => {
  const params = useParams();
  const osId = params.id as string;
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
  const [tecnicosOptions, setTecnicosOptions] = useState<TecnicoOption[]>([]);
  const [selectedTecnico, setSelectedTecnico] = useState<TecnicoOption | null>(
    null
  );
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
  const tecnicosLoaded = useRef(false);
  const osDataLoaded = useRef(false);

  // Carregar dados da OS existente
  useEffect(() => {
    const fetchOSData = async () => {
      try {
        setIsLoading(true);
        // Usando a API diretamente para obter os dados da OS pelo ID na rota
        const response = await api.get(`/ordens_servico?id=${osId}`);

        // A API retorna um array, verificamos se existe e pegamos o primeiro elemento
        // Tratando diferentes formatos possíveis da resposta
        let osArray;
        if (response && typeof response === "object") {
          // Se a resposta tem uma propriedade data (estrutura comum em axios)
          if ("data" in response) {
            osArray = response.data;
          } else {
            // Se a resposta não tem data, talvez seja o array diretamente
            osArray = response;
          }
        }

        if (!osArray || !Array.isArray(osArray) || osArray.length === 0) {
          console.error("Resposta da API inválida:", response);
          throw new Error("Nenhum dado de OS encontrado na resposta da API");
        }

        const os = osArray[0] as OrdemServicoResponse;

        if (os) {
          // Preencher os campos com os dados da OS
          // Cliente
          const clienteOption = {
            value: os.cliente.id || 0,
            label: `${os.cliente.nome} (${os.cliente.id})`,
            cidade: os.cliente.cidade,
            uf: os.cliente.uf,
          };
          setSelectedCliente(clienteOption);

          // Pre-load machine options for the selected client to ensure machine selection works
          if (os.cliente.id) {
            setLoadingMaquinas(true);
            maquinasService
              .getByClienteId(os.cliente.id, 15)
              .then((response) => {
                const machineOptions =
                  response && response.dados
                    ? response.dados.map((maquina: Maquina) => ({
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
              })
              .catch((error) =>
                console.error("Erro ao buscar máquinas:", error)
              )
              .finally(() => setLoadingMaquinas(false));
          }

          // Máquina
          const maquinaOption = {
            value: os.maquina.id || 0,
            label: `${os.maquina.modelo || os.maquina.descricao} (${
              os.maquina.numero_serie
            })`,
            isInWarranty: os.em_garantia,
            data_final_garantia: "", // Informação não presente na resposta
          };
          setSelectedMaquina(maquinaOption);

          // Contato
          if (os.contato) {
            // Adicionando campos necessários ao contato conforme a interface ClienteContato
            const contatoCompleto = {
              ...os.contato,
              situacao: "A",
              recebe_aviso_os: false, // Valor padrão pois não vem na resposta
              cargo: "", // Valor padrão pois não vem na resposta
              nome_completo: os.contato.nome, // Usando nome como nome_completo
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
                            situacao: "A", // Garantir que tenha o campo situacao
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
          } // Motivo de Pendência
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
            // Converter para capitalizado (primeira letra maiúscula, resto minúscula)
            const formaCapitalizada =
              os.abertura.forma_abertura.charAt(0).toUpperCase() +
              os.abertura.forma_abertura.slice(1).toLowerCase();

            // Definir as opções disponíveis de forma interna para não depender do estado
            const availableOptions = [
              { value: "Email", label: "Email" },
              { value: "Telefone", label: "Telefone" },
              { value: "WhatsApp", label: "WhatsApp" },
            ];

            // Verificar se a forma de abertura está nas opções disponíveis
            const formaExistente = availableOptions.find(
              (option) =>
                option.value.toLowerCase() === formaCapitalizada.toLowerCase()
            );

            // Se encontrou uma opção correspondente, use-a para garantir compatibilidade
            if (formaExistente) {
              setFormaAbertura(formaExistente);
            } else {
              // Se não encontrou, use o valor capitalizado
              setFormaAbertura({
                value: formaCapitalizada,
                label: formaCapitalizada,
              });
            }
          }

          // Data agendada
          if (os.data_agendada) {
            // Converter formato de data DD/MM/YYYY HH:mm para YYYY-MM-DDThh:mm
            try {
              const parts = os.data_agendada.split(" ");
              if (parts.length === 2) {
                const dateParts = parts[0].split("/");
                if (dateParts.length === 3) {
                  const day = dateParts[0];
                  const month = dateParts[1];
                  const year = dateParts[2];
                  const time = parts[1];

                  // Formato YYYY-MM-DDThh:mm (formato aceito pelo input datetime-local)
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

        // Log additional response information for debugging
        try {
          const testResponse = await api.get(`/ordens_servico?id=${osId}`);

          if (testResponse) {
            // Check for data property using type assertion
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

        feedback.toast("Erro ao carregar dados da OS", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOSData();

    // Garantir que os técnicos sejam carregados imediatamente
    if (!tecnicosLoaded.current) {
      const loadTecnicos = async () => {
        setLoadingTecnicos(true);
        try {
          console.log("Carregando técnicos na inicialização");
          const tecnicosResponse = await usuariosService.getAllTecnicos();
          console.log("Resposta técnicos na inicialização:", tecnicosResponse);

          const tecnicos: TecnicoOption[] = [];

          if (
            tecnicosResponse &&
            tecnicosResponse.dados &&
            Array.isArray(tecnicosResponse.dados)
          ) {
            tecnicosResponse.dados.forEach((tecnico: Usuario) => {
              tecnicos.push({
                value: tecnico.id,
                label: tecnico.nome,
              });
            });
          } else if (Array.isArray(tecnicosResponse)) {
            tecnicosResponse.forEach((tecnico: Usuario) => {
              tecnicos.push({
                value: tecnico.id,
                label: tecnico.nome,
              });
            });
          }

          if (tecnicos.length > 0) {
            setTecnicosOptions(tecnicos);
          }
        } catch (error) {
          console.error("Erro ao carregar técnicos na inicialização:", error);
        } finally {
          tecnicosLoaded.current = true;
          setLoadingTecnicos(false);
        }
      };

      loadTecnicos();
    }
  }, [osId]);

  // Define handleClienteChange before it's referenced
  const handleClienteChange = useCallback(
    async (selectedOption: ClienteOption | null) => {
      setSelectedCliente(selectedOption);
      // Limpar o input de cliente quando um cliente for selecionado
      setClienteInput("");
      // Limpar o contato selecionado quando o cliente for alterado
      setSelectedContato(null);
      // Limpar a flag de contato customizado
      setUseCustomContato(false);

      if (selectedOption) {
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

          // Verificar se temos contatos na resposta
          const contatos =
            contatosResponse && contatosResponse.contatos
              ? contatosResponse.contatos
              : [];

          // Formatar opções para o select
          const options =
            contatos.length > 0
              ? contatos.map((contato: ClienteContato) => ({
                  value: contato.id,
                  label: contato.nome,
                  contato,
                }))
              : [];

          // Adicionar opção para usar contato personalizado
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

          // Ensure no undefined labels and add required situacao field
          // Converter as opções para garantir que todos os campos necessários estejam presentes
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
        // Limpar também os campos de contato personalizado
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

    // Limpar erros de validação quando um contato é selecionado
    if (option) {
      setErrors((prev) => ({
        ...prev,
        contato: false,
        customContatoNome: false,
      }));
      setShowNameError(false);
    }
  }, []);

  const handleMaquinaSelectChange = useCallback((option: OptionType | null) => {
    const maquinaOption = option as MaquinaOption | null;
    if (maquinaOption && maquinaOption.value === -1) {
      // Usuário selecionou "Buscar outra máquina..."
      setSelectedMaquina(null);
    } else {
      setSelectedMaquina(maquinaOption);
      // Limpar o input quando uma máquina for selecionada
      setMaquinaInput("");
    }
  }, []);

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

  // Carregar dados iniciais (motivos de pendência, técnicos e motivos de atendimento)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Carregar motivos de pendência
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

        // Carregar técnicos
        if (!tecnicosLoaded.current) {
          setLoadingTecnicos(true);
          try {
            console.log("Iniciando busca de técnicos");
            const tecnicosResponse = await usuariosService.getAllTecnicos();
            console.log("Resposta de técnicos:", tecnicosResponse);

            // Verificar a estrutura da resposta para garantir o mapeamento correto
            const tecnicos: TecnicoOption[] = [];

            if (
              tecnicosResponse &&
              tecnicosResponse.dados &&
              Array.isArray(tecnicosResponse.dados)
            ) {
              console.log(
                `Encontrados ${tecnicosResponse.dados.length} técnicos`
              );
              tecnicosResponse.dados.forEach((tecnico: Usuario) => {
                tecnicos.push({
                  value: tecnico.id,
                  label: tecnico.nome,
                });
              });
            } else if (Array.isArray(tecnicosResponse)) {
              // Caso a resposta seja diretamente um array
              console.log(
                `Encontrados ${tecnicosResponse.length} técnicos (formato array direto)`
              );
              tecnicosResponse.forEach((tecnico: Usuario) => {
                tecnicos.push({
                  value: tecnico.id,
                  label: tecnico.nome,
                });
              });
            } else {
              console.error(
                "Formato de resposta não reconhecido:",
                tecnicosResponse
              );
            }

            console.log("Lista de técnicos processada:", tecnicos);
            // Garantir que há sempre opções disponíveis, mesmo que vazia
            setTecnicosOptions(
              tecnicos.length > 0
                ? tecnicos
                : [{ value: 0, label: "Nenhum técnico disponível" }]
            );
          } catch (tecnicoError) {
            console.error("Erro específico ao buscar técnicos:", tecnicoError);
          } finally {
            tecnicosLoaded.current = true;
            setLoadingTecnicos(false);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      }
    };

    fetchInitialData();
  }, []);

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
            ? response.dados.map((cliente: Cliente) => ({
                value: cliente.id_cliente || cliente.id || 0,
                label: `${cliente.razao_social} (${cliente.codigo_erp || "-"})`,
                cidade: cliente.cidade,
                uf: cliente.uf,
              }))
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
      carregado: tecnicosLoaded.current,
    });
  }, [tecnicosOptions, loadingTecnicos]);

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
        // Usar diretamente o campo garantia da API se disponível
        const dataFinalGarantia = maquina.data_final_garantia || "";
        // Se o campo garantia estiver presente na resposta, usá-lo diretamente
        const isInWarranty =
          maquina.garantia !== undefined
            ? maquina.garantia
            : dataFinalGarantia
            ? new Date(dataFinalGarantia) > new Date()
            : maquina.situacao === "G";

        return {
          value: maquina.id,
          label: `${maquina.modelo || maquina.descricao} (${
            maquina.numero_serie
          })`,
          isInWarranty,
          data_final_garantia: dataFinalGarantia,
        };
      });

      // Adicionar a opção de buscar outra máquina
      machineOptions.push({
        value: -1,
        label: "Buscar outra máquina...",
        isInWarranty: false,
        data_final_garantia: "",
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

  // Handler para o input de máquina com debounce otimizado
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
        // Removido id_tecnico, apenas usando id_usuario_tecnico conforme esperado pela API
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
        id_regiao: 1,
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
          // É um contato personalizado
          osData.nome_contato_abertura = customContatoNome;
          osData.telefone_contato_abertura = customContatoTelefone;
          osData.whatsapp_contato_abertura = customContatoWhatsapp || "";
          osData.email_contato_abertura = customContatoEmail;

          // Se escolheu salvar como contato do cliente
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
              // Verificar se a mensagem de erro contém informação sobre um contato cadastrado com sucesso
              // Verificar se o erro contém um objeto com um ID
              if (error && typeof error === "object" && "id" in error) {
                // Se o erro contém um ID, usar esse ID diretamente
                const errorWithId = error as { id?: number };
                if (errorWithId.id) {
                  osData.id_contato_abertura = errorWithId.id;
                  console.log(`Usando ID ${errorWithId.id} do erro da API`);
                  return; // Continue com a submissão usando o ID obtido
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
                // É uma mensagem de sucesso que foi tratada como erro
                // Tenta obter os dados do contato salvo
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
          // É um contato existente
          osData.id_contato_abertura = selectedContato.contato.id;
        }
      }

      // Adicionar motivo de pendência, se selecionado
      if (selectedMotivoPendencia) {
        osData.id_motivo_pendencia = selectedMotivoPendencia.value;
      }

      // Adicionar técnico, se selecionado
      if (selectedTecnico) {
        // A API espera o ID do técnico apenas como id_usuario_tecnico
        osData.id_usuario_tecnico = selectedTecnico.value;
        console.log(
          `Técnico selecionado: ID ${selectedTecnico.value}, Nome: ${selectedTecnico.label}`
        );
      } else {
        console.log("Nenhum técnico selecionado");
      }

      // Atualizar a OS existente
      try {
        // Log dos dados sendo enviados para a API para depuração
        console.log(
          "Enviando dados para API:",
          JSON.stringify(osData, null, 2)
        );

        // Enviando requisição para a API
        const response = await api.put(
          `/ordens_servico?id=${parseInt(osId)}`,
          osData
        );

        console.log("Resposta da API completa:", response);
        // Adicionar log específico para entender melhor o formato da resposta
        console.log("Tipo da resposta:", typeof response);
        if (response && typeof response === "object") {
          console.log("Chaves na resposta:", Object.keys(response));
        }

        // Extrair a mensagem de sucesso da resposta da API
        // Verificar os diferentes formatos possíveis da resposta
        let apiMessage = "Ordem de serviço atualizada com sucesso!"; // Mensagem padrão

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
            // Converter para o tipo definido
            const responseObj = response as ApiResponseType;

            // Tentar encontrar a mensagem em diferentes propriedades comuns
            if (responseObj.message) {
              apiMessage = responseObj.message;
            } else if (responseObj.mensagem) {
              apiMessage = responseObj.mensagem;
            } else if (responseObj.msg) {
              apiMessage = responseObj.msg;
            } else if (responseObj.data) {
              // Verificar dentro do objeto data também
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
            // Se a resposta for uma string direta
            apiMessage = response;
          }
        }

        // Armazenar mensagem no localStorage para recuperá-la após a navegação
        localStorage.setItem("osUpdateMessage", apiMessage);

        // Exibir feedback antes de redirecionar usando o componente Toast
        feedback.toast(apiMessage, "success");

        // Redirecionar para a página de listagem de OS usando window.location para navegação direta
        setTimeout(() => {
          window.location.href = "/admin/os_aberto";
        }, 500);
      } catch (apiError) {
        console.error("Erro específico da API:", apiError);

        // Tentar extrair mensagem de erro da API para exibir ao usuário
        let errorMessage = "Ocorreu um erro ao atualizar a ordem de serviço";

        if (apiError && typeof apiError === "object") {
          // Definir um tipo específico para o objeto de erro
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
            // Axios error format
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

        // Exibir mensagem de erro usando o Toast
        feedback.toast(errorMessage, "error");
        return; // Não propagar o erro, já tratamos ele aqui
      }
    } catch (error) {
      console.error("Erro ao atualizar ordem de serviço:", error);

      // Mensagem de erro genérica para erros não relacionados à API
      const errorMessage =
        "Ocorreu um erro ao atualizar a ordem de serviço. Por favor, tente novamente.";
      feedback.toast(errorMessage, "error");
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
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Informações do Cliente e Contato
          </h2>
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
                    value: contact.id || 0, // Garantir que o value seja um número, usando 0 como fallback
                    label: contact.nome || contact.nome_completo || "Contato",
                    contato: contact,
                  };

                  // Adicionar às opções de contato excluindo o item "Adicionar novo contato"
                  const filteredOptions = contatoOptions.filter(
                    (option) => option.value !== -1
                  );

                  // Adicionar o novo contato e depois a opção de "Adicionar novo contato"
                  const newOptions = [
                    ...filteredOptions,
                    newContactOption,
                    {
                      value: -1, // Usando -1 como valor específico para "adicionar novo"
                      label: "Adicionar novo contato...",
                      contato: {
                        id: -1, // Garantir que o ID seja um número
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

                  // Selecionar automaticamente o contato criado
                  setSelectedContato(newContactOption);

                  // Limpar a flag de uso de contato customizado
                  setUseCustomContato(false);

                  // Limpar os campos do formulário de contato
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

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Informações da Ordem de Serviço
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Máquina */}
            <div className="col-span-2 md:col-span-1">
              <div className="mb-6">
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
            </div>
            {/* Motivo de Pendência */}
            <div className="col-span-2 md:col-span-1">
              <div className="mb-6">
                <CustomSelect
                  id="motivoPendencia"
                  label="Motivo de Pendência (opcional)"
                  placeholder="Selecione um motivo de pendência..."
                  value={selectedMotivoPendencia}
                  onChange={handleMotivoPendenciaSelectChange}
                  options={motivosPendenciaOptions}
                  isSearchable
                  className={errors.motivoPendencia ? "campo-erro" : ""}
                  isClearable
                />
                {errors.motivoPendencia && (
                  <div className="text-red-500 text-sm mt-1">
                    Selecione um motivo de pendência
                  </div>
                )}
              </div>
            </div>

            {/* Motivo de Atendimento */}
            <div className="col-span-2 md:col-span-1">
              <div className="mb-6">
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
            </div>

            {/* Data Agendada */}
            <div className="col-span-2 md:col-span-1">
              <DateTimeField
                id="dataAgendada"
                label="Data Agendada (opcional)"
                value={dataAgendada}
                onChange={(e) => setDataAgendada(e.target.value)}
              />
            </div>

            {/* Forma de Abertura */}
            <div className="col-span-2 md:col-span-1">
              <div className="mb-6">
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
            </div>

            {/* Técnico */}
            <div className="col-span-2 md:col-span-1">
              <div className="mb-6">
                <CustomSelect
                  id="tecnico"
                  label="Técnico (opcional)"
                  placeholder="Selecione um técnico..."
                  value={selectedTecnico}
                  onChange={handleTecnicoSelectChange}
                  options={tecnicosOptions}
                  isSearchable // Manter busca habilitada mas mostrar todas as opções
                  isLoading={loadingTecnicos}
                  isClearable
                  noOptionsMessageFn={() =>
                    tecnicosOptions.length > 0
                      ? "Digite para filtrar técnicos"
                      : "Nenhum técnico disponível"
                  }
                />
                {/* Debug info - remover após testes */}
                {tecnicosOptions.length === 0 && !loadingTecnicos && (
                  <div className="text-xs text-amber-600">
                    Nenhum técnico carregado. Recarregue a página.
                  </div>
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
      </FormContainer>
    </>
  );
};

export default EditarOrdemServico;
