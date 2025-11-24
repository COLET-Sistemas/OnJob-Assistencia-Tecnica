import { useState, useEffect } from "react";
import type { LicencaTipo } from "@/types/licenca";

interface UseLicencaReturn {
  licencaTipo: LicencaTipo | null;
  loading: boolean;
  isFeatureRestricted: (feature: string) => boolean;
  canAccessPecasModule: () => boolean;
  canAccessTiposPecasModule: () => boolean;
  canAccessLiberacaoFinanceira: () => boolean;
}

const RESTRICTED_FEATURES = {
  PECAS: "pecas",
  TIPOS_PECAS: "tipos_pecas",
  LIBERACAO_FINANCEIRA: "liberacao_financeira",
} as const;

export function useLicenca(): UseLicencaReturn {
  const [licencaTipo, setLicencaTipo] = useState<LicencaTipo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLicencaFromStorage = () => {
      try {
        const empresaData = localStorage.getItem("empresa");
        if (empresaData) {
          const empresa = JSON.parse(empresaData);
          setLicencaTipo(empresa.licenca_tipo || null);
        } else {
          setLicencaTipo(null);
        }
      } catch (error) {
        console.error("Erro ao carregar tipo de licença:", error);
        setLicencaTipo(null);
      } finally {
        setLoading(false);
      }
    };

    loadLicencaFromStorage();

    // Listener para mudanças no localStorage
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "empresa" || event.key === "licenca_tipo") {
        loadLicencaFromStorage();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const isFeatureRestricted = (feature: string): boolean => {
    if (loading) return true; // Bloqueia durante loading para segurança
    if (!licencaTipo) return false; // Se não há licença, permite acesso

    // Licença Silver (S) tem restrições
    if (licencaTipo === "S") {
      return (
        feature === RESTRICTED_FEATURES.PECAS ||
        feature === RESTRICTED_FEATURES.TIPOS_PECAS ||
        feature === RESTRICTED_FEATURES.LIBERACAO_FINANCEIRA
      );
    }

    // Licenças Gold (G) e Platinum (P) não têm restrições
    return false;
  };

  const canAccessPecasModule = (): boolean => {
    return !isFeatureRestricted(RESTRICTED_FEATURES.PECAS);
  };

  const canAccessTiposPecasModule = (): boolean => {
    return !isFeatureRestricted(RESTRICTED_FEATURES.TIPOS_PECAS);
  };

  const canAccessLiberacaoFinanceira = (): boolean => {
    return !isFeatureRestricted(RESTRICTED_FEATURES.LIBERACAO_FINANCEIRA);
  };

  return {
    licencaTipo,
    loading,
    isFeatureRestricted,
    canAccessPecasModule,
    canAccessTiposPecasModule,
    canAccessLiberacaoFinanceira,
  };
}
