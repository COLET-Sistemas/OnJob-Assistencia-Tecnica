import { useTitle } from "@/context/TitleContext";
import {
  Bell,
  ChevronDown,
  ArrowRightFromLine,
  LogOut,
  Maximize,
  Menu,
  Minimize,
  UserCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  title?: string;
}

export default function Navbar({
  sidebarOpen,
  setSidebarOpen,
  title,
}: NavbarProps) {
  const titleContext = useTitle();
  const displayTitle = titleContext.title || title || "Dashboard";
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

  const handleLogout = () => {
    localStorage.removeItem("email");
    localStorage.removeItem("nome_usuario");
    localStorage.removeItem("perfil");
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("endereco_empresa");
    localStorage.removeItem("nome_bd");

    window.location.href = "/";
  };

  return (
    <header className="bg-[#F9F7F7] shadow-xl px-6 py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 px-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="focus:outline-none text-[#374151] cursor-pointer "
            aria-label={
              sidebarOpen ? "Fechar menu lateral" : "Abrir menu lateral"
            }
            title={sidebarOpen ? "Fechar menu lateral" : "Abrir menu lateral"}
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
            {displayTitle}
          </h4>
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
          <button
            onClick={toggleFullScreen}
            className="text-gray-700 hover:text-[#7C54BD] transition-colors p-1.5 hover:bg-gray-100 rounded-full cursor-pointer"
            aria-label={isFullScreen ? "Sair da tela cheia" : "Tela cheia"}
            title={isFullScreen ? "Sair da tela cheia" : "Tela cheia"}
          >
            {isFullScreen ? (
              <Minimize size={20} className="cursor-pointer" />
            ) : (
              <Maximize size={20} className="cursor-pointer" />
            )}
          </button>
          <div className="flex items-center space-x-3 pl-4 border-l border-gray-300 relative">
            <div className="w-9 h-9 bg-[#7C54BD] rounded-full flex items-center justify-center shadow-lg ring-2 ring-gray-200">
              <span className="text-white font-bold text-sm">
                {nomeUsuario.charAt(0).toUpperCase()}
              </span>
            </div>
            <div
              className="hidden sm:flex items-center cursor-pointer user-profile-dropdown"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <p className="text-sm font-medium text-gray-800 mr-1">
                {nomeUsuario}
              </p>
              <ChevronDown
                size={14}
                className={`text-gray-600 transition-transform ${
                  dropdownOpen ? "transform rotate-180" : ""
                }`}
              />
            </div>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                <button
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setDropdownOpen(false);
                    console.log("Ir para perfil");
                  }}
                >
                  <UserCircle size={16} className="mr-2 cursor-pointer" />
                  Perfil
                </button>
                <button
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setDropdownOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut size={16} className="mr-2 cursor-pointer" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
