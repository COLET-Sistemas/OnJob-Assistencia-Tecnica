"use client";

import React from "react";

interface StatusBadgeProps {
  status: string;
  mapping: Record<
    string,
    {
      label: string;
      className: string;
      icon?: React.ReactNode;
    }
  >;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, mapping }) => {
  const config = mapping[status] || {
    label: "Desconhecido",
    className: "bg-gray-100 text-gray-700 border border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${config.className}`}
    >
      {config.icon && (
        <span className="mr-1.5 flex items-center justify-center">
          {config.icon}
        </span>
      )}
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
