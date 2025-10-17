import React, { memo } from "react";
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
          <span
            style={{
              backgroundColor: isSelected
                ? "rgba(255, 255, 255, 0.2)"
                : option.isInWarranty
                ? "#10b981" 
                : "#f59e0b", 
              color: "white",
              borderRadius: "9999px",
              fontSize: "0.7rem",
              padding: "2px 8px",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {option.isInWarranty ? (
              <>
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
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Em Garantia</span>
              </>
            ) : (
              <>
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
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <span>Fora da Garantia</span>
              </>
            )}
          </span>
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
  // Add a custom NoOptionsMessage component to prevent the error message
  NoOptionsMessage: ({ children }: { children: React.ReactNode }) => (
    <div style={{ padding: "8px 12px", textAlign: "center", color: "#6b7280" }}>
      {children}
    </div>
  ),
};

export default MaquinaItem;
