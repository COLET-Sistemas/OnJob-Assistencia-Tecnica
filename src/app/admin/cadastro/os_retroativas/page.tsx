"use client";

import PageHeader from "@/components/admin/ui/PageHeader";

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

      <main>
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
          <p className="text-slate-700 leading-relaxed">
            Use esta tela para registrar OSs retroativas, que já foram
            concluídas e que servirão apenas para completar o banco de dados do
            sistema e auxiliar nas estatísticas. Nessas OSs, você deverá
            informar todas as datas, como as de abertura e de atendimento. Elas
            já nascerão concluídas.
          </p>
        </section>
      </main>
    </>
  );
};

export default OSRetroativasPage;
