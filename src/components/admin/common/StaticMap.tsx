import Image from 'next/image';
import React from 'react';

interface StaticMapProps {
    latitude: number | null;
    longitude: number | null;
    className?: string;
}

const StaticMap: React.FC<StaticMapProps> = ({
    latitude,
    longitude,
    className = ''
}) => {


    if (!latitude || !longitude) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 rounded-md ${className}`}>
                <p className="text-gray-500 text-center p-4">
                    Coordenadas não definidas.<br />
                    Preencha o endereço completo para visualizar o mapa.
                </p>
            </div>
        );
    }

    // Construir URL para mapa estático do Google Maps
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=17&size=600x400&markers=color:red%7C${latitude},${longitude}&key=${apiKey}`;

    return (
        <div className={`relative ${className}`}>
            <Image
                src={mapUrl}
                alt="Localização no mapa"
                fill={true}
                className="rounded-md object-cover"
                unoptimized={true} // Needed for external images from Google Maps API
            />
            <div className="absolute bottom-2 right-2 bg-white px-2 py-1 rounded-md text-xs text-gray-600 shadow-sm">
                <strong>Lat:</strong> {latitude.toFixed(6)} <strong>Lng:</strong> {longitude.toFixed(6)}
            </div>
        </div>
    );
};

export default StaticMap;
