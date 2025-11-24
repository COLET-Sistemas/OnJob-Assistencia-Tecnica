"use client";

import React, { useState, useRef, useEffect } from "react";
import { Menu, Plus, Bell, ArrowLeft, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLicenca } from "@/hooks";

type MenuOption = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  locked?: boolean;
};

interface NotificationButtonProps {
  onClick: () => void;
  totalNotificacoes?: number;
}

const NotificationButton: React.FC<NotificationButtonProps> = ({
  onClick,
  totalNotificacoes = 0,
}) => {
  // Garante que o valor seja um numero valido
  const count = typeof totalNotificacoes === "number" ? totalNotificacoes : 0;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 40 }}
    >
      <button
        className="relative p-2 hover:bg-[#6A47A8] rounded-lg transition-colors"
        onClick={onClick}
        aria-label="Notificacoes"
      >
        <Bell className="w-6 h-6" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-white text-[#7B54BE] font-bold text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>
    </div>
  );
};

interface MobileHeaderProps {
  title: string;
  onAddClick?: () => void;
  leftVariant?: "plus" | "back";
  showNotifications?: boolean;
  notificationsPlacement?: "left" | "right";
  totalNotificacoes?: number;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  onAddClick,
  leftVariant = "plus",
  showNotifications = false,
  notificationsPlacement = "right",
  totalNotificacoes = 0,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { licencaTipo, loading: licencaLoading } = useLicenca();
  // Historico liberado apenas para licenca S
  const historicoBloqueado = licencaTipo === "P" || licencaTipo === "G";
  const historicoDesabilitado = licencaLoading || historicoBloqueado;

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

  const handleInicial = () => {
    setMenuOpen(false);
    router.push("/tecnico/dashboard");
  };

  const handleNovaOS = () => {
    setMenuOpen(false);
    router.push("/tecnico/os/novo");
  };

  const handleHistorico = () => {
    if (historicoDesabilitado) return;
    setMenuOpen(false);
    router.push("/tecnico/historico");
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
    { label: "Nova OS", onClick: handleNovaOS },
    { label: "Lista de OS's", onClick: handleInicial },
    {
      label: "Histórico",
      onClick: handleHistorico,
      disabled: historicoDesabilitado,
      locked: historicoBloqueado,
    },
    { label: "Sobre", onClick: handleSobre },
    { label: "Sair", onClick: handleSair },
  ];

  const renderNotificationButton = () => (
    <NotificationButton
      onClick={() => router.push("/tecnico/notificacoes")}
      totalNotificacoes={totalNotificacoes}
    />
  );

  const leftSlot =
    showNotifications && notificationsPlacement === "left" ? (
      renderNotificationButton()
    ) : onAddClick ? (
      <button
        onClick={onAddClick}
        className="p-2 hover:bg-[#6A47A8] rounded-lg transition-colors"
        aria-label={leftVariant === "back" ? "Voltar" : "Adicionar"}
      >
        {leftVariant === "back" ? (
          <ArrowLeft className="w-6 h-6" />
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </button>
    ) : (
      <div style={{ width: 40 }} />
    );

  return (
    <header className="bg-[#7B54BE] text-white relative">
      <div className="flex items-center justify-between px-4 py-3">
        {leftSlot}

        <h1 className="text-lg font-medium text-center flex-1 px-4">{title}</h1>

        <div className="flex items-center gap-2">
          {showNotifications && notificationsPlacement === "right"
            ? renderNotificationButton()
            : null}
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
                      option.disabled
                        ? "cursor-not-allowed text-gray-400 bg-gray-50 hover:bg-gray-50 focus:bg-gray-50"
                        : ""
                    } ${
                      idx === menuOptions.length - 1
                        ? ""
                        : "border-b border-[#ece9f6]"
                    }`}
                    disabled={option.disabled}
                    aria-disabled={option.disabled}
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
                    <span className="flex items-center gap-2">
                      {option.label}
                      {option.locked ? (
                        <Lock className="w-4 h-4 text-amber-500" />
                      ) : null}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default React.memo(MobileHeader);
