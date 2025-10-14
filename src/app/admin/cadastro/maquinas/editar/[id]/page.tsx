"use client";

import { Loading } from "@/components/LoadingPersonalizado";

interface ClienteAPIResult {
  id_cliente: number;
  nome_fantasia: string;
  razao_social: string;
  codigo_erp?: string;
}

import { maquinasService } from "@/api/services/maquinasService";
import { clientesService } from "@/api/services/clientesService";
import { useTitle } from "@/context/TitleContext";
import { useToast } from "@/components/admin/ui/ToastContainer";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/admin/ui/PageHeader";
import { InputField, LoadingButton } from "@/components/admin/form";
import CustomSelect, { OptionType } from "@/components/admin/form/CustomSelect";

interface FormData {
  numero_serie: string;
  descricao: string;
  modelo: string;
  id_cliente_atual: number | null;
  situacao: string;
  data_1a_venda: string;
  nota_fiscal_venda: string;
  data_final_garantia: string;
}

interface ClienteOption extends Omit<OptionType, "value"> {
  value: number;
  razao_social?: string;
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
  });

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
        console.log("Dados da máquina (formato paginado):", maquinaData);
      } else {
        maquinaData = response;
        console.log("Dados da máquina (formato direto):", maquinaData);
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
      });

      // Se tiver cliente, carregar os dados do cliente
      if (maquinaData.cliente_atual) {
        console.log("Configurando cliente a partir do objeto cliente_atual");
        // O cliente está no objeto cliente_atual
        const clienteId = maquinaData.cliente_atual.id_cliente;
        const clienteNome = maquinaData.cliente_atual.nome_fantasia || "";

        setClienteInput(clienteNome);

        // Criar o objeto do cliente selecionado
        const clienteOption = {
          value: clienteId,
          label: clienteNome,
          razao_social: maquinaData.cliente_atual.razao_social || "",
        };

        // Configurar o cliente selecionado para o CustomSelect
        setSelectedCliente(clienteOption);

        // Adicionar o cliente às opções para garantir que ele apareça no dropdown
        setClienteOptions([clienteOption]);

        // Garantir que o ID do cliente esteja no formData
        setFormData((prev) => ({
          ...prev,
          id_cliente_atual: clienteId,
        }));
      } else if (maquinaData.id_cliente_atual) {
        console.log("Buscando cliente pelo ID:", maquinaData.id_cliente_atual);
        // Se tiver apenas o ID do cliente, mas não o objeto cliente_atual,
        // buscar os dados do cliente pela API
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
            console.log("Cliente encontrado pela API:", cliente);
            const clienteNome = cliente.nome_fantasia || "";

            setClienteInput(clienteNome);

            // Criar o objeto do cliente, garantindo que o id_cliente nunca seja undefined
            const clienteOption: ClienteOption = {
              value: cliente.id_cliente ?? 0, // Fallback para 0 caso seja undefined
              label: clienteNome,
              razao_social: cliente.razao_social || "",
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
            console.log("Cliente não encontrado pela API");
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

    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

  // Função para buscar clientes
  const searchClientes = useCallback(
    async (term: string) => {
      if (!term || term.length < 3) return;

      try {
        setIsSearchingCliente(true);
        // Utiliza clientesService.getAll para buscar clientes por nome com parâmetro resumido=S
        const data = await clientesService.getAll({
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
      await maquinasService.update(maquinaId, {
        numero_serie: formData.numero_serie,
        descricao: formData.descricao,
        modelo: formData.modelo,
        id_cliente_atual: formData.id_cliente_atual ?? undefined,
        situacao: formData.situacao,
        data_1a_venda: formData.data_1a_venda || undefined,
        nota_fiscal_venda: formData.nota_fiscal_venda,
        data_final_garantia: formData.data_final_garantia || undefined,
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

                {/* Cliente Atual e Situação na mesma linha */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Cliente Atual (ocupa 3 colunas) */}
                  <div className="md:col-span-3">
                    <CustomSelect
                      id="cliente_atual"
                      label="Cliente Atual"
                      placeholder="Digite pelo menos 3 caracteres para buscar o cliente..."
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
