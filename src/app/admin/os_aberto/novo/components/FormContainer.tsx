import React from "react";
import { motion } from "framer-motion";

interface FormContainerProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

const FormContainer: React.FC<FormContainerProps> = ({
  children,
  onSubmit,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-300 overflow-hidden"
    >
      <form onSubmit={onSubmit} className="relative">
        <div className="p-4 md:p-8 space-y-6">{children}</div>
      </form>
    </motion.div>
  );
};

export default FormContainer;
