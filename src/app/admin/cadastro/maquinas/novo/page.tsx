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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

const CadastrarMaquina = () => {
  const router = useRouter();
  const { setTitle } = useTitle();
  const { showSuccess, showError } = useToast();
  const [savingData, setSavingData] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Set page title when component mounts
  useEffect(() => {
    setTitle("Cadastro de Máquina");
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

  // Estado para clientes
  const [clientes, setClientes] = useState<
    Array<{ id: number; nome: string; razao_social: string }>
  >([]);
  const [clienteInput, setClienteInput] = useState("");
  const [clienteLoading, setClienteLoading] = useState(false);

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
    <div className="px-2">
      {/* Formulário */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl border-t-4 border-[#7C54BD]"
      >
        {/* Se houver erros, mostrar alerta */}
        {Object.keys(formErrors).length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md shadow-sm">
            <h4 className="font-medium mb-1 text-red-700">
              Por favor, corrija os seguintes erros:
            </h4>
            <ul className="list-disc list-inside">
              {Object.entries(formErrors).map(([field, message]) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações principais */}
          <div className="space-y-4 md:col-span-2">
            <h2 className="text-lg font-semibold text-[#7C54BD] border-b-2 border-[#F6C647] pb-2 inline-block">
              Informações da Máquina
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Número de Série */}
              <div>
                <label
                  htmlFor="numero_serie"
                  className="block text-sm font-medium text-[#7C54BD] mb-1"
                >
                  Nº de Série<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="numero_serie"
                  name="numero_serie"
                  placeholder="Número de série da máquina"
                  value={formData.numero_serie}
                  onChange={handleInputChange}
                  className={`w-full p-2 border ${
                    formErrors.numero_serie
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
                />
                {formErrors.numero_serie && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.numero_serie}
                  </p>
                )}
              </div>
              {/* Modelo */}
              <div>
                <label
                  htmlFor="modelo"
                  className="block text-sm font-medium text-[#7C54BD] mb-1"
                >
                  Modelo<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="modelo"
                  name="modelo"
                  placeholder="Modelo da máquina"
                  value={formData.modelo}
                  onChange={handleInputChange}
                  className={`w-full p-2 border ${
                    formErrors.modelo ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
                />
                {formErrors.modelo && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.modelo}
                  </p>
                )}
              </div>
              {/* Cliente (busca) */}
              <div className="md:col-span-2">
                <label
                  htmlFor="id_cliente_atual"
                  className="block text-sm font-medium text-[#7C54BD] mb-1"
                >
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
                  className={`w-full p-2 border ${
                    formErrors.id_cliente_atual
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
                  autoComplete="off"
                />
                {clienteLoading && (
                  <div className="text-xs text-gray-500 mt-1">
                    Buscando clientes...
                  </div>
                )}
                {clientes.length > 0 && (
                  <ul className="border rounded-md bg-white shadow-md mt-1 max-h-40 overflow-y-auto z-10 relative">
                    {clientes.map((cliente) => (
                      <li
                        key={cliente.id}
                        className={`px-3 py-2 cursor-pointer hover:bg-[#F6C647] hover:text-[#7C54BD] ${
                          formData.id_cliente_atual === cliente.id
                            ? "bg-[#F6C647] text-[#7C54BD]"
                            : ""
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
                        <span className="font-bold text-gray-700">
                          {cliente.nome}
                        </span>
                        <span className="text-gray-600">
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
              <div className="md:col-span-2">
                <label
                  htmlFor="descricao"
                  className="block text-sm font-medium text-[#7C54BD] mb-1"
                >
                  Descrição<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="descricao"
                  name="descricao"
                  placeholder="Descrição da máquina"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  className={`w-full p-2 border ${
                    formErrors.descricao ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
                />
                {formErrors.descricao && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.descricao}
                  </p>
                )}
              </div>
              {/* Linha com 3 campos: Data 1ª Venda, Nota Fiscal Venda, Data Final Garantia */}
              <div className="md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Data 1ª Venda */}
                  <div>
                    <label
                      htmlFor="data_1a_venda"
                      className="block text-sm font-medium text-[#7C54BD] mb-1"
                    >
                      Data 1ª Venda<span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="date"
                      id="data_1a_venda"
                      name="data_1a_venda"
                      value={formData.data_1a_venda}
                      onChange={handleInputChange}
                      className={`w-full p-2 border ${
                        formErrors.data_1a_venda
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm text-black`}
                    />
                    {formErrors.data_1a_venda && (
                      <p className="mt-1 text-sm text-red-500">
                        {formErrors.data_1a_venda}
                      </p>
                    )}
                  </div>
                  {/* Nota Fiscal Venda */}
                  <div>
                    <label
                      htmlFor="nota_fiscal_venda"
                      className="block text-sm font-medium text-[#7C54BD] mb-1"
                    >
                      Nota Fiscal Venda
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      id="nota_fiscal_venda"
                      name="nota_fiscal_venda"
                      placeholder="Número da nota fiscal"
                      value={formData.nota_fiscal_venda}
                      onChange={handleInputChange}
                      className={`w-full p-2 border ${
                        formErrors.nota_fiscal_venda
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
                    />
                    {formErrors.nota_fiscal_venda && (
                      <p className="mt-1 text-sm text-red-500">
                        {formErrors.nota_fiscal_venda}
                      </p>
                    )}
                  </div>
                  {/* Data Final Garantia */}
                  <div>
                    <label
                      htmlFor="data_final_garantia"
                      className="block text-sm font-medium text-[#7C54BD] mb-1"
                    >
                      Data Final Garantia
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="date"
                      id="data_final_garantia"
                      name="data_final_garantia"
                      value={formData.data_final_garantia}
                      onChange={handleInputChange}
                      className={`w-full p-2 border ${
                        formErrors.data_final_garantia
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm text-black`}
                    />
                    {formErrors.data_final_garantia && (
                      <p className="mt-1 text-sm text-red-500">
                        {formErrors.data_final_garantia}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="mt-8 flex justify-end space-x-3">
          <Link
            href="/admin/cadastro/maquinas"
            className="px-5 py-2 bg-gray-100 text-[#7C54BD] rounded-md hover:bg-gray-200 transition-colors shadow-sm hover:shadow-md"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={savingData}
            className="px-5 py-2 bg-[#7C54BD] text-white rounded-md hover:bg-[#6743a1] transition-all flex items-center shadow-sm hover:shadow-md"
          >
            {savingData ? (
              <>
                <span className="mr-2">Salvando</span>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                Salvar Máquina
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CadastrarMaquina;
