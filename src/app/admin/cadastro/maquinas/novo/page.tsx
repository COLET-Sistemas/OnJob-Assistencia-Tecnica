"use client";
import { Loading } from "@/components/LoadingPersonalizado";

// Interface para cliente retornado pela API
interface ClienteAPIResult {
  id_cliente: number;
  nome_fantasia: string;
  razao_social: string;
  codigo_erp?: string;
}

import { maquinasService, clientesService } from "@/api/services";
import { useTitle } from "@/context/TitleContext";
import { useToast } from "@/components/admin/ui/ToastContainer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/admin/ui/PageHeader";
import {
  InputField,
  LoadingButton,
  TextAreaField,
} from "@/components/admin/form";
import CustomSelect, { OptionType } from "@/components/admin/form/CustomSelect";
import useDebouncedCallback from "@/hooks/useDebouncedCallback";

interface FormData {
  numero_serie: string;
  descricao: string;
  modelo: string;
  id_cliente_atual: number | null;
  situacao: string;
  data_1a_venda: string | null;
  nota_fiscal_venda: string;
  data_final_garantia: string | null;
  observacoes: string;
}

// Define ClienteOption to ensure type compatibility with CustomSelect's OptionType
interface ClienteOption extends Omit<OptionType, "value"> {
  value: number;
  razao_social?: string;
  codigo_erp?: string;
}

interface ModeloOption extends Omit<OptionType, "value"> {
  value: string;
}

const addDaysToDateString = (dateString: string, days: number) => {
  const [year, month, day] = dateString.split("-").map(Number);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return "";
  }

  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  const newYear = date.getFullYear();
  const newMonth = String(date.getMonth() + 1).padStart(2, "0");
  const newDay = String(date.getDate()).padStart(2, "0");

  return `${newYear}-${newMonth}-${newDay}`;
};

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
    situacao: "A",
    data_1a_venda: null,
    nota_fiscal_venda: "",
    data_final_garantia: null,
    observacoes: "",
  });
  const [modeloInput, setModeloInput] = useState("");
  const [modeloOptions, setModeloOptions] = useState<ModeloOption[]>([]);
  const [selectedModelo, setSelectedModelo] = useState<ModeloOption | null>(
    null
  );
  const [isSearchingModelo, setIsSearchingModelo] = useState(false);

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

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "data_1a_venda" || name === "data_final_garantia"
          ? value || null
          : value,
    }));

    // Limpar erro do campo quando usuário digitar
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const debouncedSearchModelos = useDebouncedCallback(async (valor: string) => {
    const termo = valor.trim();

    if (termo.length < 3) {
      setModeloOptions([]);
      setIsSearchingModelo(false);
      return;
    }

    try {
      const modelos = await maquinasService.getModelos(termo);
      setModeloOptions(
        modelos.map(
          (modelo) =>
            ({
              value: modelo,
              label: modelo,
            } as ModeloOption)
        )
      );
    } catch (error) {
      console.error("Erro ao buscar modelos:", error);
      setModeloOptions([]);
    } finally {
      setIsSearchingModelo(false);
    }
  }, 400);

  const handleModeloInputChange = useCallback(
    (inputValue: string) => {
      setModeloInput(inputValue);

      if (inputValue.trim().length >= 3) {
        setIsSearchingModelo(true);
      } else {
        setModeloOptions([]);
        setIsSearchingModelo(false);
      }

      if (formErrors.modelo) {
        setFormErrors((prev) => {
          const updated = { ...prev };
          delete updated.modelo;
          return updated;
        });
      }

      debouncedSearchModelos(inputValue);
    },
    [debouncedSearchModelos, formErrors.modelo]
  );

  const handleModeloChange = useCallback(
    (selectedOption: OptionType | null) => {
      const modeloOption = selectedOption
        ? ({
            ...selectedOption,
            value: selectedOption.value.toString(),
          } as ModeloOption)
        : null;

      setSelectedModelo(modeloOption);
      setModeloInput("");

      setFormData((prev) => ({
        ...prev,
        modelo: modeloOption ? modeloOption.value : "",
      }));

      if (formErrors.modelo) {
        setFormErrors((prev) => {
          const updated = { ...prev };
          delete updated.modelo;
          return updated;
        });
      }
    },
    [formErrors.modelo]
  );

  const handleDataPrimeiraVendaBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      const { value } = event.target;

      if (!value) {
        return;
      }

      let garantiaGerada = false;
      const garantiaCalculada = addDaysToDateString(value, 365);

      setFormData((prev) => {
        if (prev.data_final_garantia) {
          return {
            ...prev,
            data_1a_venda: value,
          };
        }

        if (!garantiaCalculada) {
          return {
            ...prev,
            data_1a_venda: value,
          };
        }

        garantiaGerada = true;

        return {
          ...prev,
          data_1a_venda: value,
          data_final_garantia: garantiaCalculada,
        };
      });

      if (garantiaGerada) {
        setFormErrors((prev) => {
          if (!prev.data_final_garantia) {
            return prev;
          }

          const updated = { ...prev };
          delete updated.data_final_garantia;
          return updated;
        });
      }
    },
    []
  );

  // Função para buscar clientes
  const searchClientes = useCallback(
    async (term: string) => {
      if (!term || term.length < 3) return;

      try {
        setIsSearchingCliente(true);
        // Utiliza clientesAPI.getAll para buscar clientes por nome com parâmetro resumido=S
        const data = await clientesService.getAll({
          nome: term,
          resumido: "S",
          qtde_registros: 15,
          nro_pagina: 1,
        });

        const options = Array.isArray(data?.dados)
          ? (data.dados as ClienteAPIResult[]).map((c) => ({
              value: c.id_cliente,
              label: c.codigo_erp
                ? `${c.razao_social} - ${c.codigo_erp}`
                : c.razao_social,
              razao_social: c.razao_social,
              codigo_erp: c.codigo_erp,
            }))
          : [];

        setClienteOptions(options);
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
        setClienteOptions([]);
        showError("Erro ao buscar clientes", "Tente novamente mais tarde.");
      } finally {
        setIsSearchingCliente(false);
      }
    },
    [showError]
  );

  // Função debounced para buscar clientes quando o input tiver pelo menos 3 caracteres
  const debouncedSearchClientes = useCallback(
    (term: string) => {
      // Implementação inline do debounce para evitar problemas com o ESLint
      if (term.length >= 3 && !isSearchingCliente) {
        // Usar um timeout para debounce
        const timeoutId = setTimeout(() => {
          searchClientes(term);
        }, 300);

        // Retornar uma função que limpa o timeout se chamada antes da execução
        return () => clearTimeout(timeoutId);
      }
    },
    [searchClientes, isSearchingCliente]
  );

  // Função para lidar com a mudança no input do cliente
  const handleClienteInputChange = useCallback(
    (inputValue: string) => {
      setClienteInput(inputValue);
      debouncedSearchClientes(inputValue);
    },
    [debouncedSearchClientes]
  );

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
    // Cliente não é mais obrigatório
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
      // Convert form data to match expected API format
      // Função para formatar Date para dd.mm.yyyy
      const formatDateBR = (date: Date | string | null) => {
        if (!date) return "";

        if (typeof date === "string") {
          const [year, month, day] = date.split("-");
          if (!year || !month || !day) {
            return "";
          }
          const safeDay = day.padStart(2, "0");
          const safeMonth = month.padStart(2, "0");
          return `${safeDay}.${safeMonth}.${year}`;
        }

        const day = String(date.getUTCDate()).padStart(2, "0");
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const year = date.getUTCFullYear();
        return `${day}.${month}.${year}`;
      };

      const maquinaData = {
        numero_serie: formData.numero_serie,
        descricao: formData.descricao,
        modelo: formData.modelo,
        id_cliente_atual: formData.id_cliente_atual!,
        data_1a_venda: formatDateBR(formData.data_1a_venda),
        nota_fiscal_venda: formData.nota_fiscal_venda,
        data_final_garantia: formatDateBR(formData.data_final_garantia),
        situacao: formData.situacao,
        observacoes: formData.observacoes,
      };

      const response = await maquinasService.create(maquinaData);
      showSuccess("Sucesso", response as unknown as Record<string, unknown>);
      router.push("/admin/cadastro/maquinas");
    } catch (error) {
      console.error("Erro ao cadastrar máquina:", error);

      showError("Erro ao cadastrar", error as Record<string, unknown>);
    } finally {
      setSavingData(false);
    }
  };

  return (
    <>
      {savingData && (
        <Loading fullScreen={true} text="Salvando dados..." size="medium" />
      )}
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
                    <CustomSelect
                      id="modelo"
                      label="Modelo"
                      required
                      placeholder="Digite pelo menos 3 caracteres para buscar o modelo..."
                      inputValue={modeloInput}
                      onInputChange={handleModeloInputChange}
                      onChange={handleModeloChange}
                      options={
                        selectedModelo &&
                        !modeloOptions.find(
                          (option) => option.value === selectedModelo.value
                        )
                          ? [selectedModelo, ...modeloOptions]
                          : modeloOptions
                      }
                      value={selectedModelo}
                      isLoading={isSearchingModelo}
                      error={formErrors.modelo}
                      minCharsToSearch={3}
                      noOptionsMessageFn={({ inputValue }) =>
                        inputValue.length < 3
                          ? "Digite pelo menos 3 caracteres para buscar..."
                          : "Nenhum modelo encontrado"
                      }
                    />
                  </div>
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

                <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-5">
                  {/* Cliente Atual */}
                  <div className="md:col-span-3">
                    <CustomSelect
                      id="cliente_atual"
                      label="Cliente Atual"
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

                  <div>
                    <InputField
                      type="date"
                      label="Data 1ª Venda"
                      name="data_1a_venda"
                      value={formData.data_1a_venda ?? ""}
                      onChange={handleInputChange}
                      onBlur={handleDataPrimeiraVendaBlur}
                    />
                  </div>

                  {/* Nota Fiscal Venda */}
                  <div>
                    <InputField
                      label="Nota Fiscal Venda"
                      name="nota_fiscal_venda"
                      value={formData.nota_fiscal_venda}
                      placeholder="Número da nota fiscal"
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Data Final Garantia */}
                  <div>
                    <InputField
                      type="date"
                      label="Data Final Garantia"
                      name="data_final_garantia"
                      value={formData.data_final_garantia ?? ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              <div>
                <TextAreaField
                  id="observacoes"
                  name="observacoes"
                  label="Observações"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  placeholder="Informações adicionais sobre a máquina"
                  rows={4}
                />
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
                <span>Salvar</span>
              </LoadingButton>
            </div>
          </footer>
        </form>
      </main>
    </>
  );
};

export default CadastrarMaquina;
