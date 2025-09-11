import React from "react";
import { motion } from "framer-motion";
import { Clipboard } from "lucide-react";

interface ParecerTecnicoProps {
  parecer: string;
  delay?: number;
}

const ParecerTecnico: React.FC<ParecerTecnicoProps> = ({
  parecer,
  delay = 0.4,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 card-transition"
    >
      <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <motion.div
            whileHover={{ rotate: 5 }}
            transition={{ duration: 0.15 }}
          >
            <Clipboard className="h-5 w-5 text-[var(--primary)]" />
          </motion.div>
          Parecer Técnico
        </h2>
      </div>

      <motion.div
        className="p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: delay + 0.05 }}
      >
        <motion.div
          className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors duration-200"
          whileHover={{ boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}
        >
          <p className="text-gray-700 whitespace-pre-wrap">{parecer}</p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default ParecerTecnico;
