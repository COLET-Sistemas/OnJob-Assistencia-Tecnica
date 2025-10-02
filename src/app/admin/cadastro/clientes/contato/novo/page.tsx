"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
// Serviços
import { clientesService } from "@/api/services/clientesService";

// Componentes
import FormActions from "@/app/admin/os_aberto/novo/components/FormActions";
import FormContainer from "@/app/admin/os_aberto/novo/components/FormContainer";
import FormField from "./components/FormField";
import { Loading } from "@/components/LoadingPersonalizado";
import PageHeader from "@/components/admin/ui/PageHeader";
import CustomSelect, { OptionType } from "@/components/admin/form/CustomSelect";
import { useToast } from "@/components/admin/ui/ToastContainer";

// Tipos e utilitários
import useDebouncedCallback from "@/hooks/useDebouncedCallback";

// Interfaces
interface Cliente {
  id_cliente?: number;
  id?: number;
  razao_social: string;
  codigo_erp?: string;
  cidade?: string;
  uf?: string;
}

interface ClienteOption extends OptionType {
  value: number;
  cidade?: string;
  uf?: string;
}

// Funções de validação
const isValidEmail = (email: string) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return email.trim() === "" || re.test(String(email).toLowerCase());
};

const isValidPhone = (phone: string) => {
  // Verifica se o telefone tem o formato correto após a máscara: (00) 00000-0000
  return phone.trim() === "" || /^\(\d{2}\) \d{5}-\d{4}$/.test(phone);
};

const NovoContato = () => {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [clienteInput, setClienteInput] = useState("");
  const [clienteOptions, setClienteOptions] = useState<ClienteOption[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<ClienteOption | null>(
    null
  );
  const [isSearchingClientes, setIsSearchingClientes] = useState(false);

  // Campos do formulário
  const [nome, setNome] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [cargo, setCargo] = useState("");
  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [recebeAvisoOS, setRecebeAvisoOS] = useState(false);

  // Estado para controlar validação de campos
  const [errors, setErrors] = useState<{
    cliente?: boolean;
    nome?: boolean;
    email?: boolean;
    telefone?: boolean;
  }>({});

  // Efeito para inicializar página
  useEffect(() => {
    // Configura isLoading inicialmente como falso
    setIsLoading(false);

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

  // Handler para o select de cliente
  const handleClienteChange = useCallback(
    (selectedOption: OptionType | null) => {
      setSelectedCliente(selectedOption as ClienteOption | null);
    },
    []
  );

  // Função assíncrona para buscar clientes
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Objeto para armazenar os erros de validação
    const validationErrors: {
      cliente?: boolean;
      nome?: boolean;
      email?: boolean;
      telefone?: boolean;
    } = {};

    // Validar cliente (obrigatório)
    if (!selectedCliente) {
      validationErrors.cliente = true;
    }

    // Validar nome (obrigatório)
    if (!nome.trim()) {
      validationErrors.nome = true;
    }

    // Validar formato de email (opcional)
    if (email.trim() && !isValidEmail(email)) {
      validationErrors.email = true;
    }

    // Validar formato de telefone (opcional)
    if (telefone.trim() && !isValidPhone(telefone)) {
      validationErrors.telefone = true;
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
      if (!selectedCliente) {
        console.error("Cliente não selecionado");
        return;
      }

      // Usando a resposta para validar o sucesso da criação do contato
      const response = await clientesService.createContact(
        selectedCliente.value,
        {
          nome: nome,
          nome_completo: nomeCompleto,
          cargo: cargo,
          telefone: telefone,
          whatsapp: whatsapp,
          email: email,
          recebe_aviso_os: recebeAvisoOS,
          situacao: "A",
        }
      );

      // Exibe toast de sucesso com a mensagem retornada pela API
      showSuccess("Sucesso", response.mensagem);

      // Redireciona para a lista de clientes após cadastro
      setTimeout(() => {
        router.push("/admin/cadastro/clientes");
      }, 1000);
    } catch (error) {
      console.error("Erro ao cadastrar contato:", error);
      showError("Erro ao cadastrar contato", error as Record<string, unknown>);
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
        title="Novo Contato de Cliente"
        config={{
          type: "form",
          backLink: "/admin/cadastro/clientes",
          backLabel: "Voltar para Clientes",
        }}
      />

      <FormContainer onSubmit={handleSubmit}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <FormField
            id="cliente"
            label="Cliente"
            error={errors.cliente ? "Selecione um cliente" : undefined}
            className={errors.cliente ? "campo-erro" : ""}
          >
            <CustomSelect
              id="cliente"
              label=""
              placeholder="Selecione ou pesquise um cliente..."
              options={clienteOptions}
              value={selectedCliente}
              onChange={handleClienteChange}
              inputValue={clienteInput}
              onInputChange={handleClienteInputChange}
              isLoading={isSearchingClientes}
              noOptionsMessageFn={() =>
                clienteInput.length < 3
                  ? "Digite pelo menos 3 caracteres para pesquisar..."
                  : "Nenhum cliente encontrado"
              }
              isClearable
            />
          </FormField>

          <FormField
            id="nome"
            label="Nome"
            error={errors.nome ? "O nome é obrigatório" : undefined}
            className={errors.nome ? "campo-erro" : ""}
          >
            <input
              type="text"
              id="nome"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do contato"
            />
          </FormField>
        </motion.div>

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
          <FormField id="nomeCompleto" label="Nome Completo">
            <input
              type="text"
              id="nomeCompleto"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              placeholder="Nome completo do contato"
            />
          </FormField>

          <FormField id="cargo" label="Cargo">
            <input
              type="text"
              id="cargo"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Cargo do contato"
            />
          </FormField>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: 0.1,
            type: "spring",
            stiffness: 100,
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <FormField
            id="telefone"
            label="Telefone"
            error={
              errors.telefone
                ? "Formato inválido. Use (00) 00000-0000"
                : undefined
            }
            className={errors.telefone ? "campo-erro" : ""}
          >
            <input
              type="tel"
              id="telefone"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
              value={telefone}
              onChange={(e) => {
                const value = e.target.value;
                // Aplicando a máscara (00) 00000-0000
                const masked = value
                  .replace(/\D/g, "")
                  .replace(/^(\d{2})(\d)/g, "($1) $2")
                  .replace(/(\d{5})(\d)/, "$1-$2")
                  .replace(/(-\d{4})\d+$/, "$1");
                setTelefone(masked);
              }}
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
          </FormField>

          <FormField id="whatsapp" label="WhatsApp">
            <input
              type="tel"
              id="whatsapp"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
              value={whatsapp}
              onChange={(e) => {
                const value = e.target.value;
                // Aplicando a máscara (00) 00000-0000
                const masked = value
                  .replace(/\D/g, "")
                  .replace(/^(\d{2})(\d)/g, "($1) $2")
                  .replace(/(\d{5})(\d)/, "$1-$2")
                  .replace(/(-\d{4})\d+$/, "$1");
                setWhatsapp(masked);
              }}
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
          </FormField>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: 0.15,
            type: "spring",
            stiffness: 100,
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <FormField
            id="email"
            label="Email"
            error={errors.email ? "Formato de email inválido" : undefined}
            className={errors.email ? "campo-erro" : ""}
          >
            <input
              type="email"
              id="email"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,4}$"
            />
          </FormField>

          <FormField id="recebeAvisoOS" label="Recebe Avisos de OS">
            <div className="flex items-center h-full pt-2">
              <input
                type="checkbox"
                id="recebeAvisoOS"
                className="w-5 h-5 rounded border border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={recebeAvisoOS}
                onChange={(e) => setRecebeAvisoOS(e.target.checked)}
              />
              <label
                htmlFor="recebeAvisoOS"
                className="ml-2 text-sm text-gray-700"
              >
                Enviar notificações sobre Ordens de Serviço
              </label>
            </div>
          </FormField>
        </motion.div>

        <FormActions isSaving={isSaving} />
      </FormContainer>
    </>
  );
};

export default NovoContato;
