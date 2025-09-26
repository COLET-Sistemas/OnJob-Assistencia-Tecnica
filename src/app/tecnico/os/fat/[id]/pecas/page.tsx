"use client";
import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useRouter, useParams } from "next/navigation";
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

// Componente de item de peça
const PecaItem = memo(
  ({
    peca,
    isEditing,
    editQuantidade,
    editLoading,
    onEdit,
    onEditSave,
    onEditCancel,
    onEditChange,
    onDelete,
  }: {
    peca: FATPecaVinculada;
    isEditing: boolean;
    editQuantidade: number | "";
    editLoading: boolean;
    onEdit: (id: number, quantidade: number) => void;
    onEditSave: (id: number) => void;
    onEditCancel: () => void;
    onEditChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDelete: (id: number) => void;
  }) => (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm animate-slideInUp">
      {/* Header com código */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-slate-500" />
          <span className="font-mono text-sm font-semibold text-red-700">
            {peca.codigo_peca}
          </span>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        {/* Descrição */}
        <p className="text-slate-800 text-sm font-medium mb-4 leading-5">
          {peca.descricao_peca}
        </p>

        {/* Quantidade e ações */}
        <div className="flex items-center justify-between">
          {/* Seção de quantidade */}
          <div className="flex items-center gap-3">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={editQuantidade}
                  onChange={onEditChange}
                  className="w-16 px-2 py-1 text-sm font-medium border border-slate-300 rounded focus:border-emerald-500 focus:outline-none"
                  disabled={editLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onEditSave(peca.id_fat_peca);
                    if (e.key === "Escape") onEditCancel();
                  }}
                  autoFocus
                />
                <span className="text-xs text-slate-500">
                  {peca.unidade_medida}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">
                  {peca.quantidade}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {peca.unidade_medida}
                </span>
              </div>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <button
                  type="button"
                  className="flex items-center justify-center w-8 h-8 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 active:scale-95 transition-all"
                  onClick={() => onEditSave(peca.id_fat_peca)}
                  disabled={editLoading}
                  title="Salvar"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center w-8 h-8 bg-slate-400 text-white rounded-md hover:bg-slate-500 active:scale-95 transition-all"
                  onClick={onEditCancel}
                  disabled={editLoading}
                  title="Cancelar"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-600 rounded-md hover:bg-blue-100 hover:text-blue-600 active:scale-95 transition-all"
                  onClick={() => onEdit(peca.id_fat_peca, peca.quantidade)}
                  title="Editar quantidade"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(peca.id_fat_peca)}
                  className="flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-600 rounded-md hover:bg-red-100 hover:text-red-600 active:scale-95 transition-all"
                  title="Excluir peça"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
);

PecaItem.displayName = "PecaItem";

// Componente principal
export default function FATPecasPage() {
  const router = useRouter();
  const params = useParams();

  // Estados principais
  const [pecas, setPecas] = useState<FATPecaVinculada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estados de edição
  const [editId, setEditId] = useState<number | null>(null);
  const [editQuantidade, setEditQuantidade] = useState<number | "">("");
  const [editLoading, setEditLoading] = useState(false);

  // Estados do formulário
  const [form, setForm] = useState({
    codigo_peca: "",
    quantidade: "" as number | "",
  });
  const [pecaEncontrada, setPecaEncontrada] = useState<PecaBusca | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      setPecaEncontrada(null);
      setError("");
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
      } else {
        setPecaEncontrada(null);
        setError("Código de peça não encontrado");
      }
    } catch {
      setPecaEncontrada(null);
      setError("Erro ao buscar peça");
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
      if (!form.codigo_peca || !pecaEncontrada) {
        setError("Digite um código de peça válido.");
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
          codigo_peca: form.codigo_peca,
          descricao_peca: pecaEncontrada.descricao,
          quantidade: Number(form.quantidade),
          unidade_medida: pecaEncontrada.unidade_medida,
        });
        setForm({ codigo_peca: "", quantidade: "" });
        setPecaEncontrada(null);
        fetchPecas();
      } catch {
        setError("Erro ao vincular peça à FAT");
      } finally {
        setSubmitting(false);
      }
    },
    [form, pecaEncontrada, params.id, fetchPecas]
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

  // Auto busca quando código tem 3+ caracteres
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (form.codigo_peca.length >= 3 && !pecaEncontrada && !buscando) {
        handlePesquisarPeca();
      }
    }, 600);

    return () => clearTimeout(delayedSearch);
  }, [form.codigo_peca, pecaEncontrada, buscando, handlePesquisarPeca]);

  const pecasCount = useMemo(() => pecas.length, [pecas]);

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
        onMenuClick={() => router.back()}
      />

      <div className="p-4 max-w-2xl mx-auto space-y-5">
        {/* Formulário */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 text-base mb-5 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-500" />
            Adicionar Peça
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo de busca */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Código da Peça
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.codigo_peca}
                  onChange={handleCodigoChange}
                  className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-none transition-all text-sm font-medium text-slate-800 placeholder-slate-400"
                  placeholder="Digite o código para buscar..."
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {buscando ? (
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin"></div>
                  ) : (
                    <Search className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Peça encontrada */}
            {pecaEncontrada && <PecaEncontrada peca={pecaEncontrada} />}

            {/* Campo quantidade */}
            {pecaEncontrada && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Quantidade
                </label>
                <input
                  type="number"
                  value={form.quantidade}
                  onChange={handleQuantidadeChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-none transition-all text-sm font-medium text-slate-800 placeholder-slate-400"
                  placeholder="Ex: 2"
                  min={1}
                  required
                />
              </div>
            )}

            {/* Botão submit */}
            {pecaEncontrada && (
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
                    isEditing={editId === peca.id_fat_peca}
                    editQuantidade={editQuantidade}
                    editLoading={editLoading}
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
