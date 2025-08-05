import React, { useEffect, useRef, useState } from 'react';
import { Loading } from '../../Loading';

interface LocationPickerProps {
    initialLat: number | null;
    initialLng: number | null;
    address: string;
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
    onLocationSelected,
    isOpen,
    onClose
}) => {
    const mapRef = useRef<HTMLDivElement>(null);

    /* Estas variáveis de estado armazenam referências aos objetos do mapa e marcador
     * que são importantes para a limpeza no retorno do useEffect,
     * mas não são lidas diretamente no componente */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [map, setMap] = useState<GoogleMap | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [marker, setMarker] = useState<GoogleMarker | null>(null);

    const [loading, setLoading] = useState<boolean>(true);
    const [currentLat, setCurrentLat] = useState<number | null>(initialLat);
    const [currentLng, setCurrentLng] = useState<number | null>(initialLng);
    const [googleMapsLoaded, setGoogleMapsLoaded] = useState<boolean>(false);

    // Função para carregar o script do Google Maps
    useEffect(() => {
        if (!isOpen) return;

        const loadGoogleMaps = () => {
            if (window.google && window.google.maps) {
                setGoogleMapsLoaded(true);
                return;
            }

            const googleMapScript = document.createElement('script');
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

            googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
            googleMapScript.async = true;
            googleMapScript.defer = true;

            window.initMap = () => {
                setGoogleMapsLoaded(true);
            };

            document.head.appendChild(googleMapScript);
        };

        loadGoogleMaps();

        return () => {
            // Limpar o callback global quando o componente for desmontado
            if (window.initMap) {
                window.initMap = () => { };
            }
        };
    }, [isOpen]);

    // Inicializar o mapa quando o Google Maps for carregado
    useEffect(() => {
        if (!googleMapsLoaded || !mapRef.current || !isOpen) return;

        // Pequeno atraso para garantir que o DOM esteja pronto
        const timer = setTimeout(() => {
            setLoading(true);
        }, 100);

        // Coordenadas iniciais
        const defaultLocation = { lat: -29.699500, lng: -51.135428 };
        const initialLocation = {
            lat: currentLat || defaultLocation.lat,
            lng: currentLng || defaultLocation.lng
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
            title: 'Ajuste a posição exata',
        });

        // Evento para atualizar as coordenadas quando o marcador é arrastado
        markerInstance.addListener('dragend', () => {
            const position = markerInstance.getPosition();
            if (position) {
                setCurrentLat(position.lat());
                setCurrentLng(position.lng());
            }
        });

        // Se temos um endereço, centralizar o mapa nele
        if (address && (!currentLat || !currentLng)) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ address }, (results: GoogleGeocodeResult[], status: string) => {
                if (status === 'OK' && results && results[0]) {
                    const location = results[0].geometry.location;
                    const locationCoords = {
                        lat: location.lat(),
                        lng: location.lng()
                    };
                    mapInstance.setCenter(locationCoords);
                    markerInstance.setPosition(locationCoords);
                    setCurrentLat(locationCoords.lat);
                    setCurrentLng(locationCoords.lng);
                }
            });
        }

        setMap(mapInstance);
        setMarker(markerInstance);

        // Forçar redimensionamento do mapa após um pequeno atraso
        setTimeout(() => {
            // Truque para forçar o Google Maps a redimensionar corretamente
            window.dispatchEvent(new Event('resize'));
            setLoading(false);
        }, 300);

        return () => {
            // Limpar o mapa e marcador quando o componente for desmontado
            if (markerInstance) {
                window.google.maps.event.clearInstanceListeners(markerInstance);
            }
            clearTimeout(timer);
        };
    }, [googleMapsLoaded, isOpen, address, currentLat, currentLng]);

    // Função para confirmar a seleção da localização
    const handleConfirm = () => {
        if (currentLat && currentLng) {
            onLocationSelected(currentLat, currentLng);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-black">Ajustar Localização</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                        aria-label="Fechar"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div className="p-4 flex-1 min-h-[400px] relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white bg-opacity-80 z-10">
                            <Loading
                                size="medium"
                                text="Carregando mapa..."
                                fullScreen={false}
                            />
                        </div>
                    )}

                    <div
                        className="bg-gray-100 rounded h-full w-full"
                        ref={mapRef}
                        style={{ minHeight: '400px' }}
                    ></div>

                    {/* Informação de coordenadas atuais */}
                    <div className="absolute bottom-8 left-4 right-4 bg-white p-3 rounded-md shadow-md z-10 flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-black">Latitude</label>
                            <div className="mt-1 font-mono bg-gray-50 p-2 rounded border border-gray-200 text-black">
                                {currentLat?.toFixed(6) || '-'}
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-black">Longitude</label>
                            <div className="mt-1 font-mono bg-gray-50 p-2 rounded border border-gray-200 text-black">
                                {currentLng?.toFixed(6) || '-'}
                            </div>
                        </div>
                    </div>

                    <div className="absolute top-4 left-4 right-4 bg-white p-2 rounded-md shadow-md z-10 flex items-center justify-center">
                        <span className="text-sm text-black font-medium">
                            Arraste o marcador para ajustar a localização exata
                        </span>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 flex justify-between">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-[#7C54BD] text-white rounded-md hover:bg-[#6743a1] transition-colors flex items-center gap-2"
                        disabled={!currentLat || !currentLng}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                        </svg>
                        Confirmar Localização
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LocationPicker;
