"use client";

import { clientesService, regioesService } from "@/api/services";
import { Loading } from "@/components/LoadingPersonalizado";
import { useToast } from "@/components/admin/ui/ToastContainer";
import PageHeader from "@/components/admin/ui/PageHeader";
import {
  InputField,
  SelectField,
  LoadingButton,
} from "@/components/admin/form";
import { FormData as ClienteFormData } from "@/types/admin/cadastro/clientes";
import { formatDocumento, validarDocumento } from "@/utils/formatters";
import { buscarCEP, formatarCEP } from "@/utils/cepAPI";
import { ESTADOS } from "@/utils/constants";
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
  const validateForm = useCallback(
    (formData: ClienteFormData): FormValidation => {
      const errors: FormErrors = {};

      if (!formData.nome_fantasia.trim())
        errors.nome_fantasia = MESSAGES.required;
      if (!formData.razao_social.trim())
        errors.razao_social = MESSAGES.required;
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
    },
    []
  );

  return { validateForm };
};

const CadastrarCliente: React.FC = () => {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { validateForm } = useFormValidation();

  // Estados
  const [regioesLoading, setRegioesLoading] = useState(false);
  const [regioesInitialized, setRegioesInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const nomeRazaoSocialRef = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    nomeRazaoSocialRef.current?.focus();
  }, []);

  const [formData, setFormData] = useState<ClienteFormData>({
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
    situacao: "A",
    id_regiao: undefined,
    regiao: undefined,
  });

  // Carregar as regiões disponíveis - usando useRef para evitar duplo disparo no Strict Mode
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
        showError("Erro ao carregar regiões", error as Record<string, unknown>);
        aplicarRegioes([]);
      } finally {
        setRegioesLoading(false);
        setRegioesInitialized(true);
      }
    },
    [aplicarRegioes, showError]
  );

  useEffect(() => {
    carregarRegioesPorUF(formData.uf);
  }, [carregarRegioesPorUF, formData.uf]);

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
        const clienteData: ClienteFormData = {
          codigo_erp: formData.codigo_erp || undefined,
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
          situacao: formData.situacao,
        };

        // Enviar para a API
        const response = await clientesService.create(clienteData);

        router.push("/admin/cadastro/clientes");

        showSuccess(
          MESSAGES.success,
          response as unknown as Record<string, unknown>
        );
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

  if (!regioesInitialized && regioesLoading) {
    return (
      <Loading
        fullScreen={true}
        preventScroll={false}
        text="Carregando cadastro cliente..."
        size="large"
      />
    );
  }

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
    </>
  );
};

export default CadastrarCliente;
