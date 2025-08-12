"use client";

import { pecasAPI } from "@/api/api";
import { useTitle } from "@/context/TitleContext";
import { Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Interface para o formulário
interface FormData {
  codigo_peca: string;
  descricao: string;
  unidade_medida: string;
  situacao?: string;
}

const CadastrarPeca = () => {
  const router = useRouter();
  const { setTitle } = useTitle();
  const [savingData, setSavingData] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Set page title when component mounts
  useEffect(() => {
    setTitle("Cadastro de Peça");
  }, [setTitle]);

  // Inicializar formulário com valores padrão
  const [formData, setFormData] = useState<FormData>({
    codigo_peca: "",
    descricao: "",
    unidade_medida: "PC", // Valor padrão
  });

  // Lista de unidades de medida comuns
  const unidadesMedida = [
    "PC",
    "UN",
    "KG",
    "G",
    "L",
    "ML",
    "M",
    "CM",
    "MM",
    "M²",
    "M³",
  ];

  // Manipular mudanças nos campos do formulário
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    let newValue = value;
    if (name === "codigo_peca") {
      newValue = value.toUpperCase();
    }
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: newValue }));
    }
    // Limpar erro do campo quando o usuário começa a digitar
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validar formulário antes de enviar
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.codigo_peca.trim()) {
      errors.codigo_peca = "Código da peça é obrigatório";
    }

    if (!formData.descricao.trim()) {
      errors.descricao = "Descrição é obrigatória";
    }

    if (!formData.unidade_medida) {
      errors.unidade_medida = "Unidade de medida é obrigatória";
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
      // Adiciona o campo situacao como 'A' antes de enviar para a API
      const pecaData = {
        ...formData,
        situacao: "A",
      };

      await pecasAPI.create(pecaData);
      alert("Peça cadastrada com sucesso!");
      router.push("/admin/cadastro/pecas");
    } catch (error) {
      console.error("Erro ao cadastrar peça:", error);
      alert("Erro ao cadastrar peça. Por favor, tente novamente.");
    } finally {
      setSavingData(false);
    }
  };

  return (
    <div className="px-2">
      <div className="max-w-8xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl border-t-4 border-[var(--primary)]">
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

            {/* Informações básicas da peça */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[var(--primary)] border-b-2 border-[var(--secondary-yellow)] pb-2 inline-block mb-4">
                Informações da Peça
              </h2>
              <div className="flex flex-wrap gap-4">
                {/* Código da peça */}
                <div className="w-[20%]">
                  <label
                    htmlFor="codigo_peca"
                    className="block text-sm font-medium text-[var(--primary)] mb-1"
                  >
                    Código da Peça<span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    id="codigo_peca"
                    name="codigo_peca"
                    value={formData.codigo_peca}
                    onChange={handleInputChange}
                    className={`w-full p-2 border h-[38px] ${
                      formErrors.codigo_peca
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all duration-200 shadow-sm text-black placeholder:text-gray-400`}
                    placeholder="Ex: RBB-PRFT"
                  />
                  {formErrors.codigo_peca && (
                    <p className="mt-1 text-sm text-red-500">
                      {formErrors.codigo_peca}
                    </p>
                  )}
                </div>

                {/* Descrição */}
                <div className="flex-1">
                  <label
                    htmlFor="descricao"
                    className="block text-sm font-medium text-[var(--primary)] mb-1"
                  >
                    Descrição<span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    id="descricao"
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleInputChange}
                    className={`w-full p-2 border h-[38px] ${
                      formErrors.descricao
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all duration-200 shadow-sm text-black placeholder:text-gray-400`}
                    placeholder="Ex: Rebinboca da Parafuseta"
                  />
                  {formErrors.descricao && (
                    <p className="mt-1 text-sm text-red-500">
                      {formErrors.descricao}
                    </p>
                  )}
                </div>

                {/* Unidade de Medida */}
                <div className="w-[15%]">
                  <label
                    htmlFor="unidade_medida"
                    className="block text-sm font-medium text-[var(--primary)] mb-1"
                  >
                    Unidade<span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    id="unidade_medida"
                    name="unidade_medida"
                    value={formData.unidade_medida}
                    onChange={handleInputChange}
                    className={`w-full p-2 border h-[38px] ${
                      formErrors.unidade_medida
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all duration-200 shadow-sm text-black appearance-none`}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: "right 0.5rem center",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "1.5em 1.5em",
                      paddingRight: "2.5rem",
                    }}
                  >
                    {unidadesMedida.map((unidade) => (
                      <option key={unidade} value={unidade}>
                        {unidade}
                      </option>
                    ))}
                  </select>
                  {formErrors.unidade_medida && (
                    <p className="mt-1 text-sm text-red-500">
                      {formErrors.unidade_medida}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Botões do formulário */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <Link
                href="/admin/cadastro/pecas"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200 font-medium flex items-center gap-2"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={savingData}
                className={`px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary)]/90 transition-colors duration-200 font-medium flex items-center gap-2 ${
                  savingData ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                <Save size={18} />
                {savingData ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CadastrarPeca;
