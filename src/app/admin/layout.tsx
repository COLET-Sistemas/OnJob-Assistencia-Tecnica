'use client'

import Navbar from '@/components/admin/layout/Navbar'
import Sidebar from '@/components/admin/layout/Sidebar'
import { TitleProvider } from '@/context/TitleContext'
import { useEffect, useState } from 'react'

interface AdminLayoutProps {
    children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

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
        <TitleProvider>
            <div className="flex h-screen bg-[#F9F7F7]">
                <div className={`fixed inset-0 bg-black/50 z-10 transition-opacity md:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`} onClick={() => setSidebarOpen(false)} />

                <div className={`fixed md:static z-20 h-screen transition-all transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    }`}>
                    <Sidebar isOpen={sidebarOpen} />
                </div>

                <div className="flex-1 flex flex-col min-h-screen w-full transition-all duration-300">
                    <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                    <main className="flex-1 p-4 md:p-6 overflow-auto bg-[#F9F7F7]">{children}</main>
                </div>
            </div>
        </TitleProvider>
    )
}
