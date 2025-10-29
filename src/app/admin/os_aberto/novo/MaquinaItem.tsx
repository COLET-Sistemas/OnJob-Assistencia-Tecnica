import React, { memo } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { MachineOptionType } from "@/components/admin/form/MachineOption";

interface MaquinaItemProps {
  option: MachineOptionType & { value: number };
  isFocused: boolean;
  isSelected: boolean;
}

const MaquinaItem: React.FC<MaquinaItemProps> = memo(
  ({ option, isFocused, isSelected }) => {
    if (option.value === -1) {
      return (
        <div
          style={{
            padding: "8px 12px",
            backgroundColor: isSelected
              ? "var(--primary)"
              : isFocused
              ? "rgba(124, 84, 189, 0.1)"
              : "transparent",
            color: isSelected ? "white" : "#0f172a",
            cursor: "pointer",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontStyle: "italic",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            style={{ width: "16px", height: "16px", marginRight: "6px" }}
          >
            <path d="M6.5 9a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0Z" />
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM9 5a4 4 0 1 0 2.248 7.309l1.472 1.471a.75.75 0 1 0 1.06-1.06l-1.471-1.472A4 4 0 0 0 9 5Z"
              clipRule="evenodd"
            />
          </svg>
          {option.label}
        </div>
      );
    }

    const numeroSerie =
      option.numero_serie ||
      option.label ||
      "";
    const descricao =
      option.descricao || "";
    const clienteNome = option.clienteNomeFantasia || "";
    const inWarranty = option.isInWarranty ?? false;
    const showWarrantyBadge =
      option.isInWarranty !== undefined && option.value !== -1;

    const numeroSerieClasses = `text-sm ${
      isSelected ? "text-slate-50" : "text-slate-900"
    } font-semibold`;
    const descricaoClasses = `text-sm ${
      isSelected ? "text-slate-100" : "text-slate-600"
    } font-normal`;
    const clienteClasses = `flex items-center gap-2 text-xs ${
      isSelected ? "text-slate-200" : "text-slate-500"
    }`;

    return (
      <div
        style={{
          padding: "8px 12px",
          backgroundColor: isSelected
            ? "var(--primary)"
            : isFocused
            ? "rgba(124, 84, 189, 0.1)"
            : "transparent",
          color: isSelected ? "white" : "#0f172a",
          cursor: "pointer",
          borderRadius: "4px",
        }}
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={numeroSerieClasses}>{numeroSerie} - </span>
              {descricao && (
                <span className={descricaoClasses}>{descricao}</span>
              )}
            </div>
            {showWarrantyBadge && (
              <div
                title={inWarranty ? "Na Garantia" : "Fora da Garantia"}
                className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                  inWarranty ? "text-green-700" : "text-orange-700"
                }`}
              >
                {inWarranty ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
              </div>
            )}
          </div>
          {clienteNome && (
            <div className={clienteClasses}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isSelected ? "text-slate-200" : "text-slate-400"}
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>{clienteNome}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

MaquinaItem.displayName = "MaquinaItem";

/**
 * Componentes personalizados para o select de maquinas
 */
export const maquinaSelectComponents = {
  Option: ({
    data,
    isFocused,
    isSelected,
    innerProps,
  }: {
    data: MachineOptionType & { value: number };
    isFocused: boolean;
    isSelected: boolean;
    innerProps: React.HTMLAttributes<HTMLDivElement>;
  }) => (
    <div {...innerProps}>
      <MaquinaItem
        option={data}
        isFocused={isFocused}
        isSelected={isSelected}
      />
    </div>
  ),
  NoOptionsMessage: ({ children }: { children: React.ReactNode }) => (
    <div style={{ padding: "8px 12px", textAlign: "center", color: "#6b7280" }}>
      {children}
    </div>
  ),
};

export default MaquinaItem;
