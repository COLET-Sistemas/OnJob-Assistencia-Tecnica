"use client";

import React, { useState, useRef, useEffect } from "react";
import { MapPinCheck, MapPinned } from "lucide-react";
import type { Cliente } from "@/types/admin/cadastro/clientes";

interface LocationButtonProps {
  cliente: Cliente;
  onDefineLocation?: (cliente: Cliente) => void;
  onViewRoute?: (cliente: Cliente) => void;
  enderecoEmpresa?: string; // Agora usado como fallback se as coordenadas não estiverem disponíveis
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
  // Hooks devem ser chamados incondicionalmente no topo do componente
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [origin, setOrigin] = useState<string>("");

  // Verifica se precisa definir localização
  const needsLocationDefinition =
    cliente.latitude === undefined ||
    cliente.latitude === null ||
    cliente.latitude === 0 ||
    String(cliente.latitude) === "0" ||
    String(cliente.latitude) === "";

  const hasValidLocation = !needsLocationDefinition;

  // Função para obter a localização atual do usuário
  const getUserLocation = React.useCallback(() => {
    if (!hasValidLocation) return; // Não precisa obter localização se cliente não tem localização válida

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Sucesso: Define a origem como a localização atual
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setOrigin(`${userLat},${userLng}`);

          // Atualiza o href do link se ele já foi renderizado
          if (linkRef.current) {
            linkRef.current.href = `https://www.google.com/maps/dir/${userLat},${userLng}/${cliente.latitude},${cliente.longitude}`;
          }
        },
        () => {
          // Erro: Usa dados do localStorage como fallback
          const empresaData = JSON.parse(
            localStorage.getItem("empresa") || "{}"
          );
          const empresaLatitude = empresaData.latitude || "";
          const empresaLongitude = empresaData.longitude || "";

          // Se existir dados no localStorage, usa-os, senão usa endereço fornecido
          const fallbackOrigin =
            empresaLatitude && empresaLongitude
              ? `${empresaLatitude},${empresaLongitude}`
              : encodeURIComponent(enderecoEmpresa.replace(/\s+/g, "+"));

          setOrigin(fallbackOrigin);

          // Atualiza o href do link se ele já foi renderizado
          if (linkRef.current) {
            linkRef.current.href = `https://www.google.com/maps/dir/${fallbackOrigin}/${cliente.latitude},${cliente.longitude}`;
          }
        }
      );
    } else {
      // Navegador não suporta geolocalização ou não está no browser: usa fallback
      const empresaData =
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("empresa") || "{}")
          : {};
      const empresaLatitude = empresaData.latitude || "";
      const empresaLongitude = empresaData.longitude || "";

      const fallbackOrigin =
        empresaLatitude && empresaLongitude
          ? `${empresaLatitude},${empresaLongitude}`
          : encodeURIComponent(enderecoEmpresa.replace(/\s+/g, "+"));

      setOrigin(fallbackOrigin);
    }
  }, [cliente.latitude, cliente.longitude, enderecoEmpresa, hasValidLocation]);

  // Efeito para obter a localização quando o componente for montado
  useEffect(() => {
    if (hasValidLocation) {
      getUserLocation();
    }
  }, [getUserLocation, hasValidLocation]);

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
        <MapPinCheck size={16} />
        {!iconOnly && <span>Ajustar</span>}
      </button>
    );
  }

  if (hasValidLocation) {
    // URL inicial com fallback até que a localização seja obtida
    const initialUrl = `https://www.google.com/maps/dir/current+location/${cliente.latitude},${cliente.longitude}`;

    return (
      <a
        ref={linkRef}
        href={
          origin
            ? `https://www.google.com/maps/dir/${origin}/${cliente.latitude},${cliente.longitude}`
            : initialUrl
        }
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          e.stopPropagation();
          // Tenta atualizar localização ao clicar, caso ainda não tenha sido obtida
          if (!origin) {
            getUserLocation();
          }
        }}
        className={`${baseClasses} bg-blue-500/10 hover:bg-blue-500/20 text-blue-500`}
        title="Traçar rota até o cliente"
      >
        <MapPinned size={16} />
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
