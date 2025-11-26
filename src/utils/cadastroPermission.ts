const CADASTRO_PERMISSION_KEY = "user";
export const CADASTRO_PERMISSION_UPDATED_EVENT =
  "cadastro_permission_updated";

/**
 * Persists the cadastro permission flag in localStorage.
 * Dispatches a custom event so interested listeners can react immediately.
 */
export const setCadastroPermission = (value: boolean): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const user = JSON.parse(rawUser);
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...user,
          permite_cadastros: value,
        })
      );
    }
    window.dispatchEvent(new Event(CADASTRO_PERMISSION_UPDATED_EVENT));
  } catch (error) {
    console.error("Falha ao salvar permissao de cadastro:", error);
  }
};

/**
 * Reads the cadastro permission flag from storage.
 * Falls back to the perfil object when the dedicated key is absent.
 */
export const getCadastroPermission = (): boolean => {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const user = JSON.parse(rawUser);
      if (typeof user?.permite_cadastros === "boolean") {
        return user.permite_cadastros;
      }
    }

    const perfilRaw = localStorage.getItem("perfil");
    if (perfilRaw) {
      const perfil = JSON.parse(perfilRaw);
      if (typeof perfil?.permite_cadastros === "boolean") {
        return perfil.permite_cadastros;
      }
    }
  } catch (error) {
    console.error("Falha ao ler permissao de cadastro:", error);
  }

  return true;
};

/**
 * Removes the cadastro permission information from localStorage.
 */
export const clearCadastroPermission = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const user = JSON.parse(rawUser);
      const { permite_cadastros, ...rest } = user || {};
      localStorage.setItem("user", JSON.stringify(rest));
    }
    window.dispatchEvent(new Event(CADASTRO_PERMISSION_UPDATED_EVENT));
  } catch (error) {
    console.error("Falha ao limpar permissao de cadastro:", error);
  }
};

/**
 * Exposes the storage key for consumers that need to listen to storage events.
 */
export const getCadastroPermissionStorageKey = (): string =>
  CADASTRO_PERMISSION_KEY;
