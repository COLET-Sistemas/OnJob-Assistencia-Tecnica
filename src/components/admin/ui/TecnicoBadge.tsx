import React from "react";

interface TecnicoBadgeProps {
  tipo: string;
}

const TecnicoBadge: React.FC<TecnicoBadgeProps> = ({ tipo }) => {
  if (!tipo) return null;

  const isInterno = tipo.toLowerCase() === "interno";
  const isTerceiro = tipo.toLowerCase() === "terceiro";

  if (!isInterno && !isTerceiro) return null;

  return (
    <span
      className={`ml-1 px-1.5 py-0.5 text-[10px] font-medium rounded inline-flex items-center ${
        isInterno ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
      }`}
      style={{ transform: "translateY(-1px)" }}
    >
      {isInterno ? "Interno" : "Terceiro"}
    </span>
  );
};

export default TecnicoBadge;
