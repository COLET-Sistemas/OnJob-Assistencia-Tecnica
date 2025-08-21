"use client";

import { MapPin } from "lucide-react";
import type { Cliente } from "@/types/admin/cadastro/clientes";

interface LocationButtonProps {
  cliente: Cliente;
  onDefineLocation?: (cliente: Cliente) => void;
  onViewRoute?: (cliente: Cliente) => void;
  enderecoEmpresa?: string;
  className?: string;
  iconOnly?: boolean;
}

const LocationButton = ({
  cliente,
  onDefineLocation,
  onViewRoute,
  enderecoEmpresa = "",
  className = "",
  iconOnly = false,
}: LocationButtonProps) => {
  // Verifica se precisa definir localização
  const needsLocationDefinition =
    cliente.latitude === undefined ||
    cliente.latitude === null ||
    cliente.latitude === 0 ||
    String(cliente.latitude) === "0" ||
    String(cliente.latitude) === "";

  const hasValidLocation = !needsLocationDefinition;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (needsLocationDefinition && onDefineLocation) {
      onDefineLocation(cliente);
    } else if (hasValidLocation && onViewRoute) {
      onViewRoute(cliente);
    }
  };

  // Classes base seguindo o padrão do EditButton
  const baseClasses = `inline-flex items-center px-3 py-1.5 rounded-lg transition-colors gap-1.5 cursor-pointer ${className}`;

  if (needsLocationDefinition) {
    return (
      <button
        onClick={handleClick}
        className={`${baseClasses} bg-[var(--secondary-green)]/10 hover:bg-[var(--secondary-green)]/20 text-green-600`}
        title="Definir localização geográfica"
        type="button"
      >
        <MapPin size={15} />
        {!iconOnly && <span>Delimitar</span>}
      </button>
    );
  }

  if (hasValidLocation) {
    const enderecoEmpresaUrl = encodeURIComponent(
      enderecoEmpresa.replace(/\s+/g, "+")
    );

    return (
      <a
        href={`https://www.google.com/maps/dir/${enderecoEmpresaUrl}/${cliente.latitude},${cliente.longitude}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={`${baseClasses} bg-blue-500/10 hover:bg-blue-500/20 text-blue-500`}
        title="Traçar rota até o cliente"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
        </svg>
        {!iconOnly && <span>Rota</span>}
      </a>
    );
  }

  return null;
};

// Variante simplificada só com ícone (mantida para compatibilidade)
export const LocationButtonIcon = ({
  cliente,
  onDefineLocation,
  onViewRoute,
  enderecoEmpresa = "",
  className = "",
}: LocationButtonProps) => {
  return (
    <LocationButton
      cliente={cliente}
      onDefineLocation={onDefineLocation}
      onViewRoute={onViewRoute}
      enderecoEmpresa={enderecoEmpresa}
      className={className}
      iconOnly={true}
    />
  );
};

export default LocationButton;
