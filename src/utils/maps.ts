// utils/maps.ts
import type { LicencaTipo } from "@/types/licenca";

export const isValidAddress = (
  endereco: string,
  cidade: string,
  uf: string
): boolean => {
  return (
    endereco?.trim().length > 0 &&
    cidade?.trim().length > 0 &&
    uf?.trim().length > 0
  );
};

export const generateGoogleMapsIframeUrl = (
  endereco: string,
  numero: string,
  bairro: string,
  cidade: string,
  uf: string,
  zoom: number = 18
): string => {
  if (!isValidAddress(endereco, cidade, uf)) {
    return "";
  }

  const fullAddress = formatEmpresaAddressForUrl(
    endereco,
    numero,
    bairro,
    cidade,
    uf
  );
  const encodedAddress = encodeURIComponent(fullAddress);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (apiKey) {
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedAddress}&zoom=${zoom}&maptype=roadmap`;
  }

  return `https://maps.google.com/maps?q=${encodedAddress}&hl=pt&z=${zoom}&output=embed`;
};

export const generateGoogleMapsUrl = (
  endereco: string,
  numero: string,
  bairro: string,
  cidade: string,
  uf: string
): string => {
  if (!isValidAddress(endereco, cidade, uf)) {
    return "";
  }

  const fullAddress = formatEmpresaAddressForUrl(
    endereco,
    numero,
    bairro,
    cidade,
    uf
  );
  const encodedAddress = encodeURIComponent(fullAddress);

  return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
};

const formatEmpresaAddressForUrl = (
  endereco: string,
  numero: string,
  bairro: string,
  cidade: string,
  uf: string
): string => {
  return `${endereco}, ${numero}, ${bairro}, ${cidade}, ${uf}, Brasil`;
};

export const getEmpresaFromStorage = (): EmpresaData | null => {
  try {
    if (typeof window === "undefined") {
      return null;
    }

    const empresaStr = localStorage.getItem("empresa");
    if (!empresaStr) {
      return null;
    }

    return JSON.parse(empresaStr) as EmpresaData;
  } catch {
    return null;
  }
};

export interface EmpresaData {
  id_empresa: number;
  razao_social: string;
  cnpj: string;
  nome_bd: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  latitude?: number; // Opcional para compatibilidade
  longitude?: number; // Opcional para compatibilidade
  licenca_demo: boolean;
  licenca_tipo?: LicencaTipo | null;
  usuarios_ativos: number;
  usuarios_cadastrados: number;
  usuarios_licenciados: number;
  data_validade: string;
}

export const formatEmpresaAddress = (empresa: EmpresaData): string => {
  const { endereco, numero, bairro, cidade, uf, cep } = empresa;
  return `${endereco}, ${numero} - ${bairro}, ${cidade}/${uf} - CEP: ${cep}`;
};
