"use client";

import React from "react";

interface CustomListConfig {
  type: "list";
  itemCount: number;
}

interface CustomFormConfig {
  type: "form";
  backButton?: {
    label: string;
    href: string;
  };
}

interface PageHeaderBasicProps {
  title: string;
  config: CustomListConfig | CustomFormConfig;
}

const PageHeaderBasic: React.FC<PageHeaderBasicProps> = ({ title, config }) => {
  return (
    <header className="mb-5">
      <div className="p-5 rounded-xl shadow-sm border border-slate-200 bg-gradient-to-r from-[var(--neutral-white)] to-[var(--secondary-green)]/20 min-h-[88px] flex items-center">
        <div className="flex justify-between items-center w-full">
          <h2 className="text-xl font-bold text-[var(--neutral-graphite)] flex items-center">
            <span className="bg-[var(--primary)] h-6 w-1 rounded-full mr-3"></span>
            {title}
            {config.type === "list" && (
              <span className="ml-2 bg-[var(--primary)]/10 text-[var(--primary)] text-sm px-3 py-0.5 rounded-full font-medium">
                {config.itemCount}
              </span>
            )}
          </h2>
          {config.type === "form" && config.backButton && (
            <a
              href={config.backButton.href}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {config.backButton.label}
            </a>
          )}
        </div>
      </div>
    </header>
  );
};

export default PageHeaderBasic;
