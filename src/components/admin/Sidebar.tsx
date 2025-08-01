import {
    BarChart3,
    ChevronDown,
    ChevronRight,
    Cog,
    Home,
    MapPin,
    Package,
    Plus,
    Search,
    UserPlus,
    Users,
    Wrench
} from 'lucide-react';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { LucideIcon } from 'lucide-react';
interface MenuItem {
    key: string;
    label: string;
    icon?: LucideIcon;
    path?: string;
    submenu?: MenuItem[];
}

const menuItems: MenuItem[] = [
    {
        key: 'dashboard',
        label: 'Dashboard',
        icon: Home,
        path: '/admin/dashboard'
    },
    {
        key: 'cadastros',
        label: 'Cadastros',
        icon: Plus,
        submenu: [
            {
                key: 'admin',
                label: 'Administrativo',
                submenu: [
                    { key: 'usuarios', label: 'Usuários', icon: Users, path: '/admin/cadastro/usuarios' },
                    { key: 'regioes', label: 'Regiões', icon: MapPin, path: '/admin/cadastro/regioes' },
                    { key: 'clientes', label: 'Clientes', icon: UserPlus, path: '/admin/cadastro/clientes' }
                ]
            },
            {
                key: 'maquinarios',
                label: 'Maquinários',
                submenu: [
                    { key: 'maquinas', label: 'Máquinas', icon: Cog, path: '/admin/cadastro/maquinas' },
                    { key: 'pecas', label: 'Peças', icon: Package, path: '/admin/cadastro/pecas' }
                ]
            }
        ]
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
    }
];

export default function Sidebar() {
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
        const expanded: Record<string, boolean> = {
            cadastros: true // Expandir cadastros por padrão
        };
        
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

        // Verifica se algum item do submenu está ativo
        const hasActiveChild = hasSubmenu && item.submenu?.some(
            subItem => activeMenu === subItem.key || 
            (subItem.path && pathname.startsWith(subItem.path)) ||
            (subItem.submenu?.some(grandChild => 
                activeMenu === grandChild.key || 
                (grandChild.path && pathname.startsWith(grandChild.path))
            ))
        );

        return (
            <div key={item.key} className="relative">
                {/* Indicador de item ativo */}
                {(isActive || hasActiveChild) && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#75FABD] rounded-r-full" />
                )}

                {/* Wrapper condicional com Link se tiver path e não tiver submenu */}
                {!hasSubmenu && item.path ? (
                    <Link href={item.path} className="block w-full">
                        <div
                            className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-all duration-200 ${isActive
                                ? 'bg-[#7C54BD]/10 text-[#7C54BD] font-medium'
                                : hasActiveChild
                                    ? 'bg-[#7C54BD]/5 text-[#7C54BD]/90'
                                    : 'text-gray-700 hover:bg-[#7C54BD]/5'
                            } ${level > 0 ? 'ml-3 border-l border-[#7C54BD]/10' : ''} rounded-lg mx-2 my-0.5`}
                            style={{ paddingLeft: `${1.25 + level * 1}rem` }}
                            onClick={() => setActiveMenu(item.key)}
                        >
                            <div className="flex items-center space-x-3">
                                {Icon && (
                                    <div className={`p-1.5 rounded-md ${isActive ? 'bg-[#7C54BD] text-white' : hasActiveChild ? 'bg-[#7C54BD]/10 text-[#7C54BD]' : 'text-gray-500'}`}>
                                        <Icon size={16} />
                                    </div>
                                )}
                                <span className={`text-sm ${isActive ? 'font-semibold' : hasActiveChild ? 'font-medium' : 'font-normal'}`}>{item.label}</span>
                            </div>
                        </div>
                    </Link>
                ) : (
                    <div
                        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-all duration-200 ${isActive
                                ? 'bg-[#7C54BD]/10 text-[#7C54BD] font-medium'
                                : hasActiveChild
                                    ? 'bg-[#7C54BD]/5 text-[#7C54BD]/90'
                                    : 'text-gray-700 hover:bg-[#7C54BD]/5'
                            } ${level > 0 ? 'ml-3 border-l border-[#7C54BD]/10' : ''} rounded-lg mx-2 my-0.5`}
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
                                <div className={`p-1.5 rounded-md ${isActive ? 'bg-[#7C54BD] text-white' : hasActiveChild ? 'bg-[#7C54BD]/10 text-[#7C54BD]' : 'text-gray-500'}`}>
                                    <Icon size={16} />
                                </div>
                            )}
                            <span className={`text-sm ${isActive ? 'font-semibold' : hasActiveChild ? 'font-medium' : 'font-normal'}`}>{item.label}</span>
                        </div>
                        {hasSubmenu && (
                            <div className="p-1 rounded-md hover:bg-[#7C54BD]/10 transition-colors">
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </div>
                        )}
                    </div>
                )}

                {hasSubmenu && isExpanded && (
                    <div className={`overflow-hidden transition-all duration-300 ${level > 0 ? 'bg-gradient-to-r from-[#F4F4F4]/80 to-white/20' : ''}`}>
                        {item.submenu?.map(subItem => renderMenuItem(subItem, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`w-72 transition-all duration-300 bg-white/95 shadow-xl border-r border-[#7C54BD]/10 h-screen flex flex-col`}>
            <div className="flex items-center justify-between p-5 border-b border-[#7C54BD]/10 bg-gradient-to-r from-[#7C54BD] to-[#6842A5]">
                <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 bg-[#75FABD] rounded-xl flex items-center justify-center shadow-lg ring-4 ring-white/20">
                        <Wrench className="text-[#7C54BD]" size={22} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Colet</h2>
                        <p className="text-sm text-white/80">Assistência Técnica</p>
                    </div>
                </div>
            </div>

            <div className="px-4 py-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Buscar menu..."
                        className="w-full py-2 px-4 pl-9 bg-gray-100 rounded-lg text-gray-700 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C54BD]/30 transition-all"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#7C54BD]/20 scrollbar-track-transparent py-2">
                {menuItems.map(item => renderMenuItem(item))}
            </nav>

            <div className="border-t border-gray-200 p-4 mt-auto">
                <div className="flex items-center space-x-3 bg-gradient-to-r from-[#7C54BD]/5 to-[#75FABD]/5 p-3 rounded-lg">
                    <div className="w-10 h-10 bg-[#75FABD]/20 rounded-full flex items-center justify-center">
                        <Cog size={18} className="text-[#7C54BD]" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700">Configurações</p>
                        <p className="text-xs text-gray-500">Versão 1.0</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
