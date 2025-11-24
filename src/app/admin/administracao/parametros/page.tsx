"use client";

import AdminAuthGuard from "@/components/admin/common/AdminAuthGuard";
import { LoadingSpinner as LoadingPersonalizado } from "@/components/LoadingPersonalizado";
import PageHeader from "@/components/admin/ui/PageHeader";
import { useToast } from "@/components/admin/ui/ToastContainer";
import { parametrosService } from "@/api/services/parametrosService";
import { ParametroSistema } from "@/types/admin/administracao/parametros";
import { useDataFetch } from "@/hooks";
import { isSuperAdmin } from "@/utils/superAdmin";
import { ChangeEvent, useCallback, useMemo, useState, useEffect } from "react";
import { Loader2, Search, Pencil, Save, X, Building2 } from "lucide-react";

const ParametrizacaoPage = () => {
  const { showError, showSuccess } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedValue, setEditedValue] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [licencaTipo, setLicencaTipo] = useState<string>("");
  const [savingLicenca, setSavingLicenca] = useState(false);
  const userIsSuperAdmin = isSuperAdmin();
  const clearSearchValue = () => setSearchValue("");
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) =>
    setSearchValue(event.target.value);

  // Carregar tipo de licença atual do localStorage
  useEffect(() => {
    try {
      const empresaData = localStorage.getItem("empresa");
      if (empresaData) {
        const empresa = JSON.parse(empresaData);
        setLicencaTipo(empresa.licenca_tipo || "S");
      } else {
        setLicencaTipo("S");
      }
    } catch (error) {
      console.error("Erro ao carregar tipo de licença:", error);
      setLicencaTipo("S");
    }
  }, []);

  const fetchParametros = useCallback(async () => {
    try {
      const isUserSuperAdmin = isSuperAdmin();
      const parametros = isUserSuperAdmin
        ? await parametrosService.getAll()
        : await parametrosService.getAlteraveis();
      return parametros ?? [];
    } catch (error) {
      console.error("Erro ao buscar parâmetros:", error);
      showError(
        "Parametrização",
        "Não foi possí­vel carregar os parâmetros disponí­veis."
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
  const hasActiveFilter = searchValue.trim().length > 0;
  const parametrosFiltrados = useMemo(() => {
    const termo = searchValue.trim().toLowerCase();
    if (!termo) {
      return listaParametros;
    }

    return listaParametros.filter((parametro) => {
      const descricao = parametro.descricao ?? "";
      const chave = parametro.chave ?? "";

      return (
        descricao.toLowerCase().includes(termo) ||
        chave.toLowerCase().includes(termo)
      );
    });
  }, [listaParametros, searchValue]);
  const parametroEmEdicao =
    editingId !== null
      ? listaParametros.find((parametro) => parametro.id === editingId) ?? null
      : null;
  const isInitialLoading = loading && listaParametros.length === 0;

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
      const response = await parametrosService.updateValor(
        parametroAtual.chave,
        valorParaSalvar
      );

      const atualizados = listaParametros.map((parametro) =>
        parametro.id === editingId
          ? { ...parametro, valor: valorParaSalvar }
          : parametro
      );

      updateData(atualizados);

      const mensagemRetorno = (() => {
        if (typeof response === "string") return response;

        if (response && typeof response === "object") {
          const data = response as Record<string, unknown>;

          if (typeof data.mensagem === "string") return data.mensagem;
          if (typeof data.sucesso === "string") return data.sucesso;

          try {
            return JSON.stringify(response);
          } catch {
            return "Parâmetro atualizado com sucesso!";
          }
        }

        if (response !== undefined && response !== null) {
          return String(response);
        }

        return "Parâmetro atualizado com sucesso!";
      })();

      showSuccess("Parametrização", mensagemRetorno);
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

  const handleModalValueKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelEditing();
    }
  };

  const handleLicencaTipoChange = async (novoTipo: string) => {
    if (savingLicenca || novoTipo === licencaTipo) return;

    setSavingLicenca(true);
    try {
      // Atualizar localStorage
      const empresaData = localStorage.getItem("empresa");
      if (empresaData) {
        const empresa = JSON.parse(empresaData);
        empresa.licenca_tipo = novoTipo;
        localStorage.setItem("empresa", JSON.stringify(empresa));
        localStorage.setItem("licenca_tipo", novoTipo);
      } else {
        // Criar objeto empresa básico se não existir
        const novaEmpresa = { licenca_tipo: novoTipo };
        localStorage.setItem("empresa", JSON.stringify(novaEmpresa));
        localStorage.setItem("licenca_tipo", novoTipo);
      }

      setLicencaTipo(novoTipo);

      const tipoNome =
        novoTipo === "S" ? "Silver" : novoTipo === "G" ? "Gold" : "Platinum";
      showSuccess(
        "Parametrização",
        `Tipo de licença alterado para ${tipoNome} com sucesso!`
      );
    } catch (error) {
      console.error("Erro ao atualizar tipo de licença:", error);
      showError(
        "Parametrização",
        "Não foi possível alterar o tipo de licença. Tente novamente."
      );
    } finally {
      setSavingLicenca(false);
    }
  };

  const renderTableContent = () => {
    if (isInitialLoading) {
      return (
        <div className="py-10">
          <LoadingPersonalizado
            text="Carregando parâmetros..."
            fullScreen={false}
            className="w-full"
          />
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

    if (!loading && parametrosFiltrados.length === 0) {
      return (
        <div className="py-12 text-center">
          <p className="text-lg font-semibold text-gray-800">
            {hasActiveFilter
              ? "Nenhum parÇ½metro corresponde ao filtro."
              : "Nenhum parÇ½metro alterÇ­vel foi encontrado."}
          </p>
          {hasActiveFilter && (
            <p className="mt-2 text-sm text-gray-500">
              Ajuste o filtro ou limpe a pesquisa para ver outros registros.
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <colgroup>
            <col style={{ width: "40%" }} />
            <col style={{ width: "50%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
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
          <tbody className="bg-white divide-y divide-gray-300">
            {parametrosFiltrados.map((parametro) => {
              const estaSalvando = savingId === parametro.id;
              const adminNaoPodeAlterar =
                userIsSuperAdmin && parametro.admin_pode_alterar === false;
              const rowBackgroundClass = adminNaoPodeAlterar
                ? "bg-red-50 hover:bg-red-50"
                : "bg-white hover:bg-gray-50";

              return (
                <tr
                  key={parametro.id}
                  className={`transition-colors ${rowBackgroundClass}`}
                >
                  <td className="px-6 py-4 align-top min-w-0 max-w-[28rem]">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-gray-900 whitespace-pre-wrap break-words">
                        {parametro.descricao}
                      </span>
                      <span className="text-xs font-mono text-gray-500 uppercase tracking-wide">
                        {parametro.chave}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 min-w-0 max-w-[30rem]">
                    <div className="text-sm text-gray-900 whitespace-pre-wrap break-words break-all">
                      {parametro.valor ? (
                        parametro.valor
                      ) : (
                        <span className="text-gray-400">
                          Sem valor definido
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => startEditing(parametro)}
                      disabled={estaSalvando}
                      className={`inline-flex cursor-pointer items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                        estaSalvando
                          ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "border-gray-200 bg-white text-gray-600 hover:border-[var(--primary)] hover:text-[var(--primary)]"
                      }`}
                    >
                      {estaSalvando ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Pencil className="h-4 w-4" />
                          Editar
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSearchInput = () => (
    <div className="min-w-[260px]">
      <div className="relative w-full">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchValue}
          onChange={handleSearchChange}
          placeholder="Chave ou descrição"
          aria-label="Pesquisar parâmetros"
          className="w-full rounded-2xl border border-gray-200 bg-white/90 px-3 py-2 pl-10 text-sm font-medium text-gray-900 placeholder:text-gray-400 shadow-sm transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/50 focus:outline-none"
        />
        {hasActiveFilter && (
          <button
            type="button"
            onClick={clearSearchValue}
            aria-label="Limpar pesquisa"
            className="absolute inset-y-0 right-2 flex items-center justify-center cursor-pointer  px-2 text-gray-500 transition hover:text-gray-700 hover:border-gray-300 focus-visible:outline focus-visible:outline-[var(--primary)] focus-visible:outline-offset-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  const renderLicencaSection = () => {
    const opcoes = [
      { value: "S", label: "Silver", description: "Plano básico" },
      { value: "G", label: "Gold", description: "Plano intermediário" },
      { value: "P", label: "Platinum", description: "Plano premium" },
    ];

    return (
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="h-5 w-5 text-[var(--primary)]" />
          <h2 className="text-lg font-semibold text-gray-900">
            Tipo de Licença da Empresa
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-3">
              Configure o tipo de licença da empresa. Esta alteração afeta as
              funcionalidades disponíveis no sistema.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {opcoes.map((opcao) => (
                <button
                  key={opcao.value}
                  type="button"
                  disabled={savingLicenca}
                  onClick={() => handleLicencaTipoChange(opcao.value)}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-left
                    ${
                      licencaTipo === opcao.value
                        ? "border-[var(--primary)] bg-[var(--primary)]/5 shadow-md"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }
                    ${
                      savingLicenca
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900">
                      {opcao.label}
                    </span>
                    <span className="text-xs font-mono text-gray-500">
                      {opcao.value}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{opcao.description}</p>
                  {licencaTipo === opcao.value && (
                    <div className="mt-2 text-xs font-medium text-[var(--primary)]">
                      ✓ Selecionado
                    </div>
                  )}
                </button>
              ))}
            </div>
            {savingLicenca && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando alteração...
              </div>
            )}
          </div>
        </div>
      </section>
    );
  };

  const renderEditModal = () => {
    if (!parametroEmEdicao) return null;

    const estaSalvando = savingId === parametroEmEdicao.id;
    const valorOriginal = parametroEmEdicao.valor ?? "";
    const possuiAlteracao = editedValue !== valorOriginal;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={estaSalvando ? undefined : cancelEditing}
          aria-hidden
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="editar-parametro-title"
          className="relative w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-xl animate-in fade-in-0 zoom-in-95 duration-200"
        >
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-8 py-2">
            <div>
              <h3
                id="editar-parametro-title"
                className="mt-3 text-lg font-semibold text-[var(--primary)] whitespace-pre-wrap break-words"
              >
                {parametroEmEdicao.descricao}
              </h3>
              <p className="text-xs font-mono uppercase tracking-wide text-gray-500">
                {parametroEmEdicao.chave}
              </p>
            </div>
            <button
              type="button"
              onClick={cancelEditing}
              disabled={estaSalvando}
              className="text-gray-400 hover:text-gray-900 transition cursor-pointer rounded-full "
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form
            className="space-y-5 px-8 py-8"
            onSubmit={(event) => {
              event.preventDefault();
              handleSave();
            }}
          >
            <textarea
              value={editedValue}
              onChange={(event) => setEditedValue(event.target.value)}
              onKeyDown={handleModalValueKeyDown}
              disabled={estaSalvando}
              rows={5}
              autoFocus
              placeholder="Informe o novo valor do parâmetro"
              className="w-full rounded border border-gray-200 bg-white px-4 py-3 text-sm font-mono text-gray-900 placeholder:text-gray-400 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/30 transition resize-none whitespace-pre-wrap shadow-sm"
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelEditing}
                disabled={estaSalvando}
                className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded  cursor-pointer hover:border-gray-300 transition disabled:cursor-not-allowed disabled:opacity-70"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={estaSalvando || !possuiAlteracao}
                className={`flex-1 px-4 py-3 text-sm font-semibold text-white rounded transition ${
                  estaSalvando || !possuiAlteracao
                    ? "bg-gray-300 cursor-not-allowed opacity-80"
                    : "bg-[var(--primary)] hover:bg-[var(--primary)]/90 cursor-pointer"
                }`}
              >
                {estaSalvando ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Save className="h-4 w-4" />
                    Salvar alterações
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <AdminAuthGuard>
      <PageHeader
        title="Parametrização"
        config={{
          type: "list",
          itemCount: parametrosFiltrados.length,
          alignTitleCenter: true,
          compact: true,
          dense: true,
          actions: renderSearchInput(),
        }}
      />

      {renderLicencaSection()}

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Gerencie os parâmetros do sistema com permissão de edição. Apenas o
            campo de valor pode ser alterado por vez.
          </p>
        </div>
        {renderTableContent()}
      </section>
      {renderEditModal()}
    </AdminAuthGuard>
  );
};

export default ParametrizacaoPage;
