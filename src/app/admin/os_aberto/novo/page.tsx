"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import { LoadingSpinner as Loading } from "@/components/LoadingPersonalizado";
import PageHeader from "@/components/admin/ui/PageHeader";
import { clientesService } from "@/api/services/clientesService";
import { maquinasService } from "@/api/services/maquinasService";
import { motivosPendenciaService } from "@/api/services/motivosPendenciaService";
import { regioesService } from "@/api/services/regioesService";
import { ordensServicoService } from "@/api/services/ordensServicoService";
import { Cliente, ClienteContato } from "@/types/admin/cadastro/clientes";
import { MotivoPendencia } from "@/types/admin/cadastro/motivos_pendencia";
import { Regiao } from "@/types/admin/cadastro/regioes";
import { Maquina } from "@/types/admin/cadastro/maquinas";

interface ClienteOption {
  value: number;
  label: string;
}

interface MaquinaOption {
  value: number;
  label: string;
}

interface MotivoPendenciaOption {
  value: number;
  label: string;
}

interface RegiaoOption {
  value: number;
  label: string;
}

interface ContatoOption {
  value: number;
  label: string;
  contato: ClienteContato;
  isCustom?: boolean;
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
  const [regioesOptions, setRegioesOptions] = useState<RegiaoOption[]>([]);
  const [selectedRegiao, setSelectedRegiao] = useState<RegiaoOption | null>(
    null
  );
  const [motivosPendenciaOptions, setMotivosPendenciaOptions] = useState<
    MotivoPendenciaOption[]
  >([]);
  const [selectedMotivoPendencia, setSelectedMotivoPendencia] =
    useState<MotivoPendenciaOption | null>(null);
  const [comentarios, setComentarios] = useState("");
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

  // Carregar dados iniciais (motivos de pendência e regiões)
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

        // Carregar regiões
        const regioesData = await regioesService.getAll({ situacao: "A" });
        const regioesOpts = regioesData.map((regiao: Regiao) => ({
          value: regiao.id,
          label: regiao.nome,
        }));
        setRegioesOptions(regioesOpts);
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
      // Usando o parâmetro nome ao invés de busca
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

  // Carregar máquinas e contatos do cliente selecionado
  const handleClienteChange = async (selectedOption: ClienteOption | null) => {
    setSelectedCliente(selectedOption);
    setSelectedMaquina(null);
    setSelectedContato(null);

    if (selectedOption) {
      // Carregar máquinas do cliente
      setLoadingMaquinas(true);
      try {
        // Assumindo que existe um endpoint para buscar máquinas por cliente
        const maquinasResponse = await maquinasService.getAll(1, 100);
        // Filtramos as máquinas do cliente selecionado
        const maquinasDoCliente = maquinasResponse.dados.filter(
          (maquina: Maquina) =>
            maquina.cliente_atual.id_cliente === selectedOption.value
        );

        const options = maquinasDoCliente.map((maquina: Maquina) => ({
          value: maquina.id || 0,
          label: `${maquina.numero_serie} - ${maquina.modelo || ""}`,
        }));

        setMaquinaOptions(options);
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

    if (!selectedCliente || !selectedMaquina || !selectedRegiao) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setIsSaving(true);

    try {
      const osData: {
        id_cliente: number;
        id_maquina: number;
        id_motivo_atendimento: number; // This field is required by the API
        id_motivo_pendencia?: number;
        comentarios: string;
        id_regiao: number;
        id_contato?: number;
        contato_nome?: string;
        contato_email?: string;
        contato_telefone?: string;
        contato_whatsapp?: string;
      } = {
        id_cliente: selectedCliente.value,
        id_maquina: selectedMaquina.value,
        id_motivo_atendimento: 1, // Providing a default value since this field is required
        comentarios: comentarios,
        id_regiao: selectedRegiao.value,
      };

      // Adicionar informações de contato
      if (selectedContato) {
        if (selectedContato.isCustom) {
          // Usando contato personalizado
          if (customContatoNome.trim()) {
            osData.contato_nome = customContatoNome.trim();

            // Adicionar os novos campos personalizados
            if (customContatoEmail.trim()) {
              osData.contato_email = customContatoEmail.trim();
            }

            if (customContatoTelefone.trim()) {
              osData.contato_telefone = customContatoTelefone.trim();
            }

            if (customContatoWhatsapp.trim()) {
              osData.contato_whatsapp = customContatoWhatsapp.trim();
            }
          }
        } else {
          // Usando contato da lista
          osData.id_contato = selectedContato.value;
        }
      }

      // Adicionar motivo de pendência, se selecionado
      if (selectedMotivoPendencia) {
        osData.id_motivo_pendencia = selectedMotivoPendencia.value;
      }

      await ordensServicoService.create(osData);
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

  // Estilos customizados para o React Select
  const customSelectStyles = {
    control: (
      provided: Record<string, unknown>,
      state: { isFocused: boolean }
    ) => ({
      ...provided,
      borderColor: state.isFocused ? "var(--primary)" : "#e2e8f0",
      boxShadow: state.isFocused ? "0 0 0 1px var(--primary)" : "none",
      "&:hover": {
        borderColor: state.isFocused ? "var(--primary)" : "#cbd5e0",
      },
      borderRadius: "0.375rem",
      padding: "2px",
    }),
    option: (
      provided: Record<string, unknown>,
      state: { isSelected: boolean; isFocused: boolean }
    ) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "var(--primary)"
        : state.isFocused
        ? "rgba(124, 84, 189, 0.1)"
        : "transparent",
      color: state.isSelected ? "white" : "var(--neutral-graphite)",
      cursor: "pointer",
    }),
    menu: (provided: Record<string, unknown>) => ({
      ...provided,
      borderRadius: "0.375rem",
      boxShadow:
        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      zIndex: 9999,
    }),
  };

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
          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente <span className="text-red-500">*</span>
            </label>
            <Select
              placeholder="Digite pelo menos 3 caracteres para buscar..."
              inputValue={clienteInput}
              onInputChange={handleClienteInputChange}
              onChange={handleClienteChange}
              options={clienteOptions}
              value={selectedCliente}
              isLoading={isSearchingClientes}
              isSearchable={true}
              isClearable={true}
              noOptionsMessage={({ inputValue }) =>
                inputValue.length < 3
                  ? "Digite pelo menos 3 caracteres para buscar..."
                  : "Nenhum cliente encontrado"
              }
              styles={customSelectStyles}
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>

          {/* Contato */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contato
            </label>
            <Select
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
                setSelectedContato(option);
                setUseCustomContato(option?.isCustom || false);
              }}
              isDisabled={!selectedCliente || loadingContatos}
              isLoading={loadingContatos}
              styles={customSelectStyles}
              className="react-select-container"
              classNamePrefix="react-select"
              noOptionsMessage={() =>
                "Nenhum contato encontrado para este cliente"
              }
            />
          </div>

          {/* Campos para contato personalizado */}
          {useCustomContato && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Contato
                </label>
                <input
                  type="text"
                  value={customContatoNome}
                  onChange={(e) => setCustomContatoNome(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                  placeholder="Nome do contato"
                />
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

          {/* Máquina */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Máquina <span className="text-red-500">*</span>
            </label>
            <Select
              placeholder={
                selectedCliente
                  ? loadingMaquinas
                    ? "Carregando máquinas..."
                    : "Selecione uma máquina"
                  : "Selecione um cliente primeiro"
              }
              options={maquinaOptions}
              value={selectedMaquina}
              onChange={setSelectedMaquina}
              isDisabled={!selectedCliente || loadingMaquinas}
              isLoading={loadingMaquinas}
              styles={customSelectStyles}
              className="react-select-container"
              classNamePrefix="react-select"
              noOptionsMessage={() =>
                "Nenhuma máquina encontrada para este cliente"
              }
            />
          </div>

          {/* Motivo de Pendência */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo de Pendência
            </label>
            <Select
              placeholder="Selecione o motivo de pendência"
              options={motivosPendenciaOptions}
              value={selectedMotivoPendencia}
              onChange={setSelectedMotivoPendencia}
              styles={customSelectStyles}
              className="react-select-container"
              classNamePrefix="react-select"
              noOptionsMessage={() => "Nenhum motivo de pendência cadastrado"}
            />
          </div>

          {/* Região */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Região <span className="text-red-500">*</span>
            </label>
            <Select
              placeholder="Selecione a região"
              options={regioesOptions}
              value={selectedRegiao}
              onChange={setSelectedRegiao}
              styles={customSelectStyles}
              className="react-select-container"
              classNamePrefix="react-select"
              noOptionsMessage={() => "Nenhuma região cadastrada"}
            />
          </div>

          {/* Comentários */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comentários
            </label>
            <textarea
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              placeholder="Descreva o problema ou adicione informações relevantes para o atendimento"
            />
          </div>

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
