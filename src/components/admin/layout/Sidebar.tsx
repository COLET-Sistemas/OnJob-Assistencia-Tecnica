"use client";

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
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { LucideIcon } from "lucide-react";
import Image from "next/image";
import {
  defaultRoles,
  getStoredRoles,
  USER_ROLES_UPDATED_EVENT,
} from "@/utils/userRoles";
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

/* ---------------------------- MENUS PRINCIPAIS ---------------------------- */

const menuItems: MenuItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: Home,
    path: "/admin/dashboard",
  },
  {
    key: "os_aberto",
    label: "Gerenciamento de OSs",
    icon: FileCog,
    path: "/admin/os_aberto",
  },
  {
    key: "consultas",
    label: "Consulta de OSs",
    icon: Search,
    path: "/admin/os_consulta",
  },
  {
    key: "revisao_os",
    label: "Revisão de OSs",
    icon: ClipboardEdit,
    path: "/admin/os_revisao",
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
        label: "Tipos de Peças",
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

/* ---------------------------- CACHE GLOBAL ---------------------------- */

type RolesCacheState = {
  roles: typeof defaultRoles;
  loaded: boolean;
};

const rolesCacheState: RolesCacheState = {
  roles: { ...defaultRoles },
  loaded: false,
};

/* ---------------------------- COMPONENTE ---------------------------- */

export default function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();

  const [roles, setRoles] = useState(defaultRoles);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [apiVersion, setApiVersion] = useState("...");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // 🔸 Sincroniza versão da API
    const version = localStorage.getItem("versao_api") || "não definido";
    setApiVersion(version);

    // 🔸 Atualiza roles do localStorage
    const updateRolesFromStorage = () => {
      const storedRoles = getStoredRoles();
      rolesCacheState.roles = storedRoles;
      rolesCacheState.loaded = true;
      setRoles(storedRoles);
      setRolesLoaded(true);
    };

    updateRolesFromStorage();

    // 🔸 Escuta eventos de atualização e logout
    window.addEventListener(USER_ROLES_UPDATED_EVENT, updateRolesFromStorage);
    window.addEventListener("storage", (event) => {
      if (event.key === "user_roles_state") {
        updateRolesFromStorage();
      }
    });

    return () => {
      window.removeEventListener(
        USER_ROLES_UPDATED_EVENT,
        updateRolesFromStorage
      );
    };
  }, []);

  /* ------------------------- Controle de Menus ------------------------- */

  const findActiveMenuKey = useCallback(
    (path: string, items: MenuItem[]): string | null => {
      for (const item of items) {
        if (item.path && path.startsWith(item.path)) return item.key;
        if (item.submenu) {
          const activeKey = findActiveMenuKey(path, item.submenu);
          if (activeKey) return activeKey;
        }
      }
      return null;
    },
    []
  );

  const currentActiveKey = findActiveMenuKey(pathname, menuItems);
  const [activeMenu, setActiveMenu] = useState<string | null>(currentActiveKey);

  const determineExpandedMenus = useCallback((): Record<string, boolean> => {
    const expanded: Record<string, boolean> = {};
    menuItems.forEach((item) => {
      if (item.submenu) {
        item.submenu.forEach((subItem) => {
          if (subItem.path && pathname.startsWith(subItem.path))
            expanded[item.key] = true;
        });
      }
    });
    return expanded;
  }, [pathname]);

  const [expandedMenus, setExpandedMenus] = useState(determineExpandedMenus());

  useEffect(() => {
    const newActiveKey = findActiveMenuKey(pathname, menuItems);
    setActiveMenu(newActiveKey ?? null);
    setExpandedMenus(determineExpandedMenus());
  }, [pathname, findActiveMenuKey, determineExpandedMenus]);

  /* ------------------------ Controle de Acesso ------------------------ */

  const hasAccessToMenuItem = useCallback(
    (item: MenuItem): boolean => {
      if (!rolesLoaded) return false;

      switch (item.key) {
        case "os_aberto":
        case "revisao_os":
        case "central_cadastro":
        case "clientes":
        case "maquinas":
        case "pecas":
        case "tipos_pecas":
        case "regioes":
        case "usuarios_regioes":
        case "motivos_atendimentos":
        case "motivos_pendencias":
          return roles.gestor;
        case "consultas":
        case "relatorios":
          return roles.gestor || roles.interno;
        default:
          return true;
      }
    },
    [roles, rolesLoaded]
  );

  const visibleMenuItems = useMemo(
    () => menuItems.filter(hasAccessToMenuItem),
    [hasAccessToMenuItem]
  );

  /* ------------------------- Renderização UI ------------------------- */

  const toggleSubmenu = (menuKey: string) =>
    setExpandedMenus((prev) => ({ ...prev, [menuKey]: !prev[menuKey] }));

  const renderMenuItem = (item: MenuItem, level = 0): React.JSX.Element => {
    if (!hasAccessToMenuItem(item)) return <React.Fragment key={item.key} />;

    const Icon = item.icon;
    const submenuItems = item.submenu?.filter(hasAccessToMenuItem) || [];
    const hasSubmenu = submenuItems.length > 0;
    const isExpanded = expandedMenus[item.key];
    const isActive =
      activeMenu === item.key || (item.path && pathname === item.path);

    const hasActiveChild =
      hasSubmenu &&
      submenuItems.some(
        (subItem) =>
          activeMenu === subItem.key ||
          (subItem.path && pathname.startsWith(subItem.path))
      );

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
        onClick={() =>
          hasSubmenu ? toggleSubmenu(item.key) : setActiveMenu(item.key)
        }
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
            className={`text-sm ${isActive ? "font-semibold" : "font-normal"}`}
          >
            {item.label}
          </span>
        </div>
        {hasSubmenu && (
          <div className={`p-1.5 rounded-lg transition-all duration-200`}>
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
          >
            <div className="py-2">
              {submenuItems.map((s) => renderMenuItem(s, level + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ------------------------- Render Final ------------------------- */

  return (
    <>
      <div
        className={`${
          isOpen ? "w-72" : "w-0 md:w-20"
        } transition-all duration-300 bg-gradient-to-b from-[#7B54BE] to-[#6A4399] shadow-2xl h-screen flex flex-col overflow-hidden`}
      >
        {/* Header com logo */}
        <div className="flex items-center justify-center h-20 border-10 border-[#7B54BE] bg-[#F5F3F3]">
          {isOpen ? (
            <div className="relative w-48 h-20">
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
            <div className="relative w-22 h-22">
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

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden modern-scrollbar py-4 pr-1">
          {isOpen && visibleMenuItems.map((item) => renderMenuItem(item))}
        </nav>

        {/* Footer */}
        {isOpen && (
          <div className="border-t border-white/10 p-4 mt-auto bg-[#7B54BE]/50 backdrop-blur-sm">
            <div className="flex flex-col space-y-1 bg-white/5 p-3 rounded-xl border border-white/10">
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
