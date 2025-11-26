"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  Info,
  ShieldCheck,
  X,
} from "lucide-react";
import { useTitle } from "@/context/TitleContext";
import { useLicenca } from "@/hooks";
import { Loading } from "@/components/LoadingPersonalizado";
import PageHeader from "@/components/admin/ui/PageHeader";
import type { LicencaTipo } from "@/types/licenca";

type FeatureValue = boolean | string;

type FeatureRow = {
  title: string;
  values: Record<LicencaTipo, FeatureValue>;
  subItems?: string[];
  notes?: Partial<Record<LicencaTipo, string>>;
};

type FeatureSection = {
  title: string;
  items: FeatureRow[];
};

const planOrder: LicencaTipo[] = ["S", "G", "P"];
const planNames: Record<LicencaTipo, string> = {
  S: "Silver",
  G: "Gold",
  P: "Platinum",
};

const featureSections: FeatureSection[] = [
  {
    title: "Módulo administrativo (web)",
    items: [
      { title: "Cadastrar usuários", values: { S: true, G: true, P: true } },
      { title: "Cadastrar clientes", values: { S: true, G: true, P: true } },
      { title: "Cadastrar máquinas", values: { S: true, G: true, P: true } },
      { title: "Cadastrar regiões", values: { S: true, G: true, P: true } },
      {
        title: "Cadastrar técnicos próprios",
        values: { S: true, G: true, P: true },
      },
      {
        title: "Cadastrar técnicos terceirizados",
        values: { S: false, G: true, P: true },
      },
      { title: "Gerenciar OSs", values: { S: true, G: true, P: true } },
      {
        title: "Consultar OSs por diversos critérios",
        values: { S: true, G: true, P: true },
      },
      { title: "Visualizar dashboard", values: { S: true, G: true, P: true } },
      {
        title: "Histórico de atendimentos por cliente",
        values: { S: true, G: true, P: true },
      },
      {
        title: "Histórico de atendimentos por máquina",
        values: { S: true, G: true, P: true },
      },
      {
        title: "Cadastrar peças e tipos de peças",
        values: { S: false, G: true, P: true },
      },
      {
        title: "Controlar liberação financeira",
        values: { S: false, G: true, P: true },
      },
      {
        title: "Revisar OSs (gestor)",
        subItems: ["Fazer ajustes nas fotos", "Informar anotações do gestor"],
        values: { S: false, G: true, P: true },
        notes: {
          S: "OS concluída pelo técnico é encerrada",
          G: "OS concluída pelo técnico vai para revisão",
          P: "OS concluída pelo técnico vai para revisão",
        },
      },
      {
        title: "Revisar OSs (gestor)",
        subItems: ["Fazer ajustes nas peças"],
        values: { S: false, G: true, P: true },
      },
      {
        title: "Revisar OSs (gestor)",
        subItems: ["Fazer ajustes nos deslocamentos"],
        values: { S: false, G: false, P: true },
      },
      {
        title: "Enviar automático aviso de OS concluída por WhatsApp",
        values: { S: false, G: true, P: true },
      },
      {
        title: "Visualizar painel de monitoramento",
        values: { S: false, G: true, P: true },
      },
      {
        title: "Registrar OSs retroativas (antigas)",
        values: { S: false, G: false, P: true },
      },
    ],
  },
  {
    title: "Módulo técnico (smartphone)",
    items: [
      {
        title: "Registrar atendimentos em campo",
        values: { S: true, G: true, P: true },
      },
      {
        title: "Traçar rotas Google Maps ou Waze",
        values: { S: true, G: true, P: true },
      },
      {
        title: "Registrar peças consumidas nos atendimentos",
        values: {
          S: "descrição e qtde",
          G: "código ou descrição e qtde",
          P: "código ou descrição e qtde",
        },
      },
      {
        title: "Histórico da máquina da OS em atendimento",
        values: { S: true, G: true, P: true },
      },
      {
        title: "Histórico do cliente da OS em atendimento",
        values: { S: true, G: true, P: true },
      },
      {
        title: "Histórico de atendimentos de clientes sem OS",
        values: { S: false, G: true, P: true },
      },
      {
        title: "Histórico de atendimentos de máquinas sem OS",
        values: { S: false, G: true, P: true },
      },
      {
        title: "Registrar fotos nas OSs",
        values: { S: true, G: true, P: true },
      },
      {
        title: "Registrar deslocamentos",
        values: { S: false, G: false, P: true },
      },
      {
        title: "Abrir nova OS (técnico)",
        values: { S: false, G: false, P: true },
      },
      {
        title: "Quantidade máxima de fotos por OS",
        values: { S: "-", G: "até 3", P: "até 8" },
      },
      {
        title: "Tamanho máximo por foto enviada",
        values: { S: "-", G: "até 3 MB", P: "até 5 MB" },
      },
    ],
  },
  {
    title: "Suporte técnico",
    items: [
      {
        title: "Treinamento online gravado",
        values: { S: true, G: true, P: true },
      },
      { title: "Suporte prioritário", values: { S: false, G: false, P: true } },
      {
        title: "Formas de suporte",
        values: { S: "e-mail", G: "e-mail", P: "email e ticket" },
      },
      {
        title: "SLA (tempo máximo de atendimento)",
        values: {
          S: "até 5 dias úteis",
          G: "até 3 dias úteis",
          P: "até 1 dia útil",
        },
      },
    ],
  },
  {
    title: "Serviços adicionais",
    items: [
      {
        title: "Importação de cadastros",
        values: { S: "consultar", G: "consultar", P: "consultar" },
      },
      {
        title: "Treinamento personalizado online",
        values: { S: "consultar", G: "consultar", P: "consultar" },
      },
    ],
  },
];

const StatusBadge = ({
  value,
  note,
}: {
  value: FeatureValue;
  note?: string;
}) => {
  if (typeof value === "boolean") {
    const icon = value ? (
      <Check size={16} className="text-emerald-600" strokeWidth={2.5} />
    ) : (
      <X size={16} className="text-rose-500" strokeWidth={2.5} />
    );

    return (
      <div className="flex flex-col items-center gap-1 text-center">
        <div
          className={`w-9 h-9 rounded-full border flex items-center justify-center ${
            value
              ? "border-emerald-200 bg-emerald-50"
              : "border-rose-200 bg-rose-50"
          }`}
        >
          {icon}
        </div>
        {note && (
          <span className="text-[11px] leading-tight text-gray-500">
            {note}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div className="px-3 py-1 rounded-full border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-700">
        {value}
      </div>
      {note && (
        <span className="text-[11px] leading-tight text-gray-500">{note}</span>
      )}
    </div>
  );
};

const PlanosPage: React.FC = () => {
  const { setTitle } = useTitle();
  const router = useRouter();
  const { licencaTipo, loading } = useLicenca();

  useEffect(() => {
    setTitle("Upgrade de Plano");
  }, [setTitle]);

  useEffect(() => {
    if (!loading && licencaTipo === "P") {
      router.replace("/admin/dashboard");
    }
  }, [loading, licencaTipo, router]);

  if (loading) {
    return (
      <Loading
        fullScreen={true}
        preventScroll={false}
        text="Carregando informações do plano..."
        size="large"
      />
    );
  }

  if (licencaTipo === "P") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white shadow-md rounded-2xl p-8 text-center max-w-md border border-gray-100">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
            <ShieldCheck className="text-emerald-600" size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Plano Platinum ativo
            </h1>
          <p className="text-sm text-gray-600 mb-6">
            Todos os recursos já estão liberados.
          </p>
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 text-white font-semibold hover:bg-black transition-colors"
          >
            Voltar ao dashboard
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  const currentPlanLabel = licencaTipo ? planNames[licencaTipo] : "Plano atual";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Upgrade de Plano"
        config={{
          type: "form",
          useBackNavigation: true,
          backLabel: "Voltar para tela anterior",
        }}
      />

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
              Upgrade
            </p>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Comparativo de planos
            </h1>
            <p className="text-sm text-gray-600 max-w-2xl">
              Veja o que muda quando sua empresa evolui de plano. Recursos
              bloqueados aparecem com o ícone vermelho; os disponíveis, em verde.
            </p>
          </div>

          <div className="mt-5 md:mt-0">
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 h-full">
              <p className="text-xs text-gray-500 mb-1">Plano atual</p>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-gray-800" />
                <span className="text-base font-semibold text-gray-900">
                  {currentPlanLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Funcionalidades ou recursos
            </p>
            <h2 className="text-lg font-semibold text-gray-900">
              Matriz de comparação
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
            <Info size={14} />
            <span>Módulo administrativo para computadores (web)</span>
          </div>
        </div>

        <div className="relative overflow-auto max-h-[70vh]">
          <table className="min-w-full text-sm relative">
            <thead className="sticky top-0 z-20">
              <tr className="bg-white/95 backdrop-blur text-gray-700 shadow-sm border-b border-gray-200">
                <th className="w-2/5 text-left px-6 py-3 font-semibold sticky top-0 bg-white/95 backdrop-blur z-20">
                  Funcionalidade
                </th>
                {planOrder
                  .filter((plan) => licencaTipo === "S" || plan !== "S")
                  .map((plan) => (
                    <th
                      key={plan}
                      className="px-4 py-3 font-semibold text-center sticky top-0 bg-white/95 backdrop-blur z-20"
                    >
                      {planNames[plan]}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {featureSections.map((section) => (
                <React.Fragment key={section.title}>
                  <tr className="bg-gray-100 text-gray-900">
                    <td
                      colSpan={licencaTipo === "S" ? 4 : 3}
                      className="px-6 py-3 font-semibold uppercase text-xs tracking-wide"
                    >
                      {section.title}
                    </td>
                  </tr>
                  {section.items.map((row, index) => {
                    const isEvenRow = index % 2 === 0;

                    return (
                      <tr
                        key={`${row.title}-${index}`}
                        className={`border-b border-gray-100 ${
                          isEvenRow ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <td className="px-6 py-4 align-top">
                          <div className="text-sm font-medium text-gray-900">
                            {row.title}
                          </div>
                          {row.subItems && (
                            <ul className="mt-1 space-y-0.5 text-xs text-gray-600 list-disc list-inside">
                              {row.subItems.map((item, subIndex) => (
                                <li key={subIndex}>{item}</li>
                              ))}
                            </ul>
                          )}
                        </td>
                        {planOrder
                          .filter((plan) => licencaTipo === "S" || plan !== "S")
                          .map((plan) => (
                            <td
                              key={plan}
                              className="px-4 py-4 text-center align-top"
                            >
                              <StatusBadge
                                value={row.values[plan]}
                                note={row.notes?.[plan]}
                              />
                            </td>
                          ))}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PlanosPage;
