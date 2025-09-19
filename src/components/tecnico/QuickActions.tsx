"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Navigation, Phone, MessageSquare, Mail } from "lucide-react";
import type { OSDetalhadaV2 } from "@/api/services/ordensServicoService";

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  action: () => void;
  color: string;
  disabled: boolean;
}

export default function QuickActions({ os }: { os: OSDetalhadaV2 }) {
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Erro ao obter localização:", error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  const openNavigation = useCallback(
    (app: "google" | "waze") => {
      let destinationUrl = "";
      let destinationCoords = "";

      if (os.cliente?.latitude && os.cliente?.longitude) {
        destinationCoords = `${os.cliente.latitude},${os.cliente.longitude}`;
        destinationUrl = destinationCoords;
      } else if (os.cliente?.endereco) {
        const enderecoCompleto = `${os.cliente.endereco}${
          os.cliente.numero ? `, ${os.cliente.numero}` : ""
        } - ${os.cliente.bairro}, ${os.cliente.cidade}/${os.cliente.uf}`;
        destinationUrl = encodeURIComponent(enderecoCompleto);
      } else {
        alert("Endereço do cliente não disponível");
        return;
      }

      const isMobile =
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      if (app === "google") {
        const navigationUrl = currentLocation
          ? `https://www.google.com/maps/dir/${currentLocation.lat},${currentLocation.lng}/${destinationUrl}`
          : `https://www.google.com/maps/search/?api=1&query=${destinationUrl}`;

        if (isMobile) {
          const nativeUrl = currentLocation
            ? `comgooglemaps://?saddr=${currentLocation.lat},${currentLocation.lng}&daddr=${destinationUrl}&directionsmode=driving`
            : `comgooglemaps://?daddr=${destinationUrl}&directionsmode=driving`;

          const startTime = Date.now();
          window.location.href = nativeUrl;

          setTimeout(() => {
            if (Date.now() - startTime < 2000) {
              window.open(navigationUrl, "_blank");
            }
          }, 1500);
        } else {
          window.open(navigationUrl, "_blank");
        }
      } else if (app === "waze") {
        const wazeUrl = destinationCoords
          ? `https://waze.com/ul?ll=${destinationCoords}&navigate=yes`
          : `https://waze.com/ul?q=${destinationUrl}&navigate=yes`;

        if (isMobile) {
          const startTime = Date.now();
          window.location.href = wazeUrl;

          setTimeout(() => {
            if (Date.now() - startTime < 2000) {
              window.open(wazeUrl, "_blank");
            }
          }, 1500);
        } else {
          window.open(wazeUrl, "_blank");
        }
      }
    },
    [os.cliente, currentLocation]
  );

  const showNavigationModal = useCallback(() => {
    const isMobile =
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    if (isMobile) {
      const modal = document.createElement("div");
      modal.className =
        "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4";

      const modalContent = document.createElement("div");
      modalContent.className =
        "bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl";
      modalContent.innerHTML = `
        <h3 class="text-lg font-semibold text-gray-900 mb-4 text-center">Escolher app de navegação</h3>
        <div class="space-y-3">
   <button id="google-maps-btn" class="w-full flex items-center justify-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all">
  <!-- SVG no lugar do ícone -->
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 48 48">
    <path fill="#48b564" d="M35.76,26.36h0.01c0,0-3.77,5.53-6.94,9.64c-2.74,3.55-3.54,6.59-3.77,8.06	C24.97,44.6,24.53,45,24,45s-0.97-0.4-1.06-0.94c-0.23-1.47-1.03-4.51-3.77-8.06c-0.42-0.55-0.85-1.12-1.28-1.7L28.24,22l8.33-9.88	C37.49,14.05,38,16.21,38,18.5C38,21.4,37.17,24.09,35.76,26.36z"></path>
    <path fill="#fcc60e" d="M28.24,22L17.89,34.3c-2.82-3.78-5.66-7.94-5.66-7.94h0.01c-0.3-0.48-0.57-0.97-0.8-1.48L19.76,15	c-0.79,0.95-1.26,2.17-1.26,3.5c0,3.04,2.46,5.5,5.5,5.5C25.71,24,27.24,23.22,28.24,22z"></path>
    <path fill="#2c85eb" d="M28.4,4.74l-8.57,10.18L13.27,9.2C15.83,6.02,19.69,4,24,4C25.54,4,27.02,4.26,28.4,4.74z"></path>
    <path fill="#ed5748" d="M19.83,14.92L19.76,15l-8.32,9.88C10.52,22.95,10,20.79,10,18.5c0-3.54,1.23-6.79,3.27-9.3	L19.83,14.92z"></path>
    <path fill="#5695f6" d="M28.24,22c0.79-0.95,1.26-2.17,1.26-3.5c0-3.04-2.46-5.5-5.5-5.5c-1.71,0-3.24,0.78-4.24,2L28.4,4.74	c3.59,1.22,6.53,3.91,8.17,7.38L28.24,22z"></path>
  </svg>

  <span class="font-medium text-gray-800">Google Maps</span>
</button>

     <button id="waze-btn" class="w-full flex items-center justify-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all">
  <div class="w-8 h-8">
    <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
         width="100%" height="100%" viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve">
      <g>
        <path fill="#303030" d="M99.513,76.832c0,4.719-3.825,8.545-8.544,8.545c-4.718,0-8.544-3.826-8.544-8.545
          c0-4.719,3.826-8.543,8.544-8.543C95.688,68.289,99.513,72.112,99.513,76.832"/>
        <path fill="#303030" d="M139.43,76.832c0,4.719-3.826,8.545-8.545,8.545c-4.718,0-8.544-3.826-8.544-8.545
          c0-4.719,3.826-8.543,8.544-8.543C135.604,68.289,139.43,72.112,139.43,76.832"/>
        <path fill="#303030" d="M110.621,122.646c-14.477,0-27.519-9.492-29.911-21.917c-0.464-2.412,1.116-4.745,3.528-5.209
          c2.413-0.465,4.745,1.116,5.209,3.528c1.406,7.304,10.152,14.996,21.81,14.691c12.144-0.318,20.165-7.58,21.813-14.588
          c0.563-2.391,2.961-3.872,5.35-3.312c2.393,0.563,3.875,2.958,3.312,5.349c-1.346,5.721-5.03,11.021-10.375,14.926
          c-5.567,4.07-12.438,6.324-19.866,6.52C111.201,122.643,110.91,122.646,110.621,122.646"/>
        <path fill="#303030" d="M183.97,81.47c-1.644-9.71-5.5-18.811-11.464-27.051c-6.736-9.307-15.951-17.078-26.648-22.472
          c-10.812-5.452-22.88-8.335-34.9-8.335c-3.391,0-6.809,0.23-10.16,0.682c-14.034,1.896-27.833,7.734-38.856,16.439
          c-12.42,9.808-20.435,22.418-23.177,36.469C37.948,81.379,37.6,86,37.263,90.468c-0.528,6.994-1.074,14.226-3.298,18.952
          c-1.52,3.23-3.788,5.381-9.919,5.381c-3.374,0-6.457,1.908-7.963,4.928c-1.505,3.02-1.173,6.631,0.857,9.324
          c9.237,12.254,21.291,19.676,33.982,24.148c-0.578,1.746-0.903,3.605-0.903,5.545c0,9.744,7.899,17.643,17.643,17.643
          c9.503,0,17.229-7.518,17.606-16.928c4.137,0.225,23.836,0.279,26.033,0.217c0.487,9.309,8.167,16.711,17.596,16.711
          c9.743,0,17.642-7.898,17.642-17.643c0-2.221-0.428-4.338-1.176-6.295c6.918-3.365,13.448-7.906,19.146-13.375
          c7.946-7.625,13.778-16.621,16.868-26.016C184.854,102.486,185.728,91.857,183.97,81.47 M67.662,164.568
          c-3.215,0-5.822-2.605-5.822-5.822c0-3.215,2.607-5.822,5.822-5.822c3.216,0,5.822,2.607,5.822,5.822
          C73.484,161.963,70.878,164.568,67.662,164.568 M128.897,164.568c-3.216,0-5.823-2.605-5.823-5.822
          c0-3.215,2.607-5.822,5.823-5.822s5.822,2.607,5.822,5.822C134.72,161.963,132.113,164.568,128.897,164.568 M172.925,110.281
          c-5.095,15.49-18.524,28.281-32.835,34.83c-3.047-2.504-6.943-4.006-11.192-4.006c-6.848,0-12.771,3.906-15.694,9.607
          c-2.976,0.123-25.135,0.047-29.984-0.285c-2.972-5.547-8.822-9.322-15.557-9.322c-4.48,0-8.559,1.682-11.669,4.434
          c-12.054-3.895-23.438-10.551-31.947-21.842c25.161,0,20.196-28.118,23.451-44.792c4.959-25.412,30.099-42.499,54.491-45.794
          c3-0.405,6-0.602,8.969-0.602C151.047,32.51,186.732,68.302,172.925,110.281"/>
      </g>
    </svg>
  </div>
  <span class="font-medium text-gray-800">Waze</span>
</button>


          <button id="cancel-btn" class="w-full p-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
        </div>
      `;

      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      document
        .getElementById("google-maps-btn")
        ?.addEventListener("click", () => {
          document.body.removeChild(modal);
          openNavigation("google");
        });

      document.getElementById("waze-btn")?.addEventListener("click", () => {
        document.body.removeChild(modal);
        openNavigation("waze");
      });

      document.getElementById("cancel-btn")?.addEventListener("click", () => {
        document.body.removeChild(modal);
      });

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      });
    } else {
      openNavigation("google");
    }
  }, [openNavigation]);

  const actions: QuickAction[] = useMemo(() => {
    const actionList: QuickAction[] = [];

    if (
      os.cliente?.endereco ||
      (os.cliente?.latitude && os.cliente?.longitude)
    ) {
      actionList.push({
        icon: <Navigation className="w-4 h-4" />,
        label: "Traçar rota",
        action: showNavigationModal,
        color: "text-blue-600 bg-blue-50 border-blue-200",
        disabled: false,
      });
    }

    if (os.contato?.telefone) {
      actionList.push({
        icon: <Phone className="w-4 h-4" />,
        label: "Ligar",
        action: () => window.open(`tel:${os.contato!.telefone}`),
        color: "text-emerald-600 bg-emerald-50 border-emerald-200",
        disabled: false,
      });
    }

    if (os.contato?.whatsapp?.trim()) {
      actionList.push({
        icon: <MessageSquare className="w-4 h-4" />,
        label: "WhatsApp",
        action: () =>
          window.open(
            `https://wa.me/${os.contato!.whatsapp.replace(/\D/g, "")}`,
            "_blank"
          ),
        color: "text-green-600 bg-green-50 border-green-200",
        disabled: false,
      });
    }

    if (os.contato?.email) {
      actionList.push({
        icon: <Mail className="w-4 h-4" />,
        label: "E-mail",
        action: () => window.open(`mailto:${os.contato!.email}`),
        color: "text-blue-600 bg-blue-50 border-blue-200",
        disabled: false,
      });
    }

    return actionList;
  }, [os, showNavigationModal]);

  if (actions.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.action}
          disabled={action.disabled}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap border ${
            action.color
          } ${
            action.disabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm"
          }`}
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  );
}
