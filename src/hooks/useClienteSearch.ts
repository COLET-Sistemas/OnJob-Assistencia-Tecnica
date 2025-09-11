import { useState, useCallback } from "react";
import { clientesService } from "@/api/services";
import { useToast } from "@/components/admin/ui/ToastContainer";

export interface ClienteAPIResult {
  id_cliente: number;
  nome_fantasia: string;
  razao_social: string;
  codigo_erp?: string;
}

export interface ClienteOption {
  value: number;
  label: string;
  razao_social?: string;
}

/**
 * Hook personalizado para busca de clientes
 * @returns Funções e estados para gerenciar a busca de clientes
 */
export const useClienteSearch = () => {
  const [clienteInput, setClienteInput] = useState("");
  const [clienteOptions, setClienteOptions] = useState<ClienteOption[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<ClienteOption | null>(
    null
  );
  const [isSearchingCliente, setIsSearchingCliente] = useState(false);
  const { showError } = useToast();

  // Função para buscar clientes
  const searchClientes = useCallback(
    async (term: string) => {
      if (!term || term.length < 3) return;

      try {
        setIsSearchingCliente(true);
        const data = await clientesService.getAll({
          nome: term,
          resumido: "S",
          qtde_registros: 15,
          nro_pagina: 1,
        });

        const options = Array.isArray(data?.dados)
          ? (data.dados as ClienteAPIResult[]).map((c) => ({
              value: c.id_cliente,
              label: c.nome_fantasia,
              razao_social: c.razao_social,
            }))
          : [];

        setClienteOptions(options);
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
        setClienteOptions([]);
        showError("Erro ao buscar clientes", "Tente novamente mais tarde.");
      } finally {
        setIsSearchingCliente(false);
      }
    },
    [showError]
  );

  // Função debounced para buscar clientes
  const handleClienteInputChange = useCallback(
    (inputValue: string) => {
      setClienteInput(inputValue);

      // Implementação inline do debounce
      if (inputValue.length >= 3 && !isSearchingCliente) {
        // Usar um timeout para debounce
        const timeoutId = setTimeout(() => {
          searchClientes(inputValue);
        }, 300);

        // Retornar uma função que limpa o timeout se chamada antes da execução
        return () => clearTimeout(timeoutId);
      }
    },
    [searchClientes, isSearchingCliente]
  );

  // Função para lidar com a seleção de um cliente
  const handleClienteChange = useCallback(
    (selectedOption: { value: string | number; label: string } | null) => {
      // Converter para ClienteOption se não for nulo
      const clienteOption = selectedOption
        ? ({
            ...selectedOption,
            value: Number(selectedOption.value),
          } as ClienteOption)
        : null;

      setSelectedCliente(clienteOption);

      return clienteOption;
    },
    []
  );

  // Função para configurar um cliente selecionado manualmente
  const setInitialCliente = useCallback((cliente: ClienteOption) => {
    setSelectedCliente(cliente);
    setClienteInput(cliente.label);
    setClienteOptions((prev) => {
      // Adicionar o cliente às opções apenas se ainda não estiver lá
      const clienteExists = prev.some(
        (option) => option.value === cliente.value
      );
      return clienteExists ? prev : [cliente, ...prev];
    });
  }, []);

  return {
    clienteInput,
    clienteOptions,
    selectedCliente,
    isSearchingCliente,
    handleClienteInputChange,
    handleClienteChange,
    searchClientes,
    setInitialCliente,
  };
};
