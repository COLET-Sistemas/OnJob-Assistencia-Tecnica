import { useState } from "react";
import { KeyRound, X, Copy, Check } from "lucide-react";
import { usuariosService } from "@/api/services/usuariosService";
import { useToast } from "./ToastContainer";
import { Usuario } from "@/types/admin/cadastro/usuarios";

type ResetPasswordButtonProps = {
  id: number;
  userName: string;
  userLogin: string;
  className?: string;
  onResetSuccess?: () => void;
  onUpdateUser?: (updates: Partial<Usuario>) => void;
};

export const ResetPasswordButton = ({
  id,
  userName,
  userLogin,
  className = "",
  onResetSuccess,
  onUpdateUser,
}: ResetPasswordButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [provisionalPassword, setProvisionalPassword] = useState<string | null>(
    null
  );
  const [copied, setCopied] = useState(false);
  const { showError } = useToast();

  const handleClick = () => {
    setShowModal(true);
    setResetSuccess(false);
    setProvisionalPassword(null);
    setCopied(false);
  };

  const handleCopyPassword = () => {
    if (provisionalPassword) {
      navigator.clipboard
        .writeText(provisionalPassword)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((error) => console.error("Failed to copy: ", error));
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    try {
      const fixedPassword = "E9D9D9D9D9D9D9D9D9";
      const result = await usuariosService.resetPassword(id, {
        senha_atual: fixedPassword,
        nova_senha: fixedPassword,
      });

      if (result && typeof result === "object") {
        const isSuccess =
          result.sucesso === true || result.senha_provisoria !== undefined;
        if (isSuccess) {
          setResetSuccess(true);
          if (result.senha_provisoria) {
            setProvisionalPassword(result.senha_provisoria);
          }
          if (onUpdateUser) {
            onUpdateUser({ senha_provisoria: true });
          } else if (onResetSuccess) {
            onResetSuccess();
          }
        } else {
          showError("Erro ao resetar senha", {
            message: result.mensagem || "Não foi possível resetar a senha.",
          });
        }
      } else {
        console.error("Resposta inesperada da API:", result);
        showError("Erro ao resetar senha", {
          message: "Resposta inesperada do servidor.",
        });
      }
    } catch (error) {
      console.error("Erro ao resetar senha:", error);
      showError("Erro ao resetar senha", error as Record<string, unknown>);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => setShowModal(false);

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        title="Resetar Senha"
        className={`
          inline-flex items-center justify-center p-2
          bg-amber-100 hover:bg-amber-200 text-amber-800
          rounded-lg transition-colors cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `.trim()}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-amber-400 border-t-amber-800 rounded-full animate-spin" />
        ) : (
          <KeyRound size={18} />
        )}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCancel}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {!resetSuccess
                  ? "Confirmar Reset de Senha"
                  : "Senha Provisória Gerada"}
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <KeyRound size={20} className="text-amber-600" />
                </div>
                <div className="flex-1 break-words">
                  {!resetSuccess ? (
                    <>
                      <p className="text-sm text-gray-600 mb-2 whitespace-normal break-words">
                        Tem certeza que deseja resetar a senha deste usuário?
                      </p>
                      <p className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md break-words">
                        {userName} ({userLogin})
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 mb-2 whitespace-normal break-words">
                        Senha provisória criada com sucesso para:
                      </p>
                      <p className="text-sm font-medium text-gray-900 mb-3 bg-gray-50 px-3 py-2 rounded-md break-words">
                        {userName} ({userLogin})
                      </p>
                      {provisionalPassword && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-1">
                            Senha provisória:
                          </p>
                          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-center justify-between">
                            <p className="text-lg font-mono font-bold text-amber-800 break-all flex-1 mr-2">
                              {provisionalPassword}
                            </p>
                            <button
                              onClick={handleCopyPassword}
                              className="p-2 rounded-md bg-amber-200 hover:bg-amber-300 text-amber-800 transition-colors"
                              title="Copiar senha"
                            >
                              {copied ? (
                                <Check size={18} className="text-green-600" />
                              ) : (
                                <Copy size={18} />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2 break-words">
                            Informe esta senha ao usuário. Ele deverá alterá-la
                            no primeiro acesso.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              {!resetSuccess ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading && (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {loading ? "Resetando..." : "Confirmar Reset"}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Fechar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
