"use client";

import { clientesService, regioesService } from "@/api/services";
import { Loading } from "@/components/LoadingPersonalizado";
import LocationPicker from "@/components/admin/common/LocationPicker";
import StaticMap from "@/components/admin/common/StaticMap";
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
import { MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useState, useRef } from "react";

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

interface ApiError {
  erro?: string;
  message?: string;
}

// Constants para facilitar manutenção
const MESSAGES = {
  success: "Atualizado com sucesso!",
  error: "Erro ao atualizar cliente. Verifique os dados e tente novamente.",
  required: "Este campo é obrigatório",
  invalidCNPJ: "CPF/CNPJ inválido",
  invalidCEP: "CEP inválido",
  invalidRegion: "Selecione uma região válida",
  notFound: "Cliente não encontrado",
  loadError: "Erro ao carregar dados do cliente",
} as const;

// Hook customizado para validação
const useFormValidation = () => {
  const validateForm = useCallback((formData: FormData): FormValidation => {
    const errors: FormErrors = {};

    if (!formData.nome_fantasia.trim())
      errors.nome_fantasia = MESSAGES.required;
    if (!formData.razao_social.trim()) errors.razao_social = MESSAGES.required;
    if (!formData.codigo_erp?.trim()) errors.codigo_erp = MESSAGES.required;
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
    const selectedRegionId =
      formData.id_regiao ?? formData.regiao?.id ?? undefined;
    if (!selectedRegionId) {
      errors.id_regiao = MESSAGES.invalidRegion;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }, []);

  return { validateForm };
};

const EditarCliente: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const clienteId = params.id as string;

  const { showSuccess, showError } = useToast();
  const { validateForm } = useFormValidation();

  // Estados
  const [loading, setLoading] = useState(true);
  const [regioesLoading, setRegioesLoading] = useState(false);
  const [regioesInitialized, setRegioesInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [mapOpen, setMapOpen] = useState(false);
  const [showMapPreview, setShowMapPreview] = useState(false);
  const [clienteCarregado, setClienteCarregado] = useState(false);

  const nomeRazaoSocialRef = useRef<HTMLInputElement>(null!);

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
    id_regiao: undefined,
    regiao: undefined,
  });

  // Helper function to check if error is ApiError
  const isApiError = (error: unknown): error is ApiError => {
    return (
      typeof error === "object" &&
      error !== null &&
      ("erro" in error || "message" in error)
    );
  };

  // Helper function to get error message
  const getErrorMessage = useCallback(
    (error: unknown, defaultMessage: string): string => {
      if (isApiError(error)) {
        return error.erro || error.message || defaultMessage;
      }
      if (typeof error === "string") {
        return error;
      }
      return defaultMessage;
    },
    []
  );

  // Carregar dados do cliente
  const carregouCliente = useRef(false);
  useEffect(() => {
    if (carregouCliente.current) return;
    carregouCliente.current = true;

    const carregarCliente = async () => {
      try {
        const response = await clientesService.getById(clienteId);
        const cliente = response.dados[0];

        if (cliente) {
          const regiaoFormatada = cliente.regiao
            ? {
                id: cliente.regiao.id_regiao || cliente.regiao.id,
                nome: cliente.regiao.nome_regiao || cliente.regiao.nome,
                atendida_empresa:
                  cliente.regiao.atendida_empresa ||
                  cliente.regiao.atendida_pela_empresa ||
                  false,
                situacao: cliente.regiao.situacao || "A",
                descricao: cliente.regiao.descricao || "",
                uf: cliente.regiao.uf || "",
                data_cadastro: cliente.regiao.data_cadastro || "",
                id_usuario_cadastro: cliente.regiao.id_usuario_cadastro || 0,
              }
            : undefined;

          // Atualizar o estado do formulário com os dados do cliente
          setFormData({
            id: cliente.id_cliente,
            codigo_erp: cliente.codigo_erp || "",
            nome_fantasia: cliente.nome_fantasia || "",
            razao_social: cliente.razao_social || "",
            cnpj: cliente.cnpj || "",
            endereco: cliente.endereco || "",
            numero: cliente.numero || "",
            complemento: cliente.complemento || "",
            bairro: cliente.bairro || "",
            cep: cliente.cep || "",
            cidade: cliente.cidade || "",
            uf: cliente.uf || "RS",
            latitude: cliente.latitude,
            longitude: cliente.longitude,
            situacao: cliente.situacao || "A",
            id_regiao: cliente.id_regiao ?? regiaoFormatada?.id,
            regiao: regiaoFormatada,
            contatos: cliente.contatos,
          });

          // Se tiver coordenadas, mostrar o mapa
          if (cliente.latitude && cliente.longitude) {
            setShowMapPreview(true);
          }

          setClienteCarregado(true);
        } else {
          showError(MESSAGES.notFound, "Cliente não encontrado ou excluído");
          router.push("/admin/cadastro/clientes");
        }
      } catch (error) {
        console.error("Erro ao carregar dados do cliente:", error);
        const errorMessage = getErrorMessage(
          error,
          "Ocorreu um erro ao carregar os dados do cliente. Tente novamente."
        );
        showError(MESSAGES.loadError, errorMessage);
        router.push("/admin/cadastro/clientes");
      } finally {
        setLoading(false);
      }
    };

    if (clienteId) {
      carregarCliente();
    }
  }, [clienteId, router, showError, getErrorMessage]);

  // Carregar as regiões disponíveis
  const regioesCache = useRef<Record<string, Regiao[]>>({});

  const aplicarRegioes = useCallback((listaRegioes: Regiao[]) => {
    setRegioes(listaRegioes);

    setFormData((prev) => {
      const regiaoAtual = listaRegioes.find(
        (regiao) => regiao.id === prev.id_regiao
      );

      if (listaRegioes.length === 1) {
        const unicaRegiao = listaRegioes[0];

        if (prev.id_regiao === unicaRegiao.id) {
          return prev.regiao?.id === unicaRegiao.id
            ? prev
            : { ...prev, regiao: unicaRegiao };
        }

        return {
          ...prev,
          id_regiao: unicaRegiao.id,
          regiao: unicaRegiao,
        };
      }

      if (regiaoAtual) {
        return prev.regiao?.id === regiaoAtual.id
          ? prev
          : { ...prev, regiao: regiaoAtual };
      }

      if (prev.id_regiao || prev.regiao) {
        return { ...prev, id_regiao: undefined, regiao: undefined };
      }

      return prev;
    });

    if (listaRegioes.length === 1) {
      setFormErrors((prev) => {
        if (!prev.id_regiao) return prev;
        const updated = { ...prev };
        delete updated.id_regiao;
        return updated;
      });
    }
  }, []);

  const carregarRegioesPorUF = useCallback(
    async (uf: string) => {
      if (!uf) {
        aplicarRegioes([]);
        setRegioesInitialized(true);
        return;
      }

      const cache = regioesCache.current[uf];
      if (cache) {
        aplicarRegioes(cache);
        setRegioesInitialized(true);
        return;
      }

      setRegioesLoading(true);

      try {
        const response = await regioesService.getAll({ uf });
        const regioesAtivas = (response || [])
          .filter((regiao: Regiao) => regiao.situacao === "A")
          .sort((a: Regiao, b: Regiao) => a.nome.localeCompare(b.nome));

        regioesCache.current[uf] = regioesAtivas;
        aplicarRegioes(regioesAtivas);
      } catch (error) {
        console.error("Erro ao carregar regiões:", error);
        const errorMessage = getErrorMessage(
          error,
          "Não foi possível carregar as regiões. Tente novamente mais tarde."
        );
        showError("Erro ao carregar regiões", errorMessage);
        aplicarRegioes([]);
      } finally {
        setRegioesLoading(false);
        setRegioesInitialized(true);
      }
    },
    [aplicarRegioes, showError, getErrorMessage]
  );

  useEffect(() => {
    if (!clienteCarregado) return;
    carregarRegioesPorUF(formData.uf);
  }, [clienteCarregado, formData.uf, carregarRegioesPorUF]);

  // Foca no primeiro campo quando o cliente for carregado
  useEffect(() => {
    if (clienteCarregado && !loading) {
      nomeRazaoSocialRef.current?.focus();
    }
  }, [clienteCarregado, loading]);

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
  ): Promise<{ latitude: string; longitude: string } | null> => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        console.warn("Chave de API do Google Maps não encontrada");
        return null;
      }

      // Formata o endereço completo para a API do Google
      const enderecoCompleto = `${endereco}, ${numero}, ${cidade}, ${uf}, ${cep}, Brasil`;
      const enderecoEncoded = encodeURIComponent(enderecoCompleto);

      // Faz a chamada para a API de Geocoding do Google
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${enderecoEncoded}&key=${apiKey}`
      );
      const data = await response.json();

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
          setFormData((prev) => {
            const ufEncontrada = dadosEndereco.uf || prev.uf;
            const ufAlterada =
              ufEncontrada && ufEncontrada !== prev.uf ? ufEncontrada : null;

            return {
              ...prev,
              endereco: dadosEndereco.logradouro,
              bairro: dadosEndereco.bairro,
              cidade: dadosEndereco.localidade,
              uf: ufEncontrada,
              complemento: dadosEndereco.complemento,
              ...(ufAlterada
                ? { id_regiao: undefined, regiao: undefined }
                : {}),
            };
          });

          // Foca no campo de número após encontrar o CEP
          setTimeout(() => {
            const numeroField = document.getElementById("input-numero");
            if (numeroField) {
              numeroField.focus();
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
    if (!formData.endereco || !formData.cidade || !formData.uf) {
      showError(
        "Campos obrigatórios",
        "Preencha o cep, endereço, cidade e UF para obter as coordenadas."
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
          latitude: parseFloat(coordenadas.latitude), // ou já deixar como number
          longitude: parseFloat(coordenadas.longitude),
        }));
        setShowMapPreview(true);
      }

      // Abrir o mapa para ajuste fino
      setMapOpen(true);
    } catch (error) {
      console.error("Erro ao atualizar coordenadas:", error);
      const errorMessage = getErrorMessage(
        error,
        "Não foi possível obter as coordenadas. Verifique o endereço e tente novamente."
      );
      showError("Erro ao buscar coordenadas", errorMessage);
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
      } else if (name === "uf") {
        setFormData((prev) => ({
          ...prev,
          uf: value,
          id_regiao: undefined,
          regiao: undefined,
        }));
        setFormErrors((prev) => {
          if (!prev.id_regiao) return prev;
          const updated = { ...prev };
          delete updated.id_regiao;
          return updated;
        });
      } else if (name === "id_regiao") {
        // Atualiza o campo regiao com o objeto Regiao correspondente
        if (value === "" || value === "0") {
          setFormData((prev) => ({
            ...prev,
            id_regiao: undefined,
            regiao: undefined,
          }));
        } else {
          const regiaoId = parseInt(value, 10);
          const regiaoSelecionada = regioes.find((r) => r.id === regiaoId);
          setFormData((prev) => ({
            ...prev,
            id_regiao: regiaoId,
            regiao: regiaoSelecionada,
          }));
        }
      } else if (name === "numero") {
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Coordenadas são buscadas apenas quando o usuário clicar em "Definir Localização no Mapa"
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }

      // Limpar erro do campo quando usuário digitar (apenas se já existe erro)
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

  // Fixed handleSubmit with correct dependencies
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validarFormulario()) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      setIsSubmitting(true);

      try {
        const clienteData = {
          codigo_erp: formData.codigo_erp,
          nome_fantasia: formData.nome_fantasia,
          razao_social: formData.razao_social,
          cnpj: formData.cnpj,
          endereco: formData.endereco,
          numero: formData.numero,
          complemento: formData.complemento || undefined,
          bairro: formData.bairro,
          cep: formData.cep,
          cidade: formData.cidade,
          uf: formData.uf,
          id_regiao: formData.id_regiao ?? formData.regiao?.id,
          latitude:
            typeof formData.latitude === "string"
              ? parseFloat(formData.latitude)
              : formData.latitude,
          longitude:
            typeof formData.longitude === "string"
              ? parseFloat(formData.longitude)
              : formData.longitude,
          situacao: formData.situacao,
        };

        await clientesService.update(Number(clienteId), clienteData);

        router.push("/admin/cadastro/clientes");

        showSuccess(MESSAGES.success, "Cliente atualizado com sucesso!");
      } catch (error) {
        console.error("Erro ao atualizar cliente:", error);
        const errorMessage = getErrorMessage(
          error,
          "Ocorreu um erro ao atualizar o cliente. Tente novamente."
        );
        showError("Erro ao atualizar", errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      formData,
      validarFormulario,
      clienteId,
      router,
      showSuccess,
      showError,
      getErrorMessage,
    ]
  );

  if (loading) {
    return (
      <Loading
        fullScreen={true}
        preventScroll={false}
        text="Carregando dados do cliente..."
        size="large"
      />
    );
  }

  if (!regioesInitialized && regioesLoading) {
    return (
      <Loading
        fullScreen={true}
        preventScroll={false}
        text="Carregando dados do cliente..."
        size="large"
      />
    );
  }

  const clientDisplayName =
    [formData.nome_fantasia, formData.razao_social].find(
      (value) => value && value.trim()
    ) || "";
  const addressParts = [
    formData.endereco,
    formData.numero,
    formData.complemento,
    formData.bairro,
    formData.cidade,
    formData.uf,
    formData.cep,
  ].filter(
    (part): part is string => typeof part === "string" && part.trim().length > 0
  );
  const fullAddress = addressParts.length
    ? `${addressParts.join(", ")}, Brasil`
    : "";

  const regiaoPlaceholder = regioesLoading
    ? "Carregando regiões..."
    : regioes.length > 0
    ? "Selecione uma região..."
    : "Nenhuma região encontrada para a UF selecionada";

  const regiaoOptions =
    regioes.length > 0
      ? [
          { value: "", label: regiaoPlaceholder },
          ...regioes.map((regiao) => ({
            value: regiao.id,
            label: `${regiao.nome} - ${regiao.uf}`,
          })),
        ]
      : [{ value: "", label: regiaoPlaceholder }];

  return (
    <>
      <PageHeader
        title="Editar Cliente"
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
                  inputRef={nomeRazaoSocialRef}
                />

                <InputField
                  label="Nome Fantasia"
                  name="nome_fantasia"
                  value={formData.nome_fantasia}
                  error={formErrors.nome_fantasia}
                  placeholder="Nome fantasia da empresa"
                  required
                  onChange={handleInputChange}
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
                  label="Código no ERP"
                  name="codigo_erp"
                  value={formData.codigo_erp || ""}
                  error={formErrors.codigo_erp}
                  placeholder="Código interno do sistema ERP"
                  required
                  onChange={handleInputChange}
                />
              </div>
            </section>

            {/* Endereço */}
            <section className="space-y-6 mb-8">
              <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-3">
                Endereço
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

                <InputField
                  label="Número"
                  name="numero"
                  value={formData.numero}
                  error={formErrors.numero}
                  placeholder="Nº"
                  required
                  onChange={handleInputChange}
                />
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

              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                  <InputField
                    label="Complemento"
                    name="complemento"
                    value={formData.complemento || ""}
                    placeholder="Apto, Bloco, Sala, etc."
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-span-1">
                  <SelectField
                    label="Região"
                    name="id_regiao"
                    value={formData.id_regiao ?? ""}
                    error={formErrors.id_regiao}
                    required
                    onChange={handleInputChange}
                    options={regiaoOptions}
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
                </div>

                {showMapPreview && formData.latitude && formData.longitude && (
                  <div className="flex flex-col gap-2">
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
                <span>Salvar</span>
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
        clientName={clientDisplayName}
        address={fullAddress}
        onLocationSelected={handleLocationSelected}
      />
    </>
  );
};

export default EditarCliente;
