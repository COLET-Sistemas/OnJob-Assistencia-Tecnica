import React, { useEffect, useRef, useState } from "react";
import { Loading } from "../../LoadingPersonalizado";
import { MapPin, X, Building, AlertTriangle, Globe, Check } from "lucide-react";

interface LocationPickerProps {
  initialLat: number | null;
  initialLng: number | null;
  address: string;
  clientName?: string;
  onLocationSelected: (lat: number, lng: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

// Definindo interfaces para os tipos do Google Maps
interface GoogleMapOptions {
  center: { lat: number; lng: number };
  zoom: number;
  mapTypeControl?: boolean;
  streetViewControl?: boolean;
  fullscreenControl?: boolean;
}

interface GoogleMarkerOptions {
  position: { lat: number; lng: number };
  map: GoogleMap;
  draggable?: boolean;
  animation?: number;
  title?: string;
}

interface GoogleGeocodeResult {
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
}

interface GoogleMap {
  setCenter: (position: { lat: number; lng: number }) => void;
}

interface GoogleMarker {
  setPosition: (position: { lat: number; lng: number }) => void;
  getPosition: () => { lat: () => number; lng: () => number };
  addListener: (event: string, callback: () => void) => void;
}

interface GoogleGeocoder {
  geocode: (
    request: { address: string },
    callback: (results: GoogleGeocodeResult[], status: string) => void
  ) => void;
}

interface GoogleMapsEvent {
  clearInstanceListeners: (instance: GoogleMarker) => void;
}

// Declaração global para o objeto google
declare global {
  interface Window {
    google: {
      maps: {
        Map: new (element: HTMLElement, options: GoogleMapOptions) => GoogleMap;
        Marker: new (options: GoogleMarkerOptions) => GoogleMarker;
        Geocoder: new () => GoogleGeocoder;
        event: GoogleMapsEvent;
        Animation: {
          DROP: number;
        };
      };
    };
    initMap: () => void;
  }
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  initialLat,
  initialLng,
  address,
  clientName = "",
  onLocationSelected,
  isOpen,
  onClose,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const addressRef = useRef<string>(address);
  const isFirstLoad = useRef<boolean>(true);

  /* Estas variáveis de estado armazenam referências aos objetos do mapa e marcador
   * que são importantes para a limpeza no retorno do useEffect,
   * mas não são lidas diretamente no componente */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [map, setMap] = useState<GoogleMap | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [marker, setMarker] = useState<GoogleMarker | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [currentLat, setCurrentLat] = useState<number | null>(
    initialLat !== null ? Number(initialLat) : null
  );
  const [currentLng, setCurrentLng] = useState<number | null>(
    initialLng !== null ? Number(initialLng) : null
  );
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState<boolean>(false);

  // Atualizar as coordenadas quando o modal é aberto ou as propriedades mudam
  useEffect(() => {
    if (isOpen) {
      console.log("Modal aberto - atualizando coordenadas:", {
        initialLat,
        initialLng,
        address,
      });
      setCurrentLat(initialLat !== null ? Number(initialLat) : null);
      setCurrentLng(initialLng !== null ? Number(initialLng) : null);
    }
  }, [isOpen, initialLat, initialLng, address]);

  // Resetar o flag de primeira carga quando o modal é aberto
  useEffect(() => {
    if (isOpen) {
      isFirstLoad.current = true;
    }
  }, [isOpen]);

  // Função para carregar o script do Google Maps
  useEffect(() => {
    if (!isOpen) return;

    // Resetting loading state when modal is opened
    setLoading(true);

    const loadGoogleMaps = () => {
      // Check if Google Maps API is already loaded
      if (window.google && window.google.maps) {
        setGoogleMapsLoaded(true);
        return;
      }

      // Check if script tag already exists (to prevent multiple loading)
      const existingScript = document.querySelector(
        'script[src*="maps.googleapis.com/maps/api/js"]'
      );
      if (existingScript) {
        // If script exists but isn't ready yet, wait for it
        const checkGoogleMaps = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkGoogleMaps);
            setGoogleMapsLoaded(true);
          }
        }, 100);
        return;
      }

      const googleMapScript = document.createElement("script");
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
      googleMapScript.async = true;
      googleMapScript.defer = true;
      googleMapScript.id = "google-maps-script";

      window.initMap = () => {
        setGoogleMapsLoaded(true);
      };

      document.head.appendChild(googleMapScript);
    };

    loadGoogleMaps();

    return () => {
      // Limpar o callback global quando o componente for desmontado
      if (window.initMap) {
        window.initMap = () => {};
      }
    };
  }, [isOpen]);

  // Atualizar addressRef quando address mudar
  useEffect(() => {
    if (addressRef.current !== address) {
      addressRef.current = address;
      isFirstLoad.current = true;
    }
  }, [address]);

  // Inicializar o mapa quando o Google Maps for carregado
  useEffect(() => {
    if (!googleMapsLoaded || !mapRef.current || !isOpen) return;

    // Garantir que estamos em um estado de carregamento
    setLoading(true);

    // Coordenadas iniciais
    const defaultLocation = { lat: -29.6995, lng: -51.135428 };
    const initialLocation = {
      lat: currentLat !== null ? Number(currentLat) : defaultLocation.lat,
      lng: currentLng !== null ? Number(currentLng) : defaultLocation.lng,
    };

    // Inicializar o mapa
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: initialLocation,
      zoom: 17,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    // Inicializar o marcador
    const markerInstance = new window.google.maps.Marker({
      position: initialLocation,
      map: mapInstance,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
      title: "Ajuste a posição exata",
    });

    // Evento para atualizar as coordenadas quando o marcador é arrastado
    markerInstance.addListener("dragend", () => {
      const position = markerInstance.getPosition();
      if (position) {
        setCurrentLat(Number(position.lat()));
        setCurrentLng(Number(position.lng()));
      }
    });

    // Geocodificar o endereço somente na primeira vez ou quando ele mudar
    if (address && isFirstLoad.current) {
      isFirstLoad.current = false; // Marcar que já fizemos a primeira carga

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        { address },
        (results: GoogleGeocodeResult[], status: string) => {
          if (status === "OK" && results && results[0]) {
            const location = results[0].geometry.location;
            const locationCoords = {
              lat: location.lat(),
              lng: location.lng(),
            };

            // Usar as coordenadas do endereço para centralizar o mapa
            mapInstance.setCenter(locationCoords);
            markerInstance.setPosition(locationCoords);
            setCurrentLat(Number(locationCoords.lat));
            setCurrentLng(Number(locationCoords.lng));

            console.log("Endereço geocodificado:", address, locationCoords);
          } else {
            console.warn("Falha ao geocodificar endereço:", status);
            // Se não conseguir geocodificar, usar as coordenadas iniciais se disponíveis
            if (initialLat !== null && initialLng !== null) {
              const coords = {
                lat: Number(initialLat),
                lng: Number(initialLng),
              };
              mapInstance.setCenter(coords);
              markerInstance.setPosition(coords);
            }
          }
        }
      );
    }

    setMap(mapInstance);
    setMarker(markerInstance);

    // Forçar redimensionamento do mapa após um pequeno atraso
    const resizeTimer = setTimeout(() => {
      // Truque para forçar o Google Maps a redimensionar corretamente
      window.dispatchEvent(new Event("resize"));
      setLoading(false);
    }, 300);

    return () => {
      // Limpar o mapa e marcador quando o componente for desmontado
      if (markerInstance) {
        window.google.maps.event.clearInstanceListeners(markerInstance);
      }
      clearTimeout(resizeTimer);
    };
    // Only re-run when these specific dependencies change to avoid infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleMapsLoaded, isOpen]);

  // Função para confirmar a seleção da localização
  const handleConfirm = () => {
    if (currentLat !== null && currentLng !== null) {
      onLocationSelected(Number(currentLat), Number(currentLng));
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
        <div className="p-4 sm:p-5 flex justify-between items-center bg-gradient-to-r from-[#7B54BE] to-[#6743a1] text-white">
          <div className="flex items-center gap-2 sm:gap-3">
            <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
            <h2 className="text-lg sm:text-xl font-semibold">
              Ajustar Localização
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-white/80 bg-white/10 rounded-full p-1.5 sm:p-2 transition-all hover:bg-white/20 cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 flex-1 flex flex-col min-h-[550px] overflow-y-auto">
          {/* Client Info and Instructions Banner */}
          <div className="mb-4 sm:mb-6">
            {clientName && (
              <div className="bg-white rounded-lg border border-gray-100 shadow p-3 sm:p-4 ">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="bg-[#7B54BE]/10 p-1.5 sm:p-2 rounded-lg hidden sm:block">
                    <Building className="w-5 h-5 sm:w-6 sm:h-6 text-[#7B54BE]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <Building className="w-4 h-4 mr-1 text-[#7B54BE] sm:hidden" />
                      <h3 className="font-medium text-gray-800 text-sm sm:text-base">
                        {clientName}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 break-words">
                      {address}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* <div className="flex items-start gap-2 bg-gradient-to-r from-[#F6C647]/10 to-transparent py-2 px-3 border-l-4 border-[#F6C647] rounded-r-lg">
              <div className="bg-[#F6C647] rounded-full p-1 flex-shrink-0">
                <svg
                  className="w-3 h-3 text-white"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v.01"/>
                  <path d="M12 8v4"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-2xs text-gray-600">
                  Arraste o marcador no mapa para definir a posição exata.
                </p>
              </div>
            </div> */}
          </div>

          {/* Map Container */}
          <div className="relative flex-1 border border-gray-200 rounded-xl shadow-md overflow-hidden mb-4 sm:mb-6">
            {/* Map Header */}
            <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-2 px-3 sm:px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#7B54BE]" />
                <span className="text-xs font-medium text-gray-700">
                  Mapa Interativo
                </span>
              </div>
              <div className="text-xs text-gray-500 italic">
                <span className="sm:hidden">
                  Zoom: pinça | Arraste para mover
                </span>
                <span className="hidden sm:inline">
                  Zoom: role a roda do mouse | Arraste para mover
                </span>
              </div>
            </div>

            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-95 z-10 flex items-center justify-center">
                <div className="bg-white p-6  flex flex-col items-center">
                  <Loading
                    size="medium"
                    text="Carregando mapa..."
                    fullScreen={false}
                  />
                  <p className="text-sm text-gray-500 mt-3">
                    Aguarde enquanto carregamos o Google Maps
                  </p>
                </div>
              </div>
            )}

            <div
              className="bg-gray-50 w-full h-full overflow-hidden"
              ref={mapRef}
              style={{
                minHeight: "300px",
                height: "calc(100vh - 500px)",
                maxHeight: "400px",
              }}
            ></div>
          </div>

          {/* Coordinates Display - Enhanced with visual improvements */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-3 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <label className="text-xs font-medium text-gray-700 flex items-center">
                    <Globe className="w-3 h-3 mr-0.5 text-[#7B54BE]" />
                    <span className="text-2xs">Latitude</span>
                  </label>
                  <span className="text-2xs text-gray-500 hidden xs:inline">
                    Graus decimais
                  </span>
                </div>
                <div className="relative">
                  <div className="font-mono bg-gray-50 p-2 rounded-lg border border-gray-200 text-gray-800 shadow-sm text-center text-sm">
                    {currentLat !== null ? Number(currentLat).toFixed(6) : "-"}
                  </div>
                  {currentLat !== null && (
                    <div className="absolute top-1/2 -translate-y-1/2 right-2">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <label className="text-xs font-medium text-gray-700 flex items-center">
                    <Globe className="w-3 h-3 mr-0.5 text-[#7B54BE]" />
                    <span className="text-2xs">Longitude</span>
                  </label>
                  <span className="text-2xs text-gray-500 hidden xs:inline">
                    Graus decimais
                  </span>
                </div>
                <div className="relative">
                  <div className="font-mono bg-gray-50 p-2 rounded-lg border border-gray-200 text-gray-800 shadow-sm text-center text-sm">
                    {currentLng !== null ? Number(currentLng).toFixed(6) : "-"}
                  </div>
                  {currentLng !== null && (
                    <div className="absolute top-1/2 -translate-y-1/2 right-2">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row sm:justify-between gap-4 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium shadow-sm flex justify-center items-center gap-2 w-full sm:w-auto"
          >
            <X className="w-5 h-5" />
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            className="px-6 py-3 bg-gradient-to-r from-[#7B54BE] to-[#6743a1] text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 font-medium shadow-sm disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-none w-full sm:w-auto"
            disabled={!currentLat || !currentLng}
          >
            {!currentLat || !currentLng ? (
              <>
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                Defina a Localização
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Confirmar Localização
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
