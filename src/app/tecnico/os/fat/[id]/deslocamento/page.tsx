"use client";
import React, { useState, useEffect, useCallback, memo } from "react";
import { useRouter, useParams } from "next/navigation";
import { fatService, type FATDeslocamento } from "@/api/services/fatService";
import api from "@/api/api";
import MobileHeader from "@/components/tecnico/MobileHeader";
import {
  ArrowRight,
  ArrowLeft,
  Trash2,
  Edit3,
  Plus,
  Clock,
  MapPin,
  Car,
  FileText,
  AlertCircle,
} from "lucide-react";
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

// Card de deslocamento minimalista e profissional
const DeslocamentoItem = memo(
  ({
    desloc,
    isExpanded,
    onExpand,
    onEdit,
    onDelete,
  }: {
    desloc: FATDeslocamento;
    isExpanded: boolean;
    onExpand: (id: number) => void;
    onEdit: (d: FATDeslocamento) => void;
    onDelete: (id?: number) => void;
  }) => (
    <div
      className={`bg-white border border-slate-200 rounded-xl animate-slideInUp p-0 overflow-hidden transition-all duration-200 ${
        isExpanded ? "shadow-md ring-1 ring-emerald-200" : "hover:shadow-sm"
      }`}
      style={{ cursor: "pointer" }}
      onClick={() => onExpand(desloc.id_deslocamento)}
    >
      {/* Header com ida e volta lado a lado */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Ida */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center gap-1 text-emerald-600">
            <ArrowRight className="w-4 h-4" />
            <span className="font-mono text-[15px] font-semibold text-slate-800">
              {desloc.km_ida} km
            </span>
            <Clock className="w-3.5 h-3.5 text-slate-500 ml-1" />
            <span className="text-xs text-slate-500">
              {desloc.tempo_ida_min}min
            </span>
          </span>
        </div>
        {/* Volta */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center gap-1 text-blue-600">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-mono text-[15px] font-semibold text-slate-800">
              {desloc.km_volta} km
            </span>
            <Clock className="w-3.5 h-3.5 text-slate-500 ml-1" />
            <span className="text-xs text-slate-500">
              {desloc.tempo_volta_min}min
            </span>
          </span>
        </div>
      </div>
      {/* Observações minimalista na mesma linha */}
      {desloc.observacoes && (
        <div className="flex items-center gap-2 px-4 pb-2 pt-0.5 text-xs text-slate-600">
          <FileText className="w-3 h-3 flex-shrink-0" />
          <span className="font-semibold uppercase tracking-wider">Obs:</span>
          <span className="truncate text-slate-700" title={desloc.observacoes}>
            {desloc.observacoes}
          </span>
        </div>
      )}
      {/* Botões de ação só aparecem quando expandido */}
      {isExpanded && (
        <div className="flex flex-row gap-2 px-4 pb-3 pt-1">
          <button
            type="button"
            className="flex-1 flex items-center justify-center h-9 bg-slate-100 text-slate-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all font-medium text-sm gap-2 border border-slate-200"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(desloc);
            }}
            title="Editar"
          >
            <Edit3 className="w-4 h-4" /> Editar
          </button>
          <button
            type="button"
            className="flex-1 flex items-center justify-center h-9 bg-slate-100 text-slate-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all font-medium text-sm gap-2 border border-slate-200"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(desloc.id_deslocamento);
            }}
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" /> Excluir
          </button>
        </div>
      )}
    </div>
  )
);
DeslocamentoItem.displayName = "DeslocamentoItem";

export default function FATDeslocamentoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [deslocamentos, setDeslocamentos] = useState<FATDeslocamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<FATDeslocamento | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState<{
    id_deslocamento?: number;
    id_fat: number;
    km_ida: number | "";
    km_volta: number | "";
    tempo_ida_min: number | "";
    tempo_volta_min: number | "";
    observacoes?: string;
  }>({
    id_fat: Number(params.id),
    km_ida: "",
    km_volta: "",
    tempo_ida_min: "",
    tempo_volta_min: "",
    observacoes: "",
  });

  // Buscar deslocamentos existentes
  const fetchDeslocamentos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get<FATDeslocamento[]>(`/fats_deslocamentos`, {
        params: { id_fat: Number(params.id) },
      });
      setDeslocamentos(Array.isArray(response) ? response : []);
    } catch {
      setError("Erro ao carregar deslocamentos");
      setDeslocamentos([]); // Garante array mesmo em erro
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchDeslocamentos();
  }, [fetchDeslocamentos]);

  // Handlers de formulário
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name.startsWith("km") || name.startsWith("tempo")
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        ...form,
        id_fat: Number(params.id),
        km_ida: form.km_ida === "" ? 0 : Number(form.km_ida),
        km_volta: form.km_volta === "" ? 0 : Number(form.km_volta),
        tempo_ida_min:
          form.tempo_ida_min === "" ? 0 : Number(form.tempo_ida_min),
        tempo_volta_min:
          form.tempo_volta_min === "" ? 0 : Number(form.tempo_volta_min),
      };
      if (editing && form.id_deslocamento) {
        await fatService.updateDeslocamento({
          ...payload,
          id_deslocamento: form.id_deslocamento,
        });
      } else {
        await fatService.createDeslocamento(payload);
      }
      setForm({
        id_fat: Number(params.id),
        km_ida: "",
        km_volta: "",
        tempo_ida_min: "",
        tempo_volta_min: "",
        observacoes: "",
      });
      setEditing(null);
      fetchDeslocamentos();
    } catch {
      setError("Erro ao salvar deslocamento");
    }
  };

  const handleExpand = useCallback((id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleEdit = (desloc: FATDeslocamento) => {
    setEditing(desloc);
    setForm({
      id_deslocamento: desloc.id_deslocamento,
      id_fat: Number(params.id),
      km_ida: desloc.km_ida,
      km_volta: desloc.km_volta,
      tempo_ida_min: desloc.tempo_ida_min ?? "",
      tempo_volta_min: desloc.tempo_volta_min ?? "",
      observacoes: desloc.observacoes || "",
    });
    setExpandedId(desloc.id_deslocamento);
  };

  const handleDelete = async (id_deslocamento?: number) => {
    if (!id_deslocamento) return;
    setError("");
    try {
      await fatService.deleteDeslocamento(id_deslocamento, Number(params.id));
      fetchDeslocamentos();
    } catch {
      setError("Erro ao excluir deslocamento");
    }
  };

  const resetForm = () => {
    setEditing(null);
    setForm({
      id_fat: Number(params.id),
      km_ida: "",
      km_volta: "",
      tempo_ida_min: "",
      tempo_volta_min: "",
      observacoes: "",
    });
    setExpandedId(null);
  };

  const handleBackToFat = useCallback(() => {
    router.push(`/tecnico/os/fat/${params.id}`);
  }, [router, params.id]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
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
        title="Deslocamentos"
        onAddClick={handleBackToFat}
        leftVariant="back"
      />

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Formulário */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/20">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
              <Car className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-medium text-slate-700">
              {editing ? "Editar Deslocamento" : "Novo Deslocamento"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Grid de distâncias */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                  <MapPin className="w-3.5 h-3.5" />
                  KM Ida
                </label>
                <input
                  type="number"
                  name="km_ida"
                  value={form.km_ida}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all outline-none bg-white/70 text-slate-800 placeholder-slate-500"
                  required
                  min={0}
                  placeholder="KM"
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                  <MapPin className="w-3.5 h-3.5" />
                  KM Volta
                </label>
                <input
                  type="number"
                  name="km_volta"
                  value={form.km_volta}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all outline-none bg-white/70 text-slate-800 placeholder-slate-500"
                  required
                  min={0}
                  placeholder="KM"
                />
              </div>
            </div>

            {/* Grid de tempos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                  <Clock className="w-3.5 h-3.5" />
                  Tempo Ida (min)
                </label>
                <input
                  type="number"
                  name="tempo_ida_min"
                  value={form.tempo_ida_min}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all outline-none bg-white/70 text-slate-800 placeholder-slate-500"
                  required
                  min={0}
                  placeholder="Min"
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                  <Clock className="w-3.5 h-3.5" />
                  Tempo Volta (min)
                </label>
                <input
                  type="number"
                  name="tempo_volta_min"
                  value={form.tempo_volta_min}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all outline-none bg-white/70 text-slate-800 placeholder-slate-500"
                  required
                  min={0}
                  placeholder="Min"
                />
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                <FileText className="w-3.5 h-3.5" />
                Observações
              </label>
              <textarea
                name="observacoes"
                value={form.observacoes}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all outline-none bg-white/70 resize-none text-slate-800 placeholder-slate-500"
                rows={2}
                placeholder="Observações..."
              />
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-md hover:shadow-emerald-500/25"
              >
                {editing ? (
                  <Edit3 className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {editing ? "Salvar" : "Adicionar"}
              </button>

              {editing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-all transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  Cancelar
                </button>
              )}
            </div>

            {error && <ErrorMessage message={error} />}
          </form>
        </div>

        {/* Lista de deslocamentos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <h3 className="font-semibold text-slate-800 text-base flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-slate-500" />
              Deslocamentos
            </h3>
            {deslocamentos.length > 0 && (
              <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                {deslocamentos.length}
              </span>
            )}
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : deslocamentos.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="p-3 bg-slate-100 rounded-lg w-14 h-14 mx-auto mb-3 flex items-center justify-center">
                <ArrowRight className="w-7 h-7 text-slate-400" />
              </div>
              <p className="font-medium text-sm mb-1">
                Nenhum deslocamento cadastrado
              </p>
              <p className="text-xs">
                Adicione o primeiro deslocamento usando o formulário acima
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {deslocamentos.map((desloc, index) => (
                <div
                  key={desloc.id_deslocamento}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <DeslocamentoItem
                    desloc={desloc}
                    isExpanded={expandedId === desloc.id_deslocamento}
                    onExpand={handleExpand}
                    onEdit={handleEdit}
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
