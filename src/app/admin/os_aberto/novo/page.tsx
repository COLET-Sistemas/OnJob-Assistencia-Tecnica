"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CreatableSelect from "react-select/creatable";
import { LoadingSpinner as Loading } from "@/components/LoadingPersonalizado";
import PageHeader from "@/components/admin/ui/PageHeader";
import {
  CustomSelect,
  TextAreaField,
  DateTimeField,
  MachineOption,
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
  const [dataAgendada, setDataAgendada] = useState("2025-06-14T09:00:00");
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
        // Carregar motivos de pendência
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

        // Carregar técnicos
        setLoadingTecnicos(true);
        const tecnicosResponse = await usuariosService.getAll({
          apenas_tecnicos: "s",
          situacao: "A",
        });
        const tecnicosOpts = tecnicosResponse.dados.map((tecnico: Usuario) => ({
          value: tecnico.id,
          label: tecnico.nome,
        }));
        setTecnicosOptions(tecnicosOpts);
        setLoadingTecnicos(false);

      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Buscar clientes quando o input tiver pelo menos 3 caracteres
  const handleClienteInputChange = (inputValue: string) => {
    setClienteInput(inputValue);

    if (inputValue.length >= 3 && !isSearchingClientes) {
      setIsSearchingClientes(true);
      searchClientes(inputValue);
    }
  };

  const searchClientes = async (term: string) => {
    try {
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

  // Buscar máquinas pelo número de série
  const handleMaquinaInputChange = (inputValue: string) => {
    setMaquinaInput(inputValue);

    if (inputValue.length >= 3 && !isSearchingMaquinas) {
      setIsSearchingMaquinas(true);
      searchMaquinas(inputValue);
    }
  };

  const searchMaquinas = async (term: string) => {
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

      // Explicitly cast the array to MaquinaOption[]
      setMaquinaOptions(machineOptions as MaquinaOption[]);
    } catch (error) {
      console.error("Erro ao buscar máquinas:", error);
    } finally {
      setIsSearchingMaquinas(false);
    }
  };

  // Carregar máquinas e contatos do cliente selecionado
  const handleClienteChange = async (selectedOption: ClienteOption | null) => {
    setSelectedCliente(selectedOption);
    setSelectedMaquina(null);
    setSelectedContato(null);
    setMaquinaInput("");

    if (selectedOption) {
      // Carregar máquinas do cliente
      setLoadingMaquinas(true);
      try {
        // Buscar máquinas usando o id do cliente
        const maquinasResponse = await maquinasService.getByClienteId(
          selectedOption.value,
          15
        );

        const machineOptions = maquinasResponse.dados.map(
          (maquina: Maquina) => {
            // Verificar se está na garantia (data_final_garantia maior que hoje)
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

        // Adiciona uma opção para buscar outras máquinas
        machineOptions.push({
          value: -1,
          label: "Buscar outra máquina...",
          isInWarranty: false,
          data_final_garantia: "",
        } as MaquinaOption);

        // Explicitly cast the array to MaquinaOption[]
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

    if (!selectedCliente || !selectedMaquina || !descricaoProblema.trim()) {
      alert(
        "Por favor, preencha todos os campos obrigatórios: Cliente, Máquina e Descrição do Problema."
      );
      return;
    }

    if (!formaAbertura || !formaAbertura.value) {
      alert("Por favor, selecione uma forma de abertura válida.");
      return;
    }

    // Validar se o contato foi selecionado
    if (!selectedContato) {
      alert("Por favor, selecione um contato.");
      return;
    }

    // Validar se, para contato personalizado, pelo menos o nome foi informado
    if (selectedContato.isCustom && !customContatoNome.trim()) {
      alert("Por favor, informe pelo menos o nome do contato.");
      return;
    }

    setIsSaving(true);

    try {
      // Formatar data_agendada para o formato correto: YYYY-MM-DD HH:MM:SS
      const formattedDate = dataAgendada.replace("T", " ");

      // Define complete type with all possible fields
      const osData: {
        id_cliente: number;
        id_maquina: number;
        id_motivo_pendencia?: number;
        descricao_problema: string;
        origem_abertura: string;
        forma_abertura: string;
        em_garantia: boolean;
        data_agendada: string;
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
        data_agendada: formattedDate,
        id_regiao: 1,
      };

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
      await ordensServicoService.create({
        ...osData,
      } as OSFormCustom);
      router.push("/admin/os_aberto");
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

  // Removendo estilos customizados e formatter, já que estamos usando o componente CustomSelect

  return (
    <div className="p-6">
      <PageHeader
        title="Nova Ordem de Serviço"
        config={{
          type: "form",
          backLink: "/admin/os_aberto",
          backLabel: "Voltar para Ordens de Serviço",
        }}
      />

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Primeira linha: Cliente e Contato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cliente */}
            <CustomSelect
              id="cliente"
              label="Cliente"
              required
              placeholder="Digite pelo menos 3 caracteres para buscar..."
              inputValue={clienteInput}
              onInputChange={handleClienteInputChange}
              onChange={handleClienteSelectChange}
              options={clienteOptions}
              value={selectedCliente}
              isLoading={isSearchingClientes}
              minCharsToSearch={3}
              noOptionsMessageFn={({ inputValue }) =>
                inputValue.length < 3
                  ? "Digite pelo menos 3 caracteres para buscar..."
                  : "Nenhum cliente encontrado"
              }
            />

            {/* Contato */}
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
              onChange={handleContatoSelectChange}
              inputValue=""
              onInputChange={() => {}}
              isLoading={loadingContatos}
              noOptionsMessageFn={() =>
                "Nenhum contato encontrado para este cliente"
              }
              error={
                selectedCliente && !selectedContato
                  ? "Contato é obrigatório"
                  : undefined
              }
            />
          </div>

          {/* Campos para contato personalizado */}
          {useCustomContato && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Contato <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customContatoNome}
                  onChange={(e) => setCustomContatoNome(e.target.value)}
                  className={`w-full px-3 py-2 border text-gray-900 rounded-md shadow-sm 
                    focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] 
                    ${
                      !customContatoNome.trim()
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  placeholder="Nome do contato"
                  required
                />
                {!customContatoNome.trim() && (
                  <p className="text-red-500 text-sm mt-1">
                    Nome do contato é obrigatório
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={customContatoEmail}
                  onChange={(e) => setCustomContatoEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                  placeholder="Email do contato"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  value={customContatoTelefone}
                  onChange={(e) => setCustomContatoTelefone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                  placeholder="Telefone do contato"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp
                </label>
                <input
                  type="text"
                  value={customContatoWhatsapp}
                  onChange={(e) => setCustomContatoWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                  placeholder="WhatsApp do contato (opcional)"
                />
              </div>
            </div>
          )}

          {/* Segunda linha: Máquina e Técnico */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Máquina */}
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
              onChange={handleMaquinaSelectChange}
              isLoading={loadingMaquinas || isSearchingMaquinas}
              minCharsToSearch={3}
              noOptionsMessageFn={({ inputValue }) =>
                inputValue.length < 3
                  ? "Digite pelo menos 3 caracteres para buscar uma máquina..."
                  : "Nenhuma máquina encontrada"
              }
              components={{ Option: MachineOption }}
            />

            {/* Técnico */}
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
          </div>

          {/* Terceira linha: Motivo de Pendência, Forma de Abertura e Data Agendada */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Motivo de Pendência */}
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

            {/* Forma de Abertura */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Forma de Abertura
              </label>
              <CreatableSelect
                placeholder="Selecione ou digite uma forma de abertura"
                options={formaAberturaOptions}
                value={formaAbertura}
                onChange={(newValue) => {
                  if (newValue) {
                    setFormaAbertura(newValue as FormaAberturaOption);
                  } else {
                    setFormaAbertura({ value: "telefone", label: "Telefone" });
                  }
                }}
                styles={{
                  // Using inline styles instead of getCustomSelectStyles() to match FormaAberturaOption type
                  control: (provided, state) => ({
                    ...provided,
                    minHeight: "48px",
                    height: "48px",
                    borderColor: state.isFocused ? "var(--primary)" : "#e2e8f0",
                    boxShadow: state.isFocused
                      ? "0 0 0 1px var(--primary)"
                      : "none",
                    "&:hover": {
                      borderColor: state.isFocused
                        ? "var(--primary)"
                        : "#cbd5e0",
                    },
                    borderRadius: "0.5rem",
                  }),
                }}
                formatCreateLabel={(inputValue) => `Usar "${inputValue}"`}
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>

            {/* Data Agendada */}
            <DateTimeField
              id="data-agendada"
              label="Data Agendada"
              value={dataAgendada}
              onChange={(e) => setDataAgendada(e.target.value)}
              required
            />
          </div>

          {/* Descrição do Problema */}
          <TextAreaField
            id="descricao-problema"
            label="Descrição do Problema"
            value={descricaoProblema}
            onChange={(e) => setDescricaoProblema(e.target.value)}
            placeholder="Descreva detalhadamente o problema relatado pelo cliente"
            required
            rows={4}
          />

          {/* Botões */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push("/admin/os_aberto")}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] disabled:opacity-50"
            >
              {isSaving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NovaOrdemServico;
