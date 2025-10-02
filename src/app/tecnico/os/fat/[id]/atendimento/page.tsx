"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { fatService, type FATDetalhada } from "@/api/services/fatService";
import { motivosAtendimentoService } from "@/api/services/motivosAtendimentoService";
import MobileHeader from "@/components/tecnico/MobileHeader";
import { Loading } from "@/components/LoadingPersonalizado";
import Toast from "@/components/tecnico/Toast";
import {
  CheckSquare,
  Eye,
  MessageSquare,
  FileText,
  Timer,
  Save,
  AlertTriangle,
  Edit3,
  Lock,
} from "lucide-react";

// Componente Section otimizado com React.memo
const Section = React.memo(
  ({
    title,
    icon,
    children,
    locked = false,
  }: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    locked?: boolean;
  }) => {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
        <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <div className="text-blue-600">{icon}</div>
          <h3 className="font-semibold text-slate-800 text-sm flex-1">
            {title}
          </h3>
          {locked && <Lock className="w-3.5 h-3.5 text-slate-400" />}
        </div>
        <div className="p-4">{children}</div>
      </div>
    );
  }
);

Section.displayName = "Section";

// Componente de TextArea otimizado com autoexpansão
const TextAreaField = React.memo(
  ({
    name,
    value,
    onChange,
    placeholder,
    rows = 3,
    disabled = false,
  }: {
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder: string;
    rows?: number;
    disabled?: boolean;
  }) => {
    const textAreaRef = React.useRef<HTMLTextAreaElement>(null);

    // Função para ajustar altura automaticamente
    const adjustHeight = React.useCallback(() => {
      const textArea = textAreaRef.current;
      if (textArea) {
        textArea.style.height = "auto";
        textArea.style.height = textArea.scrollHeight + "px";
      }
    }, []);

    // Ajusta a altura no carregamento inicial e quando o valor muda
    React.useEffect(() => {
      adjustHeight();
    }, [value, adjustHeight]);

    // Handler de mudança personalizado
    const handleTextAreaChange = (
      e: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      onChange(e);
      adjustHeight();
    };

    return (
      <textarea
        ref={textAreaRef}
        name={name}
        value={value}
        onChange={handleTextAreaChange}
        disabled={disabled}
        className={`w-full px-4 py-3 rounded-lg border transition-all outline-none min-h-[80px] text-sm leading-relaxed ${
          disabled
            ? "bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed"
            : "bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        }`}
        rows={rows}
        placeholder={placeholder}
        style={{ overflow: "hidden", resize: "none" }}
      />
    );
  }
);

TextAreaField.displayName = "TextAreaField";

export default function FATAtendimentoPage() {
  const router = useRouter();
  const params = useParams();
  const [fat, setFat] = useState<FATDetalhada | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Estado para controlar edição da descrição do problema e motivo
  const [isDescricaoEditable, setIsDescricaoEditable] = useState(false);

  // Estado para motivos de atendimento
  const [motivos, setMotivos] = useState<{ id: number; descricao: string }[]>(
    []
  );
  const [motivoSelecionado, setMotivoSelecionado] = useState<number | null>(
    null
  );

  // Form state
  const [form, setForm] = useState({
    descricao_problema: "",
    solucao_encontrada: "",
    testes_realizados: "",
    sugestoes: "",
    observacoes: "",
    numero_ciclos: "",
  });

  // Verificar se houve mudanças no formulário (memoizado)
  const hasChanges = useMemo(() => {
    if (!fat) return false;
    return (
      form.descricao_problema !== (fat.descricao_problema || "") ||
      form.solucao_encontrada !== (fat.solucao_encontrada || "") ||
      form.testes_realizados !== (fat.testes_realizados || "") ||
      form.sugestoes !== (fat.sugestoes || "") ||
      form.observacoes !== (fat.observacoes || "") ||
      form.numero_ciclos !== (fat.numero_ciclos?.toString() || "") ||
      motivoSelecionado !== (fat.motivo_atendimento?.id_motivo ?? null)
    );
  }, [form, fat, motivoSelecionado]);

  // Carregar dados da FAT e motivos de atendimento
  const fetchFAT = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (!params?.id) throw new Error("ID da FAT não fornecido");
      const [response, motivosList] = await Promise.all([
        fatService.getById(Number(params.id)),
        motivosAtendimentoService.getAll(),
      ]);
      setFat(response);
      setForm({
        descricao_problema: response.descricao_problema || "",
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
      setMotivos(
        motivosList.map((m) => ({ id: m.id, descricao: m.descricao }))
      );
      setMotivoSelecionado(response.motivo_atendimento?.id_motivo ?? null);
      setIsDescricaoEditable(false);
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

  // Handler de input (otimizado com useCallback)
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  // Handler para seleção de motivo
  const handleMotivoChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setMotivoSelecionado(Number(e.target.value));
    },
    []
  );

  // Toggle edição da descrição
  const toggleDescricaoEdit = useCallback(() => {
    setIsDescricaoEditable((prev) => !prev);
  }, []);

  // Salvar alterações (otimizado)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasChanges) {
      setToast({ message: "Nenhuma alteração detectada", type: "error" });
      return;
    }

    setSaving(true);
    setError("");
    setToast(null);

    try {
      if (!fat) throw new Error("FAT não carregada");

      const payload: Partial<FATDetalhada> = {
        descricao_problema: form.descricao_problema,
        solucao_encontrada: form.solucao_encontrada,
        testes_realizados: form.testes_realizados,
        sugestoes: form.sugestoes,
        observacoes: form.observacoes,
        ...(form.numero_ciclos !== "" && form.numero_ciclos !== "0"
          ? { numero_ciclos: Number(form.numero_ciclos) }
          : {}),
        ...(motivoSelecionado
          ? { id_motivo_atendimento: motivoSelecionado }
          : {}),
      };

      const response = await fatService.update(fat.id_fat, payload);

      if (
        response &&
        typeof response === "object" &&
        "mensagem" in response &&
        typeof response.mensagem === "string"
      ) {
        setToast({ message: response.mensagem, type: "success" });
      } else {
        setToast({
          message: "Alterações salvas com sucesso!",
          type: "success",
        });
      }

      setTimeout(() => {
        setToast(null);
        if (params?.id) {
          router.push(`/tecnico/os/fat/${params.id}`);
        } else {
          router.back();
        }
      }, 1200);
    } catch (err: unknown) {
      let errorMsg = "Erro ao salvar alterações";
      if (err && typeof err === "object") {
        if (
          "mensagem" in err &&
          typeof (err as { mensagem?: unknown }).mensagem === "string"
        ) {
          errorMsg = (err as { mensagem: string }).mensagem;
        } else if (err instanceof Error) {
          errorMsg = err.message;
        }
      }
      setError(errorMsg);
      setToast({ message: errorMsg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Componente de loading otimizado
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

  // Componente de erro otimizado
  if (error && !fat) {
    return (
      <>
        <MobileHeader title="Atendimento" onMenuClick={() => router.back()} />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl border border-red-100">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="font-bold text-slate-900 mb-2 text-lg">Ops!</h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {error}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => router.back()}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 active:scale-95 transition-all"
              >
                Voltar
              </button>
              <button
                onClick={() => fetchFAT()}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-200"
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <MobileHeader
        title={fat?.id_fat ? `FAT #${fat.id_fat}` : "Atendimento"}
        onMenuClick={() => router.back()}
      />

      {/* Toast de feedback */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="px-4 pt-4 pb-24 space-y-4">
        {/* Descrição do Problema com Botão de Edição */}
        <Section
          title="Descrição do Problema"
          icon={<AlertTriangle className="w-4 h-4" />}
          locked={!isDescricaoEditable}
        >
          <div className="space-y-3">
            {/* Motivo de Atendimento */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Motivo do Atendimento
              </label>
              {isDescricaoEditable ? (
                <select
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none bg-white text-slate-800 text-sm"
                  value={motivoSelecionado ?? ""}
                  onChange={handleMotivoChange}
                  disabled={!isDescricaoEditable}
                >
                  <option value="" disabled>
                    Selecione o motivo...
                  </option>
                  {motivos.map((motivo) => (
                    <option key={motivo.id} value={motivo.id}>
                      {motivo.descricao}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-4 py-2 rounded-lg border border-slate-100 bg-slate-50 text-slate-700 text-sm">
                  {motivos.find(
                    (m) =>
                      m.id ===
                      (fat?.motivo_atendimento?.id_motivo ?? motivoSelecionado)
                  )?.descricao || "-"}
                </div>
              )}
            </div>
            <TextAreaField
              name="descricao_problema"
              value={form.descricao_problema}
              onChange={handleChange}
              placeholder="Descreva o problema apresentado pelo cliente..."
              rows={3}
              disabled={!isDescricaoEditable}
            />

            {!isDescricaoEditable && (
              <button
                type="button"
                onClick={toggleDescricaoEdit}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
              >
                <Edit3 className="w-4 h-4" />
                Editar Descrição
              </button>
            )}
          </div>
        </Section>

        {/* Solução Encontrada */}
        <Section
          title="Solução Encontrada"
          icon={<CheckSquare className="w-4 h-4" />}
        >
          <TextAreaField
            name="solucao_encontrada"
            value={form.solucao_encontrada}
            onChange={handleChange}
            placeholder="Descreva a solução encontrada para o problema..."
            rows={3}
          />
        </Section>

        {/* Testes Realizados */}
        <Section title="Testes Realizados" icon={<Eye className="w-4 h-4" />}>
          <TextAreaField
            name="testes_realizados"
            value={form.testes_realizados}
            onChange={handleChange}
            placeholder="Descreva os testes realizados na máquina..."
            rows={3}
          />
        </Section>

        {/* Sugestões */}
        <Section title="Sugestões" icon={<MessageSquare className="w-4 h-4" />}>
          <TextAreaField
            name="sugestoes"
            value={form.sugestoes}
            onChange={handleChange}
            placeholder="Sugestões para o cliente ou equipe técnica..."
            rows={3}
          />
        </Section>

        {/* Observações */}
        <Section title="Observações" icon={<FileText className="w-4 h-4" />}>
          <TextAreaField
            name="observacoes"
            value={form.observacoes}
            onChange={handleChange}
            placeholder="Observações adicionais sobre o atendimento..."
            rows={3}
          />
        </Section>

        {/* Número de Ciclos */}
        <Section title="Número de Ciclos" icon={<Timer className="w-4 h-4" />}>
          <input
            type="number"
            name="numero_ciclos"
            value={form.numero_ciclos === "0" ? "" : form.numero_ciclos}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none bg-white text-slate-800 placeholder-slate-400 text-sm"
            min={0}
            placeholder="Informe o número de ciclos da máquina."
          />
        </Section>
      </form>

      {/* Botões de ação - Fixos na parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-2xl">
        <div className="flex gap-3 max-w-screen-sm mx-auto">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all active:scale-95"
          >
            Voltar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving || !hasChanges}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg shadow-blue-200"
          >
            <Save className="w-4 h-4" />
            {saving
              ? "Salvando..."
              : hasChanges
              ? "Salvar Alterações"
              : "Sem Alterações"}
          </button>
        </div>
      </div>
    </main>
  );
}
