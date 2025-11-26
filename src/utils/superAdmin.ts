/**
 * Utilitário para verificar se o usuário é super administrador
 */

/**
 * Verifica se o usuário logado é um super administrador
 * @returns {boolean} true se for super admin, false caso contrário
 */
export const isSuperAdmin = (): boolean => {
  if (typeof window === "undefined") return false;

  try {
    const raw = localStorage.getItem("user");
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed?.super_admin);
  } catch (error) {
    console.error("Erro ao ler super admin do usuario:", error);
    return false;
  }
};

/**
 * Obtém o valor do super_admin do localStorage
 * @returns {boolean} valor do super_admin ou false se não existir
 */
export const getSuperAdminStatus = (): boolean => {
  if (typeof window === "undefined") return false;

  try {
    const raw = localStorage.getItem("user");
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed?.super_admin);
  } catch (error) {
    console.error("Erro ao ler super admin do usuario:", error);
    return false;
  }
};

/**
 * Define o status de super admin no localStorage
 * @param {boolean} status - true para super admin, false caso contrário
 */
export const setSuperAdminStatus = (status: boolean): void => {
  if (typeof window === "undefined") return;

  try {
    const raw = localStorage.getItem("user");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    localStorage.setItem(
      "user",
      JSON.stringify({
        ...parsed,
        super_admin: status,
      })
    );
  } catch (error) {
    console.error("Erro ao atualizar status de super admin:", error);
  }
};

/**
 * Remove o status de super admin do localStorage
 */
export const clearSuperAdminStatus = (): void => {
  if (typeof window === "undefined") return;

  try {
    const raw = localStorage.getItem("user");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const { super_admin, ...rest } = parsed || {};
    localStorage.setItem("user", JSON.stringify(rest));
  } catch (error) {
    console.error("Erro ao limpar status de super admin:", error);
  }
};
