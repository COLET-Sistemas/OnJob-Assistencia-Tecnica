"use client";

// Interface para cliente retornado pela API
interface ClienteAPIResult {
  id_cliente: number;
  nome_fantasia: string;
  razao_social: string;
}

import { maquinasAPI, clientesAPI } from "@/api/api";
import { useTitle } from "@/context/TitleContext";
import { useToast } from "@/components/admin/ui/ToastContainer";
import { Save } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/admin/ui/PageHeader";
import { InputField, LoadingButton } from "@/components/admin/form";

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

const EditarMaquina = () => {
  const router = useRouter();
  const { id } = useParams();
  const maquinaId = Array.isArray(id) ? id[0] : id;
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
    data_1a_venda: "",
    nota_fiscal_venda: "",
    data_final_garantia: "",
  });

  // Estado para clientes
  const [clientes, setClientes] = useState<
    Array<{ id: number; nome: string; razao_social: string }>
  >([]);
  const [clienteInput, setClienteInput] = useState("");
  const [clienteLoading, setClienteLoading] = useState(false);

  // Set page title when component mounts
  useEffect(() => {
    setTitle("Edição de Máquina");
  }, [setTitle]);

  // Carregar dados da máquina
  const fetchMaquina = useCallback(async () => {
    setLoading(true);
    try {
      const data = await maquinasAPI.getById(maquinaId);

      if (!data) {
        throw new Error("Máquina não encontrada");
      }

      setFormData({
        numero_serie: data.numero_serie || "",
        descricao: data.descricao || "",
        modelo: data.modelo || "",
        id_cliente_atual: data.id_cliente_atual || null,
        data_1a_venda: data.data_1a_venda
          ? new Date(data.data_1a_venda).toISOString().split("T")[0]
          : "",
        nota_fiscal_venda: data.nota_fiscal_venda || "",
        data_final_garantia: data.data_final_garantia
          ? new Date(data.data_final_garantia).toISOString().split("T")[0]
          : "",
      });

      // Se tiver cliente, carregar os dados do cliente
      if (data.id_cliente_atual && data.cliente_atual) {
        setClienteInput(data.cliente_atual.nome_fantasia || "");
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

  // Busca dinâmica de clientes
  useEffect(() => {
    const fetchClientes = async () => {
      if (clienteInput.length < 3) {
        setClientes([]);
        return;
      }
      setClienteLoading(true);
      try {
        // Utiliza clientesAPI.getAll para buscar clientes por nome
        const data = await clientesAPI.getAll({ nome: clienteInput });
        // data.dados é o array de clientes
        const lista = Array.isArray(data?.dados)
          ? (data.dados as ClienteAPIResult[]).map((c) => ({
              id: c.id_cliente,
              nome: c.nome_fantasia,
              razao_social: c.razao_social,
            }))
          : [];
        setClientes(lista);
      } catch {
        setClientes([]);
      } finally {
        setClienteLoading(false);
      }
    };
    fetchClientes();
  }, [clienteInput]);

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
      const response = await maquinasAPI.update(maquinaId, {
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
      console.error("Erro ao atualizar máquina:", error);

      showError(
        "Erro ao atualizar",
        error as Record<string, unknown> // Passa o erro diretamente, o ToastContainer extrai a mensagem
      );
    } finally {
      setSavingData(false);
    }
  };

  // Mostrar carregando enquanto busca dados
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-violet-700 border-t-transparent rounded-full"></div>
      </div>
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

                {/* Cliente Atual */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">
                    Cliente Atual<span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    id="id_cliente_atual"
                    name="id_cliente_atual"
                    placeholder="Digite ao menos 3 letras para buscar o cliente"
                    value={clienteInput}
                    onChange={(e) => {
                      setClienteInput(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        id_cliente_atual: null,
                      }));
                    }}
                    className={`w-full p-2.5 rounded-md border ${
                      formErrors.id_cliente_atual
                        ? "border-red-500 focus:ring-red-500"
                        : "border-slate-300 focus:ring-violet-500"
                    } focus:border-violet-500 focus:ring-2 shadow-sm`}
                    autoComplete="off"
                  />
                  {clienteLoading && (
                    <div className="text-xs text-slate-500 mt-1">
                      Buscando clientes...
                    </div>
                  )}
                  {clientes.length > 0 && (
                    <ul className="border rounded-md bg-white shadow-md mt-1 max-h-40 overflow-y-auto z-10 relative">
                      {clientes.map((cliente) => (
                        <li
                          key={cliente.id}
                          className={`px-3 py-2 cursor-pointer hover:bg-violet-50 ${
                            formData.id_cliente_atual === cliente.id
                              ? "bg-violet-100 text-violet-800"
                              : "text-slate-700"
                          }`}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              id_cliente_atual: cliente.id,
                            }));
                            setClienteInput(cliente.nome);
                            setClientes([]);
                          }}
                        >
                          <span className="font-medium">{cliente.nome}</span>
                          <span className="text-slate-500">
                            {" "}
                            - {cliente.razao_social}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {formErrors.id_cliente_atual && (
                    <p className="mt-1 text-sm text-red-500">
                      {formErrors.id_cliente_atual}
                    </p>
                  )}
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

export default EditarMaquina;
