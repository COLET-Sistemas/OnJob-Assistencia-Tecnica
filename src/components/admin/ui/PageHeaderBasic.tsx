"use client";

import React from "react";

interface CustomListConfig {
  type: "list";
  itemCount: number;
}

interface PageHeaderBasicProps {
  title: string;
  config: CustomListConfig;
}

const PageHeaderBasic: React.FC<PageHeaderBasicProps> = ({ title, config }) => {
  return (
    <header className="mb-5">
      <div className="p-5 rounded-xl shadow-sm border border-slate-200 bg-gradient-to-r from-[var(--neutral-white)] to-[var(--secondary-green)]/20 min-h-[88px] flex items-center">
        <div className="flex justify-between items-center w-full">
          <h2 className="text-xl font-bold text-[var(--neutral-graphite)] flex items-center">
            <span className="bg-[var(--primary)] h-6 w-1 rounded-full mr-3"></span>
            {title}
            <span className="ml-2 bg-[var(--primary)]/10 text-[var(--primary)] text-sm px-3 py-0.5 rounded-full font-medium">
              {config.itemCount}
            </span>
          </h2>
        </div>
      </div>
    </header>
  );
};

export default PageHeaderBasic;
