"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Wrench,
  ArrowRight,
  Search,
  Settings,
  Tag,
  FileClock,
  AlertTriangle,
  ClipboardList,
  UsersRound,
  MapPin,
} from "lucide-react";

const cards = [
  {
    key: "clientes",
    label: "Clientes",
    description: "Gerenciar informações dos clientes",
    icon: <UserPlus size={32} strokeWidth={1.5} />,
    path: "/admin/cadastro/clientes",
    category: "Pessoas",
  },
  {
    key: "maquinas",
    label: "Máquinas",
    description: "Cadastro e controle de equipamentos",
    icon: <Settings size={32} strokeWidth={1.5} />,
    path: "/admin/cadastro/maquinas",
    category: "Equipamentos",
  },
  {
    key: "pecas",
    label: "Peças",
    description: "Gestão do estoque de peças",
    icon: <Wrench size={32} strokeWidth={1.5} />,
    path: "/admin/cadastro/pecas",
    category: "Estoque",
  },
  {
    key: "tipos_pecas",
    label: "Tipos Peças",
    description: "Gestão do estoque de tipos de peças",
    icon: <Tag size={32} strokeWidth={1.5} />,
    path: "/admin/cadastro/tipos_pecas",
    category: "Estoque",
  },

  {
    key: "regioes",
    label: "Regiões",
    description: "Definir áreas de atendimento",
    icon: <MapPin size={32} strokeWidth={1.5} />,
    path: "/admin/cadastro/regioes",
    category: "Localização",
  },

  {
    key: "usuarios_regioes",
    label: "Técnicos x Regiões",
    description: "Vincular técnicos às regiões",
    icon: <UsersRound size={32} strokeWidth={1.5} />,
    path: "/admin/cadastro/tecnicos_regioes",
    category: "Configurações",
  },
  {
    key: "motivos_atendimentos",
    label: "Motivos Atendimentos",
    description: "Categorias para atendimentos",
    icon: <ClipboardList size={32} strokeWidth={1.5} />,
    path: "/admin/cadastro/motivos_atendimentos",
    category: "Configurações",
  },
  {
    key: "motivos_pendencias",
    label: "Motivos Pendências",
    description: "Categorias para pendências",
    icon: <AlertTriangle size={32} strokeWidth={1.5} />,
    path: "/admin/cadastro/motivos_pendencias",
    category: "Configurações",
  },
  {
    key: "os_retroativas",
    label: "OSs Retroativas",
    description: "Cadastro de OSs retroativas",
    icon: <FileClock size={32} strokeWidth={1.5} />,
    path: "/admin/cadastro/os_retroativas",
    category: "Configurações",
  },
];

export default function CadastroCentralPage() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const router = useRouter();

  const filteredCards = cards;

  const handleCardClick = (path: string) => {
    router.push(path);
  };

  return (
    <div className="mx-auto px-2 py-2">
      {/* Title Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Central de Cadastro
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl">
          Gerencie todos os aspectos do seu sistema de forma centralizada e
          eficiente
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCards.map((card) => (
          <div
            key={card.key}
            onClick={() => handleCardClick(card.path)}
            onMouseEnter={() => setHoveredCard(card.key)}
            onMouseLeave={() => setHoveredCard(null)}
            className="group relative bg-white rounded-3xl p-8 shadow-sm border border-gray-100 cursor-pointer overflow-hidden transition-all duration-300"
            style={{
              transform:
                hoveredCard === card.key ? "translateY(-2px)" : "translateY(0)",
              boxShadow:
                hoveredCard === card.key
                  ? "0 8px 25px rgba(124, 84, 189, 0.12)"
                  : "0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
          >
            {/* Gradient Background on Hover */}
            <div
              className="absolute inset-0 transition-opacity duration-300"
              style={{
                background:
                  "linear-gradient(135deg, rgba(124, 84, 189, 0.02) 0%, rgba(117, 250, 189, 0.02) 50%, rgba(246, 198, 71, 0.02) 100%)",
                opacity: hoveredCard === card.key ? 1 : 0,
              }}
            ></div>

            {/* Decorative Elements */}
            <div
              className="absolute top-0 right-0 w-24 h-24 rounded-full transition-transform duration-500"
              style={{
                background:
                  "linear-gradient(135deg, rgba(124, 84, 189, 0.06) 0%, transparent 100%)",
                transform: `translateX(48px) translateY(-48px) ${
                  hoveredCard === card.key ? "scale(1.2)" : "scale(1)"
                }`,
              }}
            ></div>
            <div
              className="absolute bottom-0 left-0 w-20 h-20 rounded-full transition-transform duration-500"
              style={{
                background:
                  "linear-gradient(45deg, rgba(117, 250, 189, 0.06) 0%, transparent 100%)",
                transform: `translateX(-40px) translateY(40px) ${
                  hoveredCard === card.key ? "scale(1.1)" : "scale(1)"
                }`,
              }}
            ></div>

            {/* Content */}
            <div className="relative z-10">
              {/* Icon Container */}
              <div
                className="mb-6 p-4 rounded-2xl w-fit transition-all duration-300"
                style={{
                  background:
                    hoveredCard === card.key
                      ? "linear-gradient(135deg, rgba(124, 84, 189, 0.15) 0%, rgba(124, 84, 189, 0.05) 100%)"
                      : "linear-gradient(135deg, rgba(124, 84, 189, 0.08) 0%, rgba(124, 84, 189, 0.03) 100%)",
                  transform:
                    hoveredCard === card.key ? "scale(1.05)" : "scale(1)",
                }}
              >
                <div style={{ color: "#7C54BD" }}>{card.icon}</div>
              </div>

              {/* Text Content */}
              <div className="space-y-4">
                <h3
                  className="font-bold text-xl transition-colors duration-300"
                  style={{
                    color: hoveredCard === card.key ? "#7C54BD" : "#1F2937",
                  }}
                >
                  {card.label}
                </h3>
                <p className="text-gray-600 text-base leading-relaxed">
                  {card.description}
                </p>
              </div>

              {/* Arrow Icon */}
              <div
                className="absolute top-8 right-8 transition-all duration-300"
                style={{
                  opacity: hoveredCard === card.key ? 1 : 0,
                  transform:
                    hoveredCard === card.key
                      ? "translateX(0)"
                      : "translateX(8px)",
                }}
              >
                <div
                  className="p-2 rounded-full shadow-lg"
                  style={{ backgroundColor: "#7C54BD" }}
                >
                  <ArrowRight size={18} className="text-white" />
                </div>
              </div>
            </div>

            {/* Hover Border Effect */}
            <div
              className="absolute inset-0 rounded-3xl border transition-all duration-300"
              style={{
                borderColor:
                  hoveredCard === card.key
                    ? "rgba(124, 84, 189, 0.15)"
                    : "transparent",
              }}
            ></div>

            {/* Shine Effect - Borda amarela de cima fixa */}
            <div className="absolute inset-0 rounded-3xl pointer-events-none">
              <div
                className="absolute top-0 left-0 w-full h-0.5"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(246, 198, 71, 0.4) 50%, transparent 100%)",
                }}
              ></div>
              <div
                className="absolute bottom-0 right-0 w-full h-0.5"
                style={{
                  background:
                    "linear-gradient(270deg, transparent 0%, rgba(117, 250, 189, 0.4) 50%, transparent 100%)",
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCards.length === 0 && (
        <div className="text-center py-20">
          <div
            className="w-28 h-28 rounded-3xl flex items-center justify-center mx-auto mb-8"
            style={{
              background:
                "linear-gradient(135deg, rgba(124, 84, 189, 0.1) 0%, rgba(117, 250, 189, 0.1) 100%)",
            }}
          >
            <Search style={{ color: "#7C54BD" }} size={36} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Nenhum módulo encontrado
          </h3>
          <p className="text-gray-600 max-w-md mx-auto text-lg">
            Tente ajustar seus filtros ou termo de busca para encontrar o que
            procura.
          </p>
        </div>
      )}
    </div>
  );
}
