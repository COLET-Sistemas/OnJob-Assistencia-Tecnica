import { Bell, LogOut, Menu, Search, X } from 'lucide-react';

interface NavbarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export default function Navbar({ sidebarOpen, setSidebarOpen }: NavbarProps) {
    // Recupera os dados do localStorage
    const nomeUsuario = typeof window !== 'undefined' ? localStorage.getItem('nome_usuario') || 'Usuário' : 'Usuário';
    const tipoUsuario = typeof window !== 'undefined' ? localStorage.getItem('usuario') || 'Tipo' : 'Tipo';

    return (
        <header className="bg-gradient-to-r from-[#7C54BD] to-[#6842A5] shadow-xl border-b border-[#75FABD]/20 px-6 py-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#F4F4F4] transition-colors focus:ring-2 focus:ring-[#75FABD]/50"
                        aria-label={sidebarOpen ? "Fechar menu lateral" : "Abrir menu lateral"}
                    >
                        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                    <h1 className="text-xl font-semibold text-[#F4F4F4] hidden md:block">Dashboard Administrativo</h1>
                </div>

                <div className="hidden md:flex flex-1 mx-8 max-w-md relative">
                    <div className="relative w-full">
                        <input
                            type="text"
                            placeholder="Pesquisar..."
                            className="w-full py-2 px-4 pl-10 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#75FABD]/50 focus:border-[#75FABD] transition-all"
                        />
                        <Search className="absolute left-3 top-2.5 text-white/60" size={18} />
                    </div>
                </div>

                <div className="flex items-center space-x-5">
                    <div className="relative">
                        <Bell className="text-[#F4F4F4] cursor-pointer hover:text-[#75FABD] transition-colors" size={20} />
                        <span className="absolute -top-1 -right-1 bg-[#75FABD] text-[#7C54BD] font-bold text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse">3</span>
                    </div>
                    <div className="flex items-center space-x-3 pl-4 border-l border-white/20">
                        <div className="w-9 h-9 bg-[#75FABD] rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/20">
                            <span className="text-[#7C54BD] font-bold text-sm">{nomeUsuario.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-sm font-medium text-[#F4F4F4]">{nomeUsuario}</p>
                            <p className="text-xs text-[#F4F4F4]/70">{tipoUsuario}</p>
                        </div>
                        <button className="hover:bg-white/10 p-2 rounded-full transition-colors" aria-label="Sair">
                            <LogOut className="text-[#F4F4F4]/90 hover:text-[#75FABD] transition-colors" size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
