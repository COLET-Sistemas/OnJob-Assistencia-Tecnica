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
        path: '/'
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
                    { key: 'usuarios', label: 'Usuários', icon: Users, path: '/usuarios' },
                    { key: 'regioes', label: 'Regiões', icon: MapPin, path: '/regioes' },
                    { key: 'clientes', label: 'Clientes', icon: UserPlus, path: '/cadastro/clientes' }
                ]
            },
            {
                key: 'maquinarios',
                label: 'Maquinários',
                submenu: [
                    { key: 'maquinas', label: 'Máquinas', icon: Cog },
                    { key: 'pecas', label: 'Peças', icon: Package }
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
    const [activeMenu, setActiveMenu] = useState<string>('dashboard');
    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

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
        const isActive = activeMenu === item.key;

        return (
            <div key={item.key}>
                <div
                    className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-all duration-200 hover:bg-gray-100 ${isActive ? 'bg-[#1ABC9C] text-white hover:bg-[#16a085]' : 'text-gray-700'} ${level > 0 ? 'ml-4 border-l-2 border-gray-200' : ''}`}
                    onClick={() => {
                        if (hasSubmenu) {
                            toggleSubmenu(item.key);
                        } else {
                            setActiveMenu(item.key);
                        }
                    }}
                    style={{ paddingLeft: `${1 + level * 1.5}rem` }}
                >
                    <div className="flex items-center space-x-3">
                        {Icon && <Icon size={20} />}
                        <span className="font-medium">{item.label}</span>
                    </div>
                    {hasSubmenu && (
                        isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                    )}
                </div>

                {hasSubmenu && isExpanded && (
                    <div className="bg-gray-50">
                        {item.submenu?.map(subItem => renderMenuItem(subItem, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`w-72 transition-all duration-300 bg-white shadow-lg overflow-hidden`}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#1ABC9C] rounded-lg flex items-center justify-center">
                        <Wrench className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Colet</h2>
                        <p className="text-sm text-gray-500">Assistência Técnica</p>
                    </div>
                </div>
            </div>
            <nav className="mt-6">
                {menuItems.map(item => renderMenuItem(item))}
            </nav>
        </div>
    );
}
