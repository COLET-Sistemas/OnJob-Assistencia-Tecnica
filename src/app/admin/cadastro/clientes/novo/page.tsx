"use client";

import { clientesAPI, regioesAPI } from "@/api/api";
import { Loading } from "@/components/LoadingPersonalizado";
import LocationPicker from "@/components/admin/common/LocationPicker";
import StaticMap from "@/components/admin/common/StaticMap";
import { useTitle } from "@/context/TitleContext";
import { useToast } from "@/components/admin/ui/ToastContainer";
import { FormData } from "@/types/admin/cadastro/clientes";
import { formatDocumento } from "@/utils/formatters";
import { Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

// Interface para tipagem das regiões
interface Regiao {
  id: number;
  nome: string;
  descricao: string;
  uf: string;
  atendida_empresa: boolean;
  situacao: string;
  data_cadastro: string;
  id_usuario_cadastro: number;
}

const CadastrarCliente = () => {
  const router = useRouter();
  const { setTitle } = useTitle();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [savingData, setSavingData] = useState(false);
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [mapOpen, setMapOpen] = useState(false);
  const [showMapPreview, setShowMapPreview] = useState(false);
  const [hasShownLocationToast, setHasShownLocationToast] = useState(false);

  useEffect(() => {
    setTitle("Cadastro de Cliente");
  }, [setTitle]);

  const [formData, setFormData] = useState<FormData>({
    codigo_erp: "",
    nome_fantasia: "",
    razao_social: "",
    cnpj: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cep: "",
    cidade: "",
    uf: "RS",
    latitude: undefined,
    longitude: undefined,
    situacao: "A",
    regiao: undefined,
  });

  // Carregar as regiões disponíveis - usando useRef para evitar duplo disparo no Strict Mode
  const carregouRegioes = useRef(false);
  useEffect(() => {
    if (carregouRegioes.current) return;
    carregouRegioes.current = true;
    const carregarRegioes = async () => {
      setLoading(true);
      try {
        const response = await regioesAPI.getAll();
        const regioesAtivas = (response || []).filter(
          (regiao: Regiao) => regiao.situacao === "A"
        );
        regioesAtivas.sort((a: Regiao, b: Regiao) =>
          a.nome.localeCompare(b.nome)
        );
        setRegioes(regioesAtivas);
      } catch (error) {
        console.error("Erro ao carregar regiões:", error);
        showError("Erro ao carregar regiões", error as Record<string, unknown>);
      } finally {
        setLoading(false);
      }
    };
    carregarRegioes();
  }, [showError]);

  useEffect(() => {
    if (formData.latitude && formData.longitude) {
      setShowMapPreview(true);
    }
  }, [formData.latitude, formData.longitude]);

  interface ViaCEPResponse {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    localidade: string;
    uf: string;
    erro?: boolean;
  }

  const buscarCoordenadas = async (
    endereco: string,
    numero: string,
    cidade: string,
    uf: string,
    cep: string
  ) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        console.warn("Chave de API do Google Maps não encontrada");
        return null;
      }

      // Formata o endereço completo para a API do Google
      const enderecoCompleto = `${endereco}, ${numero}, ${cidade}, ${uf}, ${cep}, Brasil`;

      // Codifica os parâmetros da URL
      const enderecoEncoded = encodeURIComponent(enderecoCompleto);

      // Faz a chamada para a API de Geocoding do Google
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${enderecoEncoded}&key=${apiKey}`
      );
      const data = await response.json();

      // Verifica se a requisição foi bem-sucedida e se há resultados
      if (data.status === "OK" && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        return { latitude: lat.toString(), longitude: lng.toString() };
      } else {
        console.warn("Não foi possível obter as coordenadas:", data.status);
        return null;
      }
    } catch (error) {
      console.error("Erro ao buscar coordenadas:", error);
      return null;
    }
  };

  // Função para buscar CEP e preencher dados do endereço usando BrasilAPI e Google Maps
  const buscarCEP = async (cep: string) => {
    if (!cep || cep.length !== 9) return;

    // Remove caracteres não numéricos
    const cepNumerico = cep.replace(/\D/g, "");

    if (cepNumerico.length !== 8) return;

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cepNumerico}/json/`
      );
      const data: ViaCEPResponse = await response.json();

      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          endereco: data.logradouro || "",
          bairro: data.bairro || "",
          cidade: data.localidade || "",
          uf: data.uf || "",
          complemento: data.complemento || "",
        }));

        // Foca no campo de número após encontrar o CEP
        setTimeout(() => {
          document.getElementById("numero")?.focus();
        }, 100);
      } else {
        throw new Error("CEP não encontrado");
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      showError(
        "Erro ao buscar CEP",
        "Não foi possível buscar o endereço pelo CEP. Por favor, digite manualmente."
      );
    }
  };

  // Formatar o campo de CEP automaticamente
  const formatarCEP = (cep: string) => {
    // Remove caracteres não numéricos
    cep = cep.replace(/\D/g, "");

    // Adiciona a formatação
    if (cep.length > 5) {
      cep = `${cep.slice(0, 5)}-${cep.slice(5, 8)}`;
    }

    return cep;
  };

  // Formatar CNPJ automaticamente
  const formatarCNPJ = (value: string) => {
    return formatDocumento(value);
  };

  // Função para atualizar as coordenadas usando o Google Maps
  const atualizarCoordenadas = async () => {
    // Verificar se tem os dados necessários para buscar as coordenadas
    if (
      !formData.endereco ||
      !formData.numero ||
      !formData.cidade ||
      !formData.uf
    ) {
      showError(
        "Campos obrigatórios",
        "Preencha o endereço, número, cidade e UF para obter as coordenadas."
      );
      return;
    }

    try {
      // Se não temos coordenadas ainda, tentar buscá-las
      if (!formData.latitude || !formData.longitude) {
        // Buscar coordenadas iniciais para posicionar o mapa
        const coordenadas = await buscarCoordenadas(
          formData.endereco,
          formData.numero,
          formData.cidade,
          formData.uf,
          formData.cep
        );

        // Se encontramos coordenadas, atualizamos o formulário primeiro
        if (coordenadas) {
          setFormData((prev) => ({
            ...prev,
            latitude: coordenadas.latitude,
            longitude: coordenadas.longitude,
          }));
          setShowMapPreview(true);

          // Consideramos que o usuário já viu a mensagem sobre localização encontrada
          setHasShownLocationToast(true);
        }
      }

      // Abrir o mapa para ajuste fino, independente de ter encontrado coordenadas iniciais ou não
      setMapOpen(true);
    } catch (error) {
      console.error("Erro ao atualizar coordenadas:", error);
      showError("Erro ao buscar coordenadas", error as Record<string, unknown>);
    }
  };

  // Função chamada quando o usuário confirma a localização no mapa
  const handleLocationSelected = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
    setShowMapPreview(true);
    showSuccess("Sucesso", "Coordenadas atualizadas com sucesso!");
    setHasShownLocationToast(true);
  };

  // Manipular mudanças nos campos do formulário - REFATORADO
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Lógica específica para alguns campos
    if (name === "cep") {
      const formattedCEP = formatarCEP(value);
      setFormData((prev) => ({ ...prev, [name]: formattedCEP }));

      // Buscar CEP automaticamente quando completar
      if (formattedCEP.length === 9) {
        buscarCEP(formattedCEP);
      }
    } else if (name === "cnpj") {
      setFormData((prev) => ({ ...prev, [name]: formatarCNPJ(value) }));
    } else if (name === "id_regiao") {
      // Atualiza o campo regiao com o objeto Regiao correspondente
      const regiaoId = parseInt(value, 10);
      const regiaoSelecionada = regioes.find((r) => r.id === regiaoId);
      setFormData((prev) => ({ ...prev, regiao: regiaoSelecionada }));
    } else if (name === "numero") {
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Se o número for preenchido e temos o endereço completo, tenta buscar as coordenadas
      if (
        value &&
        formData.endereco &&
        formData.cidade &&
        formData.uf &&
        formData.cep
      ) {
        // Tentamos buscar coordenadas automaticamente e então abrimos o mapa para o ajuste fino
        setTimeout(() => {
          buscarCoordenadas(
            formData.endereco,
            value,
            formData.cidade,
            formData.uf,
            formData.cep
          )
            .then((coordenadas) => {
              if (coordenadas) {
                setFormData((prev) => ({
                  ...prev,
                  latitude: coordenadas.latitude,
                  longitude: coordenadas.longitude,
                }));
                // Mostrar o preview do mapa em vez de abrir o modal automaticamente
                setShowMapPreview(true);

                // Mostrar toast apenas se não foi mostrado antes
                if (!hasShownLocationToast) {
                  showSuccess(
                    "Localização encontrada",
                    "Visualize no mapa à direita."
                  );
                  setHasShownLocationToast(true);
                }
              }
            })
            .catch((err) =>
              console.error("Erro ao buscar coordenadas automaticamente:", err)
            );
        }, 1000);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
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

  // Validar formulário - REFATORADO
  const validarFormulario = () => {
    const errors: Record<string, string> = {};

    if (!formData.nome_fantasia) errors.nome_fantasia = "Campo obrigatório";
    if (!formData.razao_social) errors.razao_social = "Campo obrigatório";
    if (!formData.cnpj || formData.cnpj.length < 18)
      errors.cnpj = "CNPJ inválido";
    if (!formData.endereco) errors.endereco = "Campo obrigatório";
    if (!formData.numero) errors.numero = "Campo obrigatório";
    if (!formData.bairro) errors.bairro = "Campo obrigatório";
    if (!formData.cep || formData.cep.length < 9) errors.cep = "CEP inválido";
    if (!formData.cidade) errors.cidade = "Campo obrigatório";
    if (!formData.uf) errors.uf = "Campo obrigatório";

    // Validação aprimorada para região
    if (!formData.regiao || !formData.regiao.id) {
      errors.id_regiao = "Selecione uma região válida";
    } else {
      // Verifica se a região selecionada ainda existe e está ativa
      const regiaoExiste = regioes.find(
        (r) => r.id === formData.regiao?.id && r.situacao === "A"
      );
      if (!regiaoExiste) {
        errors.id_regiao = "Região selecionada não é válida";
      }
    }

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
      // Formatar dados para envio
      const clienteData = {
        ...formData,
        latitude:
          typeof formData.latitude === "string"
            ? parseFloat(formData.latitude)
            : formData.latitude ?? null,
        longitude:
          typeof formData.longitude === "string"
            ? parseFloat(formData.longitude)
            : formData.longitude ?? null,
        id_regiao: formData.regiao?.id ?? null,
      };

      // Enviar para a API
      const response = await clientesAPI.create(clienteData);

      showSuccess(
        "Sucesso",
        response // Passa a resposta diretamente, o ToastContainer extrai a mensagem
      );

      // Redirecionar para a lista de clientes
      router.push("/admin/cadastro/clientes");
    } catch (error) {
      console.error("Erro ao cadastrar cliente:", error);

      showError(
        "Erro ao cadastrar",
        error as Record<string, unknown> // Passa o erro diretamente, o ToastContainer extrai a mensagem
      );
    } finally {
      setSavingData(false);
    }
  };

  if (loading) {
    return (
      <Loading
        fullScreen={true}
        preventScroll={false}
        text="Carregando cadastro cliente..."
        size="large"
      />
    );
  }

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"></div>
        {/* Informações principais */}
        <div className="space-y-4 md:col-span-2">
          <h2 className="text-lg font-semibold text-[#7C54BD] border-b-2 border-[#F6C647] pb-2 inline-block">
            Informações Principais
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Razão Social */}
            <div>
              <label
                htmlFor="razao_social"
                className="block text-sm font-medium text-[#7C54BD] mb-1"
              >
                Razão Social<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                id="razao_social"
                name="razao_social"
                placeholder="Razão social completa"
                value={formData.razao_social}
                onChange={handleInputChange}
                className={`w-full p-2 border ${
                  formErrors.razao_social ? "border-red-500" : "border-gray-300"
                } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
              />
              {formErrors.razao_social && (
                <p className="mt-1 text-sm text-red-500">
                  {formErrors.razao_social}
                </p>
              )}
            </div>
            {/* Nome Fantasia */}
            <div>
              <label
                htmlFor="nome_fantasia"
                className="block text-sm font-medium text-[#7C54BD] mb-1"
              >
                Nome Fantasia<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                id="nome_fantasia"
                name="nome_fantasia"
                placeholder="Nome fantasia da empresa"
                value={formData.nome_fantasia}
                onChange={handleInputChange}
                className={`w-full p-2 border ${
                  formErrors.nome_fantasia
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
              />
              {formErrors.nome_fantasia && (
                <p className="mt-1 text-sm text-red-500">
                  {formErrors.nome_fantasia}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CNPJ */}
            <div>
              <label
                htmlFor="cnpj"
                className="block text-sm font-medium text-[#7C54BD] mb-1"
              >
                CNPJ ou CPF<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                id="cnpj"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleInputChange}
                maxLength={18}
                placeholder="00.000.000/0000-00"
                className={`w-full p-2 border ${
                  formErrors.cnpj ? "border-red-500" : "border-gray-300"
                } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
              />
              <p className="mt-1 text-xs text-gray-500">
                Digite apenas números, a formatação é automática
              </p>
              {formErrors.cnpj && (
                <p className="mt-1 text-sm text-red-500">{formErrors.cnpj}</p>
              )}
            </div>

            {/* Código ERP */}
            <div>
              <label
                htmlFor="codigo_erp"
                className="block text-sm font-medium text-[#7C54BD] mb-1"
              >
                Código ERP
              </label>
              <input
                type="text"
                id="codigo_erp"
                name="codigo_erp"
                placeholder="Código interno do sistema ERP"
                value={formData.codigo_erp}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black"
              />
            </div>

            {/* Região - REFATORADO */}
            <div className="md:col-span-1">
              <label
                htmlFor="id_regiao"
                className="block text-sm font-medium text-[#7C54BD] mb-1"
              >
                Região<span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <select
                  id="id_regiao"
                  name="id_regiao"
                  value={formData.regiao?.id || 0}
                  onChange={handleInputChange}
                  className={`w-full p-2 border ${
                    formErrors.id_regiao ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm appearance-none text-black`}
                >
                  <option value={0}>Selecione uma região</option>
                  {regioes.map((regiao) => (
                    <option key={regiao.id} value={regiao.id}>
                      {regiao.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4 md:col-span-2">
            <h2 className="text-lg font-semibold text-[#7C54BD] border-b-2 border-[#F6C647] pb-2 inline-block">
              Endereço
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* CEP */}
              <div>
                <label
                  htmlFor="cep"
                  className="block text-sm font-medium text-[#7C54BD] mb-1"
                >
                  CEP<span className="text-red-500 ml-1">*</span>
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="cep"
                    name="cep"
                    value={formData.cep}
                    onChange={handleInputChange}
                    maxLength={9}
                    placeholder="00000-000"
                    className={`w-full p-2 border ${
                      formErrors.cep ? "border-red-500" : "border-gray-300"
                    } rounded-l-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
                  />
                  <button
                    type="button"
                    onClick={() => buscarCEP(formData.cep)}
                    className="bg-[#7C54BD] text-white px-4 rounded-r-md hover:bg-[#6743a1] transition-colors flex items-center justify-center group"
                    title="Buscar endereço automaticamente pelo CEP"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 group-hover:scale-110 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Digite apenas números, a formatação é automática
                </p>
                {formErrors.cep && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.cep}</p>
                )}
              </div>

              {/* Endereço */}
              <div className="md:col-span-2">
                <label
                  htmlFor="endereco"
                  className="block text-sm font-medium text-[#7C54BD] mb-1"
                >
                  Endereço<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="endereco"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleInputChange}
                  placeholder="Logradouro"
                  className={`w-full p-2 border ${
                    formErrors.endereco ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
                />
                {formErrors.endereco && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.endereco}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {/* Cidade */}
              <div className="md:col-span-3">
                <label
                  htmlFor="cidade"
                  className="block text-sm font-medium text-[#7C54BD] mb-1"
                >
                  Cidade<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="cidade"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleInputChange}
                  placeholder="Cidade"
                  className={`w-full p-2 border ${
                    formErrors.cidade ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
                />
                {formErrors.cidade && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.cidade}
                  </p>
                )}
              </div>
              {/* Bairro */}
              <div className="md:col-span-2">
                <label
                  htmlFor="bairro"
                  className="block text-sm font-medium text-[#7C54BD] mb-1"
                >
                  Bairro<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="bairro"
                  name="bairro"
                  value={formData.bairro}
                  onChange={handleInputChange}
                  placeholder="Bairro"
                  className={`w-full p-2 border ${
                    formErrors.bairro ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
                />
                {formErrors.bairro && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.bairro}
                  </p>
                )}
              </div>

              {/* UF */}
              <div className="md:col-span-1">
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
                  } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm appearance-none text-black`}
                >
                  <option value="AC">AC</option>
                  <option value="AL">AL</option>
                  <option value="AP">AP</option>
                  <option value="AM">AM</option>
                  <option value="BA">BA</option>
                  <option value="CE">CE</option>
                  <option value="DF">DF</option>
                  <option value="ES">ES</option>
                  <option value="GO">GO</option>
                  <option value="MA">MA</option>
                  <option value="MT">MT</option>
                  <option value="MS">MS</option>
                  <option value="MG">MG</option>
                  <option value="PA">PA</option>
                  <option value="PB">PB</option>
                  <option value="PR">PR</option>
                  <option value="PE">PE</option>
                  <option value="PI">PI</option>
                  <option value="RJ">RJ</option>
                  <option value="RN">RN</option>
                  <option value="RS">RS</option>
                  <option value="RO">RO</option>
                  <option value="RR">RR</option>
                  <option value="SC">SC</option>
                  <option value="SP">SP</option>
                  <option value="SE">SE</option>
                  <option value="TO">TO</option>
                </select>
                {formErrors.uf && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.uf}</p>
                )}
              </div>
              {/* Número */}
              <div className="md:col-span-1">
                <label
                  htmlFor="numero"
                  className="block text-sm font-medium text-[#7C54BD] mb-1"
                >
                  Número<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="numero"
                  name="numero"
                  value={formData.numero}
                  onChange={handleInputChange}
                  placeholder="Nº"
                  className={`w-full p-2 border ${
                    formErrors.numero ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
                />
                {formErrors.numero && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.numero}
                  </p>
                )}
              </div>

              {/* Complemento */}
              <div className="md:col-span-3">
                <label
                  htmlFor="complemento"
                  className="block text-sm font-medium text-[#7C54BD] mb-1"
                >
                  Complemento
                </label>
                <input
                  type="text"
                  id="complemento"
                  name="complemento"
                  value={formData.complemento}
                  onChange={handleInputChange}
                  placeholder="Apto, Bloco, Sala, etc."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black"
                />
              </div>
            </div>
          </div>

          {/* Localização */}
          <div className="space-y-4 md:col-span-2">
            <h2 className="text-lg font-semibold text-[#7C54BD] border-b-2 border-[#F6C647] pb-2 inline-block">
              Localização Geográfica
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lado esquerdo - Informações de Latitude e Longitude */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* Latitude */}
                  <div>
                    <label
                      htmlFor="latitude"
                      className="block text-sm font-medium text-[#7C54BD] mb-1"
                    >
                      Latitude
                    </label>
                    <input
                      type="text"
                      id="latitude"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      disabled
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black"
                    />
                  </div>

                  {/* Longitude */}
                  <div>
                    <label
                      htmlFor="longitude"
                      className="block text-sm font-medium text-[#7C54BD] mb-1"
                    >
                      Longitude
                    </label>
                    <input
                      type="text"
                      id="longitude"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      disabled
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black"
                    />
                  </div>

                  {/* Botão para buscar coordenadas pelo Google Maps */}
                  <div>
                    <button
                      type="button"
                      onClick={atualizarCoordenadas}
                      className={`w-full p-2 rounded-md flex items-center justify-center gap-2 mt-6 transition-colors
                                              ${
                                                !formData.endereco ||
                                                !formData.numero ||
                                                !formData.cidade ||
                                                !formData.uf
                                                  ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-70"
                                                  : "bg-[#7C54BD] text-white hover:bg-[#6743a1]"
                                              }`}
                      disabled={
                        !formData.endereco ||
                        !formData.numero ||
                        !formData.cidade ||
                        !formData.uf
                      }
                      title={
                        !formData.endereco ||
                        !formData.numero ||
                        !formData.cidade ||
                        !formData.uf
                          ? "Preencha todos os campos de endereço para ajustar no mapa"
                          : "Abrir mapa para ajustar localização precisa"
                      }
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      {!formData.endereco ||
                      !formData.numero ||
                      !formData.cidade ||
                      !formData.uf
                        ? "Preencha os campos de endereço"
                        : "Ajustar Localização no Mapa"}
                    </button>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      Preencha o endereço completo e clique para ajustar a
                      localização exata
                    </p>
                  </div>
                </div>
              </div>

              {/* Lado direito - Mapa Estático */}
              <div className="flex flex-col gap-2">
                <div className="h-[250px] relative rounded-md overflow-hidden shadow-md">
                  {showMapPreview &&
                  formData.latitude !== undefined &&
                  formData.longitude !== undefined ? (
                    <StaticMap
                      latitude={
                        typeof formData.latitude === "string"
                          ? parseFloat(formData.latitude)
                          : formData.latitude
                      }
                      longitude={
                        typeof formData.longitude === "string"
                          ? parseFloat(formData.longitude)
                          : formData.longitude
                      }
                      className="h-full"
                    />
                  ) : (
                    <div className="h-full bg-gray-100 flex items-center justify-center">
                      <div className="text-center p-6">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12 text-gray-400 mx-auto mb-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                          />
                        </svg>
                        <p className="text-gray-500">
                          Localização não definida.
                          <br />
                          Preencha o endereço completo.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="mt-8 flex justify-end space-x-3">
          <Link
            href="/admin/cadastro/clientes"
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
                Salvar Cliente
              </>
            )}
          </button>
        </div>
      </form>

      {/* Seletor de Localização no Mapa */}
      <LocationPicker
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        initialLat={
          typeof formData.latitude === "string"
            ? parseFloat(formData.latitude)
            : formData.latitude ?? null
        }
        initialLng={
          typeof formData.longitude === "string"
            ? parseFloat(formData.longitude)
            : formData.longitude ?? null
        }
        address={`${formData.endereco}, ${formData.numero}, ${formData.cidade}, ${formData.uf}, ${formData.cep}, Brasil`}
        onLocationSelected={handleLocationSelected}
      />
    </div>
  );
};

export default CadastrarCliente;
