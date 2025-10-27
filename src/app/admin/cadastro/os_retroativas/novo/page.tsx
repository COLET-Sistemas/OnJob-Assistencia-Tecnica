"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type ComponentProps,
} from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/admin/ui/PageHeader";
import { useToast } from "@/components/admin/ui/ToastContainer";
import {
  CustomSelect,
  InputField,
  LoadingButton,
  SelectField,
  TextAreaField,
  type MachineOptionType,
} from "@/components/admin/form";
import CustomContatoForm from "@/app/admin/os_aberto/novo/components/CustomContatoForm";
import type { OptionType } from "@/components/admin/form/CustomSelect";
import {
  clientesService,
  maquinasService,
  motivosAtendimentoService,
  ordensServicoService,
  usuariosService,
} from "@/api/services";
import useDebouncedCallback from "@/hooks/useDebouncedCallback";
import { clienteSelectComponents } from "@/app/admin/os_aberto/novo/components/ClienteItem";
import { contatoSelectComponents } from "@/app/admin/os_aberto/novo/components/ContatoItem";
import { maquinaSelectComponents } from "@/app/admin/os_aberto/novo/MaquinaItem";
import type { Cliente, ClienteContato } from "@/types/admin/cadastro/clientes";
import type { Maquina } from "@/types/admin/cadastro/maquinas";
import type { MotivoAtendimento } from "@/types/admin/cadastro/motivos_atendimento";
import type { Usuario } from "@/types/admin/cadastro/usuarios";

type CustomSelectComponentsProp = ComponentProps<
  typeof CustomSelect
>["components"];

interface ClienteOption extends OptionType {
  value: number;
  data: Cliente;
  cidade?: string;
  uf?: string;
}

interface ContatoOption extends OptionType {
  value: number;
  contato: ClienteContato;
}

interface MaquinaOption extends MachineOptionType {
  value: number;
  data?: Maquina;
}

interface FormState {
  dataAbertura: string;
  dataConclusao: string; // NOVO
  descricaoProblema: string;
  observacoesTecnico: string;
  solucaoEncontrada: string;
  testesRealizados: string;
  sugestoes: string;
  observacoes: string;
  numeroCiclos: string;
  nomeContato: string;
  nomeCompleto: string;
  cargo: string;
  telefoneContato: string;
  whatsappContato: string;
  emailContato: string;
  emGarantia: "" | "true" | "false";
}

const DETAIL_FIELDS: Array<keyof FormState> = [
  "solucaoEncontrada",
  "testesRealizados",
  "sugestoes",
  "observacoes",
  "observacoesTecnico",
];

const MANUAL_CONTACT_OPTION: ContatoOption = {
  value: -1,
  label: "Inserir contato não cadastrado",
  contato: {
    id: -1,
    nome: "",
    nome_completo: "",
    telefone: "",
    whatsapp: "",
    email: "",
    situacao: "A",
    recebe_aviso_os: false,
  },
};

const appendSecondsToDateTime = (value: string): string => {
  if (!value) {
    return "";
  }
  // Espera value no formato yyyy-MM-dd
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }
  return `${day}.${month}.${year}`;
};

const formatTelefone = (telefone: string): string => telefone.trim();

const mapMaquinaToOption = (maquina: Maquina): MaquinaOption | null => {
  const id = maquina.id ?? (maquina as { id_maquina?: number }).id_maquina ?? 0;

  if (!id) {
    return null;
  }

  const dataFinalGarantia =
    maquina.data_final_garantia ??
    (maquina as { data_final_garantia_fat?: string }).data_final_garantia_fat ??
    "";

  const isInWarranty = dataFinalGarantia
    ? new Date(dataFinalGarantia) > new Date()
    : ((maquina as { situacao?: string }).situacao || "").toUpperCase() === "G";

  return {
    value: id,
    label: `${maquina.numero_serie} - ${maquina.descricao ?? ""}`,
    data: maquina,
    data_final_garantia: dataFinalGarantia || undefined,
    isInWarranty,
  };
};

const NovaOSRetroativa = () => {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [saveToClient, setSaveToClient] = useState(false);
  const [recebeAvisoOS, setRecebeAvisoOS] = useState(false);

  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formState, setFormState] = useState<FormState>({
    dataAbertura: "",
    dataConclusao: "",
    descricaoProblema: "",
    observacoesTecnico: "",
    solucaoEncontrada: "",
    testesRealizados: "",
    sugestoes: "",
    observacoes: "",
    numeroCiclos: "",
    nomeContato: "",
    nomeCompleto: "",
    cargo: "",
    telefoneContato: "",
    whatsappContato: "",
    emailContato: "",
    emGarantia: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [clienteOptions, setClienteOptions] = useState<ClienteOption[]>([]);
  const [clienteInput, setClienteInput] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<ClienteOption | null>(
    null
  );
  const [isSearchingClientes, setIsSearchingClientes] = useState(false);

  const [contatoOptions, setContatoOptions] = useState<ContatoOption[]>([]);
  const [selectedContato, setSelectedContato] = useState<ContatoOption | null>(
    null
  );
  const [isLoadingContatos, setIsLoadingContatos] = useState(false);

  const [maquinaOptions, setMaquinaOptions] = useState<MaquinaOption[]>([]);
  const [selectedMaquina, setSelectedMaquina] = useState<MaquinaOption | null>(
    null
  );
  const [isLoadingMaquinas, setIsLoadingMaquinas] = useState(false);
  const [maquinaInput, setMaquinaInput] = useState("");
  const [isSearchingMaquinas, setIsSearchingMaquinas] = useState(false);
  const [manualMaquinaId, setManualMaquinaId] = useState("");

  const [motivoOptions, setMotivoOptions] = useState<OptionType[]>([]);
  const [selectedMotivo, setSelectedMotivo] = useState<OptionType | null>(null);

  const [tecnicoOptions, setTecnicoOptions] = useState<OptionType[]>([]);
  const [selectedTecnico, setSelectedTecnico] = useState<OptionType | null>(
    null
  );
  const [isLoadingTecnicos, setIsLoadingTecnicos] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = localStorage.getItem("id_usuario");
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed)) {
        setUsuarioId(parsed);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;

    const loadMotivos = async () => {
      try {
        const lista = await motivosAtendimentoService.getAll({
          situacao: "A",
        });

        if (!active) {
          return;
        }

        const options =
          lista
            ?.filter((motivo: MotivoAtendimento) =>
              ["A", "ATIVO"].includes((motivo.situacao || "").toUpperCase())
            )
            .map(
              (motivo: MotivoAtendimento): OptionType => ({
                value: motivo.id,
                label: motivo.descricao,
              })
            ) ?? [];

        setMotivoOptions(options);
      } catch (error) {
        console.error("Erro ao carregar motivos de atendimento:", error);
        showError("Erro ao carregar motivos de atendimento");
      }
    };

    const loadTecnicos = async () => {
      setIsLoadingTecnicos(true);
      try {
        const response = await usuariosService.getAll({
          situacao: "A",
          apenas_tecnicos: "S",
        });

        if (!active) {
          return;
        }

        const usuarios = Array.isArray(response)
          ? response
          : Array.isArray((response as { dados?: Usuario[] }).dados)
          ? ((response as { dados?: Usuario[] }).dados as Usuario[])
          : [];

        const options = usuarios.map((usuario: Usuario): OptionType => {
          let tipo = "";
          if (usuario.perfil_tecnico_terceirizado) {
            tipo = " (Terceiro)";
          } else if (usuario.perfil_interno) {
            tipo = " (Interno)";
          }

          return {
            value: usuario.id,
            label: `${usuario.nome}${tipo}`,
          };
        });

        setTecnicoOptions(options);
      } catch (error) {
        console.error("Erro ao carregar tecnicos:", error);
        showError("Erro ao carregar tecnicos");
      } finally {
        if (active) {
          setIsLoadingTecnicos(false);
        }
      }
    };

    loadMotivos();
    loadTecnicos();

    return () => {
      active = false;
    };
  }, [showError]);

  const setFormField = useCallback((field: keyof FormState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => {
      const fieldKey = field as string;
      const shouldClearFieldError = Boolean(prev[fieldKey]);
      const shouldClearDetailsError =
        DETAIL_FIELDS.includes(field) && Boolean(prev.detalhesAtendimento);

      if (!shouldClearFieldError && !shouldClearDetailsError) {
        return prev;
      }

      const nextErrors = { ...prev };

      if (shouldClearFieldError) {
        nextErrors[fieldKey] = "";
      }

      if (shouldClearDetailsError) {
        nextErrors.detalhesAtendimento = "";
      }

      return nextErrors;
    });
  }, []);

  const resetContatoFields = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      nomeContato: "",
      telefoneContato: "",
      whatsappContato: "",
      emailContato: "",
    }));
  }, []);

  const searchClientes = useCallback(
    async (term: string) => {
      try {
        const response = await clientesService.search(term);

        const options =
          response?.dados
            ?.map((cliente: Cliente) => {
              const id = cliente.id_cliente ?? cliente.id;
              if (!id) {
                return null;
              }

              return {
                value: id,
                label: `${cliente.razao_social} (${cliente.codigo_erp || "-"})`,
                data: cliente,
                cidade: cliente.cidade,
                uf: cliente.uf,
              } as ClienteOption;
            })
            .filter(Boolean) ?? [];

        setClienteOptions(options as ClienteOption[]);
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
        showError("Erro ao buscar clientes");
      } finally {
        setIsSearchingClientes(false);
      }
    },
    [showError]
  );

  const debouncedSearchClientes = useDebouncedCallback((term: string) => {
    if (term.length >= 3) {
      void searchClientes(term);
    }
  }, 500);

  const handleClienteInputChange = useCallback(
    (inputValue: string) => {
      setClienteInput(inputValue);

      if (inputValue.length < 3) {
        setIsSearchingClientes(false);
        setClienteOptions([]);
        return;
      }

      setIsSearchingClientes(true);
      debouncedSearchClientes(inputValue);
    },
    [debouncedSearchClientes]
  );
  // Em loadContatos(), padronize o mapeamento e injete a opção manual no TOPO
  const loadContatos = useCallback(
    async (clienteId: number) => {
      setIsLoadingContatos(true);
      try {
        const response = await clientesService.getContacts(clienteId);
        const contatos = response?.contatos ?? [];

        const options: ContatoOption[] = contatos
          .map((contato) => {
            const c = contato as ClienteContato;
            const id = Number(
              c.id ?? (c as { id_contato?: number }).id_contato ?? 0
            );
            if (!id) return null;

            const dados: ClienteContato = {
              id,
              nome: c.nome ?? c.nome_completo ?? "",
              nome_completo: c.nome_completo ?? c.nome ?? "",
              cargo: c.cargo,
              telefone: c.telefone ?? "",
              whatsapp: c.whatsapp ?? "",
              email: c.email ?? "",
              situacao: c.situacao ?? "A",
              recebe_aviso_os: c.recebe_aviso_os ?? false,
            };

            const base = dados.nome || dados.nome_completo || "Contato";
            const label = dados.cargo ? `${base} - ${dados.cargo}` : base;

            return { value: id, label, contato: dados } as ContatoOption;
          })
          .filter(Boolean) as ContatoOption[];

        setContatoOptions([MANUAL_CONTACT_OPTION, ...options]);
        setSelectedContato(null);
        resetContatoFields();
      } catch (error) {
        console.error("Erro ao carregar contatos:", error);
        showError("Erro ao carregar contatos");
        // ainda exibimos a opção manual para não travar o fluxo
        setContatoOptions([MANUAL_CONTACT_OPTION]);
        setSelectedContato(MANUAL_CONTACT_OPTION);
        resetContatoFields();
      } finally {
        setIsLoadingContatos(false);
      }
    },
    [resetContatoFields, showError]
  );

  const buildMaquinaOptions = useCallback((lista: Maquina[]) => {
    const options =
      lista.map((maquina) => mapMaquinaToOption(maquina)).filter(Boolean) ?? [];

    return [
      ...(options as MaquinaOption[]),
      {
        value: -1,
        label: "Buscar outra maquina...",
        isInWarranty: false,
      } as MaquinaOption,
    ];
  }, []);

  const loadMaquinas = useCallback(
    async (clienteId: number) => {
      setIsLoadingMaquinas(true);
      try {
        const response = await maquinasService.getByClienteId(clienteId, 15);
        const maquinas = response?.dados ?? [];
        setMaquinaOptions(buildMaquinaOptions(maquinas));
        setSelectedMaquina(null);
      } catch (error) {
        console.error("Erro ao carregar maquinas:", error);
        showError("Erro ao carregar maquinas");
        setMaquinaOptions(buildMaquinaOptions([]));
      } finally {
        setIsLoadingMaquinas(false);
      }
    },
    [buildMaquinaOptions, showError]
  );

  const searchMaquinas = useCallback(
    async (term: string) => {
      if (term.length < 3) {
        return;
      }

      try {
        const response = await maquinasService.searchByNumeroSerie(term);
        const maquinas = response?.dados ?? [];
        setMaquinaOptions(buildMaquinaOptions(maquinas));
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "erro" in error &&
          (error as { erro?: string }).erro === "'Nenhuma maquina encontrada'"
        ) {
          setMaquinaOptions(buildMaquinaOptions([]));
        } else {
          console.error("Erro ao buscar maquinas:", error);
        }
      } finally {
        setIsSearchingMaquinas(false);
      }
    },
    [buildMaquinaOptions]
  );

  const debouncedSearchMaquinas = useDebouncedCallback((term: string) => {
    if (term.length >= 3) {
      void searchMaquinas(term);
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

  const handleClienteChange = useCallback(
    (option: OptionType | null) => {
      const clienteOption = option as ClienteOption | null;
      setSelectedCliente(clienteOption);

      if (clienteOption) {
        setErrors((prev) => ({ ...prev, cliente: "" }));
        setMaquinaInput("");
        setManualMaquinaId("");
        loadContatos(clienteOption.value);
        loadMaquinas(clienteOption.value);
      } else {
        setClienteOptions([]);
        setContatoOptions([MANUAL_CONTACT_OPTION]);
        setSelectedContato(MANUAL_CONTACT_OPTION);
        resetContatoFields();
        setMaquinaOptions(buildMaquinaOptions([]));
        setSelectedMaquina(null);
        setManualMaquinaId("");
      }
    },
    [buildMaquinaOptions, loadContatos, loadMaquinas, resetContatoFields]
  );

  const handleContatoChange = useCallback(
    (option: OptionType | null) => {
      const contatoOption = option as ContatoOption | null;

      if (contatoOption && contatoOption.value !== -1) {
        setSelectedContato(contatoOption);
        setErrors((prev) => ({ ...prev, contato: "", nomeContato: "" }));

        const contato = contatoOption.contato;
        setFormState((prev) => ({
          ...prev,
          nomeContato:
            contato.nome || contato.nome_completo || prev.nomeContato || "",
          telefoneContato: contato.telefone || "",
          whatsappContato: contato.whatsapp || "",
          emailContato: contato.email || "",
        }));

        return;
      }

      setSelectedContato(MANUAL_CONTACT_OPTION);
      resetContatoFields();
    },
    [resetContatoFields]
  );

  const handleMaquinaChange = useCallback((option: OptionType | null) => {
    const maquinaOption = option as MaquinaOption | null;

    if (maquinaOption && maquinaOption.value === -1) {
      setSelectedMaquina(null);
      setErrors((prev) => ({ ...prev, maquina: "" }));
      return;
    }

    setSelectedMaquina(maquinaOption);

    if (maquinaOption) {
      setErrors((prev) => ({ ...prev, maquina: "" }));
      setManualMaquinaId("");
    }
  }, []);

  const handleMotivoChange = useCallback((option: OptionType | null) => {
    setSelectedMotivo(option);
    if (option) {
      setErrors((prev) => ({ ...prev, motivo: "" }));
    }
  }, []);

  const handleTecnicoChange = useCallback((option: OptionType | null) => {
    setSelectedTecnico(option);
    if (option) {
      setErrors((prev) => ({ ...prev, tecnico: "" }));
    }
  }, []);

  const handleInputChange = useCallback(
    (
      event:
        | ChangeEvent<HTMLInputElement>
        | ChangeEvent<HTMLTextAreaElement>
        | ChangeEvent<HTMLSelectElement>
    ) => {
      const { name, value } = event.target;
      setFormField(name as keyof FormState, value);
    },
    [setFormField]
  );

  const validateForm = useCallback(() => {
    const validationErrors: Record<string, string> = {};

    if (!formState.dataAbertura) {
      validationErrors.dataAbertura = "Informe a data de abertura.";
    }

    if (!formState.dataConclusao) {
      validationErrors.dataConclusao = "Informe a data de conclusão.";
    } else if (formState.dataAbertura && formState.dataConclusao) {
      // Compare dates: yyyy-MM-dd
      const aberturaDate = new Date(formState.dataAbertura);
      const conclusaoDate = new Date(formState.dataConclusao);
      if (conclusaoDate < aberturaDate) {
        validationErrors.dataConclusao =
          "A data de conclusão deve ser maior ou igual à data de abertura.";
      }
    }

    if (
      (!selectedContato || selectedContato.value === -1) &&
      !formState.nomeContato.trim()
    ) {
      validationErrors.nomeContato = "Informe o nome do contato.";
    }

    if (
      selectedContato?.value === -1 &&
      saveToClient &&
      !formState.nomeCompleto.trim()
    ) {
      validationErrors.nomeContato =
        "Informe o nome e o nome completo do contato.";
    }

    if (!selectedCliente) {
      validationErrors.cliente = "Selecione um cliente.";
    }

    const maquinaId =
      selectedMaquina?.value ||
      (manualMaquinaId ? Number(manualMaquinaId) : undefined);

    if (!maquinaId) {
      validationErrors.maquina =
        "Selecione uma maquina ou informe o ID manualmente.";
    } else if (Number.isNaN(maquinaId)) {
      validationErrors.manualMaquinaId = "Informe um numero valido.";
    }

    if (!selectedMotivo) {
      validationErrors.motivo = "Selecione o motivo da abertura.";
    }

    if (!formState.descricaoProblema.trim()) {
      validationErrors.descricaoProblema = "Descreva o defeito relatado.";
    }

    if (!selectedTecnico) {
      validationErrors.tecnico = "Selecione o técnico responsavel.";
    }

    if (
      (!selectedContato || selectedContato.value === -1) &&
      !formState.nomeContato.trim()
    ) {
      validationErrors.nomeContato = "Informe o nome do contato.";
    }

    if (!formState.emGarantia) {
      validationErrors.emGarantia =
        "Informe se o equipamento esta em garantia.";
    }

    if (!formState.numeroCiclos.trim()) {
      validationErrors.numeroCiclos = "Informe o numero de ciclos.";
    } else if (Number.isNaN(Number(formState.numeroCiclos))) {
      validationErrors.numeroCiclos = "Informe um numero valido.";
    }

    const hasDetailFieldFilled = Boolean(
      formState.solucaoEncontrada.trim() ||
        formState.testesRealizados.trim() ||
        formState.sugestoes.trim() ||
        formState.observacoes.trim() ||
        formState.observacoesTecnico.trim()
    );

    if (!hasDetailFieldFilled) {
      validationErrors.detalhesAtendimento =
        "Informe ao menos um dos campos de conclusão (Solução encontrada, Testes realizados, Sugestões ao cliente, Observações gerais ou Observações do técnico).";
    }

    if (!usuarioId) {
      validationErrors.usuario =
        "Não foi possivel identificar o usuario logado.";
    }

    setErrors(validationErrors);
    return validationErrors;
  }, [
    formState.dataAbertura,
    formState.dataConclusao,
    formState.descricaoProblema,
    formState.emGarantia,
    formState.nomeContato,
    formState.nomeCompleto,
    formState.numeroCiclos,
    formState.observacoes,
    formState.observacoesTecnico,
    formState.solucaoEncontrada,
    formState.sugestoes,
    formState.testesRealizados,
    manualMaquinaId,
    selectedCliente,
    selectedContato,
    selectedMaquina?.value,
    selectedMotivo,
    selectedTecnico,
    saveToClient,
    usuarioId,
  ]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isSubmitting) {
        return;
      }

      const validationErrors = validateForm();
      if (Object.keys(validationErrors).length > 0) {
        if (
          validationErrors.dataConclusao ===
          "A data de conclusão deve ser maior que a data de abertura."
        ) {
          showError(
            "A data de conclusão deve ser maior que a data de abertura."
          );
        } else if (
          validationErrors.detalhesAtendimento ===
          "Informe ao menos um dos campos de conclusão (Solução encontrada, Testes realizados, Sugestões ao cliente, Observações gerais ou Observações do técnico)."
        ) {
          showError(
            "Informe ao menos um dos campos de conclusão (Solução encontrada, Testes realizados, Sugestões ao cliente, Observações gerais ou Observações do técnico)."
          );
        } else {
          showError(
            "Revise os campos obrigatorios",
            "Preencha ou corrija as informacoes destacadas."
          );
        }
        return;
      }

      const maquinaId =
        selectedMaquina?.value ||
        (manualMaquinaId ? Number(manualMaquinaId) : 0);
      const contatoId =
        selectedContato && selectedContato.value !== -1
          ? Number(selectedContato.value)
          : undefined;

      const payload = {
        id_cliente: selectedCliente?.value ?? 0,
        id_maquina: maquinaId,
        id_contato_abertura: contatoId,
        nome_contato_abertura: formState.nomeContato.trim(),
        telefone_contato_abertura: formatTelefone(formState.telefoneContato),
        whatsapp_contato_abertura: formatTelefone(formState.whatsappContato),
        email_contato_abertura: formState.emailContato.trim(),
        forma_abertura: "Retroativa" as const,
        origem_abertura: "I" as const,
        data_abertura: appendSecondsToDateTime(formState.dataAbertura),
        data_conclusao: formState.dataConclusao
          ? appendSecondsToDateTime(formState.dataConclusao)
          : undefined,
        id_usuario_abertura: usuarioId!,
        id_usuario_tecnico: Number(selectedTecnico?.value),
        em_garantia: formState.emGarantia === "true",
        id_motivo_atendimento: Number(selectedMotivo?.value),
        descricao_problema: formState.descricaoProblema.trim(),
        observacoes_tecnico: formState.observacoesTecnico.trim() || undefined,
        solucao_encontrada: formState.solucaoEncontrada.trim() || undefined,
        testes_realizados: formState.testesRealizados.trim() || undefined,
        sugestoes: formState.sugestoes.trim() || undefined,
        observacoes: formState.observacoes.trim() || undefined,
        numero_ciclos: formState.numeroCiclos
          ? Number(formState.numeroCiclos)
          : undefined,
        id_usuario_revisao: usuarioId!,
        emissao_retroativa: true,
      };

      setIsSubmitting(true);

      try {
        await ordensServicoService.createRetroativa(payload);
        showSuccess("OS retroativa registrada com sucesso!");
        router.push("/admin/cadastro/os_retroativas");
      } catch (error) {
        console.error("Erro ao cadastrar OS retroativa:", error);
        showError(
          "Erro ao cadastrar OS retroativa",
          error as Record<string, unknown>
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      formState.dataAbertura,
      formState.dataConclusao,
      formState.descricaoProblema,
      formState.emailContato,
      formState.emGarantia,
      formState.nomeContato,
      formState.numeroCiclos,
      formState.observacoes,
      formState.observacoesTecnico,
      formState.solucaoEncontrada,
      formState.sugestoes,
      formState.telefoneContato,
      formState.testesRealizados,
      formState.whatsappContato,
      isSubmitting,
      manualMaquinaId,
      router,
      selectedCliente?.value,
      selectedContato,
      selectedMaquina?.value,
      selectedMotivo?.value,
      selectedTecnico?.value,
      showError,
      showSuccess,
      usuarioId,
      validateForm,
    ]
  );

  return (
    <>
      <PageHeader
        title="Cadastro de OS Retroativa"
        config={{
          type: "form",
          backLink: "/admin/cadastro/os_retroativas",
          backLabel: "Voltar para OS retroativas",
        }}
      />

      <main>
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          noValidate
        >
          <div className="p-6 md:p-8 space-y-10">
            <section className="space-y-6">
              <header>
                <h3 className="text-lg font-semibold text-slate-800">
                  Abertura da OS
                </h3>
                <p className="text-sm text-slate-500">
                  Informe os dados principais da ordem de serviço retroativa.
                </p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <InputField
                    name="dataAbertura"
                    label="Data de abertura"
                    type="date"
                    value={formState.dataAbertura}
                    onChange={(e) =>
                      setFormField("dataAbertura", e.target.value)
                    }
                    required
                  />
                  {errors.dataAbertura && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.dataAbertura}
                    </p>
                  )}
                </div>
                <div>
                  <InputField
                    name="dataConclusao"
                    label="Data de conclusão"
                    type="date"
                    value={formState.dataConclusao}
                    onChange={(e) =>
                      setFormField("dataConclusao", e.target.value)
                    }
                    required
                  />
                  {errors.dataConclusao && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.dataConclusao}
                    </p>
                  )}
                </div>
                <CustomSelect
                  id="motivo"
                  label="Motivo da abertura"
                  required
                  placeholder="Selecione o motivo..."
                  onChange={handleMotivoChange}
                  options={motivoOptions}
                  value={selectedMotivo}
                  isDisabled={motivoOptions.length === 0}
                  error={errors.motivo}
                />
              </div>

              {/* Linha 2: Cliente e Contato (mesma linha, metade cada) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CustomSelect
                  id="cliente"
                  label="Cliente"
                  required
                  placeholder="Digite pelo menos 3 caracteres para buscar..."
                  inputValue={clienteInput}
                  onInputChange={handleClienteInputChange}
                  onChange={handleClienteChange}
                  options={clienteOptions}
                  value={selectedCliente}
                  isLoading={isSearchingClientes}
                  minCharsToSearch={3}
                  noOptionsMessageFn={({ inputValue }) =>
                    inputValue.length < 3
                      ? "Digite pelo menos 3 caracteres para buscar..."
                      : "Nenhum cliente encontrado"
                  }
                  components={
                    clienteSelectComponents as unknown as CustomSelectComponentsProp
                  }
                  error={errors.cliente}
                />
                <CustomSelect
                  id="contato"
                  label="Contato"
                  required
                  placeholder={
                    selectedCliente
                      ? isLoadingContatos
                        ? "Carregando contatos..."
                        : "Selecione um contato"
                      : "Selecione um cliente primeiro"
                  }
                  onChange={handleContatoChange}
                  options={contatoOptions}
                  value={selectedContato}
                  isDisabled={!selectedCliente}
                  isLoading={isLoadingContatos}
                  noOptionsMessageFn={() =>
                    "Nenhum contato encontrado para este cliente"
                  }
                  components={
                    contatoSelectComponents as unknown as CustomSelectComponentsProp
                  }
                  error={errors.contato}
                />
              </div>

              {/* Form de contato manual, se necessário */}
              {selectedContato?.value === -1 && (
                <div className="col-span-full w-full mt-4 border rounded-lg p-4 bg-slate-50">
                  <CustomContatoForm
                    customContatoNome={formState.nomeContato}
                    setCustomContatoNome={(v) => setFormField("nomeContato", v)}
                    customContatoNomeCompleto={formState.nomeCompleto ?? ""}
                    setCustomContatoNomeCompleto={(v) =>
                      setFormField("nomeCompleto", v)
                    }
                    customContatoCargo={formState.cargo ?? ""}
                    setCustomContatoCargo={(v) => setFormField("cargo", v)}
                    customContatoEmail={formState.emailContato}
                    setCustomContatoEmail={(v) =>
                      setFormField("emailContato", v)
                    }
                    customContatoTelefone={formState.telefoneContato}
                    setCustomContatoTelefone={(v) =>
                      setFormField("telefoneContato", v)
                    }
                    customContatoWhatsapp={formState.whatsappContato}
                    setCustomContatoWhatsapp={(v) =>
                      setFormField("whatsappContato", v)
                    }
                    recebeAvisoOS={recebeAvisoOS}
                    setRecebeAvisoOS={setRecebeAvisoOS}
                    saveToClient={saveToClient}
                    setSaveToClient={setSaveToClient}
                    clienteId={
                      typeof selectedCliente?.value === "number"
                        ? selectedCliente.value
                        : undefined
                    }
                    showNameError={
                      !!errors.nomeContato && selectedContato?.value === -1
                    }
                    onContactSaved={(savedContact: ClienteContato) => {
                      loadContatos(selectedCliente!.value);
                      setSelectedContato({
                        value: Number(savedContact.id) || 0,
                        label:
                          savedContact.nome ||
                          savedContact.nome_completo ||
                          "Contato",
                        contato: savedContact,
                      });
                      showSuccess(
                        "Contato salvo e selecionado automaticamente."
                      );
                    }}
                  />
                </div>
              )}

              {/* Linha 3: Máquina, Equipamento em garantia, Técnico (mesma linha, 1/3 cada) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <CustomSelect
                    id="maquina"
                    label="Máquina"
                    required
                    placeholder={
                      selectedCliente
                        ? isLoadingMaquinas || isSearchingMaquinas
                          ? "Carregando maquinas..."
                          : "Selecione uma maquina"
                        : "Selecione um cliente primeiro"
                    }
                    inputValue={maquinaInput}
                    onInputChange={handleMaquinaInputChange}
                    onChange={handleMaquinaChange}
                    options={maquinaOptions}
                    value={selectedMaquina}
                    isDisabled={!selectedCliente}
                    isLoading={isLoadingMaquinas || isSearchingMaquinas}
                    minCharsToSearch={3}
                    noOptionsMessageFn={({ inputValue }) =>
                      inputValue.length < 3
                        ? "Digite pelo menos 3 caracteres para buscar uma maquina..."
                        : "Nenhuma maquina encontrada"
                    }
                    components={
                      maquinaSelectComponents as unknown as CustomSelectComponentsProp
                    }
                    error={errors.maquina}
                  />
                  <div className="mt-2">
                    {errors.manualMaquinaId && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.manualMaquinaId}
                      </p>
                    )}
                  </div>
                </div>
                <SelectField
                  label="Equipamento em garantia?"
                  name="emGarantia"
                  value={formState.emGarantia}
                  onChange={handleInputChange}
                  options={[
                    { value: "", label: "Selecione..." },
                    { value: "false", label: "Não" },
                    { value: "true", label: "Sim" },
                  ]}
                  required
                  error={errors.emGarantia}
                />
                <CustomSelect
                  id="tecnico"
                  label="Técnico designado"
                  required
                  placeholder="Selecione o técnico..."
                  onChange={handleTecnicoChange}
                  options={tecnicoOptions}
                  value={selectedTecnico}
                  isLoading={isLoadingTecnicos}
                  error={errors.tecnico}
                />
              </div>

              <TextAreaField
                id="descricaoProblema"
                label="Descricão do defeito"
                value={formState.descricaoProblema}
                onChange={(event) => {
                  setFormField("descricaoProblema", event.target.value);
                }}
                placeholder="Descreva o defeito relatado..."
                rows={4}
                required
              />
              {errors.descricaoProblema && (
                <p className="text-sm text-red-600">
                  {errors.descricaoProblema}
                </p>
              )}
            </section>

            <section className="space-y-6">
              <header>
                <h3 className="text-lg font-semibold text-slate-800">
                  Atendimento da OS (FAT)
                </h3>
                <p className="text-sm text-slate-500">
                  Detalhe o atendimento realizado e as observações finais.
                </p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextAreaField
                  id="solucaoEncontrada"
                  label="Solução encontrada"
                  value={formState.solucaoEncontrada}
                  onChange={(event) => {
                    setFormField("solucaoEncontrada", event.target.value);
                  }}
                  placeholder="Descreva a solução aplicada..."
                  rows={4}
                />

                <TextAreaField
                  id="testesRealizados"
                  label="Testes realizados"
                  value={formState.testesRealizados}
                  onChange={(event) => {
                    setFormField("testesRealizados", event.target.value);
                  }}
                  placeholder="Informe os testes executados..."
                  rows={4}
                />

                <TextAreaField
                  id="sugestoes"
                  label="Sugestões ao cliente"
                  value={formState.sugestoes}
                  onChange={(event) => {
                    setFormField("sugestoes", event.target.value);
                  }}
                  placeholder="Recomendações ou cuidados futuros..."
                  rows={3}
                />

                <TextAreaField
                  id="observacoes"
                  label="Observações gerais"
                  value={formState.observacoes}
                  onChange={(event) => {
                    setFormField("observacoes", event.target.value);
                  }}
                  placeholder="Observações adicionais relevantes..."
                  rows={3}
                />

                <TextAreaField
                  id="observacoesTecnico"
                  label="Observações do técnico"
                  value={formState.observacoesTecnico}
                  onChange={(event) => {
                    setFormField("observacoesTecnico", event.target.value);
                  }}
                  placeholder="Detalhes registrados pelo técnico..."
                  rows={3}
                />

                {errors.detalhesAtendimento && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.detalhesAtendimento}
                  </p>
                )}

                <InputField
                  label="Número de ciclos"
                  name="numeroCiclos"
                  value={formState.numeroCiclos}
                  onChange={handleInputChange}
                  placeholder="Ex.: 18250"
                  type="number"
                  required
                  error={errors.numeroCiclos}
                />
              </div>
            </section>
          </div>

          <footer className="bg-slate-50 px-6 md:px-8 py-6 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => router.push("/admin/cadastro/os_retroativas")}
                className="px-6 py-3 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors text-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
              >
                Cancelar
              </button>

              <LoadingButton
                type="submit"
                isLoading={isSubmitting}
                className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 focus:ring-[var(--primary)] shadow-sm"
              >
                Salvar
              </LoadingButton>
            </div>
            {errors.usuario && (
              <p className="text-sm text-red-600 mt-3 text-right">
                {errors.usuario}
              </p>
            )}
          </footer>
        </form>
      </main>
    </>
  );
};

export default NovaOSRetroativa;
