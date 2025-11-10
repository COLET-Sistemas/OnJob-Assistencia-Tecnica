"use client";

import AdminAuthGuard from "@/components/admin/common/AdminAuthGuard";
import { Loading } from "@/components/LoadingPersonalizado";
import PageHeader from "@/components/admin/ui/PageHeader";
import { useToast } from "@/components/admin/ui/ToastContainer";
import { parametrosService } from "@/api/services/parametrosService";
import { ParametroSistema } from "@/types/admin/administracao/parametros";
import { useDataFetch } from "@/hooks";
import { useCallback, useMemo, useState } from "react";
import { Loader2, Pencil, Save, X } from "lucide-react";

const ParametrizacaoPage = () => {
  const { showError, showSuccess } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedValue, setEditedValue] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const fetchParametros = useCallback(async () => {
    try {
      const parametros = await parametrosService.getAlteraveis();
      return parametros ?? [];
    } catch (error) {
      console.error("Erro ao buscar parâmetros:", error);
      showError(
        "Parametrização",
        "Não foi possível carregar os parâmetros disponíveis."
      );
      return [];
    }
  }, [showError]);

  const {
    data: parametros = [],
    loading,
    updateData,
  } = useDataFetch<ParametroSistema[]>(fetchParametros, [fetchParametros], []);

  const listaParametros = useMemo(() => parametros ?? [], [parametros]);
  const isInitialLoading = loading && listaParametros.length === 0;
  const isEditing = (id: number) => editingId === id;

  const startEditing = (parametro: ParametroSistema) => {
    if (savingId !== null) return;
    setEditingId(parametro.id);
    setEditedValue(parametro.valor ?? "");
  };

  const cancelEditing = () => {
    if (savingId !== null) return;
    setEditingId(null);
    setEditedValue("");
  };

  const handleSave = async () => {
    if (editingId === null) return;

    const parametroAtual = listaParametros.find(
      (parametro) => parametro.id === editingId
    );

    if (!parametroAtual) return;
    if (savingId !== null) return;

    const valorParaSalvar = editedValue;
    const houveAlteracao = valorParaSalvar !== (parametroAtual.valor ?? "");

    if (!houveAlteracao) {
      cancelEditing();
      return;
    }

    setSavingId(editingId);
    try {
      await parametrosService.updateValor(editingId, valorParaSalvar);

      const atualizados = listaParametros.map((parametro) =>
        parametro.id === editingId
          ? { ...parametro, valor: valorParaSalvar }
          : parametro
      );

      updateData(atualizados);
      showSuccess("Parametrização", "Parâmetro atualizado com sucesso!");
      cancelEditing();
    } catch (error) {
      console.error("Erro ao atualizar parâmetro:", error);
      showError(
        "Parametrização",
        "Não foi possível salvar as alterações. Tente novamente."
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleValueKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSave();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      cancelEditing();
    }
  };

  const renderTableContent = () => {
    if (isInitialLoading) {
      return (
        <div className="py-10">
          <Loading text="Carregando parâmetros..." fullScreen={false} />
        </div>
      );
    }

    if (!loading && listaParametros.length === 0) {
      return (
        <div className="py-12 text-center">
          <p className="text-lg font-semibold text-gray-800">
            Nenhum parâmetro alterável foi encontrado.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Certifique-se de que existem parâmetros com permissão de edição.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parâmetro
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor Atual
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {listaParametros.map((parametro) => {
              const emEdicao = isEditing(parametro.id);
              const estaSalvando = savingId === parametro.id;
              const valorOriginal = parametro.valor ?? "";
              const valorAtual = emEdicao ? editedValue : valorOriginal;
              const possuiAlteracao = emEdicao && valorAtual !== valorOriginal;

              return (
                <tr key={parametro.id}>
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-gray-900">
                        {parametro.descricao}
                      </span>
                      <span className="text-xs font-mono text-gray-500 uppercase tracking-wide">
                        {parametro.chave}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {emEdicao ? (
                      <input
                        type="text"
                        value={valorAtual}
                        onChange={(event) => setEditedValue(event.target.value)}
                        onKeyDown={handleValueKeyDown}
                        disabled={estaSalvando}
                        autoFocus
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/30 transition"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">
                        {valorOriginal || (
                          <span className="text-gray-400">Sem valor definido</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {emEdicao ? (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={estaSalvando || !possuiAlteracao}
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition ${
                            estaSalvando || !possuiAlteracao
                              ? "bg-gray-300 cursor-not-allowed"
                              : "bg-[var(--primary)] hover:bg-[var(--primary)]/90"
                          }`}
                        >
                          {estaSalvando ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          {estaSalvando ? "Salvando..." : "Salvar"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          disabled={estaSalvando}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <X className="h-4 w-4" />
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditing(parametro)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <AdminAuthGuard>
      <PageHeader
        title="Parametrização"
        config={{
          type: "list",
          itemCount: listaParametros.length,
        }}
      />

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Gerencie os parâmetros do sistema com permissão de edição. Apenas o
            campo de valor pode ser alterado por vez.
          </p>
        </div>
        {renderTableContent()}
      </section>
    </AdminAuthGuard>
  );
};

export default ParametrizacaoPage;
