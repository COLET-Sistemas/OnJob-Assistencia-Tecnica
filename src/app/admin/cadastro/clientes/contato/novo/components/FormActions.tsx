import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface FormActionsProps {
  isSaving: boolean;
}

const FormActions: React.FC<FormActionsProps> = ({ isSaving }) => {
  const router = useRouter();

  return (
    <motion.footer
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="bg-slate-50 px-8 py-6 border-t border-slate-200 mt-8 -mx-8 -mb-8"
    >
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        {/* Botão cancelar */}
        <button
          type="button"
          onClick={() => router.back()}
          className="cursor-pointer flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm 
            text-sm font-medium text-gray-700 hover:bg-gray-50 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]
            transition-all duration-200"
        >
          Cancelar
        </button>

        {/* Botão salvar */}
        <button
          type="submit"
          disabled={isSaving}
          className="cursor-pointer flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm 
            text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] 
            disabled:opacity-50 transition-all duration-200"
        >
          {isSaving ? (
            <>
              <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
              Salvando...
            </>
          ) : (
            <>Salvar</>
          )}
        </button>
      </div>
    </motion.footer>
  );
};

export default FormActions;
