// utils/maps.ts
import type { LicencaTipo } from "@/types/licenca";

export const isValidCoordinate = (lat: number, lng: number): boolean => {
  return (
    lat !== null &&
    lng !== null &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
};

export const generateGoogleMapsIframeUrl = (
  latitude: number,
  longitude: number,
  zoom: number = 18
): string => {
  if (!isValidCoordinate(latitude, longitude)) {
    return "";
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (apiKey) {
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${latitude},${longitude}&zoom=${zoom}&maptype=roadmap`;
  }

  return `https://maps.google.com/maps?q=${latitude},${longitude}&hl=pt&z=${zoom}&output=embed`;
};

export const generateGoogleMapsUrl = (
  latitude: number,
  longitude: number
): string => {
  if (!isValidCoordinate(latitude, longitude)) {
    return "";
  }

  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
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
  latitude: number;
  longitude: number;
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
