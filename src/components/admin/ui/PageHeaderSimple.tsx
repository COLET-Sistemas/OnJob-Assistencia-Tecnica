"use client";

import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";

interface ListConfig {
  type: "list";
  itemCount: number;
  newButton: {
    label: string;
    link?: string;
    onClick?: () => void;
  };
}

interface FormConfig {
  type: "form";
  backLink: string;
  backLabel?: string;
}

interface PageHeaderSimpleProps {
  title: string;
  config: ListConfig | FormConfig;
}

const PageHeaderSimple: React.FC<PageHeaderSimpleProps> = ({
  title,
  config,
}) => {
  // Renderizar header para listas
  if (config.type === "list") {
    return (
      <header className="mb-5">
        <div className="p-4 rounded-xl shadow-sm border border-slate-200 bg-gradient-to-r from-[var(--neutral-white)] to-[var(--secondary-green)]/20 min-h-[70px]">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-[var(--neutral-graphite)] flex items-center">
              <span className="bg-[var(--primary)] h-5 w-1 rounded-full mr-3"></span>
              {title}
              <span className="ml-2 bg-[var(--primary)]/10 text-[var(--primary)] text-sm px-3 py-0.5 rounded-full font-medium">
                {config.itemCount}
              </span>
            </h2>

            <div className="flex items-center">
              {config.newButton.onClick ? (
                <button
                  onClick={config.newButton.onClick}
                  className="bg-[var(--primary)] text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow-lg border border-[var(--primary)] hover:bg-[var(--primary)]/90 hover:border-[var(--primary)]/90"
                >
                  <Plus size={16} />
                  {config.newButton.label}
                </button>
              ) : (
                <Link
                  href={config.newButton.link || "#"}
                  className="bg-[var(--primary)] text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow-lg border border-[var(--primary)] hover:bg-[var(--primary)]/90 hover:border-[var(--primary)]/90"
                >
                  <Plus size={16} />
                  {config.newButton.label}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Renderizar header para formulários (cadastro/edição)
  return (
    <header className="mb-5">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 bg-gradient-to-r from-[var(--neutral-white)] to-[var(--primary)]/20 p-4 min-h-[70px] flex items-center">
        <div className="flex items-center gap-4 w-full">
          <Link
            href={config.backLink}
            className="p-2 text-slate-600 hover:text-[var(--primary)] hover:bg-violet-50 rounded-lg transition-colors"
            aria-label={config.backLabel || "Voltar"}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 flex items-center">
            <h2 className="text-lg font-bold text-[var(--neutral-graphite)] flex items-center">
              <span className="bg-[var(--primary)] h-5 w-1 rounded-full mr-3"></span>
              {title}
            </h2>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PageHeaderSimple;
