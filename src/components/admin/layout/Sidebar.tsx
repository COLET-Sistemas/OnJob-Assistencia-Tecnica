import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Cog,
  ClipboardList,
  Home,
  MapPin,
  Settings,
  Search,
  UserPlus,
  Tag,
  Wrench,
  FilePlus,
  ClipboardEdit,
  FileCog,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import { LucideIcon } from "lucide-react";
import Image from "next/image";
import packageInfo from "../../../../package.json";

interface MenuItem {
  key: string;
  label: string;
  icon?: LucideIcon;
  path?: string;
  submenu?: MenuItem[];
  isSection?: boolean;
}

interface SidebarProps {
  isOpen: boolean;
}

const menuItems: MenuItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: Home,
    path: "/admin/dashboard",
  },
  {
    key: "os_aberto",
    label: "Ordens de Serviço",
    icon: FileCog,
    path: "/admin/os_aberto",
  },
  {
    key: "revisao_os",
    label: "Revisão de OSs",
    icon: ClipboardEdit,
    path: "/admin/os_revisao",
  },
  {
    key: "consultas",
    label: "Consulta de OSs",
    icon: Search,
    path: "/admin/os_consulta",
  },
  {
    key: "relatorios",
    label: "Relatórios",
    icon: BarChart3,
    path: "/admin/relatorios",
  },
  {
    key: "central_cadastro",
    label: "Cadastros",
    icon: FilePlus,
    path: "/admin/cadastro",
    submenu: [
      {
        key: "clientes",
        label: "Clientes",
        icon: UserPlus,
        path: "/admin/cadastro/clientes",
      },
      {
        key: "maquinas",
        label: "Máquinas",
        icon: Settings,
        path: "/admin/cadastro/maquinas",
      },
      {
        key: "pecas",
        label: "Peças",
        icon: Wrench,
        path: "/admin/cadastro/pecas",
      },
      {
        key: "tipos_pecas",
        label: "Tipos Peças",
        icon: Tag,
        path: "/admin/cadastro/tipos_pecas",
      },
      {
        key: "regioes",
        label: "Regiões",
        icon: MapPin,
        path: "/admin/cadastro/regioes",
      },
      {
        key: "usuarios_regioes",
        label: "Técnicos x Regiões",
        icon: UsersRound,
        path: "/admin/cadastro/tecnicos_regioes",
      },
      {
        key: "motivos_atendimentos",
        label: "Motivos de Atendimento",
        icon: ClipboardList,
        path: "/admin/cadastro/motivos_atendimentos",
      },
      {
        key: "motivos_pendencias",
        label: "Motivos de Pendência",
        icon: AlertTriangle,
        path: "/admin/cadastro/motivos_pendencias",
      },
    ],
  },
];

export default function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();
  const [apiVersion, setApiVersion] = useState<string>("não definido");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const version = localStorage.getItem("versao_api") || "não definido";
      setApiVersion(version);
    }
  }, []);

  const findActiveMenuKey = React.useCallback(
    (path: string, items: MenuItem[]): string | null => {
      for (const item of items) {
        if (item.path && path.startsWith(item.path)) {
          return item.key;
        }

        if (item.submenu) {
          const activeKey = findActiveMenuKey(path, item.submenu);
          if (activeKey) return activeKey;
        }
      }
      return null;
    },
    []
  );

  const currentActiveKey =
    findActiveMenuKey(pathname, menuItems) || "dashboard";
  const [activeMenu, setActiveMenu] = useState<string>(currentActiveKey);

  const determineExpandedMenus = React.useCallback((): Record<
    string,
    boolean
  > => {
    const expanded: Record<string, boolean> = {};

    menuItems.forEach((item) => {
      if (item.submenu) {
        item.submenu.forEach((subItem) => {
          if (subItem.path && pathname.startsWith(subItem.path)) {
            expanded[item.key] = true;
          }

          if (subItem.submenu) {
            subItem.submenu.forEach((grandChild) => {
              if (grandChild.path && pathname.startsWith(grandChild.path)) {
                expanded[item.key] = true;
                expanded[subItem.key] = true;
              }
            });
          }
        });
      }
    });

    return expanded;
  }, [pathname]);

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(
    determineExpandedMenus()
  );

  React.useEffect(() => {
    const newActiveKey = findActiveMenuKey(pathname, menuItems);
    if (newActiveKey) {
      setActiveMenu(newActiveKey);
    }
    setExpandedMenus(determineExpandedMenus());
  }, [pathname, findActiveMenuKey, determineExpandedMenus]);

  const toggleSubmenu = (menuKey: string): void => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  const renderMenuItem = (
    item: MenuItem,
    level: number = 0
  ): React.JSX.Element => {
    const Icon = item.icon;
    const hasSubmenu = item.submenu;
    const isExpanded = expandedMenus[item.key];
    const isActive =
      activeMenu === item.key || (item.path && pathname === item.path);
    const isSection = item.isSection;

    const hasActiveChild =
      hasSubmenu &&
      item.submenu?.some(
        (subItem) =>
          activeMenu === subItem.key ||
          (subItem.path && pathname.startsWith(subItem.path)) ||
          subItem.submenu?.some(
            (grandChild) =>
              activeMenu === grandChild.key ||
              (grandChild.path && pathname.startsWith(grandChild.path))
          )
      );

    if (isSection) {
      return (
        <div key={item.key} className="px-4 py-3 mt-5 mb-2 mx-2">
          <h3 className="text-xs uppercase font-semibold tracking-wider text-white/90 flex items-center">
            <span className="mr-2 h-px w-5 bg-gradient-to-r from-white/40 to-white/70"></span>
            {item.label}
          </h3>
        </div>
      );
    }

    const menuContent = (
      <div
        className={`flex items-center justify-between px-4 py-3.5 cursor-pointer transition-all duration-200 group ${
          isActive
            ? "bg-gradient-to-r from-white/15 to-white/10 text-white shadow-sm"
            : hasActiveChild
            ? "bg-white/8 text-white/95"
            : "text-white/75 hover:text-white hover:bg-white/10"
        } ${
          level > 0 ? "ml-2 border-l-2 border-white/10" : ""
        } rounded-xl mx-2 my-0.5`}
        style={{ paddingLeft: `${level > 0 ? 0.75 : 1}rem` }}
        onClick={() => {
          if (hasSubmenu) {
            toggleSubmenu(item.key);
          } else {
            setActiveMenu(item.key);
          }
        }}
      >
        <div className="flex items-center space-x-3">
          {Icon && (
            <div
              className={`p-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-[#FDAD15] text-[#7B54BE] shadow-md scale-105"
                  : hasActiveChild
                  ? "bg-[#FDAD15]/90 text-[#7B54BE]"
                  : "bg-white/10 text-[#FDAD15] group-hover:bg-[#FDAD15]/80 group-hover:text-[#7B54BE]"
              }`}
            >
              <Icon size={18} strokeWidth={2.5} />
            </div>
          )}
          <span
            className={`text-sm transition-all duration-200 ${
              isActive
                ? "font-semibold"
                : hasActiveChild
                ? "font-medium"
                : "font-normal"
            }`}
          >
            {item.label}
          </span>
        </div>
        {hasSubmenu && (
          <div
            className={`p-1.5 rounded-lg transition-all duration-200 ${
              isExpanded
                ? "bg-[#FDAD15]/20 rotate-0"
                : "bg-white/5 group-hover:bg-white/10"
            }`}
          >
            {isExpanded ? (
              <ChevronDown
                size={16}
                className="text-[#FDAD15]"
                strokeWidth={2.5}
              />
            ) : (
              <ChevronRight
                size={16}
                className="text-[#FDAD15]"
                strokeWidth={2.5}
              />
            )}
          </div>
        )}
      </div>
    );

    return (
      <div key={item.key} className="relative">
        {(isActive || hasActiveChild) && (
          <div
            className={`absolute left-0 top-1 bottom-1 w-1 ${
              isActive
                ? "bg-gradient-to-b from-[#FDAD15] to-[#FDAD15]/70"
                : "bg-[#FDAD15]/50"
            } rounded-r-full shadow-glow`}
          />
        )}

        {!hasSubmenu && item.path ? (
          <Link href={item.path} className="block w-full">
            {menuContent}
          </Link>
        ) : (
          menuContent
        )}

        {hasSubmenu && isExpanded && (
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              level > 0
                ? "bg-[#6A4399]/80 rounded-b-xl mx-3 border border-white/5 backdrop-blur-sm"
                : "bg-[#6A4399]/40 rounded-xl mx-2 mt-1 border border-white/5 backdrop-blur-sm"
            }`}
            style={{
              maxHeight: isExpanded
                ? `${(item.submenu?.length || 0) * 70}px`
                : "0px",
            }}
          >
            <div className="py-2">
              {item.submenu?.map((subItem) =>
                renderMenuItem(subItem, level + 1)
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style jsx global>{`
        .modern-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(246, 198, 71, 0.5) transparent;
        }

        .modern-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .modern-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 10px;
        }

        .modern-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(
            180deg,
            rgba(246, 198, 71, 0.7) 0%,
            rgba(246, 198, 71, 0.4) 100%
          );
          border-radius: 10px;
        }

        .modern-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(
            180deg,
            rgba(246, 198, 71, 0.9) 0%,
            rgba(246, 198, 71, 0.6) 100%
          );
        }

        .shadow-glow {
          box-shadow: 0 0 8px rgba(246, 198, 71, 0.4);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>

      <div
        className={`${
          isOpen ? "w-72" : "w-0 md:w-20"
        } transition-all duration-300 bg-gradient-to-b from-[#7B54BE] to-[#6A4399] shadow-2xl h-screen flex flex-col overflow-hidden`}
      >
        {/* Header com Logo */}
        <div className="flex items-center justify-center h-20 border-10 border-[#7B54BE] bg-[#F5F3F3] backdrop-blur-sm px-2">
          {isOpen ? (
            <div className="relative w-48 h-20 flex items-center justify-center animate-slide-in">
              <Image
                src="/images/logoEscrito.png"
                alt="OnJob Logo"
                fill
                sizes="192px"
                className="object-contain"
                priority
              />
            </div>
          ) : (
            <div className="relative w-22 h-22 flex items-center justify-center">
              <Image
                src="/images/logo.png"
                alt="OnJob"
                fill
                sizes="62px"
                className="object-contain"
                priority
              />
            </div>
          )}
        </div>

        {/* Menu de Navegação */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden modern-scrollbar py-4 pr-1">
          {isOpen && menuItems.map((item) => renderMenuItem(item))}
          {!isOpen &&
            menuItems.map((item) =>
              item.isSection ? (
                <div key={item.key} className="py-2 flex justify-center">
                  <div className="h-px w-8 bg-white/30"></div>
                </div>
              ) : (
                <div key={item.key} className="relative my-2 group">
                  {item.icon && (
                    <div className="mx-auto w-14 h-14 flex items-center justify-center">
                      <Link
                        href={item.path || "#"}
                        onClick={(e) => !item.path && e.preventDefault()}
                        className="block"
                        title={item.label}
                      >
                        <div
                          className={`p-2.5 rounded-xl transition-all duration-200 ${
                            item.path && pathname.startsWith(item.path)
                              ? "bg-[#FDAD15] text-[#7B54BE] shadow-lg scale-110"
                              : "bg-white/10 text-[#FDAD15] hover:bg-[#FDAD15]/80 hover:text-[#7B54BE] hover:scale-105"
                          }`}
                        >
                          {item.icon && (
                            <item.icon size={20} strokeWidth={2.5} />
                          )}
                        </div>
                      </Link>
                    </div>
                  )}
                  {/* Tooltip aprimorado */}
                  <div className="absolute left-full ml-3 px-3 py-2 bg-[#7B54BE] border border-[#FDAD15]/30 rounded-lg text-white text-xs font-medium invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 shadow-xl backdrop-blur-sm pointer-events-none">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#7B54BE]"></div>
                  </div>

                  {/* Submenu Popup para menu fechado */}
                  {item.submenu && (
                    <div className="absolute left-full ml-3 top-0 bg-[#7B54BE] border border-[#FDAD15]/30 rounded-xl text-white invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 z-50 shadow-2xl backdrop-blur-sm min-w-[200px]">
                      <div className="p-2">
                        <div className="px-3 py-2 border-b border-white/10 mb-1">
                          <p className="text-sm font-semibold text-[#FDAD15]">
                            {item.label}
                          </p>
                        </div>
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.key}
                            href={subItem.path || "#"}
                            className="flex items-center space-x-2 px-3 py-2.5 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            {subItem.icon && (
                              <div className="p-1.5 rounded-md bg-white/10 text-[#FDAD15]">
                                <subItem.icon size={16} strokeWidth={2.5} />
                              </div>
                            )}
                            <span className="text-xs font-medium">
                              {subItem.label}
                            </span>
                          </Link>
                        ))}
                      </div>
                      <div className="absolute right-full top-4 border-4 border-transparent border-r-[#7B54BE]"></div>
                    </div>
                  )}
                </div>
              )
            )}
        </nav>

        {/* Footer com informações de versão */}
        {isOpen && (
          <div className="border-t border-white/10 p-4 mt-auto bg-[#7B54BE]/50 backdrop-blur-sm">
            <div className="flex flex-col space-y-1 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#FDAD15] to-[#FDAD15]/80 rounded-xl flex items-center justify-center shadow-md">
                  <Cog size={20} className="text-[#7B54BE]" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <p className="text-xs font-semibold text-white/90">
                    APP:{" "}
                    <span className="text-[#FDAD15]">
                      {packageInfo.version}
                    </span>
                  </p>
                  <p className="text-xs font-semibold text-white/90">
                    API:{" "}
                    <span className="text-[#FDAD15]">
                      {isMounted ? apiVersion : "..."}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
