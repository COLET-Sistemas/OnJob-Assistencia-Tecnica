import React, { memo } from "react";
import { ClienteContato } from "@/types/admin/cadastro/clientes";
import { OptionProps } from "react-select";
import { GroupBase } from "react-select";
import { OptionType } from "@/components/admin/form/CustomSelect";

// Define a custom option type that extends the base OptionType
export interface ContatoOptionType extends OptionType {
  contato: ClienteContato;
  value: number; // Override value to be specifically number for this type
}

interface ContatoItemProps {
  option: ContatoOptionType;
  isFocused: boolean;
  isSelected: boolean;
}

/**
 * Componente memoizado para renderizar cada item na lista de contatos
 * com informações adicionais como telefone e email
 */
const ContatoItem: React.FC<ContatoItemProps> = memo(
  ({ option, isFocused, isSelected }) => {
    // Se for a opção personalizada (ID -1), renderiza normalmente
    if (option.contato.id === -1) {
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
        </div>
      );
    }

    // Renderiza contato com informações adicionais
    const { contato } = option;
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
        <div style={{ fontWeight: 500 }}>
          {contato.nome || contato.nome_completo || "Sem nome"}
          {contato.cargo ? ` - ${contato.cargo}` : ""}
        </div>
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
          {contato.telefone && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                style={{ width: "14px", height: "14px" }}
              >
                <path
                  fillRule="evenodd"
                  d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.879a1.5 1.5 0 0 1 1.496 1.386l.333 3.123a1.5 1.5 0 0 1-.43 1.285l-.333.333a1 1 0 0 0-.3 1.24c.21.532.517 1.139.902 1.728.385.59.9 1.153 1.491 1.638a1 1 0 0 0 1.266.075l.877-.71a1.5 1.5 0 0 1 1.72-.043l2.883 1.883a1.5 1.5 0 0 1 .496 2.096A16.982 16.982 0 0 1 8.16 18 15.01 15.01 0 0 1 2 12.16V3.5Z"
                  clipRule="evenodd"
                />
              </svg>
              {contato.telefone}
            </div>
          )}
          {contato.email && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                style={{ width: "14px", height: "14px" }}
              >
                <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
                <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
              </svg>
              {contato.email}
            </div>
          )}
        </div>
      </div>
    );
  }
);

ContatoItem.displayName = "ContatoItem";

/**
 * Componentes personalizados para o select de contatos
 */
export const contatoSelectComponents = {
  Option: (
    props: OptionProps<ContatoOptionType, false, GroupBase<ContatoOptionType>>
  ) => {
    const { data, isFocused, isSelected } = props;
    return (
      <ContatoItem
        option={data}
        isFocused={isFocused}
        isSelected={isSelected}
      />
    );
  },
};

export default ContatoItem;
