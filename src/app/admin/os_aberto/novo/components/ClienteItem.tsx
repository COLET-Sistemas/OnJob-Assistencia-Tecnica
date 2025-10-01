import React, { memo } from "react";
import { OptionProps } from "react-select";
import { GroupBase } from "react-select";
import { OptionType } from "@/components/admin/form/CustomSelect";

// Define a custom option type that extends the base OptionType
export interface ClienteOptionType extends OptionType {
  cidade?: string;
  uf?: string;
  value: number; // Override value to be specifically number for this type
}

interface ClienteItemProps {
  option: ClienteOptionType;
  isFocused: boolean;
  isSelected: boolean;
}

/**
 * Componente memoizado para renderizar cada item na lista de clientes
 * com informações adicionais como cidade e UF
 */
const ClienteItem: React.FC<ClienteItemProps> = memo(
  ({ option, isFocused, isSelected }) => {
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
        <div style={{ fontWeight: 500 }}>{option.label}</div>
        {(option.cidade || option.uf) && (
          <div
            style={{
              fontSize: "0.8rem",
              marginTop: "2px",
              opacity: 0.8,
              color: isSelected ? "white" : "#4b5563",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                style={{ width: "14px", height: "14px" }}
              >
                <path
                  fillRule="evenodd"
                  d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                  clipRule="evenodd"
                />
              </svg>
              {option.cidade && option.uf
                ? `${option.cidade} - ${option.uf}`
                : option.cidade || option.uf || "Localização não definida"}
            </div>
          </div>
        )}
      </div>
    );
  }
);

ClienteItem.displayName = "ClienteItem";

/**
 * Componentes personalizados para o select de clientes
 */
export const clienteSelectComponents = {
  Option: (
    props: OptionProps<ClienteOptionType, false, GroupBase<ClienteOptionType>>
  ) => {
    const { data, isFocused, isSelected } = props;
    return (
      <ClienteItem
        option={data}
        isFocused={isFocused}
        isSelected={isSelected}
      />
    );
  },
};

export default ClienteItem;
