"use client";

import React, { useState, useRef, useEffect } from "react";
import { MapPinCheck, MapPinned } from "lucide-react";
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
}: LocationButtonProps) => {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [origin, setOrigin] = useState<string>("");

  const needsLocationDefinition =
    !cliente.latitude ||
    cliente.latitude === 0 ||
    String(cliente.latitude) === "0";

  const hasValidLocation = !needsLocationDefinition;

  const getUserLocation = React.useCallback(() => {
    if (!hasValidLocation) return;

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setOrigin(`${userLat},${userLng}`);

          if (linkRef.current) {
            linkRef.current.href = `https://www.google.com/maps/dir/${userLat},${userLng}/${cliente.latitude},${cliente.longitude}`;
          }
        },
        () => {
          const empresaData = JSON.parse(
            localStorage.getItem("empresa") || "{}"
          );
          const empresaLatitude = empresaData.latitude || "";
          const empresaLongitude = empresaData.longitude || "";
          const fallbackOrigin =
            empresaLatitude && empresaLongitude
              ? `${empresaLatitude},${empresaLongitude}`
              : encodeURIComponent(enderecoEmpresa.replace(/\s+/g, "+"));
          setOrigin(fallbackOrigin);
        }
      );
    }
  }, [cliente.latitude, cliente.longitude, enderecoEmpresa, hasValidLocation]);

  useEffect(() => {
    if (hasValidLocation) getUserLocation();
  }, [getUserLocation, hasValidLocation]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (needsLocationDefinition && onDefineLocation) onDefineLocation(cliente);
    else if (hasValidLocation && onViewRoute) onViewRoute(cliente);
  };

  const baseClasses = `inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer p-2 ${className}`;

  if (needsLocationDefinition) {
    return (
      <button
        onClick={handleClick}
        className={`${baseClasses} bg-[var(--secondary-green)]/10 hover:bg-[var(--secondary-green)]/20 text-green-600`}
        title="Definir localização geográfica"
        type="button"
      >
        <MapPinCheck size={20} strokeWidth={1.8} />
      </button>
    );
  }

  if (hasValidLocation) {
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
          if (!origin) getUserLocation();
        }}
        className={`${baseClasses} bg-blue-500/10 hover:bg-blue-500/20 text-blue-500`}
        title="Traçar rota até o cliente"
      >
        <MapPinned size={20} strokeWidth={1.8} />
      </a>
    );
  }

  return null;
};

export const LocationButtonIcon = (props: LocationButtonProps) => (
  <LocationButton {...props} iconOnly={true} />
);

export default LocationButton;
