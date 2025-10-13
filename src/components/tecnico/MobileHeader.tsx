"use client";
type MenuOption = {
  label: string;
  onClick: () => void;
};
import React, { useState, useRef, useEffect } from "react";
import { Menu, Plus, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useNotificacoes } from "@/hooks";

interface MobileHeaderProps {
  title: string;
  onMenuClick?: () => void;
  onAddClick?: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  onMenuClick,
  onAddClick,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fecha o menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  // Funções de ação do menu
  const handleInicial = () => {
    setMenuOpen(false);
    router.push("/tecnico/dashboard");
  };

  const handleSobre = () => {
    setMenuOpen(false);
    router.push("/tecnico/sobre");
  };

  const handleSair = () => {
    setMenuOpen(false);
    if (typeof window !== "undefined") {
      localStorage.clear();
      router.push("/");
    }
  };

  const menuOptions: MenuOption[] = [
    { label: "Lista de OS's", onClick: handleInicial },
    { label: "Sobre", onClick: handleSobre },
    { label: "Sair", onClick: handleSair },
  ];

  // Use o hook de notificações
  const { totalNotificacoes } = useNotificacoes();

  return (
    <header className="bg-[#7B54BE] text-white relative">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Esquerda: botão de adicionar (dashboard) ou voltar (outras telas) */}
        {onAddClick ? (
          <button
            onClick={onAddClick}
            className="p-2 hover:bg-[#7B54BE] rounded-lg transition-colors"
            aria-label="Adicionar"
          >
            <Plus className="w-6 h-6" />
          </button>
        ) : (
          <></>
        )}

        <h1 className="text-lg font-medium text-center flex-1 px-4">{title}</h1>

        {/* Botão de Notificações */}
        <div className="relative">
          <button
            className="p-2 hover:bg-[#6A47A8] rounded-lg transition-colors"
            onClick={() => router.push("/tecnico/notificacoes")}
            aria-label="Notificações"
          >
            <Bell className="w-6 h-6" />
            {totalNotificacoes > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-[#7B54BE] font-bold text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                {totalNotificacoes > 99 ? "99+" : totalNotificacoes}
              </span>
            )}
          </button>
        </div>

        {/* Direita: botão de menu */}
        {onMenuClick ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="p-2 hover:bg-[#6A47A8] rounded-lg transition-colors"
              aria-label="Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            {menuOpen && (
              <div
                className="absolute right-2 top-10 min-w-[150px] bg-white text-[#22223b] rounded-xl shadow-xl z-50 border border-[#ece9f6] flex flex-col animate-fade-in"
                style={{
                  boxShadow: "0 8px 24px 0 rgba(60, 60, 90, 0.10)",
                  padding: "0.5rem 0",
                }}
              >
                {menuOptions.map((option, idx) => (
                  <button
                    key={option.label}
                    onClick={option.onClick}
                    className={`w-full text-left px-5 py-3 text-base font-medium transition-colors focus:outline-none focus:bg-[#f3eaff] hover:bg-[#f3eaff] ${
                      idx === menuOptions.length - 1
                        ? ""
                        : "border-b border-[#ece9f6]"
                    }`}
                    style={{
                      borderRadius:
                        idx === 0
                          ? "12px 12px 0 0"
                          : idx === menuOptions.length - 1
                          ? "0 0 12px 12px"
                          : "0",
                      background: "none",
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ width: 40 }} />
        )}
      </div>
    </header>
  );
};

export default React.memo(MobileHeader);
