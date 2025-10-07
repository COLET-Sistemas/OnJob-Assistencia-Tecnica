"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
import { ordensServicoService } from "@/api/services/ordensServicoService";
import { usuariosService } from "@/api/services/usuariosService";
import { Cliente, ClienteContato } from "@/types/admin/cadastro/clientes";
import { MotivoPendencia } from "@/types/admin/cadastro/motivos_pendencia";
import { Maquina } from "@/types/admin/cadastro/maquinas";
import { Usuario } from "@/types/admin/cadastro/usuarios";
import { OptionType } from "@/components/admin/form/CustomSelect";
import useDebouncedCallback from "@/hooks/useDebouncedCallback";

// Componentes locais
import CustomContatoForm from "./components/CustomContatoForm";
import FormActions from "./components/FormActions";
import FormContainer from "./components/FormContainer";
// Importando componentes personalizados
import { contatoSelectComponents } from "./components/ContatoItem";
import { clienteSelectComponents } from "./components/ClienteItem";

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

const NovaOrdemServico = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [clienteInput, setClienteInput] = useState("");
  const [clienteOptions, setClienteOptions] = useState<ClienteOption[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<ClienteOption | null>(
    null
  );
  const [maquinaOptions, setMaquinaOptions] = useState<MaquinaOption[]>([]);
  const [selectedMaquina, setSelectedMaquina] = useState<MaquinaOption | null>(
    null
  );
  const [maquinaInput, setMaquinaInput] = useState("");
  const [isSearchingMaquinas, setIsSearchingMaquinas] = useState(false);
  const [motivosPendenciaOptions, setMotivosPendenciaOptions] = useState<
    MotivoPendenciaOption[]
  >([]);
  const [selectedMotivoPendencia, setSelectedMotivoPendencia] =
    useState<MotivoPendenciaOption | null>(null);
  // Motivo de Atendimento
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
  const formaAberturaOptions: FormaAberturaOption[] = [
    { value: "Email", label: "Email" },
    { value: "Telefone", label: "Telefone" },
    { value: "WhatsApp", label: "WhatsApp" },
  ];
  const [isSearchingClientes, setIsSearchingClientes] = useState(false);
  const [loadingMaquinas, setLoadingMaquinas] = useState(false);
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
  const [savedContact, setSavedContact] = useState<ClienteContato | null>(null);
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

  // Efeito para focar no campo de cliente quando a página carregar
  useEffect(() => {
    // Pequeno delay para garantir que o componente foi renderizado completamente
    const timer = setTimeout(() => {
      // Buscar o elemento de input dentro do componente Select
      const clienteInput = document.querySelector("#cliente input");
      if (clienteInput) {
        (clienteInput as HTMLInputElement).focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Define handleClienteChange before it's referenced
  const handleClienteChange = useCallback(
    async (selectedOption: ClienteOption | null) => {
      setSelectedCliente(selectedOption);
      setSelectedContato(null);
      setSelectedMaquina(null);
      setMaquinaInput("");

      if (selectedOption) {
        setLoadingMaquinas(true);
        try {
          const maquinasResponse = await maquinasService.getByClienteId(
            selectedOption.value,
            15
          );

          const machineOptions = maquinasResponse.dados.map(
            (maquina: Maquina) => {
              const isInWarranty =
                maquina.data_final_garantia &&
                new Date(maquina.data_final_garantia) > new Date();

              return {
                value: maquina.id || 0,
                label: `${maquina.numero_serie} - ${maquina.descricao || ""}`,
                isInWarranty,
                data_final_garantia: maquina.data_final_garantia || "",
              } as MaquinaOption;
            }
          );

          machineOptions.push({
            value: -1,
            label: "Buscar outra máquina...",
            isInWarranty: false,
            data_final_garantia: "",
          } as MaquinaOption);

          setMaquinaOptions(machineOptions as MaquinaOption[]);
        } catch (error) {
          console.error("Erro ao carregar máquinas:", error);
        } finally {
          setLoadingMaquinas(false);
        }

        // Carregar contatos do cliente
        setLoadingContatos(true);
        try {
          const response = await clientesService.getContacts(
            selectedOption.value
          );
          // Agora estamos utilizando response.contatos que é um array de contatos
          const options = response.contatos.map((contato: ClienteContato) => ({
            value: Number(contato.id ?? 0), // Explicitly convert to number to ensure type safety
            label: `${contato.nome || contato.nome_completo || "Sem nome"}${
              contato.cargo ? ` - ${contato.cargo}` : ""
            }`,
            contato: contato,
          }));

          // Adiciona a opção para inserir um contato personalizado
          const customOption = {
            value: -1,
            label: "Inserir contato não cadastrado",
            contato: { id: -1, telefone: "", email: "", situacao: "A" },
          };
          options.push(customOption);

          setContatoOptions(options as ContatoOption[]);
        } catch (error) {
          console.error("Erro ao carregar contatos:", error);
        } finally {
          setLoadingContatos(false);
        }
      } else {
        setMaquinaOptions([]);
        setContatoOptions([]);
      }
    },
    []
  );

  // Adaptadores de tipo para os handlers de mudança de select (memoizados)
  const handleClienteSelectChange = useCallback(
    (option: OptionType | null) => {
      handleClienteChange(option as ClienteOption | null);
    },
    [handleClienteChange]
  );

  const handleContatoSelectChange = useCallback((option: OptionType | null) => {
    const contatoOption = option as ContatoOption | null;
    setSelectedContato(contatoOption);
    setUseCustomContato(contatoOption?.contato.id === -1 || false);
  }, []);

  const handleMaquinaSelectChange = useCallback((option: OptionType | null) => {
    const maquinaOption = option as MaquinaOption | null;
    if (maquinaOption && maquinaOption.value === -1) {
      // Usuário selecionou "Buscar outra máquina..."
      setSelectedMaquina(null);
      setMaquinaInput("");
    } else {
      setSelectedMaquina(maquinaOption);
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

  // Carregar dados iniciais (motivos de pendência, técnicos e regiões)
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Carregar motivos de pendência apenas se ainda não foram carregados
        if (!motivosPendenciaLoaded.current) {
          motivosPendenciaLoaded.current = true;
          const motivosPendenciaData = await motivosPendenciaService.getAll({
            situacao: "A",
          });
          const motivosPendenciaOpts = motivosPendenciaData.map(
            (motivo: MotivoPendencia) => ({
              value: motivo.id,
              label: motivo.descricao,
            })
          );
          setMotivosPendenciaOptions(motivosPendenciaOpts);
        }

        // Carregar motivos de atendimento usando o service
        const motivosAtendimentoData = await motivosAtendimentoService.getAll({
          situacao: "A",
        });
        const motivosAtendimentoOpts = motivosAtendimentoData.map(
          (motivo: { id: number; descricao: string; situacao: string }) => ({
            value: motivo.id,
            label: motivo.descricao,
          })
        );
        setMotivosAtendimentoOptions(motivosAtendimentoOpts);

        // Carregar técnicos apenas se ainda não foram carregados
        if (!tecnicosLoaded.current) {
          tecnicosLoaded.current = true;
          setLoadingTecnicos(true);
          const tecnicosResponse = await usuariosService.getAll({
            apenas_tecnicos: "S",
            situacao: "A",
          });
          // Handle both array response and {dados: [...]} structure
          const tecnicos = Array.isArray(tecnicosResponse)
            ? tecnicosResponse
            : tecnicosResponse.dados || [];

          const tecnicosOpts = tecnicos.map((tecnico: Usuario) => {
            let tipo = "";
            if (tecnico.perfil_tecnico_terceirizado) {
              tipo = " (Terceiro)";
            } else if (tecnico.perfil_interno) {
              tipo = " (Interno)";
            }
            return {
              value: tecnico.id,
              label: `${tecnico.nome}${tipo}`,
            };
          });

          setTecnicosOptions(tecnicosOpts);
          setLoadingTecnicos(false);
        }
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Função assíncrona para buscar clientes (memoizada)
  const searchClientes = useCallback(async (term: string) => {
    if (term.length < 3) return;

    try {
      setIsSearchingClientes(true);
      const response = await clientesService.search(term);

      // Acessa os dados dos clientes no array 'dados'
      const options = response.dados.map((cliente: Cliente) => ({
        value: cliente.id_cliente || cliente.id || 0,
        label: `${cliente.razao_social} (${cliente.codigo_erp || "-"})`,
        cidade: cliente.cidade,
        uf: cliente.uf,
      }));
      setClienteOptions(options);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    } finally {
      setIsSearchingClientes(false);
    }
  }, []);

  // Handler para o input de cliente com debounce usando hook customizado
  const debouncedSearchClientes = useDebouncedCallback((term: string) => {
    if (term.length >= 3) {
      searchClientes(term);
    } else {
      setClienteOptions([]);
      setIsSearchingClientes(false);
    }
  }, 500);

  const handleClienteInputChange = useCallback(
    (inputValue: string) => {
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

      // Verificar se a resposta tem dados antes de mapear
      const machineOptions =
        response.dados &&
        Array.isArray(response.dados) &&
        response.dados.length > 0
          ? response.dados.map((maquina: Maquina) => {
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
                value: maquina.id || 0,
                label: `${maquina.numero_serie} - ${maquina.descricao || ""}`,
                isInWarranty,
                data_final_garantia: dataFinalGarantia,
              } as MaquinaOption;
            })
          : [];

      // Adicionar a opção de buscar outra máquina
      machineOptions.push({
        value: -1,
        label: "Buscar outra máquina...",
        isInWarranty: false,
        data_final_garantia: "",
      } as MaquinaOption);

      setMaquinaOptions(machineOptions as MaquinaOption[]);
    } catch (error) {
      // Evitar logar erro no console para mensagens de "Nenhuma máquina encontrada"
      if (
        error &&
        typeof error === "object" &&
        "erro" in error &&
        error.erro === "'Nenhuma máquina encontrada'"
      ) {
        // Apenas configurar opções vazias com a opção de busca
        setMaquinaOptions([
          {
            value: -1,
            label: "Buscar outra máquina...",
            isInWarranty: false,
            data_final_garantia: "",
          } as MaquinaOption,
        ]);
      } else {
        console.error("Erro ao buscar máquinas:", error);
      }
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

  // This function has been moved above to line ~155

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
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      return;
    }

    setErrors({});
    setIsSaving(true);

    try {
      if (!selectedCliente || !selectedMaquina || !formaAbertura) {
        console.error("Valores necessários não encontrados");
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
        id_tecnico?: number;
        id_usuario_tecnico?: number;
        id_contato?: number;
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
        osData.data_agendada = dataAgendada.replace("T", " ");
      }

      // Adicionar informações de contato com os novos campos
      if (selectedContato) {
        if (selectedContato.contato.id === -1) {
          if (customContatoNome.trim()) {
            // Se já temos um contato salvo, usar ele
            if (savedContact) {
              osData.id_contato = savedContact.id;
              osData.id_contato_abertura = savedContact.id;
              osData.nome_contato_abertura =
                savedContact.nome || savedContact.nome_completo || "";
              osData.telefone_contato_abertura = savedContact.telefone || "";
              osData.whatsapp_contato_abertura =
                savedContact.whatsapp || savedContact.telefone || "";
              osData.email_contato_abertura = savedContact.email || "";
            } else {
              // Comportamento original - apenas para essa OS
              osData.nome_contato_abertura = customContatoNome.trim();

              // Adicionar os novos campos personalizados
              if (customContatoEmail.trim()) {
                osData.email_contato_abertura = customContatoEmail.trim();
              }

              if (customContatoTelefone.trim()) {
                osData.telefone_contato_abertura = customContatoTelefone.trim();
              }

              if (customContatoWhatsapp.trim()) {
                osData.whatsapp_contato_abertura = customContatoWhatsapp.trim();
              }
            }
          }
        } else {
          osData.id_contato = selectedContato.value;
          osData.id_contato_abertura = selectedContato.value;
          osData.nome_contato_abertura =
            selectedContato.contato.nome ||
            selectedContato.contato.nome_completo ||
            "";
          osData.telefone_contato_abertura =
            selectedContato.contato.telefone || "";
          osData.whatsapp_contato_abertura =
            selectedContato.contato.whatsapp ||
            selectedContato.contato.telefone ||
            "";
          osData.email_contato_abertura = selectedContato.contato.email || "";
        }
      }

      // Adicionar motivo de pendência, se selecionado
      if (selectedMotivoPendencia) {
        osData.id_motivo_pendencia = selectedMotivoPendencia.value;
      }

      // Adicionar técnico, se selecionado
      if (selectedTecnico) {
        osData.id_tecnico = selectedTecnico.value;
        osData.id_usuario_tecnico = selectedTecnico.value;
      }

      // Using type assertion with OSForm interface to avoid errors
      type OSFormCustom = typeof osData & {
        id_motivo_atendimento: number;
        comentarios: string;
      };
      // Garantindo que selectedCliente e selectedMaquina não são nulos
      if (selectedCliente && selectedMaquina) {
        const response = await ordensServicoService.create({
          ...osData,
        } as OSFormCustom);

        const apiResponse = response as unknown as {
          mensagem: string;
          id_os: number;
        };
        if (apiResponse && apiResponse.mensagem) {
          localStorage.setItem("osCreateMessage", apiResponse.mensagem);
          localStorage.setItem(
            "osCreateId",
            apiResponse.id_os?.toString() || ""
          );
        }

        router.push("/admin/os_aberto");
      }
    } catch (error) {
      console.error("Erro ao criar ordem de serviço:", error);
      alert(
        "Ocorreu um erro ao criar a ordem de serviço. Por favor, tente novamente."
      );
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
        title="Nova Ordem de Serviço"
        config={{
          type: "form",
          backLink: "/admin/os_aberto",
          backLabel: "Voltar para Ordens de Serviço",
        }}
      />

      <FormContainer onSubmit={handleSubmit}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Cliente */}
          <motion.div>
            <CustomSelect
              id="cliente"
              label="Cliente"
              required
              placeholder="Digite pelo menos 3 caracteres para buscar..."
              inputValue={clienteInput}
              onInputChange={handleClienteInputChange}
              onChange={(option) => {
                handleClienteSelectChange(option);
                if (option) setErrors((prev) => ({ ...prev, cliente: false }));
              }}
              options={clienteOptions}
              value={selectedCliente}
              isLoading={isSearchingClientes}
              minCharsToSearch={3}
              error={errors.cliente ? "Cliente é obrigatório" : ""}
              noOptionsMessageFn={({ inputValue }) =>
                inputValue.length < 3
                  ? "Digite pelo menos 3 caracteres para buscar..."
                  : "Nenhum cliente encontrado"
              }
              // @ts-expect-error - Type incompatibility between ClienteOptionType and OptionType components
              components={clienteSelectComponents}
            />
          </motion.div>

          {/* Contato */}
          <motion.div>
            <CustomSelect
              id="contato"
              label="Contato"
              required
              placeholder={
                selectedCliente
                  ? loadingContatos
                    ? "Carregando contatos..."
                    : "Selecione um contato"
                  : "Selecione um cliente primeiro"
              }
              options={contatoOptions}
              value={selectedContato}
              onChange={(option) => {
                handleContatoSelectChange(option);
                if (option) setErrors((prev) => ({ ...prev, contato: false }));
              }}
              inputValue=""
              onInputChange={() => {}}
              isLoading={loadingContatos}
              error={errors.contato ? "Contato é obrigatório" : ""}
              noOptionsMessageFn={() =>
                "Nenhum contato encontrado para este cliente"
              }
              // @ts-expect-error - Type incompatibility between ContatoOption and OptionType components
              components={contatoSelectComponents}
              isDisabled={!selectedCliente}
            />
          </motion.div>
        </motion.div>

        {/* Campos para contato personalizado */}
        {useCustomContato && (
          <CustomContatoForm
            customContatoNome={customContatoNome}
            setCustomContatoNome={(value) => {
              setCustomContatoNome(value);
              if (value.trim()) setShowNameError(false);
            }}
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
            showNameError={showNameError}
            saveToClient={saveToClient}
            setSaveToClient={setSaveToClient}
            clienteId={selectedCliente?.value}
            onContactSaved={(contact) => {
              setSavedContact(contact);
              // Atualiza a lista de contatos após salvar um novo
              if (selectedCliente) {
                setLoadingContatos(true);
                clientesService
                  .getContacts(selectedCliente.value)
                  .then((response) => {
                    const options = response.contatos.map(
                      (contato: ClienteContato) => ({
                        value: Number(contato.id ?? 0), // Explicitly convert to number to ensure type safety
                        label: `${
                          contato.nome || contato.nome_completo || "Sem nome"
                        }${contato.cargo ? ` - ${contato.cargo}` : ""}`,
                        contato: contato,
                      })
                    );

                    // Adiciona a opção para inserir um contato personalizado
                    options.push({
                      value: -1, // This is explicitly a number
                      label: "Inserir contato não cadastrado",
                      contato: {
                        id: -1,
                        telefone: "",
                        email: "",
                        situacao: "A",
                      },
                      // isCustom removed since it's not in our interface
                    });

                    setContatoOptions(options as ContatoOption[]);

                    // Seleciona automaticamente o contato recém-criado
                    const novoContatoOption = options.find(
                      (option) => option.value === contact.id
                    );
                    if (novoContatoOption) {
                      setSelectedContato(novoContatoOption);
                      setUseCustomContato(false);

                      // Limpa os campos de formulário após salvar com sucesso
                      setCustomContatoNome("");
                      setCustomContatoNomeCompleto("");
                      setCustomContatoCargo("");
                      setCustomContatoEmail("");
                      setCustomContatoTelefone("");
                      setCustomContatoWhatsapp("");
                      setRecebeAvisoOS(false);

                      // Desativar a opção de salvar contato, já que o contato foi salvo
                      if (setSaveToClient) {
                        setSaveToClient(false);
                      }
                    }
                  })
                  .catch((error) => {
                    console.error("Erro ao atualizar contatos:", error);
                  })
                  .finally(() => {
                    setLoadingContatos(false);
                  });
              }
            }}
          />
        )}

        {/* Segunda linha: Máquina e Técnico */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: 0.05,
            type: "spring",
            stiffness: 100,
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Máquina */}
          <motion.div>
            <CustomSelect
              id="maquina"
              label="Máquina"
              required
              placeholder={
                selectedCliente
                  ? loadingMaquinas
                    ? "Carregando máquinas..."
                    : "Selecione uma máquina"
                  : "Selecione um cliente primeiro"
              }
              inputValue={maquinaInput}
              onInputChange={handleMaquinaInputChange}
              options={maquinaOptions}
              value={selectedMaquina}
              onChange={(option) => {
                handleMaquinaSelectChange(option);
                if (option) setErrors((prev) => ({ ...prev, maquina: false }));
              }}
              isLoading={loadingMaquinas || isSearchingMaquinas}
              minCharsToSearch={3}
              error={errors.maquina ? "Máquina é obrigatória" : ""}
              noOptionsMessageFn={({ inputValue }) =>
                inputValue.length < 3
                  ? "Digite pelo menos 3 caracteres para buscar uma máquina..."
                  : "Nenhuma máquina encontrada"
              }
              components={
                maquinaSelectComponents as unknown as React.ComponentProps<
                  typeof CustomSelect
                >["components"]
              }
              isDisabled={!selectedCliente}
            />
          </motion.div>

          {/* Motivo de Atendimento */}
          <motion.div>
            <CustomSelect
              id="motivo-atendimento"
              label="Motivo de Atendimento"
              placeholder="Selecione o motivo de atendimento"
              options={motivosAtendimentoOptions}
              value={selectedMotivoAtendimento}
              onChange={(option) => {
                handleMotivoAtendimentoSelectChange(option);
                if (option)
                  setErrors((prev) => ({ ...prev, motivoAtendimento: false }));
              }}
              inputValue=""
              onInputChange={() => {}}
              isLoading={false}
              noOptionsMessageFn={() =>
                "Nenhum motivo de atendimento cadastrado"
              }
            />
          </motion.div>
        </motion.div>

        {/* Terceira linha: Motivo de Pendência, Forma de Abertura e Data Agendada */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: 0.1,
            type: "spring",
            stiffness: 100,
          }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          {/* Técnico */}
          <motion.div>
            <CustomSelect
              id="tecnico"
              label="Técnico"
              placeholder="Selecione o técnico"
              options={tecnicosOptions}
              value={selectedTecnico}
              onChange={handleTecnicoSelectChange}
              inputValue=""
              onInputChange={() => {}}
              isLoading={loadingTecnicos}
              noOptionsMessageFn={() => "Nenhum técnico encontrado"}
            />
          </motion.div>

          {/* Motivo de Pendência */}
          <motion.div>
            <CustomSelect
              id="motivo-pendencia"
              label="Motivo de Pendência"
              placeholder="Selecione o motivo de pendência"
              options={motivosPendenciaOptions}
              value={selectedMotivoPendencia}
              onChange={handleMotivoPendenciaSelectChange}
              inputValue=""
              onInputChange={() => {}}
              isLoading={false}
              noOptionsMessageFn={() => "Nenhum motivo de pendência cadastrado"}
            />
          </motion.div>

          {/* Forma de Abertura */}
          <motion.div>
            <CustomSelect
              id="forma_abertura"
              label="Forma de Abertura"
              required
              placeholder="Selecione a forma de abertura"
              options={formaAberturaOptions}
              value={formaAbertura}
              onChange={(option) => {
                setFormaAbertura(option as FormaAberturaOption);
                setErrors((prev) => ({ ...prev, formaAbertura: false }));
              }}
              inputValue=""
              onInputChange={() => {}}
              isLoading={false}
              error={
                errors.formaAbertura ? "Forma de abertura é obrigatória" : ""
              }
              noOptionsMessageFn={() => "Nenhuma forma encontrada"}
            />
          </motion.div>

          {/* Data Agendada */}
          <motion.div>
            <DateTimeField
              id="data-agendada"
              label="Data Agendada (opcional)"
              value={dataAgendada}
              onChange={(e) => setDataAgendada(e.target.value)}
            />
          </motion.div>
        </motion.div>

        {/* Descrição do Problema */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: 0.15,
            type: "spring",
            stiffness: 100,
          }}
        >
          <div className="relative">
            <TextAreaField
              id="descricao-problema"
              label="Descrição do Problema"
              value={descricaoProblema}
              onChange={(e) => {
                setDescricaoProblema(e.target.value);
                if (e.target.value.trim()) {
                  setErrors((prev) => ({ ...prev, descricaoProblema: false }));
                }
              }}
              placeholder="Descreva detalhadamente o problema relatado pelo cliente"
              required
              rows={4}
              className={`transition-all duration-200 ${
                errors.descricaoProblema ? "!border-red-500 !ring-red-500" : ""
              }`}
            />
            {errors.descricaoProblema && (
              <div className="text-red-500 text-sm mt-1">
                Descrição do problema é obrigatória
              </div>
            )}
          </div>
        </motion.div>

        <FormActions isSaving={isSaving} />
      </FormContainer>
    </>
  );
};

export default NovaOrdemServico;
