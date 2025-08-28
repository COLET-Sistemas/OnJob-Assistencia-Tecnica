import React from "react";
import { components, OptionProps, GroupBase } from "react-select";
import { OptionType } from "./CustomSelect";

// Extend the Option type to include warranty info
export interface MachineOptionType extends OptionType {
  isInWarranty?: boolean;
  data_final_garantia?: string;
}

// Custom Option component that includes a warranty badge
export const MachineOption = (
  props: OptionProps<OptionType, boolean, GroupBase<OptionType>>
) => {
  const option = props.data as MachineOptionType;

  return (
    <components.Option {...props}>
      <div className="flex items-center justify-between w-full">
        <div>{props.children}</div>
        {option.isInWarranty !== undefined && (
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              option.isInWarranty
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {option.isInWarranty ? "Em Garantia" : "Sem Garantia"}
          </span>
        )}
      </div>
    </components.Option>
  );
};
