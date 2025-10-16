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

/* ------------------------------------------
   Tipos mínimos seguros para Google Maps API
------------------------------------------- */
interface LatLngLike {
  lat: number;
  lng: number;
}

interface LatLngResult {
  lat: () => number;
  lng: () => number;
}

interface GoogleMap {
  setCenter: (pos: LatLngLike) => void;
}

interface GoogleMarker {
  getPosition: () => LatLngResult | null;
  setPosition: (pos: LatLngLike) => void;
  addListener: (event: string, callback: () => void) => void;
}

interface GoogleGeocoder {
  geocode: (
    request: { address: string },
    callback: (results: GoogleGeocodeResult[] | null, status: string) => void
  ) => void;
}

interface GoogleGeocodeResult {
  geometry: {
    location: LatLngResult;
  };
}

interface GoogleMaps {
  Map: new (element: HTMLElement, options: GoogleMapOptions) => GoogleMap;
  Marker: new (options: GoogleMarkerOptions) => GoogleMarker;
  Geocoder: new () => GoogleGeocoder;
  Animation: { DROP: number };
  event: { clearInstanceListeners: (instance: GoogleMarker) => void };
}

interface GoogleMapOptions {
  center: LatLngLike;
  zoom: number;
  mapTypeControl?: boolean;
  streetViewControl?: boolean;
  fullscreenControl?: boolean;
}

interface GoogleMarkerOptions {
  position: LatLngLike;
  map: GoogleMap;
  draggable?: boolean;
  animation?: number;
}

declare global {
  interface Window {
    google?: { maps: GoogleMaps };
    initMap?: () => void;
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
  const isFirstLoad = useRef(true);

  const [loading, setLoading] = useState(true);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [currentLat, setCurrentLat] = useState<number | null>(
    initialLat ?? null
  );
  const [currentLng, setCurrentLng] = useState<number | null>(
    initialLng ?? null
  );

  // Carrega script do Google Maps apenas uma vez
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    const loadGoogleMaps = () => {
      if (window.google?.maps) {
        setGoogleMapsLoaded(true);
        return;
      }

      const existingScript = document.querySelector(
        'script[src*="maps.googleapis.com/maps/api/js"]'
      );
      if (existingScript) {
        const timer = setInterval(() => {
          if (window.google?.maps) {
            clearInterval(timer);
            setGoogleMapsLoaded(true);
          }
        }, 200);
        return;
      }

      const script = document.createElement("script");
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;
      script.id = "google-maps-script";

      window.initMap = () => setGoogleMapsLoaded(true);
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, [isOpen]);

  // Inicializa o mapa
  useEffect(() => {
    if (!googleMapsLoaded || !mapRef.current || !isOpen) return;

    const gmaps = window.google?.maps;
    if (!gmaps) return;

    const defaultLoc: LatLngLike = { lat: -29.6995, lng: -51.135428 };
    const initialLoc: LatLngLike = {
      lat: currentLat ?? defaultLoc.lat,
      lng: currentLng ?? defaultLoc.lng,
    };

    const mapInstance = new gmaps.Map(mapRef.current, {
      center: initialLoc,
      zoom: 17,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    const markerInstance = new gmaps.Marker({
      position: initialLoc,
      map: mapInstance,
      draggable: true,
      animation: gmaps.Animation.DROP,
    });

    markerInstance.addListener("dragend", () => {
      const pos = markerInstance.getPosition();
      if (pos) {
        setCurrentLat(pos.lat());
        setCurrentLng(pos.lng());
      }
    });

    // Geocodifica o endereço apenas na primeira vez
    if (address && isFirstLoad.current) {
      isFirstLoad.current = false;
      const geocoder = new gmaps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const loc = results[0].geometry.location;
          const coords = { lat: loc.lat(), lng: loc.lng() };
          mapInstance.setCenter(coords);
          markerInstance.setPosition(coords);
          setCurrentLat(coords.lat);
          setCurrentLng(coords.lng);
        }
      });
    }

    const resizeTimer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
      setLoading(false);
    }, 250);

    return () => {
      gmaps.event.clearInstanceListeners(markerInstance);
      clearTimeout(resizeTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleMapsLoaded, isOpen, address]);

  const handleConfirm = () => {
    if (currentLat && currentLng) {
      onLocationSelected(currentLat, currentLng);
      onClose();
    }
  };

  if (!isOpen) return null;

  // Layout responsivo e compacto
  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 z-50 flex items-center justify-center px-2 sm:px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl sm:max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-3 sm:p-4 flex justify-between items-center bg-gradient-to-r from-[#7B54BE] to-[#6743a1] text-white">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <h2 className="text-base sm:text-lg font-semibold">
              Ajustar Localização
            </h2>
          </div>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-3 sm:p-5 flex-1 flex flex-col min-h-[400px]">
          {clientName && (
            <div className="bg-white rounded-lg border border-gray-100 shadow p-3 mb-3">
              <div className="flex items-start gap-2">
                <Building className="w-5 h-5 text-[#7B54BE]" />
                <div>
                  <h3 className="font-medium text-gray-800 text-sm">
                    {clientName}
                  </h3>
                  <p className="text-xs text-gray-500">{address}</p>
                </div>
              </div>
            </div>
          )}

          {/* Mapa */}
          <div className="relative flex-1 border border-gray-200 rounded-lg overflow-hidden mb-3">
            {loading && (
              <div className="absolute inset-0 bg-white/90 z-10 flex items-center justify-center">
                <Loading text="Carregando mapa..." />
              </div>
            )}
            <div
              ref={mapRef}
              className="w-full h-full bg-gray-50"
              style={{ minHeight: "280px", height: "40vh", maxHeight: "350px" }}
            ></div>
          </div>

          {/* Coordenadas */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 flex items-center gap-1 mb-1">
                <Globe className="w-3 h-3 text-[#7B54BE]" /> Latitude
              </label>
              <div className="relative">
                <div className="font-mono bg-gray-50 p-2 rounded-md border border-gray-200 text-sm text-center text-gray-800">
                  {currentLat ? currentLat.toFixed(6) : "-"}
                </div>
                {currentLat && (
                  <Check className="absolute top-1/2 right-2 w-3 h-3 text-green-600 -translate-y-1/2" />
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 flex items-center gap-1 mb-1">
                <Globe className="w-3 h-3 text-[#7B54BE]" /> Longitude
              </label>
              <div className="relative">
                <div className="font-mono bg-gray-50 p-2 rounded-md border border-gray-200 text-sm text-center text-gray-800">
                  {currentLng ? currentLng.toFixed(6) : "-"}
                </div>
                {currentLng && (
                  <Check className="absolute top-1/2 right-2 w-3 h-3 text-green-600 -translate-y-1/2" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium flex justify-center items-center gap-2"
          >
            <X className="w-4 h-4" /> Cancelar
          </button>

          <button
            onClick={handleConfirm}
            disabled={!currentLat || !currentLng}
            className="px-5 py-2.5 bg-gradient-to-r from-[#7B54BE] to-[#6743a1] text-white rounded-lg font-medium flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition disabled:opacity-70"
          >
            {!currentLat || !currentLng ? (
              <>
                <AlertTriangle className="w-4 h-4 animate-pulse" />
                Defina a Localização
              </>
            ) : (
              <>
                <Check className="w-4 h-4" /> Confirmar Localização
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
