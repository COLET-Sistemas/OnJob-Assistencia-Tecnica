interface SerializableUserRoles {
  admin: boolean;
  gestor: boolean;
  interno: boolean;
  tecnico_proprio: boolean;
  tecnico_terceirizado: boolean;
}

export type UserRoleKey = keyof SerializableUserRoles;

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
    window.dispatchEvent(
      new CustomEvent(USER_ROLES_UPDATED_EVENT, { detail: roles })
    );
  } catch (error) {
    console.error("Falha ao salvar perfis do usuario:", error);
  }
};

export const getStoredRoles = (): SerializableUserRoles => {
  if (typeof window === "undefined") {
    return { ...defaultRoles };
  }

  try {
    const raw = localStorage.getItem("user");
    const parsed = raw ? JSON.parse(raw) : null;
    return {
      admin: !!parsed?.administrador,
      gestor: !!parsed?.perfil_gestor_assistencia,
      interno: !!parsed?.perfil_interno,
      tecnico_proprio: !!parsed?.perfil_tecnico_proprio,
      tecnico_terceirizado: !!parsed?.perfil_tecnico_terceirizado,
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
    window.dispatchEvent(new Event(USER_ROLES_UPDATED_EVENT));
  } catch (error) {
    console.error("Falha ao limpar perfis do usuario:", error);
  }
};
