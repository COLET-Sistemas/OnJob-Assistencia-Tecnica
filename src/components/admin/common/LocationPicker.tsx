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
    const [currentLat, setCurrentLat] = useState<number | null>(initialLat !== null ? Number(initialLat) : null);
    const [currentLng, setCurrentLng] = useState<number | null>(initialLng !== null ? Number(initialLng) : null);
    const [googleMapsLoaded, setGoogleMapsLoaded] = useState<boolean>(false);

    // Atualizar as coordenadas quando o modal é aberto ou as propriedades mudam
    useEffect(() => {
        if (isOpen) {
            console.log('Modal aberto - atualizando coordenadas:', { initialLat, initialLng, address });
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
            const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
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

            const googleMapScript = document.createElement('script');
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

            googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
            googleMapScript.async = true;
            googleMapScript.defer = true;
            googleMapScript.id = 'google-maps-script';

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
        const defaultLocation = { lat: -29.699500, lng: -51.135428 };
        const initialLocation = {
            lat: currentLat !== null ? Number(currentLat) : defaultLocation.lat,
            lng: currentLng !== null ? Number(currentLng) : defaultLocation.lng
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
                setCurrentLat(Number(position.lat()));
                setCurrentLng(Number(position.lng()));
            }
        });

        // Geocodificar o endereço somente na primeira vez ou quando ele mudar
        if (address && isFirstLoad.current) {
            isFirstLoad.current = false; // Marcar que já fizemos a primeira carga

            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ address }, (results: GoogleGeocodeResult[], status: string) => {
                if (status === 'OK' && results && results[0]) {
                    const location = results[0].geometry.location;
                    const locationCoords = {
                        lat: location.lat(),
                        lng: location.lng()
                    };

                    // Usar as coordenadas do endereço para centralizar o mapa
                    mapInstance.setCenter(locationCoords);
                    markerInstance.setPosition(locationCoords);
                    setCurrentLat(Number(locationCoords.lat));
                    setCurrentLng(Number(locationCoords.lng));

                    console.log('Endereço geocodificado:', address, locationCoords);
                } else {
                    console.warn('Falha ao geocodificar endereço:', status);
                    // Se não conseguir geocodificar, usar as coordenadas iniciais se disponíveis
                    if (initialLat !== null && initialLng !== null) {
                        const coords = { lat: Number(initialLat), lng: Number(initialLng) };
                        mapInstance.setCenter(coords);
                        markerInstance.setPosition(coords);
                    }
                }
            });
        }

        setMap(mapInstance);
        setMarker(markerInstance);

        // Forçar redimensionamento do mapa após um pequeno atraso
        const resizeTimer = setTimeout(() => {
            // Truque para forçar o Google Maps a redimensionar corretamente
            window.dispatchEvent(new Event('resize'));
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
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col border-t-4 border-[#7C54BD]">
                <div className="p-5 flex justify-between items-center bg-gradient-to-r from-[#7C54BD]/10 to-white">
                    <h2 className="text-xl font-semibold text-[#7C54BD]">Ajustar Localização</h2>
                    <button
                        onClick={onClose}
                        className="text-[#7C54BD] hover:text-[#6743a1] bg-white rounded-full p-1 shadow-sm transition-all hover:shadow cursor-pointer"
                        aria-label="Fechar"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div className="p-6 flex-1 flex flex-col min-h-[550px]">
                    {/* Instruction Banner - Now outside of the map container */}
                    <div className="bg-[#7C54BD] p-3 rounded-lg shadow-lg mb-4 flex items-center justify-center">
                        <span className="text-sm text-white font-medium flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path>
                            </svg>
                            Arraste o marcador para ajustar a localização exata
                        </span>
                    </div>

                    {/* Map Container */}
                    <div className="relative flex-1">
                        {loading && (
                            <div className="absolute inset-0 bg-white bg-opacity-90 z-10 flex items-center justify-center">
                                <Loading
                                    size="medium"
                                    text="Carregando mapa..."
                                    fullScreen={false}
                                />
                            </div>
                        )}

                        <div
                            className="bg-gray-100 rounded-lg shadow-inner w-full h-full overflow-hidden"
                            ref={mapRef}
                            style={{ minHeight: '400px' }}
                        ></div>
                    </div>

                    {/* Coordinates Display - Now outside of the map container */}
                    <div className="mt-4 bg-white p-4 rounded-lg shadow-lg flex flex-col md:flex-row gap-6 border-l-4 border-[#F6C647]">
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-[#7C54BD]">Latitude</label>
                            <div className="mt-1 font-mono bg-gray-50 p-3 rounded border border-gray-100 text-gray-800 shadow-inner">
                                {currentLat !== null ? Number(currentLat).toFixed(6) : '-'}
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-[#7C54BD]">Longitude</label>
                            <div className="mt-1 font-mono bg-gray-50 p-3 rounded border border-gray-100 text-gray-800 shadow-inner">
                                {currentLng !== null ? Number(currentLng).toFixed(6) : '-'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-between bg-gradient-to-b from-white to-gray-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white text-[#7C54BD] border border-[#7C54BD] rounded-md hover:bg-[#7C54BD]/5 transition-colors font-medium shadow-sm cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-6 py-2.5 bg-gradient-to-r from-[#7C54BD] to-[#6743a1] text-white rounded-md hover:shadow-lg transition-all flex items-center gap-2 font-medium shadow-sm disabled:opacity-70 disabled:hover:shadow-none cursor-pointer"
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
