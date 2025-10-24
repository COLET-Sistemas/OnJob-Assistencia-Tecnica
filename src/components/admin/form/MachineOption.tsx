import React from "react";
import { components, OptionProps, GroupBase } from "react-select";
import { CircleCheck, CircleX } from "lucide-react";
import { OptionType } from "./CustomSelect";

// Extend the Option type to include warranty info
export interface MachineOptionType extends OptionType {
  isInWarranty?: boolean;
  data_final_garantia?: string;
  numero_serie?: string;
  descricao?: string;
  clienteNomeFantasia?: string;
}

// Custom Option component that includes a warranty badge with Lucide icons
export const MachineOption = (
  props: OptionProps<OptionType, boolean, GroupBase<OptionType>>
) => {
  const option = props.data as MachineOptionType;

  return (
    <components.Option {...props}>
      <div className="flex items-center justify-between w-full">
        <div>{props.children}</div>
        {option.isInWarranty !== undefined && option.value !== -1 && (
          <div
            className="flex items-center gap-1.5"
            title={option.isInWarranty ? "Em garantia" : "Fora da garantia"}
          >
            {option.isInWarranty ? (
              <>
                <CircleCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-700">
                  Em Garantia
                </span>
              </>
            ) : (
              <>
                <CircleX className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-medium text-amber-700">
                  Sem Garantia
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </components.Option>
  );
};
