// utils/maps.ts

/**
 * Valida se as coordenadas fornecidas são válidas
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns boolean - true se as coordenadas são válidas
 */
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
    !(lat === 0 && lng === 0) // Excluir coordenada 0,0 que pode ser padrão
  );
};

/**
 * Gera URL para iframe do Google Maps
 * @param latitude - Latitude da localização
 * @param longitude - Longitude da localização
 * @param zoom - Nível de zoom (padrão: 18)
 * @returns string - URL para iframe do Google Maps
 */
export const generateGoogleMapsIframeUrl = (
  latitude: number,
  longitude: number,
  zoom: number = 18
): string => {
  console.log("🗺️ Gerando URL do iframe do Google Maps:", {
    latitude,
    longitude,
    zoom,
  });

  // Validar se as coordenadas são válidas
  if (!isValidCoordinate(latitude, longitude)) {
    console.warn("❌ Coordenadas inválidas para iframe:", {
      latitude,
      longitude,
    });
    return "";
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  console.log("🔑 API Key disponível:", !!apiKey);

  let iframeUrl: string;

  // Com API key - usar a API oficial do Google Maps Embed com marcador
  if (apiKey) {
    // Usando 'place' em vez de 'view' para mostrar o marcador
    iframeUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${latitude},${longitude}&zoom=${zoom}&maptype=roadmap`;
    console.log(
      "✅ URL com API Key (Embed API com marcador) gerada:",
      iframeUrl
    );
  } else {
    // Fallback usando o método tradicional que funciona sem API key
    // Esta URL mostra o marcador automaticamente
    iframeUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&hl=pt&z=${zoom}&output=embed`;
    console.log(
      "⚠️ URL sem API Key (fallback embed com marcador) gerada:",
      iframeUrl
    );
  }

  return iframeUrl;
};

/**
 * Gera URL para abrir no Google Maps (nova aba)
 * @param latitude - Latitude da localização
 * @param longitude - Longitude da localização
 * @returns string - URL para abrir no Google Maps
 */
export const generateGoogleMapsUrl = (
  latitude: number,
  longitude: number
): string => {
  console.log("🔗 Gerando URL do Google Maps para nova aba:", {
    latitude,
    longitude,
  });

  if (!isValidCoordinate(latitude, longitude)) {
    console.warn("❌ Coordenadas inválidas para URL:", { latitude, longitude });
    return "";
  }

  // URL para abrir no Google Maps (não é para embed)
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  console.log("✅ URL do Google Maps gerada:", mapsUrl);

  return mapsUrl;
};

/**
 * Recupera dados da empresa do localStorage
 * @returns EmpresaData | null
 */
export const getEmpresaFromStorage = (): EmpresaData | null => {
  try {
    if (typeof window === "undefined") {
      console.log("🌐 Window não disponível (SSR)");
      return null;
    }

    const empresaStr = localStorage.getItem("empresa");
    if (!empresaStr) {
      console.warn("⚠️ Dados da empresa não encontrados no localStorage");
      return null;
    }

    const empresaData = JSON.parse(empresaStr) as EmpresaData;
    console.log("📊 Dados da empresa recuperados do localStorage:", {
      razao_social: empresaData.razao_social,
      latitude: empresaData.latitude,
      longitude: empresaData.longitude,
      coordenadas_validas: isValidCoordinate(
        empresaData.latitude,
        empresaData.longitude
      ),
    });

    return empresaData;
  } catch (error) {
    console.error("❌ Erro ao recuperar dados da empresa:", error);
    return null;
  }
};

/**
 * Interface para dados da empresa
 */
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
  usuarios_ativos: number;
  usuarios_cadastrados: number;
  usuarios_licenciados: number;
  data_validade: string;
}

export const formatEmpresaAddress = (empresa: EmpresaData): string => {
  const { endereco, numero, bairro, cidade, uf, cep } = empresa;
  const enderecoCompleto = `${endereco}, ${numero} - ${bairro}, ${cidade}/${uf} - CEP: ${cep}`;
  console.log("📍 Endereço formatado:", enderecoCompleto);
  return enderecoCompleto;
};
