"use client";

import { Loading } from "@/components/LoadingPersonalizado";
import { maquinasService } from "@/api/services/maquinasService";
import { clientesService } from "@/api/services/clientesService";
import { clienteSelectComponents } from "@/app/admin/os_aberto/novo/components/ClienteItem";
import { useTitle } from "@/context/TitleContext";
import { useToast } from "@/components/admin/ui/ToastContainer";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Cliente } from "@/types/admin/cadastro/clientes";
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
  data_1a_venda: string;
  nota_fiscal_venda: string;
  data_final_garantia: string;
  observacoes: string;
}

interface ClienteOption extends Omit<OptionType, "value"> {
  value: number;
  razao_social?: string;
  nome_fantasia?: string;
  cidade?: string;
  uf?: string;
  codigo_erp?: string;
}

interface ModeloOption extends Omit<OptionType, "value"> {
  value: string;
}

const EditarMaquina = () => {
  const router = useRouter();
  const { id } = useParams();
  const maquinaId = Array.isArray(id) ? id[0] : (id as string);
  const { setTitle } = useTitle();
  const { showSuccess, showError } = useToast();
  const [savingData, setSavingData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    numero_serie: "",
    descricao: "",
    modelo: "",
    id_cliente_atual: null,
    situacao: "A",
    data_1a_venda: "",
    nota_fiscal_venda: "",
    data_final_garantia: "",
    observacoes: "",
  });

  const [modeloInput, setModeloInput] = useState("");
  const [modeloOptions, setModeloOptions] = useState<ModeloOption[]>([]);
  const [selectedModelo, setSelectedModelo] = useState<ModeloOption | null>(
    null
  );
  const [isSearchingModelo, setIsSearchingModelo] = useState(false);
  const [isNovoModelo, setIsNovoModelo] = useState(false);

  // Estados para o cliente
  const [clienteInput, setClienteInput] = useState("");
  const [clienteOptions, setClienteOptions] = useState<ClienteOption[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<ClienteOption | null>(
    null
  );
  const [isSearchingCliente, setIsSearchingCliente] = useState(false);

  // Função auxiliar para converter data do formato brasileiro para ISO (YYYY-MM-DD)
  const converterDataBRparaISO = (dataBR: string): string => {
    if (!dataBR) return "";
    // Se já está no formato ISO (YYYY-MM-DD), retorna direto
    if (/^\d{4}-\d{2}-\d{2}/.test(dataBR)) {
      return dataBR.split("T")[0];
    }
    // Se está no formato brasileiro (DD/MM/YYYY), converte
    const partes = dataBR.split("/");
    if (partes.length === 3) {
      const [dia, mes, ano] = partes;
      return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
    }
    return "";
  };

  // Set page title when component mounts
  useEffect(() => {
    setTitle("Edição de Máquina");
  }, [setTitle]);

  // Carregar dados da máquina
  const fetchMaquina = useCallback(async () => {
    setLoading(true);
    try {
      const response = await maquinasService.getById(maquinaId);

      let maquinaData;
      if (
        response &&
        "dados" in response &&
        Array.isArray(response.dados) &&
        response.dados.length > 0
      ) {
        maquinaData = response.dados[0];
      } else {
        maquinaData = response;
      }

      if (!maquinaData) {
        throw new Error("Máquina não encontrada");
      }

      setFormData({
        numero_serie: maquinaData.numero_serie || "",
        descricao: maquinaData.descricao || "",
        modelo: maquinaData.modelo || "",
        id_cliente_atual:
          maquinaData.id_cliente_atual ||
          maquinaData.cliente_atual?.id_cliente ||
          null,
        situacao: maquinaData.situacao || "A",
        data_1a_venda: maquinaData.data_1a_venda
          ? converterDataBRparaISO(maquinaData.data_1a_venda)
          : "",
        nota_fiscal_venda: maquinaData.nota_fiscal_venda || "",
        data_final_garantia: maquinaData.data_final_garantia
          ? converterDataBRparaISO(maquinaData.data_final_garantia)
          : "",
        observacoes: maquinaData.observacoes || "",
      });

      if (maquinaData.modelo) {
        const modeloOption: ModeloOption = {
          value: maquinaData.modelo,
          label: maquinaData.modelo,
        };
        setSelectedModelo(modeloOption);
      } else {
        setSelectedModelo(null);
      }
      setModeloInput("");

      if (maquinaData.cliente_atual) {
        const clienteId = maquinaData.cliente_atual.id_cliente;
        const clienteRazaoSocial =
          maquinaData.cliente_atual.razao_social ||
          maquinaData.cliente_atual.nome_fantasia ||
          "";
        const clienteCodigoErp =
          maquinaData.cliente_atual.codigo_erp &&
          maquinaData.cliente_atual.codigo_erp.trim().length > 0
            ? ` (${maquinaData.cliente_atual.codigo_erp})`
            : " (-)";
        const clienteLabel = `${clienteRazaoSocial}${clienteCodigoErp}`;

        setClienteInput(clienteLabel);

        const clienteOption: ClienteOption = {
          value: clienteId ?? 0,
          label: clienteLabel,
          razao_social: maquinaData.cliente_atual.razao_social || "",
          nome_fantasia: maquinaData.cliente_atual.nome_fantasia,
          cidade: maquinaData.cliente_atual.cidade,
          uf: maquinaData.cliente_atual.uf,
          codigo_erp: maquinaData.cliente_atual.codigo_erp,
        };

        setSelectedCliente(clienteOption);
        setClienteOptions([clienteOption]);

        setFormData((prev) => ({
          ...prev,
          id_cliente_atual: clienteId,
        }));
      } else if (maquinaData.id_cliente_atual) {
        try {
          const clienteData = await clientesService.getAll({
            id: maquinaData.id_cliente_atual,
          });

          if (
            clienteData &&
            clienteData.dados &&
            clienteData.dados.length > 0
          ) {
            const cliente = clienteData.dados[0];
            const clienteRazaoSocial =
              cliente.razao_social ||
              cliente.nome_fantasia ||
              "Cliente sem razao social";
            const clienteCodigoErp =
              cliente.codigo_erp && cliente.codigo_erp.trim().length > 0
                ? ` (${cliente.codigo_erp})`
                : " (-)";
            const clienteLabel = `${clienteRazaoSocial}${clienteCodigoErp}`;

            setClienteInput(clienteLabel);

            // Criar o objeto do cliente, garantindo que o id_cliente nunca seja undefined
            const clienteOption: ClienteOption = {
              value: cliente.id_cliente ?? 0,
              label: clienteLabel,
              razao_social: cliente.razao_social || "",
              nome_fantasia: cliente.nome_fantasia,
              cidade: cliente.cidade,
              uf: cliente.uf,
              codigo_erp: cliente.codigo_erp,
            };

            setSelectedCliente(clienteOption);

            // Adicionar o cliente às opções para garantir que ele apareça no dropdown
            setClienteOptions([clienteOption]);

            // Garantir que o ID do cliente esteja no formData
            setFormData((prev) => ({
              ...prev,
              id_cliente_atual: cliente.id_cliente ?? null,
            }));
          } else {
          }
        } catch (clienteError) {
          console.error("Erro ao buscar dados do cliente:", clienteError);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar máquina:", error);
      showError("Erro", "Não foi possível carregar os dados da máquina");
      router.push("/admin/cadastro/maquinas");
    } finally {
      setLoading(false);
    }
  }, [maquinaId, router, showError]);

  useEffect(() => {
    if (maquinaId) {
      fetchMaquina();
    }
  }, [maquinaId, fetchMaquina]);

  // Manipular mudanças nos campos do formulário
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    const normalizedValue =
      name === "modelo" && isNovoModelo ? value.toUpperCase() : value;

    // Se o campo alterado for data_1a_venda, calcular data_final_garantia mantendo dia e mês
    if (name === "data_1a_venda") {
      let dataFinalGarantia = "";
      if (normalizedValue) {
        let dia, mes, ano;
        if (/^\d{4}-\d{2}-\d{2}/.test(normalizedValue)) {
          // ISO: yyyy-mm-dd
          [ano, mes, dia] = normalizedValue.split("-");
        } else if (/^\d{2}\/\d{2}\/\d{4}/.test(normalizedValue)) {
          // BR: dd/mm/yyyy
          [dia, mes, ano] = normalizedValue.split("/");
        } else {
          // Tenta extrair do Date
          const d = new Date(normalizedValue);
          if (!isNaN(d.getTime())) {
            dia = String(d.getDate()).padStart(2, "0");
            mes = String(d.getMonth() + 1).padStart(2, "0");
            ano = String(d.getFullYear());
          }
        }
        if (dia && mes && ano) {
          // Soma 1 ao ano
          const anoGarantia = String(Number(ano) + 1);
          dataFinalGarantia = `${anoGarantia}-${mes}-${dia}`;
        }
      }
      setFormData((prev) => ({
        ...prev,
        [name]: normalizedValue,
        data_final_garantia: dataFinalGarantia,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: normalizedValue,
      }));
    }

    // Limpar erro do campo quando usuário digitar
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  // Função para buscar clientes
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

  const handleNovoModeloToggle = (checked: boolean) => {
    const modeloBase =
      (formData.modelo || selectedModelo?.value || "").toString();
    const modeloUpper = modeloBase.toUpperCase();

    setIsNovoModelo(checked);
    setModeloInput("");
    setModeloOptions([]);
    setIsSearchingModelo(false);

    if (checked) {
      setFormData((prev) => ({
        ...prev,
        modelo: modeloUpper,
      }));
    } else if (modeloUpper) {
      const modeloOption: ModeloOption = {
        value: modeloUpper,
        label: modeloUpper,
      };
      setSelectedModelo(modeloOption);
      setFormData((prev) => ({
        ...prev,
        modelo: modeloUpper,
      }));
    } else {
      setSelectedModelo(null);
    }

    if (formErrors.modelo) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated.modelo;
        return updated;
      });
    }
  };

  const searchClientes = useCallback(
    async (term: string) => {
      if (term.length < 3) return;

      try {
        setIsSearchingCliente(true);
        const response = await clientesService.search(term);

        const options = Array.isArray(response?.dados)
          ? response.dados.map((cliente: Cliente) => {
              const razaoSocial =
                cliente.razao_social && cliente.razao_social.trim().length > 0
                  ? cliente.razao_social
                  : cliente.nome_fantasia || "Cliente sem razao social";
              const nomeFantasia =
                cliente.nome_fantasia && cliente.nome_fantasia.trim().length > 0
                  ? cliente.nome_fantasia
                  : undefined;
              const codigoErp =
                cliente.codigo_erp && cliente.codigo_erp.trim().length > 0
                  ? ` (${cliente.codigo_erp})`
                  : " (-)";

              return {
                value: cliente.id_cliente || cliente.id || 0,
                label: `${razaoSocial}${codigoErp}`,
                cidade: cliente.cidade,
                uf: cliente.uf,
                nome_fantasia: nomeFantasia,
                razao_social: cliente.razao_social || "",
                codigo_erp: cliente.codigo_erp || "",
              };
            })
          : [];

        setClienteOptions(options);
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
        setClienteOptions([]);
      } finally {
        setIsSearchingCliente(false);
      }
    },
    []
  );

  // Função debounced para buscar clientes quando o input tiver pelo menos 3 caracteres
  const debouncedSearchClientes = useDebouncedCallback((term: string) => {
    if (term.length >= 3) {
      searchClientes(term);
    } else {
      setClienteOptions([]);
      setIsSearchingCliente(false);
    }
  }, 500);

  // Função para lidar com a mudança no input do cliente
  const handleClienteInputChange = useCallback(
    (inputValue: string) => {
      setClienteInput(inputValue);

      if (inputValue.length >= 3) {
        setIsSearchingCliente(true);
        debouncedSearchClientes(inputValue);
      } else {
        setClienteOptions([]);
        setIsSearchingCliente(false);
      }
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
      setSelectedCliente(null);
      setClienteInput("");
      setClienteOptions([]);
      setFormData((prev) => ({ ...prev, id_cliente_atual: null }));
    }
  };

  // Validar formulário
  const validarFormulario = () => {
    const errors: Record<string, string> = {};
    if (!formData.numero_serie) errors.numero_serie = "Campo obrigatório";
    if (!formData.descricao) errors.descricao = "Campo obrigatório";
    if (!formData.modelo.trim()) errors.modelo = "Campo obrigatório";
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
      const modeloNormalizado = formData.modelo.trim().toUpperCase();

      await maquinasService.update(maquinaId, {
        numero_serie: formData.numero_serie,
        descricao: formData.descricao,
        modelo: modeloNormalizado,
        id_cliente_atual: formData.id_cliente_atual ?? undefined,
        situacao: formData.situacao,
        data_1a_venda: formData.data_1a_venda || undefined,
        nota_fiscal_venda: formData.nota_fiscal_venda,
        data_final_garantia: formData.data_final_garantia || undefined,
        observacoes: formData.observacoes,
      });
      showSuccess("Sucesso", "Máquina atualizada com sucesso");
      router.push("/admin/cadastro/maquinas");
    } catch (error) {
      console.error("Erro ao atualizar máquina:", error);

      showError("Erro ao atualizar", error as Record<string, unknown>);
    } finally {
      setSavingData(false);
    }
  };

  if (loading) {
    return (
      <Loading
        fullScreen={true}
        text="Carregando dados da máquina..."
        size="medium"
        className="min-h-[400px]"
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Edição de Máquina"
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
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-md font-medium text-slate-700">
                        Modelo
                        <span
                          className="text-red-500 ml-1"
                          aria-label="obrigatório"
                        >
                          *
                        </span>
                      </span>
                      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={isNovoModelo}
                          onChange={(event) =>
                            handleNovoModeloToggle(event.target.checked)
                          }
                          className="h-4 w-4 rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                        <span>Novo modelo</span>
                      </label>
                    </div>

                    {isNovoModelo ? (
                      <InputField
                        label=""
                        name="modelo"
                        value={formData.modelo}
                        error={formErrors.modelo}
                        placeholder="Digite o modelo em letras maiúsculas"
                        onChange={handleInputChange}
                        className="uppercase"
                      />
                    ) : (
                      <CustomSelect
                        id="modelo"
                        label=""
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
                    )}
                  </div>
                </div>

                {/* Descricao */}
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

                {/* Cliente Atual e Situação na mesma linha */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Cliente Atual (ocupa 3 colunas) */}
                  <div className="md:col-span-3">
                    <CustomSelect
                      id="cliente_atual"
                      label="Cliente Atual"
                      placeholder="Digite pelo menos 3 caracteres para buscar..."
                      inputValue={clienteInput}
                      onInputChange={handleClienteInputChange}
                      onChange={handleClienteChange}
                      options={
                        selectedCliente &&
                        !clienteOptions.find(
                          (option) => option.value === selectedCliente.value
                        )
                          ? [selectedCliente, ...clienteOptions]
                          : clienteOptions
                      }
                      value={selectedCliente}
                      isLoading={isSearchingCliente}
                      error={formErrors.id_cliente_atual}
                      minCharsToSearch={3}
                      filterOption={() => true}
                      // @ts-expect-error - Custom option renderers usam campos extras de ClienteOption
                      components={clienteSelectComponents}
                      noOptionsMessageFn={({ inputValue }) =>
                        inputValue.length < 3
                          ? "Digite pelo menos 3 caracteres para buscar..."
                          : "Nenhum cliente encontrado"
                      }
                    />
                  </div>

                  {/* Situação (ocupa 1 coluna) */}
                  <div>
                    <CustomSelect
                      id="situacao"
                      label="Situação"
                      placeholder="Selecione a situação"
                      options={[
                        { label: "Ativo", value: "A" },
                        { label: "Inativo", value: "I" },
                      ]}
                      value={
                        formData.situacao
                          ? {
                              label:
                                formData.situacao === "A" ? "Ativo" : "Inativo",
                              value: formData.situacao,
                            }
                          : null
                      }
                      onChange={(option) => {
                        if (option) {
                          setFormData((prev) => ({
                            ...prev,
                            situacao: option.value.toString(),
                          }));
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
                  {/* Data 1ª Venda */}
                  <div>
                    <InputField
                      type="date"
                      label="Data 1ª Venda"
                      name="data_1a_venda"
                      value={formData.data_1a_venda}
                      onChange={handleInputChange}
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
                      value={formData.data_final_garantia}
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

export default EditarMaquina;
