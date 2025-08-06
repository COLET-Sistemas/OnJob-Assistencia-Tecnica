import {
    BarChart3,
    ChevronDown,
    ChevronRight,
    Cog,
    Home,
    MapPin,
    Package,
    Search,
    UserPlus,
    Users,
    Wrench
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';

import { LucideIcon } from 'lucide-react';
// Importar a versão do package.json
import packageInfo from '../../../package.json';
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
        key: 'dashboard',
        label: 'Dashboard',
        icon: Home,
        path: '/admin/dashboard'
    },
    {
        key: 'consultas',
        label: 'Consultas',
        icon: Search,
        path: '/consultas'
    },
    {
        key: 'os',
        label: 'OSs Assistência Técnica',
        icon: Wrench,
        path: '/os'
    },
    {
        key: 'relatorios',
        label: 'Relatórios',
        icon: BarChart3,
        path: '/relatorios'
    },
    {
        key: 'cadastros',
        label: 'Cadastros',
        isSection: true
    },
    {
        key: 'admin',
        label: 'Administrativo',
        icon: Users,
        submenu: [
            { key: 'clientes', label: 'Clientes', icon: UserPlus, path: '/admin/cadastro/clientes' },
            { key: 'regioes', label: 'Regiões', icon: MapPin, path: '/admin/cadastro/regioes' },
            { key: 'usuarios', label: 'Usuários', icon: Users, path: '/admin/cadastro/usuarios' },

        ]
    },
    {
        key: 'maquinarios',
        label: 'Maquinários',
        icon: Cog,
        submenu: [
            { key: 'maquinas', label: 'Máquinas', icon: Cog, path: '/admin/cadastro/maquinas' },
            { key: 'pecas', label: 'Peças', icon: Package, path: '/admin/cadastro/pecas' }
        ]
    },
    {
        key: 'motivos',
        label: 'Motivos',
        icon: Package,
        submenu: [
            { key: 'motivos_atendimentos', label: 'Motivos Atendimentos', icon: Package, path: '/admin/cadastro/motivos_atendimentos' },
            { key: 'motivos_pendencias', label: 'Motivos Pendências', icon: Package, path: '/admin/cadastro/motivos_pendencias' }
        ]
    },
];

export default function Sidebar({ isOpen }: SidebarProps) {
    const pathname = usePathname();

    // Função para encontrar a chave do item de menu ativo com base no pathname
    const findActiveMenuKey = React.useCallback((path: string, items: MenuItem[]): string | null => {
        for (const item of items) {
            // Verificar se o item atual corresponde ao path
            if (item.path && path.startsWith(item.path)) {
                return item.key;
            }

            // Verificar recursivamente nos submenus
            if (item.submenu) {
                const activeKey = findActiveMenuKey(path, item.submenu);
                if (activeKey) return activeKey;
            }
        }
        return null;
    }, []);

    // Determinar qual menu deve estar ativo com base no pathname
    const currentActiveKey = findActiveMenuKey(pathname, menuItems) || 'dashboard';
    const [activeMenu, setActiveMenu] = useState<string>(currentActiveKey);

    // Determinar quais submenus devem estar expandidos com base no pathname
    const determineExpandedMenus = React.useCallback((): Record<string, boolean> => {
        const expanded: Record<string, boolean> = {};

        // Expandir o menu pai se um item filho estiver ativo
        menuItems.forEach(item => {
            if (item.submenu) {
                item.submenu.forEach(subItem => {
                    if (subItem.path && pathname.startsWith(subItem.path)) {
                        expanded[item.key] = true;
                    }

                    if (subItem.submenu) {
                        subItem.submenu.forEach(grandChild => {
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

    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(determineExpandedMenus());

    // Atualizar o activeMenu e expandedMenus quando o pathname mudar
    React.useEffect(() => {
        const newActiveKey = findActiveMenuKey(pathname, menuItems);
        if (newActiveKey) {
            setActiveMenu(newActiveKey);
        }
        setExpandedMenus(determineExpandedMenus());
    }, [pathname, findActiveMenuKey, determineExpandedMenus]);

    const toggleSubmenu = (menuKey: string): void => {
        setExpandedMenus(prev => ({
            ...prev,
            [menuKey]: !prev[menuKey]
        }));
    };

    const renderMenuItem = (item: MenuItem, level: number = 0): React.JSX.Element => {
        const Icon = item.icon;
        const hasSubmenu = item.submenu;
        const isExpanded = expandedMenus[item.key];
        const isActive = activeMenu === item.key || (item.path && pathname === item.path);
        const isSection = item.isSection;

        // Verifica se algum item do submenu está ativo
        const hasActiveChild = hasSubmenu && item.submenu?.some(
            subItem => activeMenu === subItem.key ||
                (subItem.path && pathname.startsWith(subItem.path)) ||
                (subItem.submenu?.some(grandChild =>
                    activeMenu === grandChild.key ||
                    (grandChild.path && pathname.startsWith(grandChild.path))
                ))
        );

        // Se for uma seção de menu, renderize com um estilo de título
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

        return (
            <div key={item.key} className="relative">
                {/* Indicador de item ativo */}
                {(isActive || hasActiveChild) && (
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isActive ? 'bg-[#F6C647]' : hasActiveChild ? 'bg-[#F6C647]' : ''} rounded-r-full`} />
                )}

                {/* Wrapper condicional com Link se tiver path e não tiver submenu */}
                {!hasSubmenu && item.path ? (
                    <Link href={item.path} className="block w-full">
                        <div
                            className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-all duration-200 ${isActive
                                ? 'bg-white/15 text-white font-medium'
                                : hasActiveChild
                                    ? 'bg-white/10 text-white/90'
                                    : 'text-white/80 hover:text-white hover:bg-white/10'
                                } ${level > 0 ? 'ml-2 border-l border-white/10' : ''} rounded-lg mx-2 my-0.5`}
                            style={{ paddingLeft: `${1.25 + level * 1}rem` }}
                            onClick={() => setActiveMenu(item.key)}
                        >
                            <div className="flex items-center space-x-3">
                                {Icon && (
                                    <div className={`p-1.5 rounded-md ${isActive ? 'bg-white/20 text-[#F6C647]' : hasActiveChild ? 'bg-white/15 text-[#F6C647]' : 'text-[#F6C647]'}`}>
                                        <Icon size={18} />
                                    </div>
                                )}
                                <span className={`text-sm ${isActive ? 'font-semibold' : hasActiveChild ? 'font-medium' : 'font-normal'}`}>{item.label}</span>
                            </div>
                        </div>
                    </Link>
                ) : (
                    <div
                        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-all duration-200 ${isActive
                            ? 'bg-white/15 text-white font-medium'
                            : hasActiveChild
                                ? 'bg-white/10 text-white/90'
                                : 'text-white/80 hover:text-white hover:bg-white/10'
                            } ${level > 0 ? 'ml-2 border-l border-white/10' : ''} rounded-lg mx-2 my-0.5`}
                        onClick={() => {
                            if (hasSubmenu) {
                                toggleSubmenu(item.key);
                            } else {
                                setActiveMenu(item.key);
                            }
                        }}
                        style={{ paddingLeft: `${1.25 + level * 1}rem` }}
                    >
                        <div className="flex items-center space-x-3">
                            {Icon && (
                                <div className={`p-1.5 rounded-md ${isActive ? 'bg-white/20 text-[#F6C647]' : hasActiveChild ? 'bg-white/15 text-[#F6C647]' : 'text-[#F6C647]'}`}>
                                    <Icon size={18} />
                                </div>
                            )}
                            <span className={`text-sm ${isActive ? 'font-semibold' : hasActiveChild ? 'font-medium' : 'font-normal'}`}>{item.label}</span>
                        </div>
                        {hasSubmenu && (
                            <div className="p-1 rounded-md hover:bg-white/10 transition-colors">
                                {isExpanded ? <ChevronDown size={14} className="text-[#F6C647]" /> : <ChevronRight size={14} className="text-[#F6C647]" />}
                            </div>
                        )}
                    </div>
                )}

                {hasSubmenu && isExpanded && (
                    <div className={`overflow-hidden transition-all duration-300 ${level > 0 ? 'bg-[#7C54BD] rounded-b-lg mx-2 border border-white/10' : ''}`}>
                        {item.submenu?.map(subItem => renderMenuItem(subItem, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`${isOpen ? 'w-72' : 'w-0 md:w-20'} transition-all duration-300 bg-[#7C54BD] shadow-xl h-screen flex flex-col overflow-hidden`}>
            <div className="flex items-center justify-between h-20 border-b border-white/10 bg-[#7C54BD]">
                <div className="flex items-center space-x-3 px-6 h-full">
                    <div className="w-10 h-10 bg-[#F6C647] rounded-lg flex items-center justify-center shadow-lg ring-2 ring-white/20 flex-shrink-0">
                        <Wrench className="text-[#7C54BD]" size={22} />
                    </div>
                    <div className={`${!isOpen && 'hidden md:hidden'} transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                        <h2 className="text-xl font-bold text-[#F6C647]">OnJob</h2>
                        <p className="text-sm text-[#F6C647]">Assistência Técnica</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent py-4">
                {isOpen && menuItems.map(item => renderMenuItem(item))}
                {!isOpen && menuItems.map(item => (
                    item.isSection ? (
                        <div key={item.key} className="py-2 flex justify-center">
                            <div className="h-px w-6 bg-white/30"></div>
                        </div>
                    ) : (
                        <div key={item.key} className="relative my-3 group">
                            {item.icon && (
                                <Link href={item.path || '#'} onClick={(e) => !item.path && e.preventDefault()} className="mx-auto w-12 h-12 flex items-center justify-center">
                                    <div className={`p-2 rounded-lg hover:bg-white/15 transition-colors ${item.path && pathname.startsWith(item.path) ? 'bg-white/20 text-[#F6C647]' : 'text-[#F6C647]'}`}>
                                        {item.icon && <item.icon size={18} />}
                                    </div>
                                </Link>
                            )}
                            {/* Tooltip */}
                            <div className="absolute left-full ml-2 rounded-md bg-[#7C54BD] border border-white/10 text-white px-2 py-1 text-xs font-medium invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">
                                {item.label}
                            </div>
                        </div>
                    )
                ))}
            </nav>

            <div className="border-t border-white/10 p-5 mt-auto">
                {isOpen ? (
                    <div className="flex items-center space-x-3 bg-[#7C54BD] p-3 rounded-lg border border-white/20">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Cog size={18} className="text-[#F6C647]" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white/80">...</p>
                            <p className="text-xs font-medium text-white">Versão {packageInfo.version}</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Cog size={18} className="text-[#F6C647]" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
