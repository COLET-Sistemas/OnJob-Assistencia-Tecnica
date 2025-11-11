"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronRight,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  Settings,
  User,
  Users,
} from "lucide-react";
import MobileHeader from "@/components/tecnico/MobileHeader";
import { clientesService } from "@/api/services/clientesService";
import { maquinasService } from "@/api/services/maquinasService";
import { motivosAtendimentoService } from "@/api/services/motivosAtendimentoService";
import { ordensServicoService } from "@/api/services/ordensServicoService";
import { Cliente, ClienteContato } from "@/types/admin/cadastro/clientes";
import { Maquina } from "@/types/admin/cadastro/maquinas";
import { MotivoAtendimento } from "@/types/admin/cadastro/motivos_atendimento";
import useDebouncedCallback from "@/hooks/useDebouncedCallback";
import { useFeedback } from "@/context";

type ClienteOption = {
  id: number;
  label: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  cidade?: string;
  uf?: string;
  regiaoId?: number;
  raw: Cliente;
};

type ContatoOption = {
  id: number;
  label: string;
  contato: ClienteContato;
};

type MaquinaOption = {
  id: number;
  label: string;
  maquina: Maquina;
};

const applyPhoneMask = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{2})(\d)/g, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+$/, "$1");
};

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const manualContatoOption: ContatoOption = {
  id: -1,
  label: "Adicionar novo contato",
  contato: {
    id: -1,
    nome: "",
    nome_completo: "",
    cargo: "",
    telefone: "",
    whatsapp: "",
    email: "",
    situacao: "A",
    recebe_aviso_os: false,
  },
};

const emptyNewContact = {
  nome: "",
  cargo: "",
  telefone: "",
  whatsapp: "",
  email: "",
};

const formatClienteSecondaryLine = (option: ClienteOption) => {
  const baseName = option.nomeFantasia?.trim() || option.label;
  const cidade = option.cidade?.trim();
  const uf = option.uf?.trim();

  if (cidade && uf) {
    return `${baseName} - ${cidade}/${uf}`;
  }

  if (cidade || uf) {
    return `${baseName} - ${cidade ?? uf}`;
  }

  return baseName;
};

export default function NovaOrdemServicoMobile() {
  const router = useRouter();
  const { showToast } = useFeedback();

  const [tecnicoId, setTecnicoId] = useState<number | null>(null);

  const [clienteQuery, setClienteQuery] = useState("");
  const [clienteOptions, setClienteOptions] = useState<ClienteOption[]>([]);
  const [clienteDropdownOpen, setClienteDropdownOpen] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<ClienteOption | null>(
    null
  );

  const [contatoOptions, setContatoOptions] = useState<ContatoOption[]>([]);
  const [selectedContato, setSelectedContato] = useState<ContatoOption | null>(
    null
  );
  const [loadingContatos, setLoadingContatos] = useState(false);
  const [showContatoForm, setShowContatoForm] = useState(false);
  const [newContact, setNewContact] = useState(emptyNewContact);
  const [savingContact, setSavingContact] = useState(false);

  const [maquinaOptions, setMaquinaOptions] = useState<MaquinaOption[]>([]);
  const [loadingMaquinas, setLoadingMaquinas] = useState(false);
  const [maquinaSearch, setMaquinaSearch] = useState("");
  const [selectedMaquina, setSelectedMaquina] = useState<MaquinaOption | null>(
    null
  );
  const [maquinaSearchResults, setMaquinaSearchResults] = useState<
    MaquinaOption[]
  >([]);
  const [searchingMaquinas, setSearchingMaquinas] = useState(false);
  const maquinaSearchTermRef = useRef("");
  const clienteSearchCacheRef = useRef<Map<string, ClienteOption[]>>(
    new Map()
  );
  const maquinaSearchCacheRef = useRef<Map<string, MaquinaOption[]>>(
    new Map()
  );

  const [motivosAtendimento, setMotivosAtendimento] = useState<
    MotivoAtendimento[]
  >([]);
  const [selectedMotivo, setSelectedMotivo] =
    useState<MotivoAtendimento | null>(null);

  const [dataAgendada, setDataAgendada] = useState("");
  const [descricaoProblema, setDescricaoProblema] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [errors, setErrors] = useState({
    cliente: undefined as string | undefined,
    contato: undefined as string | undefined,
    maquina: undefined as string | undefined,
    motivo: undefined as string | undefined,
    descricao: undefined as string | undefined,
    tecnico: undefined as string | undefined,
    novoContato: undefined as string | undefined,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("id_usuario");
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed)) {
        setTecnicoId(parsed);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    motivosAtendimentoService
      .getAll({ situacao: "A" })
      .then((lista) => {
        if (!active) return;
        setMotivosAtendimento(
          (lista ?? []).filter(
            (motivo) => motivo.situacao === "A" || motivo.situacao === "Ativo"
          )
        );
      })
      .catch((error) => {
        console.error("Erro ao carregar motivos de atendimento:", error);
        showToast("NÃƒÂ£o foi possÃƒÂ­vel carregar motivos de atendimento.", "error");
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  const debouncedSearchClientes = useDebouncedCallback(
    async (term: string) => {
      const query = term.trim();

      if (query.length < 3) {
        setClienteOptions([]);
        setClienteDropdownOpen(false);
        setLoadingClientes(false);
        return;
      }

      const cacheKey = query.toLowerCase();
      const cached = clienteSearchCacheRef.current.get(cacheKey);
      if (cached) {
        setClienteOptions(cached);
        setClienteDropdownOpen(cached.length > 0);
        setLoadingClientes(false);
        return;
      }

      setLoadingClientes(true);
      try {
        const response = await clientesService.search(query);
        const options =
          response?.dados
            ?.map((cliente) => {
              const id = cliente.id ?? cliente.id_cliente;
              if (!id) return null;
              const razaoSocial = cliente.razao_social?.trim() ?? "";
              const nomeFantasia = cliente.nome_fantasia?.trim() ?? "";
              return {
                id,
                label: nomeFantasia || razaoSocial || "",
                razaoSocial,
                nomeFantasia,
                cidade: cliente.cidade?.trim(),
                uf: cliente.uf?.trim(),
                regiaoId:
                  cliente.id_regiao ??
                  cliente.regiao?.id ??
                  cliente.regiao?.id_regiao,
                raw: cliente,
              } as ClienteOption;
            })
            .filter(Boolean) ?? [];

        const mapped = options as ClienteOption[];
        clienteSearchCacheRef.current.set(cacheKey, mapped);
        setClienteOptions(mapped);
        setClienteDropdownOpen(mapped.length > 0);
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
        setClienteOptions([]);
        setClienteDropdownOpen(false);
        showToast("Erro ao buscar clientes.", "error");
      } finally {
        setLoadingClientes(false);
      }
    },
    400
  );
  const fetchContatos = useCallback(
    async (clienteId: number): Promise<ContatoOption[]> => {
      setLoadingContatos(true);
      try {
        const contatosResponse = await clientesService.getContacts(clienteId);
        const contatos = contatosResponse?.contatos ?? [];
        const options: ContatoOption[] = contatos
          .map((contato) => {
            const id = contato.id ?? contato.id_contato;
            if (!id) return null;
            return {
              id,
              label:
                contato.nome ||
                contato.nome_completo ||
                contato.email ||
                "Contato sem nome",
              contato,
            };
          })
          .filter(
            (option): option is ContatoOption => option !== null && !!option.id
          );

        options.sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
        options.push(manualContatoOption);
        setContatoOptions(options);
        setSelectedContato(null);
        setShowContatoForm(false);
        setNewContact(emptyNewContact);
        return options;
      } catch (error) {
        console.error("Erro ao carregar contatos:", error);
        showToast("Erro ao carregar contatos do cliente.", "error");
        return [];
      } finally {
        setLoadingContatos(false);
      }
    },
    [showToast]
  );

  const fetchMaquinas = useCallback(
    async (clienteId: number) => {
      setLoadingMaquinas(true);
      setMaquinaSearch("");
      setMaquinaSearchResults([]);
      setSearchingMaquinas(false);
      maquinaSearchTermRef.current = "";
      maquinaSearchCacheRef.current.clear();
      try {
        const maquinasResponse = await maquinasService.getByClienteId(
          clienteId,
          50
        );
        const options =
          maquinasResponse?.dados?.map((maquina) => ({
            id: maquina.id,
            label: `${maquina.numero_serie} - ${
              maquina.descricao || maquina.modelo || "Maquina"
            }`,
            maquina,
          })) ?? [];
        options.sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
        setMaquinaOptions(options);
        setSelectedMaquina(null);
      } catch (error) {
        console.error("Erro ao carregar maquinas:", error);
        showToast("Erro ao carregar maquinas do cliente.", "error");
      } finally {
        setLoadingMaquinas(false);
      }
    },
    [showToast]
  );

  const handleClienteChange = useCallback(
    (option: ClienteOption) => {
      setSelectedCliente(option);
      setClienteQuery(option.label);
      setClienteDropdownOpen(false);
      setErrors((prev) => ({ ...prev, cliente: undefined }));
      setSelectedContato(null);
      setContatoOptions([]);
      fetchContatos(option.id);
      fetchMaquinas(option.id);
    },
    [fetchContatos, fetchMaquinas]
  );

  const handleClienteInput = useCallback(
    (value: string) => {
      setClienteQuery(value);
      setSelectedCliente(null);
      setSelectedContato(null);
      setContatoOptions([]);
      setMaquinaOptions([]);
      setMaquinaSearch("");
      setMaquinaSearchResults([]);
      setSearchingMaquinas(false);
      maquinaSearchTermRef.current = "";

      const normalized = value.trim();

      if (normalized.length >= 3) {
        const cached = clienteSearchCacheRef.current.get(
          normalized.toLowerCase()
        );
        if (cached) {
          setClienteOptions(cached);
          setClienteDropdownOpen(cached.length > 0);
          setLoadingClientes(false);
          return;
        }
        debouncedSearchClientes(normalized);
      } else {
        setClienteOptions([]);
        setClienteDropdownOpen(false);
        setLoadingClientes(false);
      }
    },
    [debouncedSearchClientes]
  );

  const handleSelectContato = useCallback(
    (contatoId: number) => {
      const option = contatoOptions.find((item) => item.id === contatoId);
      if (!option) return;
      setSelectedContato(option);
      setErrors((prev) => ({
        ...prev,
        contato: undefined,
        novoContato: undefined,
      }));
      if (option.id === -1) {
        setShowContatoForm(true);
        setNewContact(emptyNewContact);
      } else {
        setShowContatoForm(false);
        setNewContact(emptyNewContact);
      }
    },
    [contatoOptions]
  );

  const debouncedSearchMaquinas = useDebouncedCallback(
    async (term: string) => {
      const normalized = term.trim();

      if (normalized.length < 3) {
        if (maquinaSearchTermRef.current === term) {
          setMaquinaSearchResults([]);
          setSearchingMaquinas(false);
        }
        return;
      }

      const cacheKey = `${selectedCliente?.id ?? "global"}::${normalized.toLowerCase()}`;
      const cached = maquinaSearchCacheRef.current.get(cacheKey);
      if (cached) {
        if (maquinaSearchTermRef.current === term) {
          setMaquinaSearchResults(cached);
          setSearchingMaquinas(false);
        }
        return;
      }

      try {
        const response = await maquinasService.searchByNumeroSerie(normalized);
        const mapped =
          response?.dados?.map((maquina) => ({
            id: maquina.id,
            label: `${maquina.numero_serie} - ${
              maquina.descricao || maquina.modelo || "Maquina"
            }`,
            maquina,
          })) ?? [];

        if (maquinaSearchTermRef.current !== term) {
          return;
        }

        maquinaSearchCacheRef.current.set(cacheKey, mapped);
        setMaquinaSearchResults(mapped);
      } catch (error) {
        console.error('Erro ao buscar maquinas por numero de serie:', error);
        showToast('Erro ao buscar maquinas pelo nÃƒÂºmero de serie.', 'error');
      } finally {
        if (maquinaSearchTermRef.current === term) {
          setSearchingMaquinas(false);
        }
      }
    },
    400
  );

  const handleMaquinaSearchChange = useCallback(
    (value: string) => {
      const term = value.trim();
      setMaquinaSearch(value);
      maquinaSearchTermRef.current = term;

      if (!selectedCliente) {
        setMaquinaSearchResults([]);
        setSearchingMaquinas(false);
        return;
      }

      if (term.length < 3) {
        setMaquinaSearchResults([]);
        setSearchingMaquinas(false);
        return;
      }

      const cacheKey = `${selectedCliente.id ?? "global"}::${term.toLowerCase()}`;
      const cached = maquinaSearchCacheRef.current.get(cacheKey);
      if (cached) {
        setMaquinaSearchResults(cached);
        setSearchingMaquinas(false);
        return;
      }

      setSearchingMaquinas(true);
      debouncedSearchMaquinas(term);
    },
    [debouncedSearchMaquinas, selectedCliente]
  );
  const handleSaveNewContact = useCallback(async () => {
    if (!selectedCliente) {
      showToast("Selecione um cliente antes de salvar o contato.", "warning");
      return;
    }

    const nome = newContact.nome.trim();
    const telefone = newContact.telefone.trim();
    const email = newContact.email.trim();
    const whatsapp = newContact.whatsapp.trim();

    if (!nome) {
      setErrors((prev) => ({
        ...prev,
        novoContato: "Informe o nome completo do contato para salvar.",
      }));
      return;
    }

    if (email && !isValidEmail(email)) {
      setErrors((prev) => ({
        ...prev,
        novoContato: "Informe um e-mail valido para o contato.",
      }));
      return;
    }

    setSavingContact(true);
    setErrors((prev) => ({ ...prev, novoContato: undefined }));

    try {
      const payload: Omit<ClienteContato, "id"> = {
        nome,
        nome_completo: nome,
        cargo: newContact.cargo.trim(),
        telefone,
        whatsapp: whatsapp || telefone,
        email,
        situacao: "A",
        recebe_aviso_os: true,
      };

      const response = await clientesService.createContact(
        selectedCliente.id,
        payload
      );

      const contatoCriado =
        response.contato ??
        (response as unknown as { contato?: ClienteContato })?.contato ??
        null;
      const contatoId =
        contatoCriado?.id ??
        (response as unknown as { id?: number })?.id ??
        null;

      const options = await fetchContatos(selectedCliente.id);
      if (contatoId) {
        const option = options.find((item) => item.id === contatoId);
        if (option) {
          setSelectedContato(option);
          setShowContatoForm(false);
          setNewContact(emptyNewContact);
          showToast("Contato salvo com sucesso.", "success");
          return;
        }
      }

      showToast("Contato salvo. Atualize a lista para selecionÃƒÂ¡-lo.", "info");
    } catch (error) {
      console.error("Erro ao salvar contato:", error);
      showToast("Erro ao salvar contato.", "error");
    } finally {
      setSavingContact(false);
    }
  }, [fetchContatos, newContact, selectedCliente, showToast]);

  const deferredMaquinaSearch = useDeferredValue(maquinaSearch);

  const maquinaFiltradas = useMemo(() => {
    const term = deferredMaquinaSearch.trim().toLowerCase();

    if (term.length >= 3) {
      const combined = new Map<number, MaquinaOption>();
      maquinaSearchResults.forEach((option) => {
        if (option?.id) {
          combined.set(option.id, option);
        }
      });
      const baseFiltered = maquinaOptions.filter((option) =>
        option.label.toLowerCase().includes(term)
      );
      baseFiltered.forEach((option) => {
        if (option?.id && !combined.has(option.id)) {
          combined.set(option.id, option);
        }
      });
      return Array.from(combined.values());
    }

    if (!term) {
      return maquinaOptions;
    }

    return maquinaOptions.filter((option) =>
      option.label.toLowerCase().includes(term)
    );
  }, [deferredMaquinaSearch, maquinaOptions, maquinaSearchResults]);

  const contatoSelecionado = useMemo(() => {
    if (!selectedContato) return null;
    return contatoOptions.find((option) => option.id === selectedContato.id);
  }, [contatoOptions, selectedContato]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const validationErrors: Partial<typeof errors> = {};
      const manualContactSelected = selectedContato?.id === -1;
      const manualNome = newContact.nome.trim();
      const manualEmail = newContact.email.trim();

      if (!selectedCliente) {
        validationErrors.cliente = "Selecione um cliente.";
      }

      if (!selectedMaquina) {
        validationErrors.maquina = "Selecione uma maquina.";
      }

      if (!descricaoProblema.trim()) {
        validationErrors.descricao = "Descreva o problema informado.";
      }

      if (!tecnicoId) {
        validationErrors.tecnico =
          "NÃƒÂ£o foi possÃƒÂ­vel identificar o tÃƒÂ©cnico logado.";
      }

      if (!selectedContato) {
        validationErrors.contato = "Selecione um contato.";
      } else if (manualContactSelected) {
        if (!manualNome) {
          validationErrors.novoContato = "Informe o nome completo do contato.";
        } else if (manualEmail && !isValidEmail(manualEmail)) {
          validationErrors.novoContato =
            "Informe um e-mail valido para o contato.";
        }
      }

      setErrors((prev) => ({ ...prev, ...validationErrors }));

      if (Object.keys(validationErrors).length > 0) {
        showToast("Revise os campos destacados antes de enviar.", "warning");
        return;
      }

      if (!selectedCliente || !selectedMaquina) return;

      const contato = contatoSelecionado?.contato ?? null;
      const manualContato = manualContactSelected ? newContact : null;

      const payload: Record<string, unknown> = {
        id_cliente: selectedCliente.id,
        id_maquina: selectedMaquina.id,
        id_regiao:
          selectedCliente.regiaoId ??
          selectedCliente.raw.id_regiao ??
          selectedCliente.raw.regiao?.id ??
          selectedCliente.raw.regiao?.id_regiao ??
          1,
        descricao_problema: descricaoProblema.trim(),
        origem_abertura: "T",
        forma_abertura: "Tecnico",
        em_garantia: selectedMaquina.maquina.garantia ?? false,
        id_usuario_tecnico: tecnicoId,
        id_tecnico: tecnicoId,
      };

      if (contato && !manualContactSelected) {
        payload.id_contato = contatoSelecionado?.id;
        payload.id_contato_abertura = contatoSelecionado?.id;
        payload.nome_contato_abertura =
          contato.nome || contato.nome_completo || contato.email || "";
        payload.telefone_contato_abertura = contato.telefone || "";
        payload.whatsapp_contato_abertura =
          contato.whatsapp || contato.telefone || "";
        payload.email_contato_abertura = contato.email || "";
      } else if (manualContactSelected && manualContato) {
        const nomeManual = manualContato.nome.trim();
        const telefoneManual = manualContato.telefone.trim();
        const whatsappManual = manualContato.whatsapp.trim();
        const emailManual = manualContato.email.trim();

        payload.nome_contato_abertura = nomeManual;
        if (telefoneManual) {
          payload.telefone_contato_abertura = telefoneManual;
        }
        if (whatsappManual) {
          payload.whatsapp_contato_abertura = whatsappManual;
        }
        if (emailManual) {
          payload.email_contato_abertura = emailManual;
        }
      }

      if (selectedMotivo) {
        payload.id_motivo_atendimento = selectedMotivo.id;
      }

      if (dataAgendada.trim()) {
        payload.data_agendada = dataAgendada.replace("T", " ");
      }

      setSubmitting(true);

      try {
        await ordensServicoService.create(payload as never);
        showToast("Ordem de serviÃƒÂ§o aberta com sucesso.", "success");
        router.replace("/tecnico/dashboard");
      } catch (error) {
        console.error("Erro ao abrir OS:", error);
        showToast(
          "NÃƒÂ£o foi possÃƒÂ­vel abrir a OS. Tente novamente em instantes.",
          "error"
        );
      } finally {
        setSubmitting(false);
      }
    },
    [
      contatoSelecionado,
      dataAgendada,
      descricaoProblema,
      newContact,
      router,
      selectedCliente,
      selectedContato,
      selectedMaquina,
      selectedMotivo,
      showToast,
      tecnicoId,
    ]
  );
  return (
    <>
      <MobileHeader
        title="Nova OS"
        leftVariant="back"
        onAddClick={() => router.back()}
      />
      <main className="min-h-screen bg-slate-50 ">
        <form
          onSubmit={handleSubmit}
          className="px-4 py-6 space-y-6 max-w-3xl mx-auto"
        >
          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
            <header className="flex items-center gap-2 text-slate-700">
              <Users className="w-5 h-5 text-[#7B54BE]" />
              <h2 className="text-base font-semibold">
                InformaÃƒÂ§ÃƒÂµes do cliente
              </h2>
            </header>

            <div className="space-y-2">
              <label
                htmlFor="cliente"
                className="text-sm font-medium text-slate-600"
              >
                Cliente
              </label>
              <div className="relative">
                <div
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 bg-white ${
                    errors.cliente
                      ? "border-red-400 focus-within:border-red-500"
                      : "border-slate-200 focus-within:border-[#7B54BE]"
                  }`}
                >
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    id="cliente"
                    type="text"
                    placeholder="Digite pelo menos 3 caracteres"
                    value={clienteQuery}
                    onChange={(event) => handleClienteInput(event.target.value)}
                    onFocus={() => {
                      if (clienteOptions.length > 0) {
                        setClienteDropdownOpen(true);
                      }
                    }}
                    className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-500"
                    autoComplete="off"
                  />
                  {loadingClientes && (
                    <Loader2 className="w-4 h-4 animate-spin text-[#7B54BE]" />
                  )}
                </div>
                {errors.cliente && (
                  <p className="text-xs text-red-500 mt-1">{errors.cliente}</p>
                )}
                {clienteDropdownOpen && clienteOptions.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full bg-white border border-slate-100 shadow-lg rounded-xl max-h-60 overflow-y-auto">
                    {clienteOptions.map((option) => (
                      <li key={option.id}>
                        <button
                          type="button"
                          onClick={() => handleClienteChange(option)}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-[#F3EAFF] flex items-center justify-between gap-3"
                        >
                          <div>
                            <p className="font-semibold text-slate-800">
                              {option.razaoSocial || option.label}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatClienteSecondaryLine(option)}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {selectedCliente && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600 flex items-center gap-2">
                <span className="font-semibold text-slate-700">
                  Cliente selecionado:
                </span>
                <span>{selectedCliente.label}</span>
                {selectedCliente.cidade && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedCliente.cidade}/{selectedCliente.uf}
                  </span>
                )}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600">Contato</p>
              {loadingContatos && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-[#7B54BE]" />
                  Carregando contatos...
                </div>
              )}
              {!loadingContatos && contatoOptions.length === 0 && (
                <p className="text-sm text-slate-500">
                  Busque e selecione um cliente para listar os contatos.
                </p>
              )}
              <div className="space-y-3">
                {contatoOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelectContato(option.id)}
                    className={`w-full border rounded-xl p-3 text-left transition-all ${
                      selectedContato?.id === option.id
                        ? "border-[#7B54BE] bg-[#F3EAFF]"
                        : "border-slate-200 hover:border-[#7B54BE]/60 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-slate-800 flex items-center gap-2">
                        <User className="w-4 h-4 text-[#7B54BE]" />
                        {option.label}
                      </span>
                      <span className="text-xs text-slate-500">
                        {option.id === -1 ? "Novo contato" : "Selecionar"}
                      </span>
                    </div>
                    {option.id !== -1 && (
                      <div className="mt-2 space-y-1 text-xs text-slate-500">
                        {option.contato.telefone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{option.contato.telefone}</span>
                          </div>
                        )}
                        {option.contato.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">
                              {option.contato.email}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {errors.contato && (
                <p className="text-xs text-red-500 mt-1">{errors.contato}</p>
              )}
            </div>

            {showContatoForm && (
              <div className="bg-slate-50 border border-dashed border-[#7B54BE]/60 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">
                  Salvar novo contato
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Preencha os dados abaixo para cadastrar o contato e usÃƒÂ¡-lo na
                  abertura da OS.
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-slate-600">
                      Nome completo
                    </span>
                    <input
                      type="text"
                      value={newContact.nome}
                      onChange={(event) =>
                        setNewContact((prev) => ({
                          ...prev,
                          nome: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg placeholder-slate-400 text-slate-500 border border-slate-200 px-3 py-2 text-sm focus:border-[#7B54BE] focus:outline-none"
                      placeholder="Nome do contato"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-slate-600 ">
                      Cargo (opcional)
                    </span>
                    <input
                      type="text"
                      value={newContact.cargo}
                      onChange={(event) =>
                        setNewContact((prev) => ({
                          ...prev,
                          cargo: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-500 placeholder-slate-400 text-sm focus:border-[#7B54BE] focus:outline-none"
                      placeholder="Cargo na empresa"
                    />
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="space-y-1">
                      <span className="text-xs font-medium text-slate-600">
                        Telefone (opcional)
                      </span>
                      <input
                        type="tel"
                        value={newContact.telefone}
                        onChange={(event) =>
                          setNewContact((prev) => ({
                            ...prev,
                            telefone: applyPhoneMask(event.target.value),
                          }))
                        }
                        maxLength={15}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 placeholder-slate-400 focus:border-[#7B54BE] focus:outline-none"
                        placeholder="(00) 00000-0000"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-medium text-slate-600">
                        WhatsApp (opcional)
                      </span>
                      <input
                        type="tel"
                        value={newContact.whatsapp}
                        onChange={(event) =>
                          setNewContact((prev) => ({
                            ...prev,
                            whatsapp: applyPhoneMask(event.target.value),
                          }))
                        }
                        maxLength={15}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 placeholder-slate-400 focus:border-[#7B54BE] focus:outline-none"
                        placeholder="(00) 00000-0000"
                      />
                    </label>
                  </div>
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-slate-600">
                      E-mail (opcional)
                    </span>
                    <input
                      type="email"
                      value={newContact.email}
                      onChange={(event) =>
                        setNewContact((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder-slate-400 text-slate-500 focus:border-[#7B54BE] focus:outline-none"
                      placeholder="contato@empresa.com"
                    />
                  </label>
                  {errors.novoContato && (
                    <p className="text-xs text-red-500">{errors.novoContato}</p>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveNewContact}
                    disabled={savingContact}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#7B54BE] text-white text-sm font-semibold px-4 py-2 transition-all hover:bg-[#6A47A8] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {savingContact && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    Salvar contato
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
            <header className="flex items-center gap-2 text-slate-700">
              <Settings className="w-5 h-5 text-[#7B54BE]" />
              <h2 className="text-base font-semibold">
                Detalhes do atendimento
              </h2>
            </header>

            <div className="space-y-2">
              <label
                htmlFor="maquina-search"
                className="text-sm font-medium text-slate-600"
              >
                Maquina
              </label>
              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    id="maquina-search"
                    type="text"
                    placeholder="Filtrar ou buscar por numero de serie"
                    value={maquinaSearch}
                    onChange={(event) =>
                      handleMaquinaSearchChange(event.target.value)
                    }
                    disabled={!selectedCliente}
                    className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-500 disabled:cursor-not-allowed disabled:text-slate-400"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {loadingMaquinas && (
                    <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin text-[#7B54BE]" />
                      Carregando maquinas do cliente...
                    </div>
                  )}
                  {!loadingMaquinas && searchingMaquinas && (
                    <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin text-[#7B54BE]" />
                      Buscando maquina pelo numero de serie...
                    </div>
                  )}
                  {!loadingMaquinas &&
                    !searchingMaquinas &&
                    maquinaFiltradas.length === 0 && (
                      <p className="px-4 py-3 text-sm text-slate-500">
                        {maquinaSearch.trim().length >= 3
                          ? "Nenhuma maquina encontrada para esse numero de serie."
                          : selectedCliente
                          ? "Nenhuma maquina cadastrada para este cliente."
                          : "Selecione um cliente para listar as maquinas."}
                      </p>
                    )}
                  {selectedMaquina ? (
                    <div className="px-4 py-3 text-sm bg-[#F3EAFF] rounded-lg border border-[#7B54BE]/30 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-[#2F2A4A]">
                          {selectedMaquina.label}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMaquina(null);
                            setMaquinaSearch("");
                          }}
                          className="text-xs text-[#7B54BE] hover:underline"
                        >
                          Alterar
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Settings className="w-3 h-3" />
                        {selectedMaquina.maquina.modelo}
                      </p>
                      {selectedMaquina.maquina.garantia && (
                        <p className="text-xs text-emerald-600">Em garantia</p>
                      )}
                    </div>
                  ) : (
                    // Caso nenhuma mÃƒÂ¡quina esteja selecionada, exibe lista
                    maquinaFiltradas.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setSelectedMaquina(option);
                          setMaquinaSearch(""); // limpa o campo de busca
                          setErrors((prev) => ({
                            ...prev,
                            maquina: undefined,
                          }));
                        }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-[#F3EAFF] transition-colors text-slate-700"
                      >
                        <p className="font-semibold">{option.label}</p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Settings className="w-3 h-3" />
                          {option.maquina.modelo}
                        </p>
                        {option.maquina.garantia && (
                          <p className="text-xs text-emerald-600 mt-1">
                            Em garantia
                          </p>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
              {errors.maquina && (
                <p className="text-xs text-red-500 mt-1">{errors.maquina}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="motivo"
                className="text-sm font-medium text-slate-600"
              >
                Motivo do atendimento
              </label>
              <select
                id="motivo"
                value={selectedMotivo?.id ?? ""}
                onChange={(event) => {
                  const motivo = motivosAtendimento.find(
                    (item) => item.id === Number(event.target.value)
                  );
                  setSelectedMotivo(motivo ?? null);
                  setErrors((prev) => ({ ...prev, motivo: undefined }));
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:border-[#7B54BE] focus:outline-none text-slate-500"
              >
                <option value="">Selecione um motivo (opcional)</option>
                {motivosAtendimento.map((motivo) => (
                  <option key={motivo.id} value={motivo.id}>
                    {motivo.descricao}
                  </option>
                ))}
              </select>
              {errors.motivo && (
                <p className="text-xs text-red-500 mt-1">{errors.motivo}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="data-agendada"
                className="text-sm font-medium text-slate-600"
              >
                Data agendada (opcional)
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 bg-white">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  id="data-agendada"
                  type="datetime-local"
                  value={dataAgendada}
                  onChange={(event) => setDataAgendada(event.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-slate-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="descricao"
                className="text-sm font-medium text-slate-600"
              >
                DescriÃƒÂ§ÃƒÂ£o do problema
              </label>
              <textarea
                id="descricao"
                value={descricaoProblema}
                onChange={(event) => {
                  setDescricaoProblema(event.target.value);
                  if (event.target.value.trim()) {
                    setErrors((prev) => ({ ...prev, descricao: undefined }));
                  }
                }}
                placeholder="Detalhe o problema informado pelo cliente"
                rows={5}
                className={`w-full rounded-xl border px-3 py-2 text-sm text-slate-500 placeholder-slate-400 focus:outline-none focus:border-[#7B54BE] ${
                  errors.descricao
                    ? "border-red-400"
                    : "border-slate-200 bg-white"
                }`}
              />

              {errors.descricao && (
                <p className="text-xs text-red-500 mt-1">{errors.descricao}</p>
              )}
            </div>
          </section>

          {errors.tecnico && (
            <p className="text-xs text-red-500 px-1">{errors.tecnico}</p>
          )}

          <div className="sticky bottom-0 left-0 right-0 bg-slate-50/95 backdrop-blur-sm py-4 border-t border-slate-200">
            <div className="max-w-3xl mx-auto px-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#7B54BE] text-white text-base font-semibold px-4 py-3 shadow-lg shadow-[#7B54BE]/25 transition-all hover:bg-[#6A47A8] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                Salvar OS
              </button>
            </div>
          </div>
        </form>
      </main>
    </>
  );
}

