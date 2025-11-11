/**
 * Utilitário para verificar se o usuário é super administrador
 */

/**
 * Verifica se o usuário logado é um super administrador
 * @returns {boolean} true se for super admin, false caso contrário
 */
export const isSuperAdmin = (): boolean => {
  if (typeof window === "undefined") return false;

  const superAdmin = localStorage.getItem("super_admin");
  return superAdmin === "true";
};

/**
 * Obtém o valor do super_admin do localStorage
 * @returns {boolean} valor do super_admin ou false se não existir
 */
export const getSuperAdminStatus = (): boolean => {
  if (typeof window === "undefined") return false;

  const superAdmin = localStorage.getItem("super_admin");
  return superAdmin === "true";
};

/**
 * Define o status de super admin no localStorage
 * @param {boolean} status - true para super admin, false caso contrário
 */
export const setSuperAdminStatus = (status: boolean): void => {
  if (typeof window === "undefined") return;

  localStorage.setItem("super_admin", String(status));
};

/**
 * Remove o status de super admin do localStorage
 */
export const clearSuperAdminStatus = (): void => {
  if (typeof window === "undefined") return;

  localStorage.removeItem("super_admin");
};
