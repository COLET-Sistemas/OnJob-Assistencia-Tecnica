import React, { ReactNode } from "react";
import { motion } from "framer-motion";

interface InfoCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  delay?: number;
}

const InfoCard: React.FC<InfoCardProps> = ({
  title,
  icon,
  children,
  className = "",
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay * 0.1 }}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300 ${className}`}
    >
      <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-[var(--primary)]">{icon}</span>
          {title}
        </h2>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  );
};

export default InfoCard;
