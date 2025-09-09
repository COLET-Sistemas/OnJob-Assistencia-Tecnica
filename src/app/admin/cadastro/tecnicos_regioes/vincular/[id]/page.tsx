"use client";

import { Loading } from "@/components/LoadingPersonalizado";
import { useDataFetch } from "@/hooks";
import { useCallback, useState, useEffect } from "react";
import { usuariosRegioesService } from "@/api/services/usuariosService";
import { regioesService } from "@/api/services/regioesService";
import { UsuarioComRegioes, Regiao } from "@/types/admin/cadastro/usuarios";
import PageHeaderBasic from "@/components/admin/ui/PageHeaderBasic";
import { useRouter, useParams } from "next/navigation";
import { LoadingButton } from "@/components/admin/form";

const VincularTecnicoRegioes = () => {
  const router = useRouter();
  const params = useParams();
  const idUsuario = parseInt(params.id as string, 10);
  const [selectedRegioes, setSelectedRegioes] = useState<number[]>([]);
  const [allRegioes, setAllRegioes] = useState<Regiao[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data
  const fetchUsuarioRegioes = useCallback(async () => {
    try {
      // The API now returns data directly in the UsuarioComRegioes format
      const result = await usuariosRegioesService.getById(idUsuario);

      // The response is already in the correct format, no transformation needed
      return result;
    } catch (err) {
      console.error("Error fetching usuario regioes:", err);
      setError(
        `Erro ao carregar dados do usuário: ${
          err instanceof Error ? err.message : "Erro desconhecido"
        }`
      );
      throw err;
    }
  }, [idUsuario]);

  const {
    data: usuario,
    loading: loadingUsuario,
    error: usuarioError,
  } = useDataFetch<UsuarioComRegioes>(fetchUsuarioRegioes, [
    fetchUsuarioRegioes,
  ]);

  // Fetch all regions
  const fetchRegioes = useCallback(async () => {
    try {
      const result = await regioesService.getAll();

      // Transform the API response to match our expected type
      const transformedResult: Regiao[] = result.map((regiao) => ({
        id_regiao: regiao.id_regiao || regiao.id, // Use id_regiao if available, otherwise use id
        nome_regiao: regiao.nome_regiao || regiao.nome, // Use nome_regiao if available, otherwise use nome
      }));

      return transformedResult;
    } catch (err) {
      console.error("Error fetching regioes:", err);
      setError(
        `Erro ao carregar regiões: ${
          err instanceof Error ? err.message : "Erro desconhecido"
        }`
      );
      throw err;
    }
  }, []);

  const {
    data: regioes,
    loading: loadingRegioes,
    error: regioesError,
  } = useDataFetch<Regiao[]>(fetchRegioes, [fetchRegioes]);

  // Set initial selected regions
  useEffect(() => {
    if (usuario && usuario.regioes) {
      setSelectedRegioes(
        usuario.regioes.map((regiao: Regiao) => regiao.id_regiao)
      );
    }
  }, [usuario]);

  useEffect(() => {
    if (regioes) {
      setAllRegioes(regioes);
    }
  }, [regioes]);

  const handleToggleRegiao = (idRegiao: number) => {
    setSelectedRegioes((current) =>
      current.includes(idRegiao)
        ? current.filter((id) => id !== idRegiao)
        : [...current, idRegiao]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Create the payload according to what the API expects
      const payload: { id_usuario: number; id_regiao: number[] } = {
        id_usuario: idUsuario,
        id_regiao: selectedRegioes,
      };

      await usuariosRegioesService.update(idUsuario, payload);
      router.push("/admin/cadastro/tecnicos_regioes");
    } catch (err) {
      console.error("Erro ao vincular regiões:", err);
      setError(
        `Erro ao salvar vinculações: ${
          err instanceof Error ? err.message : "Erro desconhecido"
        }`
      );
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/cadastro/tecnicos_regioes");
  };

  // Display error messages if any
  if (error || usuarioError || regioesError) {
    const errorMessage =
      error ||
      (usuarioError instanceof Error
        ? usuarioError.message
        : "Erro ao carregar dados do usuário") ||
      (regioesError instanceof Error
        ? regioesError.message
        : "Erro ao carregar regiões");

    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4 rounded shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-500"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Erro ao carregar dados
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{errorMessage}</p>
              <button
                onClick={() => router.back()}
                className="mt-3 text-sm text-red-800 font-medium hover:underline"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadingUsuario || loadingRegioes) {
    return (
      <Loading
        fullScreen={true}
        preventScroll={false}
        text="Carregando dados..."
        size="large"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeaderBasic
        title={`Vincular Regiões ao Técnico: ${
          usuario?.nome_usuario || "Carregando..."
        }`}
        config={{
          type: "form",
          backButton: {
            label: "Voltar",
            href: "/admin/cadastro/tecnicos_regioes",
          },
        }}
      />

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium mb-4">
          Selecione as regiões para este técnico
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {allRegioes.map((regiao) => (
            <div
              key={regiao.id_regiao}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedRegioes.includes(regiao.id_regiao)
                  ? "bg-yellow-100 border-yellow-300 shadow"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              }`}
              onClick={() => handleToggleRegiao(regiao.id_regiao)}
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedRegioes.includes(regiao.id_regiao)}
                  onChange={() => {}} // Controlled by parent div click
                  className="h-4 w-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                />
                <label className="ml-2 block text-sm font-medium text-gray-900">
                  {regiao.nome_regiao}
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <LoadingButton
            className="px-4 py-2 text-sm font-medium rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Salvar Vinculações
          </LoadingButton>
        </div>
      </div>
    </div>
  );
};

export default VincularTecnicoRegioes;
