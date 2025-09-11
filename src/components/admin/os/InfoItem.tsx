import React from "react";
import { motion } from "framer-motion";

interface InfoItemProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

const InfoItem: React.FC<InfoItemProps> = ({ label, value, icon }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <div className="text-sm font-medium text-gray-500 flex items-center">
        {icon && <span className="mr-1 text-gray-400">{icon}</span>}
        {label}
      </div>
      <div className="mt-1 group-hover:text-[var(--primary-dark)] transition-colors duration-200">
        {value || "-"}
      </div>
    </motion.div>
  );
};

export default InfoItem;
