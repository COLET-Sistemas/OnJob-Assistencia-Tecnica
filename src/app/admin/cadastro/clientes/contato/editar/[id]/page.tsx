"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";

// Serviços
import { clientesService } from "@/api/services/clientesService";
import api from "@/api/api";
import { ClienteContato } from "@/types/admin/cadastro/clientes";

// Componentes
import FormActions from "./components/FormActions";
import FormContainer from "@/app/admin/os_aberto/novo/components/FormContainer";
import FormField from "../../novo/components/FormField";
import { Loading } from "@/components/LoadingPersonalizado";
import PageHeader from "@/components/admin/ui/PageHeader";
import { OptionType } from "@/components/admin/form/CustomSelect";
import { useToast } from "@/components/admin/ui/ToastContainer";

interface ClienteOption extends OptionType {
  value: number;
  cidade?: string;
  uf?: string;
}

// Funções de validação
const isValidEmail = (email: string) => {
  // Primeiro verifica se o email está vazio, o que é permitido
  if (email.trim() === "") return true;

  // Validação mais robusta de email
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  // Verifica o formato
  if (!re.test(String(email).toLowerCase())) return false;

  // Verifica tamanho máximo (RFC 5321 limita a 254 caracteres)
  if (email.length > 254) return false;

  // Verifica se o domínio tem pelo menos um ponto
  const parts = email.split("@");
  if (parts.length !== 2) return false;
  if (!parts[1].includes(".")) return false;

  return true;
};

const isValidPhone = (phone: string) => {
  // Verifica se o telefone tem o formato correto após a máscara: (00) 00000-0000
  return phone.trim() === "" || /^\(\d{2}\) \d{5}-\d{4}$/.test(phone);
};

const EditarContato = () => {
  const params = useParams();
  const contatoId = params.id as string;

  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<ClienteOption | null>(
    null
  );

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
    nomeCompleto?: boolean;
    email?: boolean;
    telefone?: boolean;
  }>({});

  // Efeito para carregar os dados do contato
  useEffect(() => {
    const fetchContatoData = async () => {
      setIsLoading(true);
      try {
        const response = await api.get<Record<string, unknown>>(
          "/clientes_contatos",
          {
            params: { id: Number(contatoId) },
          }
        );

        let contato: ClienteContato | null = null;
        let contatoClienteId: number | null = null;

        // Analisamos a estrutura da resposta para extrair os dados do contato
        if (response) {
          // Caso 1: Temos um objeto dados direto
          if (response.dados) {
            contato = response.dados as unknown as ClienteContato;
            contatoClienteId = (response.dados as Record<string, unknown>)[
              "id_cliente"
            ] as number;
          }
          // Caso 2: Temos um array de contatos
          else if (response.contatos && Array.isArray(response.contatos)) {
            const foundContact = response.contatos.find(
              (c: Record<string, unknown>) =>
                ((c.id_contato || c.id) as number) === Number(contatoId)
            );

            if (foundContact) {
              contato = foundContact as unknown as ClienteContato;
              contatoClienteId = response.id_cliente as number;
            }
          }
          // Caso 3: A própria resposta é o contato
          else if ((response.id || response.id_contato) && response.nome) {
            contato = response as unknown as ClienteContato;
            contatoClienteId = (response as Record<string, unknown>)[
              "id_cliente"
            ] as number;
          }
        }

        if (!contato) {
          showError("Erro", "Contato não encontrado");
          router.push("/admin/cadastro/clientes");
          return;
        }

        // Preencher os campos com os dados do contato
        setNome(contato.nome || "");
        setNomeCompleto(contato.nome_completo || "");
        setCargo(contato.cargo || "");
        setTelefone(contato.telefone || "");
        setWhatsapp(contato.whatsapp || "");
        setEmail(contato.email || "");
        setRecebeAvisoOS(contato.recebe_aviso_os || false);

        // Se temos o ID do cliente, buscamos informações adicionais
        if (contatoClienteId) {
          try {
            const clienteResponse = await clientesService.getById(
              contatoClienteId
            );
            if (
              clienteResponse &&
              clienteResponse.dados &&
              clienteResponse.dados.length > 0
            ) {
              const cliente = clienteResponse.dados[0];
              setSelectedCliente({
                value: cliente.id_cliente || Number(cliente.id) || 0,
                label: cliente.razao_social,
                cidade: cliente.cidade,
                uf: cliente.uf,
              });
            } else {
              // Se não conseguirmos obter os dados do cliente, usamos apenas o ID
              setSelectedCliente({
                value: contatoClienteId,
                label: `Cliente ID: ${contatoClienteId}`,
              });
            }
          } catch (clienteError) {
            console.error("Erro ao carregar dados do cliente:", clienteError);
            // Mesmo que não consiga carregar o cliente, continuamos com o ID
            setSelectedCliente({
              value: contatoClienteId,
              label: `Cliente ID: ${contatoClienteId}`,
            });
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados do contato:", error);
        showError("Erro ao carregar dados", error as Record<string, unknown>);
      } finally {
        setIsLoading(false);
      }
    };

    if (contatoId) {
      fetchContatoData();
    }
  }, [contatoId, router, showError]);

  // Cliente não pode ser alterado na edição do contato
  // As funções de busca e seleção de cliente foram removidas

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Objeto para armazenar os erros de validação
    const validationErrors: {
      cliente?: boolean;
      nome?: boolean;
      nomeCompleto?: boolean;
      email?: boolean;
      telefone?: boolean;
    } = {};

    // O cliente não pode ser alterado na edição, então não é necessário validar
    // Ele já deve estar preenchido desde o carregamento do contato

    // Validar nome (obrigatório e máximo 20 caracteres)
    if (!nome.trim()) {
      validationErrors.nome = true;
    } else if (nome.trim().length > 20) {
      validationErrors.nome = true;
    }

    // Validar nome completo (obrigatório)
    if (!nomeCompleto.trim()) {
      validationErrors.nomeCompleto = true;
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

      // Crie um objeto para a API com os dados do contato
      // Precisamos usar as propriedades esperadas pela API
      const contatoData = {
        nome: nome,
        nome_completo: nomeCompleto,
        cargo: cargo,
        telefone: telefone,
        whatsapp: whatsapp,
        email: email,
        recebe_aviso_os: recebeAvisoOS,
        situacao: "A",
      };

 
      const apiData = {
        ...contatoData,
        id_cliente: selectedCliente.value,
        id: Number(contatoId), 
      } as unknown as Partial<ClienteContato> & {
        id_cliente: number;
        id: number;
      };

      const response = await clientesService.updateContact(
        Number(contatoId),
        apiData
      );

      // Exibe toast de sucesso com a mensagem retornada pela API
      showSuccess(
        "Sucesso",
        response.mensagem || "Contato atualizado com sucesso"
      );

      // Redireciona para a lista de clientes após atualização
      setTimeout(() => {
        router.push("/admin/cadastro/clientes");
      }, 1000);
    } catch (error) {
      console.error("Erro ao atualizar contato:", error);
      showError("Erro ao atualizar contato", error as Record<string, unknown>);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Loading fullScreen text="Carregando dados do contato..." />;
  }

  return (
    <>
      <PageHeader
        title="Editar Contato de Cliente"
        config={{
          type: "form",
          backLink: "/admin/cadastro/clientes",
          backLabel: "Voltar para Clientes",
        }}
      />

      <FormContainer onSubmit={handleSubmit}>
        {/* Cliente (ocupando toda a linha) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
          className="grid grid-cols-1 gap-6"
        >
          <FormField
            id="cliente"
            label="Cliente"
            error={errors.cliente ? "Selecione um cliente" : undefined}
            className={errors.cliente ? "campo-erro" : ""}
          >
            {selectedCliente ? (
              <div className="w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-100 text-gray-800">
                {selectedCliente.label} - {selectedCliente.cidade}/
                {selectedCliente.uf}
              </div>
            ) : (
              <div className="w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-100 text-gray-500">
                Cliente não encontrado
              </div>
            )}
          </FormField>
        </motion.div>

        {/* Nome ou Apelido e Nome Completo */}
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
          <FormField
            id="nome"
            label="Nome ou Apelido"
            error={
              errors.nome
                ? "O nome é obrigatório e deve ter no máximo 20 caracteres"
                : undefined
            }
            className={errors.nome ? "campo-erro" : ""}
          >
            <input
              type="text"
              id="nome"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do contato"
              maxLength={20}
            />
          </FormField>

          <FormField
            id="nomeCompleto"
            label="Nome Completo"
            error={
              errors.nomeCompleto ? "O nome completo é obrigatório" : undefined
            }
            className={errors.nomeCompleto ? "campo-erro" : ""}
          >
            <input
              type="text"
              id="nomeCompleto"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              placeholder="Nome completo do contato"
              required
            />
          </FormField>
        </motion.div>

        {/* Cargo e Email */}
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

          <FormField
            id="email"
            label="Email"
            error={
              errors.email
                ? "Formato de email inválido. Ex: nome@empresa.com"
                : undefined
            }
            className={errors.email ? "campo-erro" : ""}
          >
            <input
              type="email"
              id="email"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </FormField>
        </motion.div>

        {/* Telefone, WhatsApp e Recebe Avisos */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: 0.15,
            type: "spring",
            stiffness: 100,
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <FormField
            id="telefone"
            label="Telefone de Contato"
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

          <FormField id="recebeAvisoOS" label="Recebe Avisos de OS">
            <div className="flex items-center h-full pb-5">
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
                Enviar notificações sobre OS
              </label>
            </div>
          </FormField>
        </motion.div>

        <FormActions isSaving={isSaving} />
      </FormContainer>
    </>
  );
};

export default EditarContato;
