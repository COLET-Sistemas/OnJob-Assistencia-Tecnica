"use client";

import LicenseGuard from "@/components/admin/common/LicenseGuard";
import PageHeader from "@/components/admin/ui/PageHeader";
import { FileClock } from "lucide-react";

const OSRetroativasPage = () => {
  return (
    <LicenseGuard feature="os_retroativas">
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
            {/* Cabe��alho com ��cone centralizado */}
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
                <strong>Ordens de Servi��o retroativas</strong> �?" atendimentos
                que jǭ foram executados, mas ainda nǜo constam no sistema. Essa
                a��ǜo garante um <strong>hist��rico completo</strong> e melhora a{" "}
                <strong>precisǜo dos relat��rios</strong> e indicadores de
                desempenho.
              </p>
            </div>
          </section>
        </main>
      </>
    </LicenseGuard>
  );
};

export default OSRetroativasPage;
