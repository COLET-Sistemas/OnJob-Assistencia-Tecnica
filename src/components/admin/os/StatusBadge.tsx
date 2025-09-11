import React from "react";
import { motion } from "framer-motion";

interface StatusBadgeProps {
  status: string | undefined;
  type?: "icon" | "text" | "both";
  mapping: Record<
    string,
    {
      label: string;
      className: string;
      icon: React.ReactNode;
    }
  >;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = "both",
  mapping,
}) => {
  const statusInfo =
    status && mapping[status]
      ? mapping[status]
      : {
          label: "Desconhecido",
          className: "bg-gray-100 text-gray-700 border border-gray-200",
          icon: <span></span>,
        };

  return (
    <motion.span
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.15 }}
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.className}`}
    >
      {(type === "icon" || type === "both") && (
        <span className="mr-1.5">{statusInfo.icon}</span>
      )}
      {(type === "text" || type === "both") && statusInfo.label}
    </motion.span>
  );
};

export default StatusBadge;
