"use client";

import Image from "next/image";
import React from "react";

export interface AddressMapPreviewProps {
  endereco?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
  className?: string;
}

const buildAddress = (props: AddressMapPreviewProps): string => {
  const parts = [
    props.endereco,
    props.numero,
    props.bairro,
    props.cidade,
    props.uf,
    props.cep,
  ].filter(Boolean);
  return parts.join(", ");
};

const AddressMapPreview: React.FC<AddressMapPreviewProps> = ({
  className = "",
  ...addressProps
}) => {
  const address = buildAddress(addressProps);
  const hasAddress = Boolean(address);
  const encodedAddress = hasAddress ? encodeURIComponent(address) : "";
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  const staticMapUrl =
    hasAddress && apiKey
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddress}&zoom=17&size=640x360&scale=2&maptype=roadmap&markers=color:red%7C${encodedAddress}&key=${apiKey}`
      : null;
  const mapsViewUrl = hasAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
    : null;
  const mapsDirectionsUrl = hasAddress
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`
    : null;

  const renderPlaceholder = () => {
    if (!hasAddress) {
      return (
        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-500">
          Endereço do cliente incompleto. Atualize os dados para visualizar o
          mapa.
        </div>
      );
    }

    if (!staticMapUrl) {
      return (
        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-500">
          Chave publica do Google Maps não configurada. Adicione
          <code className="rounded bg-slate-100 px-1 text-[11px] text-slate-600">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          </code>{" "}
          para visualizar o mapa estático.
        </div>
      );
    }

    return (
      <Image
        src={staticMapUrl}
        alt="Visualização do endereço no mapa"
        fill
        className="object-cover"
        priority={false}
        unoptimized
      />
    );
  };

  const renderButton = (
    href: string | null,
    label: string,
    variant: "primary" | "neutral"
  ) => {
    if (!href) {
      return (
        <button
          type="button"
          disabled
          className="inline-flex cursor-not-allowed items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400"
        >
          {label}
        </button>
      );
    }

    const baseClasses =
      "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm transition";
    const variantClasses =
      variant === "primary"
        ? "border border-transparent bg-gradient-to-r from-[var(--primary)] to-[#6541D3] text-white shadow-[var(--primary)]/25 hover:opacity-90"
        : "border border-[var(--primary)]/30 bg-white text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/10";

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseClasses} ${variantClasses}`}
      >
        {label}
      </a>
    );
  };

  return (
    <div
      className={`rounded-2xl border border-transparent bg-gradient-to-br from-white via-white to-slate-50 p-4 shadow-lg ring-1 ring-slate-100 ${className}`}
    >
      <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 h-64 relative">
        {renderPlaceholder()}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {renderButton(mapsViewUrl, "Ver mapa", "neutral")}
        {renderButton(mapsDirectionsUrl, "Traçar rota", "primary")}
      </div>
    </div>
  );
};

export default AddressMapPreview;
