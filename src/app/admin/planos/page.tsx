"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  X,
  ShieldCheck,
  CircleHelp,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useTitle } from "@/context/TitleContext";
import { useLicenca } from "@/hooks";
import { Loading } from "@/components/LoadingPersonalizado";
import PageHeader from "@/components/admin/ui/PageHeader";
import type { LicencaTipo } from "@/types/licenca";

type FeatureValue = boolean | string;

type FeatureRow = {
  title: string | React.ReactNode;
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

const Tooltip = ({
  children,
  content,
}: {
  children: React.ReactNode;
  content: string;
}) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  const showTooltip = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({
      top: rect.top + window.scrollY - 8,
      left: rect.left + window.scrollX + rect.width / 2,
    });
    setVisible(true);
  }, []);

  const hideTooltip = useCallback(() => setVisible(false), []);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        className="inline-flex items-center"
      >
        {children}
      </div>
      {mounted &&
        visible &&
        createPortal(
          <div
            className="fixed z-[9999] -translate-x-1/2 -translate-y-full px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg pointer-events-none whitespace-nowrap relative"
            style={{ top: position.top, left: position.left }}
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
          </div>,
          document.body
        )}
    </>
  );
};

const featureSections: FeatureSection[] = [
  {
    title: "Módulo administrativo (web)",
    items: [
      { title: "Cadastrar usuários", values: { S: true, G: true, P: true } },
      { title: "Cadastrar clientes", values: { S: true, G: true, P: true } },
      { title: "Cadastrar máquinas", values: { S: true, G: true, P: true } },
      {
        title: (
          <div className="flex items-center gap-2">
            <span>Cadastrar regiões</span>
            <Tooltip content="Permite registrar as regiões de cada cliente e os técnicos que atendem cada região">
              <CircleHelp
                size={16}
                className="text-gray-500 hover:text-gray-600 cursor-help"
              />
            </Tooltip>
          </div>
        ),
        values: { S: true, G: true, P: true },
      },
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
        title: "Consultar histórico de atendimentos por cliente",
        values: { S: true, G: true, P: true },
      },
      {
        title: "Consultar histórico de atendimentos por máquina",
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
          S: "OS concluí­da pelo técnico é encerrada",
          G: "OS concluí­da pelo técnico vai para revisão",
          P: "OS concluí­da pelo técnico vai para revisão",
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
        title: "Enviar automático aviso de OS concluí­da por WhatsApp",
        values: { S: false, G: true, P: true },
      },
      {
        title: "Visualizar painel de monitoramento",
        values: { S: false, G: false, P: true },
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
          S: "Descrição e qtde",
          G: "Código ou descrição e qtde",
          P: "Código ou descrição e qtde",
        },
      },
      {
        title: "Consultar histórico da máquina da OS em atendimento",
        values: { S: true, G: true, P: true },
      },
      {
        title: "Consultar histórico do cliente da OS em atendimento",
        values: { S: false, G: true, P: true },
      },
      {
        title: "Consultar histórico de atendimentos de clientes sem OS",
        values: { S: false, G: false, P: true },
      },
      {
        title: "Consultar histórico de atendimentos de máquinas sem OS",
        values: { S: false, G: false, P: true },
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
        title: "Registrar fotos nas OSs",
        values: { S: false, G: true, P: true },
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
      {
        title: "Suporte prioritário",
        values: { S: false, G: false, P: true },
      },
      {
        title: "Formas de suporte",
        values: { S: "E-mail", G: "E-mail", P: "E-mail e ticket" },
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
        values: { S: "Consultar", G: "Consultar", P: "Consultar" },
      },
      {
        title: "Treinamento personalizado online",
        values: { S: "Consultar", G: "Consultar", P: "Consultar" },
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full border border-purple-100 bg-purple-50 text-sky-700 flex items-center justify-center shadow-inner">
              <CheckCircle2 size={22} className="text-purple-700" />
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-[0.2em]">
                Plano atual
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xl font-bold text-gray-900">
                  {currentPlanLabel}
                </span>
              </div>
              <p className="text-sm text-gray-600 ">
                Este é o plano ativo da sua empresa neste momento. Compare
                abaixo para ver quais recursos adicionais você ganha ao evoluir.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-5">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Funcionalidades e recursos
            </p>
            <h2 className="text-lg font-semibold text-gray-900">
              Matriz de comparação
            </h2>
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
                  <tr className="bg-gray-300 text-gray-900">
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
                        <td className="px-6 py-4 align-middle">
                          <div className="px-1 text-base font-medium text-gray-900">
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
                              className="px-4 py-4 text-center align-middle"
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
