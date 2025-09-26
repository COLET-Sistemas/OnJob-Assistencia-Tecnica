"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { fatService, type FATDeslocamento } from "@/api/services/fatService";
import api from "@/api/api";
import MobileHeader from "@/components/tecnico/MobileHeader";
import {
  Car,
  Trash2,
  Edit3,
  Plus,
  Clock,
  MapPin,
  FileText,
} from "lucide-react";

export default function FATDeslocamentoPage() {
  const router = useRouter();
  const params = useParams();
  const [deslocamentos, setDeslocamentos] = useState<FATDeslocamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<FATDeslocamento | null>(null);
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
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <MobileHeader title="Deslocamentos" onMenuClick={() => router.back()} />

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

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* Lista de deslocamentos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-slate-700">
              Deslocamentos
            </h3>
            <div className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
              {deslocamentos.length}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
            </div>
          ) : deslocamentos.length === 0 ? (
            <div className="text-center p-8 bg-white/50 rounded-xl border-2 border-dashed border-slate-200">
              <Car className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600 font-medium text-sm">
                Nenhum deslocamento cadastrado
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Adicione o primeiro deslocamento
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {deslocamentos.map((d) => (
                <div
                  key={d.id_deslocamento}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-white/20 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <MapPin className="w-3 h-3" />
                            <span className="text-xs font-medium">
                              Distância
                            </span>
                          </div>
                          <div className="text-slate-800 font-medium text-sm">
                            {d.km_ida} km → {d.km_volta} km
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs font-medium">Tempo</span>
                          </div>
                          <div className="text-slate-800 font-medium text-sm">
                            {d.tempo_ida_min}min → {d.tempo_volta_min}min
                          </div>
                        </div>
                      </div>

                      {d.observacoes && (
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-1.5 text-slate-600 mb-1">
                            <FileText className="w-3 h-3" />
                            <span className="text-xs font-medium uppercase tracking-wider">
                              Obs
                            </span>
                          </div>
                          <p className="text-slate-700 text-xs leading-relaxed">
                            {d.observacoes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Botões de ação - Sempre visíveis em mobile */}
                    <div className="flex flex-col gap-1.5 ml-2">
                      <button
                        onClick={() => handleEdit(d)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md active:scale-95 transition-all hover:from-blue-600 hover:to-blue-700"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(d.id_deslocamento)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md active:scale-95 transition-all hover:from-red-600 hover:to-red-700"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
