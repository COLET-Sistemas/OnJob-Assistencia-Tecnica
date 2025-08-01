import { Bell, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    // Recupera os dados do localStorage
    const nomeUsuario = typeof window !== 'undefined' ? localStorage.getItem('nome_usuario') || 'Usuário' : 'Usuário';
    const tipoUsuario = typeof window !== 'undefined' ? localStorage.getItem('usuario') || 'Tipo' : 'Tipo';

    return (
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard Administrativo</h1>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <Bell className="text-gray-600 cursor-pointer hover:text-[#1ABC9C] transition-colors" size={20} />
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
                    </div>
                    <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                        <div className="w-8 h-8 bg-[#1ABC9C] rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">{nomeUsuario.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-800">{nomeUsuario}</p>
                            <p className="text-xs text-gray-500">{tipoUsuario}</p>
                        </div>
                        <LogOut className="text-gray-400 cursor-pointer hover:text-red-500 transition-colors" size={18} />
                    </div>
                </div>
            </div>
        </header>
    );
}
