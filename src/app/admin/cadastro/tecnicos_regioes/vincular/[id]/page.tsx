"use client";

import api from "@/api/api";
import { regioesService } from "@/api/services/regioesService";
import { usuariosRegioesService } from "@/api/services/usuariosService";
import { LoadingButton } from "@/components/admin/form";
import { useToast } from "@/components/admin/ui/ToastContainer";
import PageHeader from "@/components/admin/ui/PageHeader";
import { Loading } from "@/components/LoadingPersonalizado";
import { useTitle } from "@/context/TitleContext";
import { Regiao } from "@/types/admin/cadastro/regioes";
import { UsuarioComRegioes } from "@/types/admin/cadastro/usuarios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { use } from "react";

// Cache global de regiões compartilhado entre componentes
let regioesGlobais: Regiao[] = [];
let regioesCarregadas = false;

// Custom hook para gerenciar o cache de regiões
const useRegioesCache = () => {
  const [regioes, setRegioes] = useState<Regiao[]>(regioesGlobais);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Função para carregar regiões (será chamada apenas uma vez)
  const fetchRegioes = useCallback(async () => {
    // Se já carregamos anteriormente, apenas retorna o cache
    if (regioesCarregadas) {
      return regioesGlobais;
    }

    // Evita chamadas múltiplas
    regioesCarregadas = true;

    setIsLoading(true);
    try {
      const result = await regioesService.getAll();
      // Atualiza tanto o estado local quanto o cache global
      regioesGlobais = result;
      setRegioes(result);
      return result;
    } catch (err) {
      setError(err as Error);
      regioesCarregadas = false; // Reseta para permitir nova tentativa
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []); // Sem dependências para evitar loops

  // Memoize das regiões para evitar re-renderizações desnecessárias
  const regioesOrdenadas = useMemo(() => {
    return [...regioes].sort((a, b) => {
      const nomeA = a.nome || (a.nome_regiao as string);
      const nomeB = b.nome || (b.nome_regiao as string);
      return nomeA.localeCompare(nomeB, "pt-BR", { sensitivity: "base" });
    });
  }, [regioes]);

  return {
    regioes: regioesOrdenadas,
    isLoading,
    error,
    fetchRegioes,
  };
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const VincularTecnicoRegioes = ({ params }: PageProps) => {
  // Unwrap the params promise using React.use()
  const unwrappedParams = use(params);
  const idUsuario = parseInt(unwrappedParams.id);
  const router = useRouter();
  const { setTitle } = useTitle();
  const { showSuccess, showError } = useToast();
  const regioesCache = useRegioesCache();

  // Estados
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tecnico, setTecnico] = useState<UsuarioComRegioes | null>(null);
  const [regioesVinculadas, setRegioesVinculadas] = useState<number[]>([]);

  // Referência para controlar se já carregamos os dados
  const didLoadRef = useRef(false);

  // Carregar dados iniciais
  useEffect(() => {
    // Evita chamadas duplicadas causadas por re-renders
    if (didLoadRef.current) return;
    didLoadRef.current = true;

    setTitle("Vincular Técnico a Regiões");
    setIsLoading(true);

    // Função assíncrona para carregar dados uma única vez
    const loadData = async () => {
      try {
        // Inicia a busca das regiões
        const regioesPromise = regioesCache.fetchRegioes();

        // Busca os dados do técnico
        const tecnicoResponse = await usuariosRegioesService.getById(idUsuario);

        // Atualiza o estado com as informações do técnico
        setTecnico(tecnicoResponse);

        // Extrai IDs das regiões já vinculadas
        setRegioesVinculadas(
          tecnicoResponse.regioes.map((regiao) => regiao.id_regiao)
        );

        // Aguarda as regiões serem carregadas (sem usar o resultado)
        await regioesPromise;
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        showError("Erro", "Não foi possível carregar os dados necessários");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idUsuario]); // Remova dependências problemáticas e use eslint-disable

  // Alternar seleção de região
  const toggleRegiao = (idRegiao: number) => {
    setRegioesVinculadas((prevRegioes) => {
      if (prevRegioes.includes(idRegiao)) {
        return prevRegioes.filter((id) => id !== idRegiao);
      } else {
        return [...prevRegioes, idRegiao];
      }
    });
  };

  // Salvar vinculações
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Usando POST com o formato de payload solicitado
      await api.post("/usuarios_regioes", {
        id_usuario: idUsuario,
        id_regiao: regioesVinculadas,
      });

      showSuccess(
        "Sucesso",
        "Vínculos do técnico com as regiões foram atualizados com sucesso!"
      );

      router.push("/admin/cadastro/tecnicos_regioes");
    } catch (error) {
      console.error("Erro ao salvar vínculos:", error);
      showError(
        "Erro ao salvar",
        "Não foi possível atualizar os vínculos do técnico com as regiões"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Loading
        fullScreen={true}
        preventScroll={false}
        text="Carregando informações..."
        size="large"
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Vincular Técnico a Regiões"
        config={{
          type: "form",
          backLink: "/admin/cadastro/tecnicos_regioes",
          backLabel: "Voltar para lista de técnicos",
        }}
      />

      <main>
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          noValidate
        >
          <div className="p-8">
            {/* Informações do técnico */}
            <section className="mb-6">
              <h2 className="text-xl font-medium text-gray-800 mb-4">
                Informações do Técnico
              </h2>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center">
                  <p className="font-semibold text-lg text-gray-900">
                    {tecnico?.nome_usuario}
                  </p>
                  <span
                    className={`ml-3 text-xs px-2 py-1 rounded-full ${
                      tecnico?.tipo === "interno"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {tecnico?.tipo === "interno" ? "Interno" : "Terceirizado"}
                  </span>
                </div>
              </div>
            </section>

            {/* Seleção de regiões */}
            <section>
              <h2 className="text-xl font-medium text-gray-800 mb-4">
                Selecione as Regiões
              </h2>
              <p className="text-gray-500 mb-4">
                Clique nas regiões para vincular ou desvincular do técnico.
              </p>

              <div className="flex flex-wrap gap-3 mt-6">
                {regioesCache.regioes.map((regiao: Regiao) => {
                  // Normaliza os IDs e nomes das regiões para lidar com ambas as estruturas de dados
                  const regionId = regiao.id || (regiao.id_regiao as number);
                  const regionName =
                    regiao.nome || (regiao.nome_regiao as string);
                  const isSelected = regioesVinculadas.includes(regionId);

                  return (
                    <button
                      key={regionId}
                      type="button"
                      onClick={() => toggleRegiao(regionId)}
                      className={`
                        px-4 py-2 rounded-md font-medium transition-all
                        ${
                          isSelected
                            ? "bg-violet-600 text-white shadow-md hover:bg-violet-700"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                        }
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500
                      `}
                    >
                      {regionName}
                    </button>
                  );
                })}
              </div>

              {regioesCache.regioes.length === 0 && (
                <div className="text-center p-6 bg-gray-50 rounded-md">
                  <p className="text-gray-500">Nenhuma região encontrada</p>
                </div>
              )}

              {/* Resumo das regiões selecionadas */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-700 mb-3">
                  Regiões vinculadas: {regioesVinculadas.length}
                </h3>
              </div>
            </section>
          </div>

          {/* Footer com botões */}
          <footer className="bg-slate-50 px-8 py-6 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Link
                href="/admin/cadastro/tecnicos_regioes"
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

export default VincularTecnicoRegioes;
