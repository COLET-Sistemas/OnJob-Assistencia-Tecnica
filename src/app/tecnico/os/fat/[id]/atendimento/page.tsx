"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { fatService, type FATDetalhada } from "@/api/services/fatService";
import MobileHeader from "@/components/tecnico/MobileHeader";
import { Loading } from "@/components/LoadingPersonalizado";
import {
  CheckSquare,
  Eye,
  MessageSquare,
  FileText,
  Timer,
  Save,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

const Section = React.memo(
  ({
    title,
    icon,
    children,
  }: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }) => {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 p-4 border-b border-slate-100">
          <div className="text-slate-600">{icon}</div>
          <h3 className="font-medium text-slate-900 text-sm">{title}</h3>
        </div>
        <div className="p-4">{children}</div>
      </div>
    );
  }
);

Section.displayName = "Section";

export default function FATAtendimentoPage() {
  const router = useRouter();
  const params = useParams();
  const [fat, setFat] = useState<FATDetalhada | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [form, setForm] = useState({
    solucao_encontrada: "",
    testes_realizados: "",
    sugestoes: "",
    observacoes: "",
    numero_ciclos: "",
  });

  // Carregar dados da FAT
  const fetchFAT = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (!params?.id) throw new Error("ID da FAT não fornecido");
      const response = await fatService.getById(Number(params.id));
      setFat(response);
      setForm({
        solucao_encontrada: response.solucao_encontrada || "",
        testes_realizados: response.testes_realizados || "",
        sugestoes: response.sugestoes || "",
        observacoes: response.observacoes || "",
        numero_ciclos:
          response.numero_ciclos !== undefined &&
          response.numero_ciclos !== null
            ? response.numero_ciclos.toString()
            : "",
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro ao carregar FAT");
      }
    } finally {
      setLoading(false);
    }
  }, [params?.id]);

  useEffect(() => {
    fetchFAT();
  }, [fetchFAT]);

  // Handler de input
  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Salvar alterações
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      if (!fat) throw new Error("FAT não carregada");
      const payload: Partial<FATDetalhada> = {
        solucao_encontrada: form.solucao_encontrada,
        testes_realizados: form.testes_realizados,
        sugestoes: form.sugestoes,
        observacoes: form.observacoes,
        // Só envia numero_ciclos se preenchido e diferente de zero
        ...(form.numero_ciclos !== "" && form.numero_ciclos !== "0"
          ? { numero_ciclos: Number(form.numero_ciclos) }
          : {}),
      };
      await fatService.update(fat.id_fat, payload);
      setSuccess("Alterações salvas com sucesso!");
      setTimeout(() => setSuccess(""), 1000);
      // Voltar para tela de FAT e atualizar dados
      if (params?.id) {
        router.push(`/tecnico/os/fat/${params.id}`);
      } else {
        router.back();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro ao salvar alterações");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <MobileHeader title="Atendimento" onMenuClick={() => router.back()} />
        <Loading
          fullScreen={true}
          preventScroll={false}
          text="Carregando atendimento..."
          size="large"
        />
      </>
    );
  }

  if (error && !fat) {
    return (
      <>
        <MobileHeader title="Atendimento" onMenuClick={() => router.back()} />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-lg border border-red-200">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="font-semibold text-slate-900 mb-3 text-lg">Erro</h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {error}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => router.back()}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => fetchFAT()}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <MobileHeader
        title={fat?.id_fat ? `FAT #${fat.id_fat}` : "Atendimento"}
        onMenuClick={() => router.back()}
      />

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="px-4 pb-2 space-y-4 mt-4">
        {/* Solução Encontrada */}
        <Section
          title="Solução Encontrada"
          icon={<CheckSquare className="w-4 h-4" />}
        >
          <textarea
            name="solucao_encontrada"
            value={form.solucao_encontrada}
            onChange={handleChange}
            className="w-full px-3 py-3 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200/30 transition-all outline-none bg-white text-slate-800 placeholder-slate-500 resize-none text-sm"
            rows={3}
            placeholder="Descreva a solução encontrada para o problema..."
          />
        </Section>

        {/* Testes Realizados */}
        <Section title="Testes Realizados" icon={<Eye className="w-4 h-4" />}>
          <textarea
            name="testes_realizados"
            value={form.testes_realizados}
            onChange={handleChange}
            className="w-full px-3 py-3 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200/30 transition-all outline-none bg-white text-slate-800 placeholder-slate-500 resize-none text-sm"
            rows={3}
            placeholder="Descreva os testes realizados no equipamento..."
          />
        </Section>

        {/* Sugestões */}
        <Section title="Sugestões" icon={<MessageSquare className="w-4 h-4" />}>
          <textarea
            name="sugestoes"
            value={form.sugestoes}
            onChange={handleChange}
            className="w-full px-3 py-3 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200/30 transition-all outline-none bg-white text-slate-800 placeholder-slate-500 resize-none text-sm"
            rows={3}
            placeholder="Sugestões para o cliente ou equipe técnica..."
          />
        </Section>

        {/* Observações e Número de Ciclos */}
        <div className="grid grid-cols-1 gap-4">
          <Section title="Observações" icon={<FileText className="w-4 h-4" />}>
            <textarea
              name="observacoes"
              value={form.observacoes}
              onChange={handleChange}
              className="w-full px-3 py-3 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200/30 transition-all outline-none bg-white text-slate-800 placeholder-slate-500 resize-none text-sm"
              rows={2}
              placeholder="Observações adicionais sobre o atendimento..."
            />
          </Section>

          <Section
            title="Número de Ciclos"
            icon={<Timer className="w-4 h-4" />}
          >
            <input
              type="number"
              name="numero_ciclos"
              value={form.numero_ciclos === "0" ? "" : form.numero_ciclos}
              onChange={handleChange}
              className="w-full px-3 py-3 rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200/30 transition-all outline-none bg-white text-slate-800 placeholder-slate-500 text-sm"
              min={0}
              placeholder="Informe o número de ciclos realizados"
            />
          </Section>
        </div>

        {/* Mensagens de feedback */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <p className="text-emerald-800 font-medium text-sm">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <p className="text-red-800 font-medium text-sm">{error}</p>
            </div>
          </div>
        )}
        {/* Botões de ação - Fixos na parte inferior */}
        <div className="p-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
