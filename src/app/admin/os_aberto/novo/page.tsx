"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LoadingSpinner as Loading } from "@/components/LoadingPersonalizado";
import PageHeader from "@/components/admin/ui/PageHeader";
import {
  CustomSelect,
  TextAreaField,
  MachineOption,
  DateTimeField,
  type MachineOptionType,
} from "@/components/admin/form";
import { clientesService } from "@/api/services/clientesService";
import { maquinasService } from "@/api/services/maquinasService";
import { motivosPendenciaService } from "@/api/services/motivosPendenciaService";
import { ordensServicoService } from "@/api/services/ordensServicoService";
import { usuariosService } from "@/api/services/usuariosService";
import { Cliente, ClienteContato } from "@/types/admin/cadastro/clientes";
import { MotivoPendencia } from "@/types/admin/cadastro/motivos_pendencia";
import { Maquina } from "@/types/admin/cadastro/maquinas";
import { Usuario } from "@/types/admin/cadastro/usuarios";
import { OptionType } from "@/components/admin/form/CustomSelect";

// Componentes locais
import CustomContatoForm from "./components/CustomContatoForm";
import FormActions from "./components/FormActions";
import FormContainer from "./components/FormContainer";

interface ClienteOption extends OptionType {
  value: number;
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

interface ContatoOption extends OptionType {
  value: number;
  contato: ClienteContato;
  isCustom?: boolean;
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
  const [descricaoProblema, setDescricaoProblema] = useState("");
  const [formaAbertura, setFormaAbertura] = useState<FormaAberturaOption>({
    value: "telefone",
    label: "Telefone",
  });
  const [formaAberturaInput, setFormaAberturaInput] = useState("");
  const [dataAgendada, setDataAgendada] = useState("");
  const formaAberturaOptions: FormaAberturaOption[] = [
    { value: "email", label: "Email" },
    { value: "telefone", label: "Telefone" },
    { value: "whatsapp", label: "WhatsApp" },
  ];
  const [isSearchingClientes, setIsSearchingClientes] = useState(false);
  const [loadingMaquinas, setLoadingMaquinas] = useState(false);
  const [contatoOptions, setContatoOptions] = useState<ContatoOption[]>([]);
  const [selectedContato, setSelectedContato] = useState<ContatoOption | null>(
    null
  );
  const [loadingContatos, setLoadingContatos] = useState(false);
  const [customContatoNome, setCustomContatoNome] = useState("");
  const [customContatoEmail, setCustomContatoEmail] = useState("");
  const [customContatoTelefone, setCustomContatoTelefone] = useState("");
  const [customContatoWhatsapp, setCustomContatoWhatsapp] = useState("");
  const [useCustomContato, setUseCustomContato] = useState(false);
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
    descricaoProblema?: boolean;
    formaAbertura?: boolean;
    customContatoNome?: boolean;
  }>({});

  // Refs para controlar chamadas à API
  const motivosPendenciaLoaded = useRef(false);
  const tecnicosLoaded = useRef(false);
  // Refs para controlar timeouts de debounce
  const clienteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maquinaTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Adaptadores de tipo para os handlers de mudança de select
  const handleClienteSelectChange = (option: OptionType | null) => {
    handleClienteChange(option as ClienteOption | null);
  };

  const handleContatoSelectChange = (option: OptionType | null) => {
    const contatoOption = option as ContatoOption | null;
    setSelectedContato(contatoOption);
    setUseCustomContato(contatoOption?.isCustom || false);
  };

  const handleMaquinaSelectChange = (option: OptionType | null) => {
    const maquinaOption = option as MaquinaOption | null;
    if (maquinaOption && maquinaOption.value === -1) {
      // Usuário selecionou "Buscar outra máquina..."
      setSelectedMaquina(null);
      setMaquinaInput(""); // Limpar o campo de busca
    } else {
      setSelectedMaquina(maquinaOption);
    }
  };

  const handleMotivoPendenciaSelectChange = (option: OptionType | null) => {
    setSelectedMotivoPendencia(option as MotivoPendenciaOption | null);
  };

  const handleTecnicoSelectChange = (option: OptionType | null) => {
    setSelectedTecnico(option as TecnicoOption | null);
  };

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

          const tecnicosOpts = tecnicos.map((tecnico: Usuario) => ({
            value: tecnico.id,
            label: tecnico.nome,
          }));

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

    // Cleanup function para limpar os timeouts quando o componente é desmontado
    return () => {
      if (clienteTimeoutRef.current) clearTimeout(clienteTimeoutRef.current);
      if (maquinaTimeoutRef.current) clearTimeout(maquinaTimeoutRef.current);
    };
  }, []);

  // Função assíncrona para buscar clientes
  const searchClientes = async (term: string) => {
    if (term.length < 3) return;

    try {
      setIsSearchingClientes(true);
      const response = await clientesService.search(term);

      // Acessa os dados dos clientes no array 'dados'
      const options = response.dados.map((cliente: Cliente) => ({
        value: cliente.id_cliente || cliente.id || 0,
        label: `${cliente.nome_fantasia} (${cliente.codigo_erp || "-"})`,
      }));
      setClienteOptions(options);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    } finally {
      setIsSearchingClientes(false);
    }
  };

  // Handler para o input de cliente com debounce
  const handleClienteInputChange = (inputValue: string) => {
    setClienteInput(inputValue);

    // Limpa o timeout anterior se estiver pendente
    if (clienteTimeoutRef.current) {
      clearTimeout(clienteTimeoutRef.current);
      clienteTimeoutRef.current = null;
    }

    if (inputValue.length >= 3) {
      setIsSearchingClientes(true);
      clienteTimeoutRef.current = setTimeout(() => {
        searchClientes(inputValue);
      }, 700);
    } else {
      setClienteOptions([]);
      setIsSearchingClientes(false);
    }
  };

  const searchMaquinas = async (term: string) => {
    if (term.length < 3) return;

    try {
      const response = await maquinasService.searchByNumeroSerie(term);

      const machineOptions = response.dados.map((maquina: Maquina) => {
        const isInWarranty =
          maquina.data_final_garantia &&
          new Date(maquina.data_final_garantia) > new Date();

        return {
          value: maquina.id || 0,
          label: `${maquina.numero_serie} - ${maquina.descricao || ""}`,
          isInWarranty,
          data_final_garantia: maquina.data_final_garantia || "",
        } as MaquinaOption;
      });

      // Adicionar a opção de buscar outra máquina
      machineOptions.push({
        value: -1,
        label: "Buscar outra máquina...",
        isInWarranty: false,
        data_final_garantia: "",
      } as MaquinaOption);

      setMaquinaOptions(machineOptions as MaquinaOption[]);
    } catch (error) {
      console.error("Erro ao buscar máquinas:", error);
    } finally {
      setIsSearchingMaquinas(false);
    }
  };

  // Handler para o input de máquina com debounce
  const handleMaquinaInputChange = (inputValue: string) => {
    setMaquinaInput(inputValue);

    // Limpa o timeout anterior se estiver pendente
    if (maquinaTimeoutRef.current) {
      clearTimeout(maquinaTimeoutRef.current);
      maquinaTimeoutRef.current = null;
    }

    if (inputValue.length >= 3) {
      setIsSearchingMaquinas(true);

      maquinaTimeoutRef.current = setTimeout(() => {
        searchMaquinas(inputValue);
      }, 700);
    } else if (inputValue.length < 3) {
      setIsSearchingMaquinas(false);
    }
  };

  const handleClienteChange = async (selectedOption: ClienteOption | null) => {
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
          value: contato.id,
          label: `${contato.nome || contato.nome_completo || "Sem nome"}${
            contato.cargo ? ` - ${contato.cargo}` : ""
          }`,
          contato: contato,
        }));

        // Adiciona a opção para inserir um contato personalizado
        const customOption: ContatoOption = {
          value: -1,
          label: "Inserir outro contato",
          contato: { id: -1, telefone: "", email: "", situacao: "A" },
          isCustom: true,
        };
        options.push(customOption);

        setContatoOptions(options);
      } catch (error) {
        console.error("Erro ao carregar contatos:", error);
      } finally {
        setLoadingContatos(false);
      }
    } else {
      setMaquinaOptions([]);
      setContatoOptions([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Objeto para armazenar os erros de validação
    const validationErrors: {
      cliente?: boolean;
      maquina?: boolean;
      contato?: boolean;
      motivoPendencia?: boolean;
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

    // Validar motivo de pendência
    if (!selectedMotivoPendencia) {
      validationErrors.motivoPendencia = true;
    }

    // Validar contato
    if (!selectedContato) {
      validationErrors.contato = true;
    } else if (selectedContato.isCustom && !customContatoNome.trim()) {
      // Validar nome do contato personalizado
      validationErrors.customContatoNome = true;
      setShowNameError(true);
    }

    // Se houver erros, atualizar o estado e abortar o envio
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      // Rolar até o primeiro campo com erro
      const firstErrorField = document.querySelector(".campo-erro");
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      return;
    }

    // Limpar erros se tudo estiver válido
    setErrors({});

    setIsSaving(true);

    try {
      // Verificamos anteriormente que esses valores não são nulos, mas vamos garantir isso novamente
      if (!selectedCliente || !selectedMaquina || !formaAbertura) {
        console.error("Valores necessários não encontrados");
        return;
      }

      const osData: {
        id_cliente: number;
        id_maquina: number;
        id_motivo_pendencia?: number;
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

      // Adicione data_agendada apenas se não estiver vazia
      if (dataAgendada && dataAgendada.trim() !== "") {
        osData.data_agendada = dataAgendada.replace("T", " ");
      }

      // Adicionar informações de contato com os novos campos
      if (selectedContato) {
        if (selectedContato.isCustom) {
          // Usando contato personalizado
          if (customContatoNome.trim()) {
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
        } else {
          // Usando contato da lista
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
        await ordensServicoService.create({
          ...osData,
        } as OSFormCustom);
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
          transition={{ duration: 0.3 }}
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
            customContatoEmail={customContatoEmail}
            setCustomContatoEmail={setCustomContatoEmail}
            customContatoTelefone={customContatoTelefone}
            setCustomContatoTelefone={setCustomContatoTelefone}
            customContatoWhatsapp={customContatoWhatsapp}
            setCustomContatoWhatsapp={setCustomContatoWhatsapp}
            showNameError={showNameError}
          />
        )}

        {/* Segunda linha: Máquina e Técnico */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
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
              components={{ Option: MachineOption }}
            />
          </motion.div>

          {/* Técnico */}
          <motion.div>
            <CustomSelect
              id="tecnico"
              label="Técnico"
              placeholder="Selecione o técnico (opcional)"
              options={tecnicosOptions}
              value={selectedTecnico}
              onChange={handleTecnicoSelectChange}
              inputValue=""
              onInputChange={() => {}}
              isLoading={loadingTecnicos}
              noOptionsMessageFn={() => "Nenhum técnico encontrado"}
            />
          </motion.div>
        </motion.div>

        {/* Terceira linha: Motivo de Pendência, Forma de Abertura e Data Agendada */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Motivo de Pendência */}
          <motion.div>
            <CustomSelect
              id="motivo-pendencia"
              label="Motivo de Pendência"
              required
              placeholder="Selecione o motivo de pendência"
              options={motivosPendenciaOptions}
              value={selectedMotivoPendencia}
              onChange={(option) => {
                handleMotivoPendenciaSelectChange(option);
                if (option)
                  setErrors((prev) => ({ ...prev, motivoPendencia: false }));
              }}
              inputValue=""
              onInputChange={() => {}}
              isLoading={false}
              error={
                errors.motivoPendencia
                  ? "Motivo de pendência é obrigatório"
                  : ""
              }
              noOptionsMessageFn={() => "Nenhum motivo de pendência cadastrado"}
            />
          </motion.div>

          {/* Forma de Abertura */}
          <motion.div>
            <CustomSelect
              id="forma-abertura"
              label="Forma de Abertura"
              required
              placeholder="Selecione ou digite a forma de abertura"
              options={[
                ...formaAberturaOptions,
                // Adiciona a opção digitada pelo usuário se não estiver na lista
                ...(formaAberturaInput &&
                !formaAberturaOptions.some(
                  (opt) =>
                    opt.label.toLowerCase() === formaAberturaInput.toLowerCase()
                )
                  ? [
                      {
                        value: formaAberturaInput.toLowerCase(),
                        label: formaAberturaInput,
                      },
                    ]
                  : []),
              ]}
              value={formaAbertura}
              onChange={(option) => {
                if (option) {
                  setFormaAbertura(option as FormaAberturaOption);
                  setErrors((prev) => ({ ...prev, formaAbertura: false }));
                } else {
                  setFormaAbertura({ value: "telefone", label: "Telefone" });
                }
              }}
              inputValue={formaAberturaInput}
              onInputChange={(value) => {
                setFormaAberturaInput(value);
                if (
                  value &&
                  !formaAberturaOptions.some(
                    (opt) => opt.label.toLowerCase() === value.toLowerCase()
                  )
                ) {
                  setFormaAbertura({
                    value: value.toLowerCase().replace(/\s+/g, "_"),
                    label: value,
                  });
                }
              }}
              isLoading={false}
              error={
                errors.formaAbertura ? "Forma de abertura é obrigatória" : ""
              }
              noOptionsMessageFn={({ inputValue }) =>
                inputValue
                  ? `Use "${inputValue}" como forma de abertura`
                  : "Nenhuma forma de abertura disponível"
              }
            />
          </motion.div>

          {/* Data Agendada */}
          <motion.div>
            <DateTimeField
              id="data-agendada"
              label="Data Agendada"
              value={dataAgendada}
              onChange={(e) => setDataAgendada(e.target.value)}
            />
          </motion.div>
        </motion.div>

        {/* Descrição do Problema */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
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
