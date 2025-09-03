"use client";

import { useEffect, useState, useCallback } from "react";
import { MapPin, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";

import {
  isValidCoordinate,
  generateGoogleMapsIframeUrl,
  generateGoogleMapsUrl,
  getEmpresaFromStorage,
  formatEmpresaAddress,
  type EmpresaData,
} from "@/utils/maps";

interface MapComponentProps {
  height?: string;
  zoom?: number;
  showAddress?: boolean;
  className?: string;
}

const MapComponent: React.FC<MapComponentProps> = ({
  height = "300px",
  zoom = 18,
  showAddress = true,
  className = "",
}) => {
  const [empresaData, setEmpresaData] = useState<EmpresaData | null>(null);
  const [mapUrl, setMapUrl] = useState<string>("");
  const [hasValidCoords, setHasValidCoords] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mapError, setMapError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  const loadEmpresaData = useCallback(() => {
    setIsLoading(true);
    setMapError(false);

    const empresa = getEmpresaFromStorage();

    if (empresa) {
      setEmpresaData(empresa);

      const lat = Number(empresa.latitude);
      const lng = Number(empresa.longitude);

      if (isValidCoordinate(lat, lng)) {
        const url = generateGoogleMapsIframeUrl(lat, lng, zoom);
        setMapUrl(url);
        setHasValidCoords(true);
      } else {
        setHasValidCoords(false);
      }
    } else {
      setHasValidCoords(false);
    }

    setIsLoading(false);
  }, [zoom]);

  useEffect(() => {
    loadEmpresaData();
  }, [loadEmpresaData, retryCount]);

  const openInGoogleMaps = () => {
    if (empresaData && hasValidCoords) {
      const url = generateGoogleMapsUrl(
        empresaData.latitude,
        empresaData.longitude
      );
      if (url) {
        window.open(url, "_blank");
      }
    }
  };

  const handleMapError = () => {
    setMapError(true);
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div
        className={`w-full bg-gray-100 flex items-center justify-center rounded-lg border ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#7C54BD] border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  if (!hasValidCoords || !empresaData) {
    return (
      <div
        className={`w-full bg-gray-50 flex flex-col items-center justify-center rounded-lg border border-gray-200 ${className}`}
        style={{ height }}
      >
        <div className="text-center p-6">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-gray-600 font-medium mb-2">
            Localização não disponível
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            {!empresaData
              ? "Dados da empresa não encontrados"
              : "Coordenadas inválidas ou não configuradas"}
          </p>

          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-[#7C54BD] text-white rounded-lg hover:bg-[#6B47A8] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>

          {empresaData && showAddress && (
            <div className="mt-4 p-3 bg-white rounded-md border text-left">
              <p className="text-sm text-gray-600">
                {formatEmpresaAddress(empresaData)}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full space-y-4 ${className}`}>
      <div
        className="w-full rounded-lg overflow-hidden shadow-md border relative"
        style={{ height }}
      >
        {mapError ? (
          <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
            <p className="text-red-600 text-sm mb-3">Erro ao carregar o mapa</p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Recarregar
            </button>
          </div>
        ) : (
          <iframe
            src={mapUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Localização da ${empresaData.razao_social}`}
            onError={handleMapError}
            onLoad={() => setMapError(false)}
          />
        )}
      </div>

      {showAddress && empresaData && (
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-[#7C54BD] mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-1">
                {empresaData.razao_social}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {formatEmpresaAddress(empresaData)}
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>Lat: {empresaData.latitude.toFixed(6)}</span>
                <span>Lng: {empresaData.longitude.toFixed(6)}</span>
                <button
                  onClick={openInGoogleMaps}
                  className="inline-flex items-center space-x-1 text-[#7C54BD] hover:text-[#6B47A8] hover:underline transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Abrir no Google Maps</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
