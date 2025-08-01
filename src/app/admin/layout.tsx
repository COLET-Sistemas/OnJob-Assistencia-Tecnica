'use client'

import Navbar from '@/components/admin/Navbar'
import Sidebar from '@/components/admin/Sidebar'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface AdminLayoutProps {
    children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const pathname = usePathname();

    // Função para determinar o título com base no pathname
    const getPageTitle = () => {
        if (pathname?.includes('/admin/cadastro/clientes')) return 'Clientes';
        if (pathname?.includes('/admin/cadastro/maquinas')) return 'Máquinas';
        if (pathname?.includes('/admin/cadastro/pecas')) return 'Peças';
        if (pathname?.includes('/admin/cadastro/regioes')) return 'Regiões';
        if (pathname?.includes('/admin/cadastro/usuarios')) return 'Usuários';
        if (pathname?.includes('/admin/dashboard')) return 'Dashboard';
        return 'Dashboard';
    };

    // Detectar tamanho da tela para mobile
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };

        // Configurar no carregamento inicial
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex h-screen bg-[#F9F7F7]">
            <div className={`fixed inset-0 bg-black/50 z-10 transition-opacity md:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`} onClick={() => setSidebarOpen(false)} />

            <div className={`fixed md:static z-20 h-screen transition-all transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                }`}>
                <Sidebar isOpen={sidebarOpen} />
            </div>

            <div className="flex-1 flex flex-col min-h-screen w-full transition-all duration-300">
                <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title={getPageTitle()} />
                <main className="flex-1 p-4 md:p-6 overflow-auto bg-[#F9F7F7]">{children}</main>
            </div>
        </div>
    )
}
