"use client";
// Interface para cliente retornado pela API
interface ClienteAPIResult {
  id_cliente: number;
  nome_fantasia: string;
  razao_social: string;
  codigo_erp?: string;
}

import { maquinasAPI, clientesAPI } from "@/api/api";
import { useTitle } from "@/context/TitleContext";
import { useToast } from "@/components/admin/ui/ToastContainer";
import { Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageHeader from "@/components/admin/ui/PageHeader";
import { InputField, LoadingButton } from "@/components/admin/form";
import CustomSelect, { OptionType } from "@/components/admin/form/CustomSelect";

// Define interface for the form data
interface FormData {
  numero_serie: string;
  descricao: string;
  modelo: string;
  id_cliente_atual: number | null;
  data_1a_venda: string;
  nota_fiscal_venda: string;
  data_final_garantia: string;
}

// Define ClienteOption to ensure type compatibility with CustomSelect's OptionType
interface ClienteOption extends Omit<OptionType, "value"> {
  value: number;
  razao_social?: string;
}

const CadastrarMaquina = () => {
  const router = useRouter();
  const { setTitle } = useTitle();
  const { showSuccess, showError } = useToast();
  const [savingData, setSavingData] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Set page title when component mounts
  useEffect(() => {
    setTitle("Máquinas");
  }, [setTitle]);

  const [formData, setFormData] = useState<FormData>({
    numero_serie: "",
    descricao: "",
    modelo: "",
    id_cliente_atual: null,
    data_1a_venda: "",
    nota_fiscal_venda: "",
    data_final_garantia: "",
  });

  // Estados para o cliente
  const [clienteInput, setClienteInput] = useState("");
  const [clienteOptions, setClienteOptions] = useState<ClienteOption[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<ClienteOption | null>(
    null
  );
  const [isSearchingCliente, setIsSearchingCliente] = useState(false);

  // Manipular mudanças nos campos do formulário
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Limpar erro do campo quando usuário digitar
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  // Função para buscar clientes quando o input tiver pelo menos 3 caracteres
  const handleClienteInputChange = (inputValue: string) => {
    setClienteInput(inputValue);

    if (inputValue.length >= 3 && !isSearchingCliente) {
      setIsSearchingCliente(true);
      searchClientes(inputValue);
    }
  };

  const searchClientes = async (term: string) => {
    try {
      // Utiliza clientesAPI.getAll para buscar clientes por nome com parâmetro resumido=S
      const data = await clientesAPI.getAll({
        nome: term,
        resumido: "S",
        qtde_registros: 15,
        nro_pagina: 1,
      });

      const options = Array.isArray(data?.dados)
        ? (data.dados as ClienteAPIResult[]).map((c) => ({
            value: c.id_cliente,
            label: c.nome_fantasia,
            razao_social: c.razao_social,
          }))
        : [];

      setClienteOptions(options);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      setClienteOptions([]);
    } finally {
      setIsSearchingCliente(false);
    }
  };

  const handleClienteChange = (selectedOption: OptionType | null) => {
    // Convert OptionType to ClienteOption if not null
    const clienteOption = selectedOption
      ? ({
          ...selectedOption,
          value: Number(selectedOption.value),
        } as ClienteOption)
      : null;

    setSelectedCliente(clienteOption);

    if (clienteOption) {
      setFormData((prev) => ({
        ...prev,
        id_cliente_atual: clienteOption.value,
      }));

      // Limpar erro se existir
      if (formErrors.id_cliente_atual) {
        setFormErrors((prev) => ({ ...prev, id_cliente_atual: "" }));
      }
    } else {
      setFormData((prev) => ({ ...prev, id_cliente_atual: null }));
    }
  };

  // Validar formulário
  const validarFormulario = () => {
    const errors: Record<string, string> = {};
    if (!formData.numero_serie) errors.numero_serie = "Campo obrigatório";
    if (!formData.descricao) errors.descricao = "Campo obrigatório";
    if (!formData.modelo) errors.modelo = "Campo obrigatório";
    if (!formData.id_cliente_atual)
      errors.id_cliente_atual = "Selecione um cliente";
    if (!formData.data_1a_venda) errors.data_1a_venda = "Campo obrigatório";
    if (!formData.nota_fiscal_venda)
      errors.nota_fiscal_venda = "Campo obrigatório";
    if (!formData.data_final_garantia)
      errors.data_final_garantia = "Campo obrigatório";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSavingData(true);

    try {
      const response = await maquinasAPI.create({
        numero_serie: formData.numero_serie,
        descricao: formData.descricao,
        modelo: formData.modelo,
        id_cliente_atual: formData.id_cliente_atual,
        data_1a_venda: formData.data_1a_venda,
        nota_fiscal_venda: formData.nota_fiscal_venda,
        data_final_garantia: formData.data_final_garantia,
      });
      showSuccess(
        "Sucesso",
        response // Passa a resposta diretamente, o ToastContainer extrai a mensagem
      );
      router.push("/admin/cadastro/maquinas");
    } catch (error) {
      console.error("Erro ao cadastrar máquina:", error);

      showError(
        "Erro ao cadastrar",
        error as Record<string, unknown> // Passa o erro diretamente, o ToastContainer extrai a mensagem
      );
    } finally {
      setSavingData(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Cadastro de Máquina"
        config={{
          type: "form",
          backLink: "/admin/cadastro/maquinas",
          backLabel: "Voltar para lista de máquinas",
        }}
      />

      <main>
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          noValidate
        >
          <div className="p-8">
            <section>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Número de Série */}
                  <div>
                    <InputField
                      label="Nº de Série"
                      name="numero_serie"
                      value={formData.numero_serie}
                      error={formErrors.numero_serie}
                      placeholder="Número de série da máquina"
                      required
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Modelo */}
                  <div>
                    <InputField
                      label="Modelo"
                      name="modelo"
                      value={formData.modelo}
                      error={formErrors.modelo}
                      placeholder="Modelo da máquina"
                      required
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Cliente Atual */}
                <div>
                  <CustomSelect
                    id="cliente_atual"
                    label="Cliente Atual"
                    required
                    placeholder="Digite pelo menos 3 caracteres para buscar o cliente..."
                    inputValue={clienteInput}
                    onInputChange={handleClienteInputChange}
                    onChange={handleClienteChange}
                    options={clienteOptions}
                    value={selectedCliente}
                    isLoading={isSearchingCliente}
                    error={formErrors.id_cliente_atual}
                    minCharsToSearch={3}
                    noOptionsMessageFn={({ inputValue }) =>
                      inputValue.length < 3
                        ? "Digite pelo menos 3 caracteres para buscar..."
                        : "Nenhum cliente encontrado"
                    }
                  />
                </div>

                {/* Descrição */}
                <div>
                  <InputField
                    label="Descrição"
                    name="descricao"
                    value={formData.descricao}
                    error={formErrors.descricao}
                    placeholder="Descrição da máquina"
                    required
                    onChange={handleInputChange}
                  />
                </div>

                {/* Linha com 3 campos: Data 1ª Venda, Nota Fiscal Venda, Data Final Garantia */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Data 1ª Venda */}
                  <div>
                    <InputField
                      type="date"
                      label="Data 1ª Venda"
                      name="data_1a_venda"
                      value={formData.data_1a_venda}
                      error={formErrors.data_1a_venda}
                      required
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Nota Fiscal Venda */}
                  <div>
                    <InputField
                      label="Nota Fiscal Venda"
                      name="nota_fiscal_venda"
                      value={formData.nota_fiscal_venda}
                      error={formErrors.nota_fiscal_venda}
                      placeholder="Número da nota fiscal"
                      required
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Data Final Garantia */}
                  <div>
                    <InputField
                      type="date"
                      label="Data Final Garantia"
                      name="data_final_garantia"
                      value={formData.data_final_garantia}
                      error={formErrors.data_final_garantia}
                      required
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Footer com botões */}
          <footer className="bg-slate-50 px-8 py-6 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Link
                href="/admin/cadastro/maquinas"
                className="px-6 py-3 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors text-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                Cancelar
              </Link>

              <LoadingButton
                type="submit"
                isLoading={savingData}
                className="bg-[var(--primary)] text-white hover:bg-violet-700 focus:ring-violet-500 shadow-sm"
              >
                <span className="flex items-center justify-center gap-2">
                  <Save className="h-4 w-4" />
                  <span>Salvar</span>
                </span>
              </LoadingButton>
            </div>
          </footer>
        </form>
      </main>
    </>
  );
};

export default CadastrarMaquina;
