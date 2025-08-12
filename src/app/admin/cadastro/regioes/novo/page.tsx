"use client";

import { regioesAPI } from "@/api/api";
import { useTitle } from "@/context/TitleContext";
import { FormData } from "@/types/admin/cadastro/regioes";
import { Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const CadastrarRegiao = () => {
  const router = useRouter();
  const { setTitle } = useTitle();
  const [savingData, setSavingData] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Set page title when component mounts
  useEffect(() => {
    setTitle("Cadastro de Região");
  }, [setTitle]);

  // Inicializar formulário com valores padrão
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    descricao: "",
    uf: "RS",
    atendida_empresa: true,
    situacao: "A",
  });

  // Lista de UFs brasileiras
  const ufs = [
    "AC",
    "AL",
    "AP",
    "AM",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MT",
    "MS",
    "MG",
    "PA",
    "PB",
    "PR",
    "PE",
    "PI",
    "RJ",
    "RN",
    "RS",
    "RO",
    "RR",
    "SC",
    "SP",
    "SE",
    "TO",
  ];

  // Manipular mudanças nos campos do formulário
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Limpar erro do campo quando o usuário começa a digitar
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validar formulário antes de enviar
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      errors.nome = "Nome da região é obrigatório";
    }

    if (!formData.descricao.trim()) {
      errors.descricao = "Descrição é obrigatória";
    }

    if (!formData.uf) {
      errors.uf = "UF é obrigatória";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSavingData(true);

    try {
      await regioesAPI.create(formData);
      alert("Região cadastrada com sucesso!");
      router.push("/admin/cadastro/regioes");
    } catch (error) {
      console.error("Erro ao cadastrar região:", error);
      alert("Erro ao cadastrar região. Por favor, tente novamente.");
    } finally {
      setSavingData(false);
    }
  };

  // Loading state handled directly in the component

  return (
    <div className="px-2">
      <div className="max-w-8xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl border-t-4 border-[#7C54BD]">
          <form onSubmit={handleSubmit} className="p-8">
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

            {/* Informações básicas da região */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[#7C54BD] border-b-2 border-[#F6C647] pb-2 inline-block mb-4">
                Informações da Região
              </h2>
              {/* Nome e Descrição na mesma linha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Nome da região */}
                <div>
                  <label
                    htmlFor="nome"
                    className="block text-sm font-medium text-[#7C54BD] mb-1"
                  >
                    Nome da Região<span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    className={`w-full p-2 border ${
                      formErrors.nome ? "border-red-500" : "border-gray-300"
                    } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm text-black placeholder:text-gray-400`}
                    placeholder="Nome da região"
                  />
                  {formErrors.nome && (
                    <p className="mt-1 text-sm text-red-500">
                      {formErrors.nome}
                    </p>
                  )}
                </div>

                {/* Descrição */}
                <div>
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
                    value={formData.descricao}
                    onChange={handleInputChange}
                    className={`w-full p-2 border ${
                      formErrors.descricao
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm text-black placeholder:text-gray-400`}
                    placeholder="Descrição detalhada da região"
                  />
                  {formErrors.descricao && (
                    <p className="mt-1 text-sm text-red-500">
                      {formErrors.descricao}
                    </p>
                  )}
                </div>
              </div>

              {/* UF e Atendida pela empresa na linha de baixo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* UF */}
                <div>
                  <label
                    htmlFor="uf"
                    className="block text-sm font-medium text-[#7C54BD] mb-1"
                  >
                    UF<span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    id="uf"
                    name="uf"
                    value={formData.uf}
                    onChange={handleInputChange}
                    className={`w-full p-2 border ${
                      formErrors.uf ? "border-red-500" : "border-gray-300"
                    } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm text-black`}
                  >
                    {ufs.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                  {formErrors.uf && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.uf}</p>
                  )}
                </div>

                {/* Atendida pela empresa (Sim/Não) */}
                <div className="flex flex-col justify-end h-full">
                  <label
                    htmlFor="atendida_empresa"
                    className="block text-sm font-medium text-[#7C54BD] mb-1"
                  >
                    Região atendida pela empresa
                  </label>
                  <div className="flex items-center gap-4 mt-1">
                    <label className="flex items-center cursor-pointer">
                      <input
                        id="atendida_empresa_sim"
                        name="atendida_empresa"
                        type="radio"
                        checked={formData.atendida_empresa === true}
                        onChange={() =>
                          setFormData((prev) => ({
                            ...prev,
                            atendida_empresa: true,
                          }))
                        }
                        className="h-4 w-4 text-[#7C54BD] focus:ring-[#7C54BD] border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-900">Sim</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        id="atendida_empresa_nao"
                        name="atendida_empresa"
                        type="radio"
                        checked={formData.atendida_empresa === false}
                        onChange={() =>
                          setFormData((prev) => ({
                            ...prev,
                            atendida_empresa: false,
                          }))
                        }
                        className="h-4 w-4 text-[#7C54BD] focus:ring-[#7C54BD] border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-900">Não</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="mt-8 flex justify-end space-x-3 border-t border-gray-100 pt-6">
              <Link
                href="/admin/cadastro/regioes"
                className="px-5 py-2 bg-gray-100 text-[#7C54BD] rounded-md hover:bg-gray-200 transition-colors shadow-sm hover:shadow-md"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={savingData}
                className="px-5 py-2 bg-[#7C54BD] text-white rounded-md hover:bg-[#6743a1] transition-all flex items-center shadow-sm hover:shadow-md"
              >
                <Save size={18} className="mr-2" />
                {savingData ? "Salvando..." : "Salvar Região"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CadastrarRegiao;
