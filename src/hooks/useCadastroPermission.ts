import { useEffect, useState } from "react";
import {
  CADASTRO_PERMISSION_UPDATED_EVENT,
  getCadastroPermission,
  getCadastroPermissionStorageKey,
} from "@/utils/cadastroPermission";

interface UseCadastroPermissionResult {
  hasPermission: boolean;
  isLoading: boolean;
}

export const useCadastroPermission = (): UseCadastroPermissionResult => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const evaluatePermission = () => {
      const permission = getCadastroPermission();
      setHasPermission(permission);
      setIsLoading(false);
    };

    evaluatePermission();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === null) {
        evaluatePermission();
        return;
      }

      const targetKey = getCadastroPermissionStorageKey();
      if (event.key === targetKey || event.key === "perfil") {
        evaluatePermission();
      }
    };

    const handleCustomEvent = () => {
      evaluatePermission();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(
      CADASTRO_PERMISSION_UPDATED_EVENT,
      handleCustomEvent
    );

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        CADASTRO_PERMISSION_UPDATED_EVENT,
        handleCustomEvent
      );
    };
  }, []);

  return { hasPermission, isLoading };
};
