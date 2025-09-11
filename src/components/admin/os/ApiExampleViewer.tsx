import React, { useState } from "react";
import { motion } from "framer-motion";
import { Code, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";

interface ApiExampleViewerProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

const ApiExampleViewer: React.FC<ApiExampleViewerProps> = ({ data }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6"
    >
      <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Code className="h-5 w-5 text-[var(--primary)]" />
          Exemplo de Retorno da API
        </h2>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCopy}
            className="text-gray-500 hover:text-[var(--primary)] transition-colors p-1 rounded"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setExpanded(!expanded)}
            className="text-gray-500 hover:text-[var(--primary)] transition-colors p-1 rounded"
          >
            {expanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </motion.button>
        </div>
      </div>

      <motion.div
        initial={false}
        animate={{ height: expanded ? "auto" : "200px" }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div
          className={`p-4 bg-gray-50 overflow-auto ${
            !expanded ? "max-h-[200px]" : ""
          }`}
        >
          <pre className="text-sm text-gray-700 font-mono">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </motion.div>

      {!expanded && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center">
          <button
            onClick={() => setExpanded(true)}
            className="text-sm text-[var(--primary)] hover:underline"
          >
            Mostrar tudo
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ApiExampleViewer;
