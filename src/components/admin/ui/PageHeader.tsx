"use client";

import { Filter, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";

// Tipo para configuração de lista
interface ListConfig {
  type: "list";
  itemCount: number;
  onFilterToggle: () => void;
  showFilters: boolean;
  activeFiltersCount?: number;
  newButton: {
    label: string;
    link?: string;
    onClick?: () => void;
  };
}

// Tipo para configuração de formulário (cadastro/edição)
interface FormConfig {
  type: "form";
  backLink: string;
  backLabel?: string;
}

// Props base do componente
interface PageHeaderProps {
  title: string;
  config: ListConfig | FormConfig;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, config }) => {
  // Renderizar header para listas
  if (config.type === "list") {
    return (
      <header className="mb-5">
        <div className="p-5 rounded-xl shadow-sm border border-slate-200 bg-gradient-to-r from-[var(--neutral-white)] to-[var(--secondary-green)]/20">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-[var(--neutral-graphite)] flex items-center">
              <span className="bg-[var(--primary)] h-6 w-1 rounded-full mr-3"></span>
              {title}
              <span className="ml-2 bg-[var(--primary)]/10 text-[var(--primary)] text-sm px-3 py-0.5 rounded-full font-medium">
                {config.itemCount}
              </span>
            </h2>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={config.onFilterToggle}
                  className={`relative px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-sm border cursor-pointer ${
                    config.showFilters
                      ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg shadow-[var(--primary)]/25"
                      : "bg-white hover:bg-gray-50 text-[var(--neutral-graphite)] border-gray-200 hover:border-gray-300 hover:shadow-md"
                  }`}
                >
                  <Filter size={18} />
                  <span className="font-medium">Filtros</span>
                  {(config.activeFiltersCount ?? 0) > 0 && (
                    <div className="absolute -top-1 -right-1 flex items-center justify-center">
                      <span className="w-5 h-5 bg-[#F6C647] text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                        {config.activeFiltersCount}
                      </span>
                    </div>
                  )}
                </button>
              </div>

              {config.newButton.onClick ? (
                <button
                  onClick={config.newButton.onClick}
                  className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow-lg border border-[var(--primary)] hover:bg-[var(--primary)]/90 hover:border-[var(--primary)]/90"
                >
                  <Plus size={18} />
                  {config.newButton.label}
                </button>
              ) : (
                <Link
                  href={config.newButton.link || "#"}
                  className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow-lg border border-[var(--primary)] hover:bg-[var(--primary)]/90 hover:border-[var(--primary)]/90"
                >
                  <Plus size={18} />
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
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center gap-4">
          <Link
            href={config.backLink}
            className="p-2 text-slate-600 hover:text-[var(--primary)] hover:bg-violet-50 rounded-lg transition-colors"
            aria-label={config.backLabel || "Voltar"}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-[var(--neutral-graphite)] flex items-center">
              <span className="bg-[var(--primary)] h-6 w-1 rounded-full mr-3"></span>
              {title}
            </h2>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
