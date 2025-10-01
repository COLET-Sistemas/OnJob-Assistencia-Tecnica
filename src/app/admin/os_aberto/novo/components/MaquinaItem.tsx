import React, { memo } from "react";
import { MachineOptionType } from "@/components/admin/form/MachineOption";

interface MaquinaItemProps {
  option: MachineOptionType & { value: number };
  isFocused: boolean;
  isSelected: boolean;
}

/**
 * Componente memoizado para renderizar cada item na lista de máquinas
 * com informações adicionais como status de garantia
 */
const MaquinaItem: React.FC<MaquinaItemProps> = memo(
  ({ option, isFocused, isSelected }) => {
    // Se for a opção especial "Buscar outra máquina..."
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

    // Renderiza máquina com informações adicionais
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontWeight: 500 }}>{option.label}</span>
          {option.isInWarranty && (
            <span
              style={{
                backgroundColor: isSelected
                  ? "rgba(255, 255, 255, 0.2)"
                  : "#10b981",
                color: isSelected ? "white" : "white",
                borderRadius: "9999px",
                fontSize: "0.7rem",
                padding: "2px 8px",
                fontWeight: 500,
              }}
            >
              Em Garantia
            </span>
          )}
        </div>
        {option.data_final_garantia && (
          <div
            style={{
              fontSize: "0.8rem",
              marginTop: "2px",
              opacity: 0.8,
              color: isSelected ? "white" : "#4b5563",
            }}
          >
            {option.isInWarranty
              ? `Garantia até: ${new Date(
                  option.data_final_garantia
                ).toLocaleDateString("pt-BR")}`
              : `Garantia expirada: ${new Date(
                  option.data_final_garantia
                ).toLocaleDateString("pt-BR")}`}
          </div>
        )}
      </div>
    );
  }
);

MaquinaItem.displayName = "MaquinaItem";

/**
 * Componentes personalizados para o select de máquinas
 */
export const maquinaSelectComponents = {
  Option: ({
    data,
    isFocused,
    isSelected,
  }: {
    data: MachineOptionType & { value: number };
    isFocused: boolean;
    isSelected: boolean;
  }) => (
    <MaquinaItem option={data} isFocused={isFocused} isSelected={isSelected} />
  ),
};

export default MaquinaItem;
