import Link from "next/link";
import {
  Bell,
  ChevronDown,
  ArrowRightFromLine,
  LogOut,
  Maximize,
  Menu,
  ScrollText,
  UsersRound,
  Minimize,
  UserCircle,
  MonitorDot,
} from "lucide-react";
import { useEffect, useState, memo } from "react";
import { useEmpresa } from "@/hooks";
import { authService, empresaService } from "@/api/services";

const CompanyName = memo(function CompanyName() {
  const { nomeEmpresa, loading } = useEmpresa();

  if (loading) {
    return (
      <div
        className="animate-pulse bg-gray-200 rounded"
        style={{
          height: "22px",
          width: "120px",
          marginLeft: "8px",
        }}
      />
    );
  }

  return (
    <h4
      className="font-semibold flex items-center"
      style={{
        color: "#374151",
        fontSize: "22px",
        fontWeight: 600,
        marginLeft: "8px",
        letterSpacing: 0,
      }}
    >
      {nomeEmpresa}
    </h4>
  );
});

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

function NavbarComponent({ sidebarOpen, setSidebarOpen }: NavbarProps) {
  const [nomeUsuario, setNomeUsuario] = useState("Usuário");

  useEffect(() => {
    setNomeUsuario(localStorage.getItem("nome_usuario") || "Usuário");
  }, []);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const closeDropdown = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(".user-profile-dropdown")) {
      setDropdownOpen(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.addEventListener("click", closeDropdown);
      return () => {
        document.removeEventListener("click", closeDropdown);
      };
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleFullScreenChange = () => {
        setIsFullScreen(!!document.fullscreenElement);
      };

      document.addEventListener("fullscreenchange", handleFullScreenChange);
      return () => {
        document.removeEventListener(
          "fullscreenchange",
          handleFullScreenChange
        );
      };
    }
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          setIsFullScreen(true);
        })
        .catch((err) => {
          console.error(
            `Error attempting to enable full-screen mode: ${err.message}`
          );
        });
    } else {
      if (document.exitFullscreen) {
        document
          .exitFullscreen()
          .then(() => {
            setIsFullScreen(false);
          })
          .catch((err) => {
            console.error(
              `Error attempting to exit full-screen mode: ${err.message}`
            );
          });
      }
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      localStorage.clear();
      sessionStorage.clear();
      empresaService.clearEmpresaData();

      window.location.href = "/";
    } catch (error) {
      console.error("Erro durante logout:", error);
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    }
  };

  return (
    <header className="bg-transparent backdrop-blur-sm px-6 py-5 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 px-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="focus:outline-none text-[#374151]  transition-colors cursor-pointer "
            style={{
              background: "none",
              border: "none",
              padding: 0,
              margin: 0,
            }}
          >
            {sidebarOpen ? (
              <Menu
                size={24}
                strokeWidth={2.5}
                className="text-[#374151] cursor-pointer"
              />
            ) : (
              <ArrowRightFromLine
                size={24}
                strokeWidth={2.5}
                className="text-[#374151] cursor-pointer"
              />
            )}
          </button>
          <CompanyName />
        </div>

        <div className="flex items-center space-x-5">
          <div className="relative">
            <button className="p-2 rounded-full hover:bg-gray-200 transition-colors cursor-pointer">
              <Bell
                className="text-gray-700 hover:text-[#7C54BD] transition-colors cursor-pointer"
                size={20}
              />
              <span className="absolute -top-1 -right-1 bg-[#7C54BD] text-white font-bold text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                3
              </span>
            </button>
          </div>
          <Link
            href="/dashboard-panel"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-700 hover:text-[#7C54BD] transition-colors p-1.5 hover:bg-gray-200 rounded-full cursor-pointer"
            aria-label="Painel Dashboard"
            title="Painel Dashboard"
          >
            <MonitorDot size={20} className="cursor-pointer" />
          </Link>
          <button
            onClick={toggleFullScreen}
            className="text-gray-700 hover:text-[#7C54BD] transition-colors p-1.5 hover:bg-gray-200 rounded-full cursor-pointer"
            aria-label={isFullScreen ? "Sair da tela cheia" : "Tela cheia"}
            title={isFullScreen ? "Sair da tela cheia" : "Tela cheia"}
          >
            {isFullScreen ? (
              <Minimize size={20} className="cursor-pointer" />
            ) : (
              <Maximize size={20} className="cursor-pointer" />
            )}
          </button>

          {/* Seção do Usuário Melhorada */}
          <div className="flex items-center space-x-3 pl-4 border-l border-gray-300 relative">
            {/* Avatar do Usuário */}
            <div className="w-10 h-10 bg-gradient-to-br from-[#7C54BD] to-[#9333ea] rounded-full flex items-center justify-center shadow-lg ring-1 ring-gray-200/50 transition-all duration-300 hover:shadow-xl">
              <span className="text-white font-semibold text-base select-none flex items-center justify-center w-full h-full">
                {nomeUsuario.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Nome e Dropdown */}
            <div
              className={`hidden sm:flex items-center cursor-pointer user-profile-dropdown group transition-all duration-200 ease-out hover:bg-gray-50/80 rounded-lg px-2 py-2 ${
                dropdownOpen ? "bg-gray-50/80" : ""
              }`}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <p className="text-md font-bold text-gray-800 mr-2 group-hover:text-[#7C54BD] transition-colors duration-200">
                {nomeUsuario}
              </p>
              <ChevronDown
                size={16}
                className={`text-gray-500 transition-all duration-300 ease-out group-hover:text-[#7C54BD] ${
                  dropdownOpen ? "transform rotate-180 text-[#7C54BD]" : ""
                }`}
              />
            </div>

            {/* Dropdown Menu Clean */}
            <div
              className={`absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200/60 overflow-hidden z-20 transition-all duration-250 ease-out origin-top-right ${
                dropdownOpen
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
              }`}
            >
              <div className="py-1">
                <button
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#7C54BD] transition-all duration-150 cursor-pointer group"
                  onClick={() => {
                    setDropdownOpen(false);
                    window.location.href = "/admin/perfil";
                  }}
                >
                  <UserCircle
                    size={18}
                    className="mr-3 text-gray-500 group-hover:text-[#7C54BD] transition-colors duration-150"
                  />
                  <span className="font-medium">Perfil</span>
                </button>

                <button
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#7C54BD] transition-all duration-150 cursor-pointer group"
                  onClick={() => {
                    setDropdownOpen(false);
                    window.location.href = "/admin/administracao/empresa";
                  }}
                >
                  <ScrollText
                    size={18}
                    className="mr-3 text-gray-500 group-hover:text-[#7C54BD] transition-colors duration-150"
                  />
                  <span className="font-medium">Licença de Uso</span>
                </button>

                <button
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#7C54BD] transition-all duration-150 cursor-pointer group"
                  onClick={() => {
                    setDropdownOpen(false);
                    window.location.href = "/admin/administracao/usuarios";
                  }}
                >
                  <UsersRound
                    size={18}
                    className="mr-3 text-gray-500 group-hover:text-[#7C54BD] transition-colors duration-150"
                  />
                  <span className="font-medium">Gestão de Usuários</span>
                </button>

                <div className="border-t border-gray-100 my-1"></div>

                <button
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-150 cursor-pointer group"
                  onClick={() => {
                    setDropdownOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut
                    size={18}
                    className="mr-3 text-gray-500 group-hover:text-red-600 transition-colors duration-150"
                  />
                  <span className="font-medium">Sair</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Export the memoized version of the component to prevent unnecessary re-renders
export default memo(NavbarComponent);
