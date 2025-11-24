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
        // prioridade: chave licenca_tipo salva diretamente
        const licencaDireta = localStorage.getItem("licenca_tipo");
        if (licencaDireta) {
          setLicencaTipo(licencaDireta as LicencaTipo);
          return;
        }

        // fallback: objeto empresa com licenca_tipo
        const empresaData = localStorage.getItem("empresa");
        if (empresaData) {
          const empresa = JSON.parse(empresaData);
          setLicencaTipo(empresa.licenca_tipo || null);
        } else {
          setLicencaTipo(null);
        }
      } catch (error) {
        console.error("Erro ao carregar tipo de licenca:", error);
        setLicencaTipo(null);
      } finally {
        setLoading(false);
      }
    };

    loadLicencaFromStorage();

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
    if (loading) return true; // bloqueia durante loading para seguranca
    if (!licencaTipo) return false; // sem licenca, libera acesso

    if (licencaTipo === "S") {
      return (
        feature === RESTRICTED_FEATURES.PECAS ||
        feature === RESTRICTED_FEATURES.TIPOS_PECAS ||
        feature === RESTRICTED_FEATURES.LIBERACAO_FINANCEIRA
      );
    }

    // G e P sem restricoes
    return false;
  };

  const canAccessPecasModule = (): boolean => !isFeatureRestricted(RESTRICTED_FEATURES.PECAS);
  const canAccessTiposPecasModule = (): boolean =>
    !isFeatureRestricted(RESTRICTED_FEATURES.TIPOS_PECAS);
  const canAccessLiberacaoFinanceira = (): boolean =>
    !isFeatureRestricted(RESTRICTED_FEATURES.LIBERACAO_FINANCEIRA);

  return {
    licencaTipo,
    loading,
    isFeatureRestricted,
    canAccessPecasModule,
    canAccessTiposPecasModule,
    canAccessLiberacaoFinanceira,
  };
}
