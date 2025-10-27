"use client";
import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useRouter, useParams } from "next/navigation";

type ApiError = {
  status?: number;
  data?: unknown;
  erro?: string;
};
import api from "@/api/api";
import MobileHeader from "@/components/tecnico/MobileHeader";
import {
  Trash2,
  Plus,
  Hash,
  Check,
  X,
  Search,
  Package,
  AlertCircle,
  Edit3,
} from "lucide-react";

// Interface para peça vinculada à FAT
interface FATPecaVinculada {
  id_fat_peca: number;
  codigo_peca: string;
  descricao_peca: string;
  quantidade: number;
  unidade_medida: string;
}

// Interface para peça buscada
interface PecaBusca {
  id: number;
  codigo_peca: string;
  descricao: string;
  unidade_medida: string;
  situacao: string;
  id_tipo_peca: number;
  tipo_peca: string;
}

// Componente de loading minimalista
const LoadingSpinner = memo(() => (
  <div className="flex items-center justify-center py-12">
    <div className="w-6 h-6 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
  </div>
));

LoadingSpinner.displayName = "LoadingSpinner";

// Componente de erro
const ErrorMessage = memo(({ message }: { message: string }) => (
  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 animate-slideInUp">
    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
    <span className="text-sm leading-relaxed">{message}</span>
  </div>
));

ErrorMessage.displayName = "ErrorMessage";

// Componente de peça encontrada
const PecaEncontrada = memo(({ peca }: { peca: PecaBusca }) => (
  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg animate-slideInUp">
    <div className="font-medium text-emerald-800 text-sm mb-1">
      {peca.descricao}
    </div>
    <div className="flex items-center gap-3 text-xs text-emerald-600">
      <span>{peca.unidade_medida}</span>
      <span>•</span>
      <span>{peca.tipo_peca}</span>
    </div>
  </div>
));

PecaEncontrada.displayName = "PecaEncontrada";

// Card de peça com expansão apenas para botões
const PecaItem = memo(
  ({
    peca,
    isExpanded,
    isEditing,
    editQuantidade,
    editLoading,
    onExpand,
    onEdit,
    onEditSave,
    onEditCancel,
    onEditChange,
    onDelete,
  }: {
    peca: FATPecaVinculada;
    isExpanded: boolean;
    isEditing: boolean;
    editQuantidade: number | "";
    editLoading: boolean;
    onExpand: (id: number) => void;
    onEdit: (id: number, quantidade: number) => void;
    onEditSave: (id: number) => void;
    onEditCancel: () => void;
    onEditChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDelete: (id: number) => void;
  }) => (
    <div
      className={`bg-white border border-slate-100 rounded-lg animate-slideInUp p-0 overflow-hidden transition-all duration-200 ${
        isExpanded ? "shadow-lg ring-2 ring-emerald-200" : ""
      }`}
      style={{ cursor: isEditing ? "default" : "pointer" }}
      onClick={() => !isEditing && onExpand(peca.id_fat_peca)}
    >
      {/* Header com código e quantidade */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-1">
          <Hash className="w-4 h-4 text-slate-400" />
          <span className="font-mono text-sm font-semibold text-slate-700">
            {peca.codigo_peca}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <input
                type="number"
                min={1}
                value={editQuantidade}
                onChange={onEditChange}
                className="w-12 px-1 py-0.5 text-sm font-semibold border border-slate-200 rounded focus:border-emerald-400 focus:outline-none text-slate-700 bg-white"
                disabled={editLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onEditSave(peca.id_fat_peca);
                  if (e.key === "Escape") onEditCancel();
                }}
                autoFocus
                style={{ minWidth: 0 }}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-xs text-slate-400 font-medium ml-0.5">
                {peca.unidade_medida}
              </span>
            </>
          ) : (
            <>
              <span className="text-base font-bold text-slate-700">
                {peca.quantidade}
              </span>
              <span className="text-xs text-slate-400 font-medium ml-0.5">
                {peca.unidade_medida}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Descrição sempre visível */}
      <div className="px-3 pt-2 pb-1">
        <p className="text-slate-700 text-xs font-medium leading-5">
          {peca.descricao_peca}
        </p>
      </div>

      {/* Botões de ação só aparecem quando expandido */}
      {isExpanded && (
        <div className="flex flex-row gap-2 px-3 pb-3 pt-1">
          {isEditing ? (
            <>
              <button
                type="button"
                className="flex-1 flex items-center justify-center h-10 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-all border border-transparent font-medium text-sm gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditSave(peca.id_fat_peca);
                }}
                disabled={editLoading}
                title="Salvar"
              >
                <Check className="w-4 h-4" /> Salvar
              </button>
              <button
                type="button"
                className="flex-1 flex items-center justify-center h-10 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-all border border-transparent font-medium text-sm gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditCancel();
                }}
                disabled={editLoading}
                title="Cancelar"
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="flex-1 flex items-center justify-center h-10 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all border border-transparent font-medium text-sm gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(peca.id_fat_peca, peca.quantidade);
                }}
                title="Editar quantidade"
              >
                <Edit3 className="w-4 h-4" /> Editar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(peca.id_fat_peca);
                }}
                className="flex-1 flex items-center justify-center h-10 bg-red-500 text-white rounded hover:bg-red-600 transition-all border border-transparent font-medium text-sm gap-2"
                title="Excluir peça"
              >
                <Trash2 className="w-4 h-4" /> Excluir
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
);

PecaItem.displayName = "PecaItem";

// Componente principal
export default function FATPecasPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  // Estados principais
  const [pecas, setPecas] = useState<FATPecaVinculada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estados de expansão e edição
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editQuantidade, setEditQuantidade] = useState<number | "">("");
  const [editLoading, setEditLoading] = useState(false);

  // Estados do formulário
  const [form, setForm] = useState({
    codigo_peca: "",
    descricao_peca: "",
    quantidade: "" as number | "",
    observacoes: "",
  });
  const [pecaEncontrada, setPecaEncontrada] = useState<PecaBusca | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modoSemCodigo, setModoSemCodigo] = useState(false);

  // Ref para o input de quantidade
  const quantidadeInputRef = React.useRef<HTMLInputElement>(null);

  // Função para buscar peças
  const fetchPecas = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get<FATPecaVinculada[]>("/fats_pecas", {
        params: { id_fat: Number(params.id) },
      });
      setPecas(Array.isArray(response) ? response : []);
    } catch (err) {
      // @ts-expect-error: pode não ter response
      if (err && err.response && err.response.status !== 404) {
        setError("Erro ao carregar peças vinculadas");
      } else {
        setPecas([]);
      }
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchPecas();
  }, [fetchPecas]);

  // Handlers de edição

  // Expansão de card
  const handleExpand = useCallback((id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
    setEditId(null);
    setEditQuantidade("");
    setError("");
  }, []);

  const handleEditClick = useCallback((id: number, quantidade: number) => {
    setEditId(id);
    setEditQuantidade(quantidade);
    setError("");
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditId(null);
    setEditQuantidade("");
    setError("");
  }, []);

  const handleEditQuantidadeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setEditQuantidade(value === "" ? "" : Number(value));
    },
    []
  );

  const handleEditSave = useCallback(
    async (id_fat_peca: number) => {
      if (!editQuantidade || Number(editQuantidade) <= 0) {
        setError("Informe uma quantidade válida.");
        return;
      }
      setEditLoading(true);
      setError("");
      try {
        await api.put(`/fats_pecas?id=${id_fat_peca}`, {
          quantidade: Number(editQuantidade),
        });
        setEditId(null);
        setEditQuantidade("");
        fetchPecas();
      } catch {
        setError("Erro ao atualizar quantidade.");
      } finally {
        setEditLoading(false);
      }
    },
    [editQuantidade, fetchPecas]
  );

  // Handlers do formulário
  const handleCodigoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const codigo_peca = e.target.value;
      setForm((prev) => ({ ...prev, codigo_peca }));
      setError("");
    },
    []
  );

  const handleDescricaoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const descricao_peca = e.target.value;
      setForm((prev) => ({ ...prev, descricao_peca }));
    },
    []
  );

  const handlePesquisarPeca = useCallback(async () => {
    setPecaEncontrada(null);
    setError("");
    const codigo = form.codigo_peca.trim();
    if (!codigo) {
      setError("Digite o código da peça.");
      return;
    }
    setBuscando(true);
    try {
      const res = await api.get<{ dados: PecaBusca[] }>("/pecas", {
        params: { codigo },
      });
      if (res.dados && res.dados.length > 0) {
        const peca = res.dados[0];
        setPecaEncontrada(peca);
        // Preenche automaticamente a descrição se encontrar
        setForm((prev) => ({
          ...prev,
          descricao_peca: peca.descricao,
        }));
        // Foca no input de quantidade após encontrar a peça
        setTimeout(() => {
          quantidadeInputRef.current?.focus();
        }, 100);
      } else {
        setPecaEncontrada(null);
        setError("Código de peça não encontrado");
      }
    } catch (error) {
      setPecaEncontrada(null);

      const apiError = error as ApiError;
      const apiMessage = apiError?.erro?.trim() || "Erro ao buscar peça.";
      setError(apiMessage);
    } finally {
      setBuscando(false);
    }
  }, [form.codigo_peca]);

  const handleQuantidadeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setForm((prev) => ({
        ...prev,
        quantidade: value === "" ? "" : Number(value),
      }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      // Se não está no modo sem código, valida o código
      if (!modoSemCodigo && !form.codigo_peca.trim()) {
        setError("Digite um código de peça válido.");
        return;
      }

      if (!form.descricao_peca.trim()) {
        setError("Digite a descrição da peça.");
        return;
      }
      if (!form.quantidade || Number(form.quantidade) <= 0) {
        setError("Informe a quantidade.");
        return;
      }
      setSubmitting(true);
      try {
        await api.post("/fats_pecas", {
          id_fat: Number(params.id),
          codigo_peca: modoSemCodigo ? "" : form.codigo_peca.trim(),
          descricao_peca: form.descricao_peca.trim(),
          quantidade: Number(form.quantidade),
          unidade_medida: modoSemCodigo
            ? ""
            : pecaEncontrada?.unidade_medida || "",
          observacoes: form.observacoes.trim(),
        });

        setForm({
          codigo_peca: "",
          descricao_peca: "",
          quantidade: "",
          observacoes: "",
        });
        setPecaEncontrada(null);
        setModoSemCodigo(false);
        fetchPecas();
      } catch {
        setError("Erro ao vincular peça à FAT");
      } finally {
        setSubmitting(false);
      }
    },
    [form, pecaEncontrada, params.id, fetchPecas, modoSemCodigo]
  );

  const handleDelete = useCallback(
    async (id_fat_peca: number) => {
      setError("");
      try {
        await api.delete(`/fats_pecas?id=${id_fat_peca}`);
        fetchPecas();
      } catch {
        setError("Erro ao excluir peça");
      }
    },
    [fetchPecas]
  );

  const handleNaoSeiCodigo = useCallback(() => {
    setModoSemCodigo(true);
    setForm((prev) => ({ ...prev, codigo_peca: "" }));
    setPecaEncontrada(null);
    setError("");
  }, []);

  const handleVoltarComCodigo = useCallback(() => {
    setModoSemCodigo(false);
    setForm({
      codigo_peca: "",
      descricao_peca: "",
      quantidade: "",
      observacoes: "",
    });
    setPecaEncontrada(null);
    setError("");
  }, []);

  const pecasCount = useMemo(() => pecas.length, [pecas]);

  const handleBackToFat = useCallback(() => {
    router.push(`/tecnico/os/fat/${params.id}`);
  }, [router, params.id]);

  return (
    <main className="min-h-screen bg-gray-50">
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideInUp {
          animation: slideInUp 0.2s ease-out forwards;
        }
      `}</style>

      <MobileHeader
        title="Peças Utilizadas"
        onAddClick={handleBackToFat}
        leftVariant="back"
      />

      <div className="p-4 max-w-2xl mx-auto space-y-5">
        {/* Formulário */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 text-base mb-5 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-500" />
            Adicionar Peça
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo de código - só aparece se não estiver no modo sem código */}
            {!modoSemCodigo && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Código da Peça
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.codigo_peca}
                      onChange={handleCodigoChange}
                      className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-none transition-all text-sm font-medium text-slate-800 placeholder-slate-400"
                      placeholder="Digite o código..."
                      required={!modoSemCodigo}
                    />
                    <button
                      type="button"
                      onClick={handlePesquisarPeca}
                      disabled={buscando || !form.codigo_peca.trim()}
                      className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium text-sm active:scale-[0.98]"
                    >
                      {buscando ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Botão "Não sei o código" */}
                <button
                  type="button"
                  onClick={handleNaoSeiCodigo}
                  className="w-full py-2 text-sm text-slate-600 hover:text-slate-800 underline transition-colors"
                >
                  Não sei o código
                </button>
              </>
            )}

            {/* Peça encontrada */}
            {pecaEncontrada && !modoSemCodigo && (
              <PecaEncontrada peca={pecaEncontrada} />
            )}

            {/* Modo sem código - mostra campo de descrição */}
            {modoSemCodigo && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Descrição da Peça
                  </label>
                  <input
                    type="text"
                    value={form.descricao_peca}
                    onChange={handleDescricaoChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-none transition-all text-sm font-medium text-slate-800 placeholder-slate-400"
                    placeholder="Digite a descrição da peça..."
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="button"
                  onClick={handleVoltarComCodigo}
                  className="w-full py-2 text-sm text-slate-600 hover:text-slate-800 underline transition-colors"
                >
                  Voltar para busca por código
                </button>
              </>
            )}

            {/* Campo quantidade - sempre aparece quando tem peça encontrada ou está no modo sem código */}
            {(pecaEncontrada || modoSemCodigo) && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Quantidade
                </label>
                <div className="relative">
                  <input
                    ref={quantidadeInputRef}
                    type="number"
                    value={form.quantidade}
                    onChange={handleQuantidadeChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-none transition-all text-sm font-medium text-slate-800 placeholder-slate-400"
                    placeholder="Quantidade de peças"
                    min={1}
                    required
                  />
                  {!modoSemCodigo && pecaEncontrada?.unidade_medida && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">
                      {pecaEncontrada.unidade_medida}
                    </span>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Observações
              </label>
              <input
                type="text"
                value={form.observacoes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, observacoes: e.target.value }))
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-none transition-all text-sm font-medium text-slate-800 placeholder-slate-400"
                placeholder="Observações sobre a peça (opcional)"
              />
            </div>

            {/* Botão submit - aparece quando tem peça encontrada ou está no modo sem código */}
            {(pecaEncontrada || modoSemCodigo) && (
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm active:scale-[0.98]"
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Vinculando...
                  </div>
                ) : (
                  "Vincular Peça"
                )}
              </button>
            )}
          </form>
        </div>

        {/* Mensagem de erro */}
        {error && <ErrorMessage message={error} />}

        {/* Lista de peças */}
        <div className="space-y-4">
          {/* Header da lista */}
          <div className="flex items-center justify-between py-2">
            <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-500" />
              Peças Vinculadas
            </h3>
            {pecasCount > 0 && (
              <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                {pecasCount}
              </span>
            )}
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : pecas.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="p-3 bg-slate-100 rounded-lg w-14 h-14 mx-auto mb-3 flex items-center justify-center">
                <Package className="w-7 h-7 text-slate-400" />
              </div>
              <p className="font-medium text-sm mb-1">Nenhuma peça vinculada</p>
              <p className="text-xs">
                Adicione a primeira peça usando o formulário acima
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pecas.map((peca, index) => (
                <div
                  key={peca.id_fat_peca}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <PecaItem
                    peca={peca}
                    isExpanded={expandedId === peca.id_fat_peca}
                    isEditing={editId === peca.id_fat_peca}
                    editQuantidade={editQuantidade}
                    editLoading={editLoading}
                    onExpand={handleExpand}
                    onEdit={handleEditClick}
                    onEditSave={handleEditSave}
                    onEditCancel={handleEditCancel}
                    onEditChange={handleEditQuantidadeChange}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
