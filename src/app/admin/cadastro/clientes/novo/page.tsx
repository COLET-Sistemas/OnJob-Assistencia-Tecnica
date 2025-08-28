"use client";

import { clientesAPI, regioesAPI } from "@/api/api";
import { Loading } from "@/components/LoadingPersonalizado";
import LocationPicker from "@/components/admin/common/LocationPicker";
import StaticMap from "@/components/admin/common/StaticMap";
import { useTitle } from "@/context/TitleContext";
import { useToast } from "@/components/admin/ui/ToastContainer";
import PageHeader from "@/components/admin/ui/PageHeader";
import {
  InputField,
  SelectField,
  LoadingButton,
} from "@/components/admin/form";
import { FormData } from "@/types/admin/cadastro/clientes";
import { formatDocumento, validarDocumento } from "@/utils/formatters";
import { buscarCEP, formatarCEP } from "@/utils/cepAPI";
import { ESTADOS } from "@/utils/constants";
import { Save, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useRef } from "react";

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

interface FormErrors {
  [key: string]: string;
}

interface FormValidation {
  isValid: boolean;
  errors: FormErrors;
}

// Constants para facilitar manutenção
const MESSAGES = {
  success: "Cadastro realizado!",
  error: "Erro ao cadastrar cliente. Verifique os dados e tente novamente.",
  required: "Este campo é obrigatório",
  invalidCNPJ: "CPF/CNPJ inválido",
  invalidCEP: "CEP inválido",
  invalidRegion: "Selecione uma região válida",
} as const;

// Hook customizado para validação
const useFormValidation = () => {
  const validateForm = useCallback((formData: FormData): FormValidation => {
    const errors: FormErrors = {};

    if (!formData.nome_fantasia.trim())
      errors.nome_fantasia = MESSAGES.required;
    if (!formData.razao_social.trim()) errors.razao_social = MESSAGES.required;
    if (!formData.cnpj || !validarDocumento(formData.cnpj))
      errors.cnpj = MESSAGES.invalidCNPJ;
    if (!formData.endereco.trim()) errors.endereco = MESSAGES.required;
    if (!formData.numero.trim()) errors.numero = MESSAGES.required;
    if (!formData.bairro.trim()) errors.bairro = MESSAGES.required;
    if (!formData.cep || formData.cep.length < 9)
      errors.cep = MESSAGES.required;
    if (!formData.cidade.trim()) errors.cidade = MESSAGES.required;
    if (!formData.uf) errors.uf = MESSAGES.required;

    // Validação para região
    if (!formData.regiao || !formData.regiao.id) {
      errors.id_regiao = MESSAGES.invalidRegion;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }, []);

  return { validateForm };
};

const CadastrarCliente: React.FC = () => {
  const router = useRouter();
  const { setTitle } = useTitle();
  const { showSuccess, showError } = useToast();
  const { validateForm } = useFormValidation();

  // Estados
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [mapOpen, setMapOpen] = useState(false);
  const [showMapPreview, setShowMapPreview] = useState(false);

  // Refs
  const nomeFantasiaRef = useRef<HTMLInputElement>(null!);

  // Definir título da página e focar no primeiro input
  useEffect(() => {
    setTitle("Clientes");
    nomeFantasiaRef.current?.focus();
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

  // Função para buscar CEP usando o utilitário com múltiplas APIs
  const buscarCEPFormulario = useCallback(
    async (cep: string) => {
      if (!cep || cep.length !== 9) return;

      try {
        const dadosEndereco = await buscarCEP(cep);

        if (dadosEndereco) {
          setFormData((prev) => ({
            ...prev,
            endereco: dadosEndereco.logradouro,
            bairro: dadosEndereco.bairro,
            cidade: dadosEndereco.localidade,
            uf: dadosEndereco.uf,
            complemento: dadosEndereco.complemento,
          }));

          // Foca no campo de número após encontrar o CEP
          setTimeout(() => {
            const numeroField = document.getElementById("input-numero");
            if (numeroField) {
              numeroField.focus();
              // Scroll suave para o campo se necessário
              numeroField.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          }, 200);
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        showError(
          "Erro ao buscar CEP",
          "Não foi possível buscar o endereço pelo CEP usando as APIs disponíveis. Por favor, digite o endereço manualmente."
        );
      }
    },
    [showError]
  );

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
        "Preencha o cep, endereço, número, cidade e UF para obter as coordenadas."
      );
      return;
    }

    try {
      // Buscar coordenadas apenas quando o usuário clicar no botão
      const coordenadas = await buscarCoordenadas(
        formData.endereco,
        formData.numero,
        formData.cidade,
        formData.uf,
        formData.cep
      );

      // Se encontramos coordenadas, atualizamos o formulário
      if (coordenadas) {
        setFormData((prev) => ({
          ...prev,
          latitude: coordenadas.latitude,
          longitude: coordenadas.longitude,
        }));
        setShowMapPreview(true);
      }

      // Abrir o mapa para ajuste fino
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
  };

  // Manipular mudanças nos campos do formulário de forma otimizada
  const handleInputChange = useCallback(
    (
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
          buscarCEPFormulario(formattedCEP);
        }
      } else if (name === "cnpj") {
        setFormData((prev) => ({ ...prev, [name]: formatarCNPJ(value) }));
      } else if (name === "id_regiao") {
        // Atualiza o campo regiao com o objeto Regiao correspondente
        if (value === "" || value === "0") {
          setFormData((prev) => ({ ...prev, regiao: undefined }));
        } else {
          const regiaoId = parseInt(value, 10);
          const regiaoSelecionada = regioes.find((r) => r.id === regiaoId);
          setFormData((prev) => ({ ...prev, regiao: regiaoSelecionada }));
        }
      } else if (name === "numero") {
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Removido: busca automática de coordenadas
        // As coordenadas agora são buscadas apenas quando o usuário clicar em "Definir Localização no Mapa"
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      } // Limpar erro do campo quando usuário digitar (apenas se já existe erro)
      if (formErrors[name]) {
        setFormErrors((prev) => {
          const updated = { ...prev };
          delete updated[name];
          return updated;
        });
      }
    },
    [formErrors, regioes, buscarCEPFormulario]
  );

  // Validar formulário usando o hook personalizado
  const validarFormulario = useCallback(() => {
    const validation = validateForm(formData);
    setFormErrors(validation.errors);
    return validation.isValid;
  }, [formData, validateForm]);

  // Envio do formulário
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validarFormulario()) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      setIsSubmitting(true);

      try {
        // Formatar dados para envio conforme esperado pela API
        const clienteData = {
          codigo_erp: formData.codigo_erp || null,
          nome_fantasia: formData.nome_fantasia,
          razao_social: formData.razao_social,
          cnpj: formData.cnpj,
          endereco: formData.endereco,
          numero: formData.numero,
          complemento: formData.complemento || null,
          bairro: formData.bairro,
          cep: formData.cep,
          cidade: formData.cidade,
          uf: formData.uf,
          id_regiao: formData.regiao?.id ?? null,
          latitude:
            typeof formData.latitude === "string"
              ? parseFloat(formData.latitude)
              : formData.latitude ?? null,
          longitude:
            typeof formData.longitude === "string"
              ? parseFloat(formData.longitude)
              : formData.longitude ?? null,
          situacao: formData.situacao,
        };

        // Enviar para a API
        const response = await clientesAPI.create(clienteData);

        router.push("/admin/cadastro/clientes");

        showSuccess(MESSAGES.success, response);
      } catch (error) {
        console.error("Erro ao cadastrar cliente:", error);

        // Verificar se o erro contém uma mensagem específica da API
        if (error && typeof error === "object" && "erro" in error) {
          showError("Erro ao cadastrar", error.erro as string);
        } else if (error && typeof error === "object" && "message" in error) {
          showError("Erro ao cadastrar", error.message as string);
        } else if (typeof error === "string") {
          showError("Erro ao cadastrar", error);
        } else {
          showError(
            "Erro ao cadastrar",
            "Ocorreu um erro ao cadastrar o cliente. Tente novamente."
          );
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validarFormulario, router, showSuccess, showError]
  );

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
    <>
      <PageHeader
        title="Cadastro de Cliente"
        config={{
          type: "form",
          backLink: "/admin/cadastro/clientes",
          backLabel: "Voltar para lista de clientes",
        }}
      />

      <main>
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          noValidate
        >
          <div className="p-8">
            {/* Informações principais */}
            <section className="space-y-6 mb-8">
              <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-3">
                Informações Principais
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Razão Social"
                  name="razao_social"
                  value={formData.razao_social}
                  error={formErrors.razao_social}
                  placeholder="Razão social completa"
                  required
                  onChange={handleInputChange}
                />

                <InputField
                  label="Nome Fantasia"
                  name="nome_fantasia"
                  value={formData.nome_fantasia}
                  error={formErrors.nome_fantasia}
                  placeholder="Nome fantasia da empresa"
                  required
                  onChange={handleInputChange}
                  inputRef={nomeFantasiaRef}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField
                  label="CNPJ ou CPF"
                  name="cnpj"
                  value={formData.cnpj}
                  error={formErrors.cnpj}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  required
                  onChange={handleInputChange}
                />

                <InputField
                  label="Código ERP"
                  name="codigo_erp"
                  value={formData.codigo_erp || ""}
                  placeholder="Código interno do sistema ERP"
                  onChange={handleInputChange}
                />

                <SelectField
                  label="Região"
                  name="id_regiao"
                  value={formData.regiao?.id || ""}
                  error={formErrors.id_regiao}
                  required
                  onChange={handleInputChange}
                  options={[
                    { value: "", label: "Selecione uma região..." },
                    ...regioes.map((regiao) => ({
                      value: regiao.id,
                      label: `${regiao.nome} - ${regiao.uf}`,
                    })),
                  ]}
                />
              </div>
            </section>

            {/* Endereço */}
            <section className="space-y-6 mb-8">
              <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-3">
                Endereço
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField
                  label="CEP"
                  name="cep"
                  value={formData.cep}
                  error={formErrors.cep}
                  placeholder="00000-000"
                  required
                  onChange={handleInputChange}
                />

                <div className="md:col-span-2">
                  <InputField
                    label="Endereço"
                    name="endereco"
                    value={formData.endereco}
                    error={formErrors.endereco}
                    placeholder="Logradouro"
                    required
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                <div className="md:col-span-2">
                  <InputField
                    label="Cidade"
                    name="cidade"
                    value={formData.cidade}
                    error={formErrors.cidade}
                    placeholder="Cidade"
                    required
                    onChange={handleInputChange}
                  />
                </div>

                <div className="md:col-span-2">
                  <InputField
                    label="Bairro"
                    name="bairro"
                    value={formData.bairro}
                    error={formErrors.bairro}
                    placeholder="Bairro"
                    required
                    onChange={handleInputChange}
                  />
                </div>

                <div className="md:col-span-2">
                  <SelectField
                    label="UF"
                    name="uf"
                    value={formData.uf}
                    error={formErrors.uf}
                    required
                    onChange={handleInputChange}
                    options={ESTADOS}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <InputField
                  label="Número"
                  name="numero"
                  value={formData.numero}
                  error={formErrors.numero}
                  placeholder="Nº"
                  required
                  onChange={handleInputChange}
                />

                <div className="md:col-span-3">
                  <InputField
                    label="Complemento"
                    name="complemento"
                    value={formData.complemento || ""}
                    placeholder="Apto, Bloco, Sala, etc."
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </section>

            {/* Localização */}
            <section className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-3">
                Localização Geográfica
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={atualizarCoordenadas}
                    className="w-full px-4 py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <MapPin className="h-5 w-5" />
                    Definir Localização no Mapa
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="Latitude"
                      name="latitude"
                      value={formData.latitude?.toString() || ""}
                      placeholder="Ex: -30.0346"
                      onChange={handleInputChange}
                      readOnly
                    />

                    <InputField
                      label="Longitude"
                      name="longitude"
                      value={formData.longitude?.toString() || ""}
                      placeholder="Ex: -51.2177"
                      onChange={handleInputChange}
                      readOnly
                    />
                  </div>

                  {formData.latitude && formData.longitude && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700 font-medium mb-1">
                        ✅ Coordenadas definidas
                      </p>
                    </div>
                  )}
                </div>

                {showMapPreview && formData.latitude && formData.longitude && (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-slate-700">
                      Localização no Mapa:
                    </p>
                    <StaticMap
                      latitude={parseFloat(formData.latitude.toString())}
                      longitude={parseFloat(formData.longitude.toString())}
                      className="w-full h-[300px]"
                    />
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Footer com botões */}
          <footer className="bg-slate-50 px-8 py-6 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Link
                href="/admin/cadastro/clientes"
                className="px-6 py-3 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors text-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                Cancelar
              </Link>

              <LoadingButton
                type="submit"
                isLoading={isSubmitting}
                className="bg-[var(--primary)] text-white hover:bg-violet-700 focus:ring-violet-500 shadow-sm"
              >
                <span className="flex items-center justify-center gap-2">
                  <Save className="h-4 w-4" />
                  <span>Salvar Cliente</span>
                </span>
              </LoadingButton>
            </div>
          </footer>
        </form>
      </main>

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
    </>
  );
};

export default CadastrarCliente;
