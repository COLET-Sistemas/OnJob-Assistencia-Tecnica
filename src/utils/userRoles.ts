interface SerializableUserRoles {
  admin: boolean;
  gestor: boolean;
  interno: boolean;
  tecnico_proprio: boolean;
  tecnico_terceirizado: boolean;
}

export type UserRoleKey = keyof SerializableUserRoles;

const ROLES_STORAGE_KEY = "user_roles_state";

export const defaultRoles: SerializableUserRoles = {
  admin: false,
  gestor: false,
  interno: false,
  tecnico_proprio: false,
  tecnico_terceirizado: false,
};

export const USER_ROLES_UPDATED_EVENT = "user_roles_updated";

export const setStoredRoles = (roles: SerializableUserRoles): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
    window.dispatchEvent(new Event(USER_ROLES_UPDATED_EVENT));
  } catch (error) {
    console.error("Falha ao salvar perfis do usuario:", error);
  }
};

export const getStoredRoles = (): SerializableUserRoles => {
  if (typeof window === "undefined") {
    return { ...defaultRoles };
  }

  try {
    const raw = localStorage.getItem(ROLES_STORAGE_KEY);
    if (!raw) {
      return { ...defaultRoles };
    }

    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return { ...defaultRoles };
    }

    return {
      admin: !!parsed.admin,
      gestor: !!parsed.gestor,
      interno: !!parsed.interno,
      tecnico_proprio: !!parsed.tecnico_proprio,
      tecnico_terceirizado: !!parsed.tecnico_terceirizado,
    };
  } catch (error) {
    console.error("Falha ao ler perfis do usuario:", error);
    return { ...defaultRoles };
  }
};

export const clearStoredRoles = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(ROLES_STORAGE_KEY);
    window.dispatchEvent(new Event(USER_ROLES_UPDATED_EVENT));
  } catch (error) {
    console.error("Falha ao limpar perfis do usuario:", error);
  }
};
