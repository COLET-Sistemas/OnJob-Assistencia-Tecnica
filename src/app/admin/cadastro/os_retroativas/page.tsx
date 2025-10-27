"use client";

import PageHeader from "@/components/admin/ui/PageHeader";
import { FileClock } from "lucide-react";

const OSRetroativasPage = () => {
  return (
    <>
      <PageHeader
        title="OS Retroativas"
        config={{
          type: "list",
          itemCount: 0,
          newButton: {
            label: "Nova OS Retroativa",
            link: "/admin/cadastro/os_retroativas/novo",
          },
        }}
      />

      <main className="py-4">
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Cabeçalho com ícone centralizado */}
          <div className="px-8 py-12 text-center border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                <FileClock className="w-7 h-7 text-slate-600" />
              </div>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-4">
              Registro de OS Retroativas
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-3xl mx-auto text-base">
              Use esta tela para registrar{" "}
              <strong>Ordens de Serviço retroativas</strong> — atendimentos que
              já foram executados, mas ainda não constam no sistema. Essa ação
              garante um <strong>histórico completo</strong> e melhora a{" "}
              <strong>precisão dos relatórios</strong> e indicadores de
              desempenho.
            </p>
          </div>
        </section>
      </main>
    </>
  );
};

export default OSRetroativasPage;
