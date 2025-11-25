import { useState, useEffect } from "react";
import type { LicencaTipo } from "@/types/licenca";

interface UseLicencaReturn {
  licencaTipo: LicencaTipo | null;
  loading: boolean;
  isFeatureRestricted: (feature: string) => boolean;
  canAccessPecasModule: () => boolean;
  canAccessTiposPecasModule: () => boolean;
  canAccessLiberacaoFinanceira: () => boolean;
  canAccessOsRetroativasModule: () => boolean;
}

const RESTRICTED_FEATURES = {
  PECAS: "pecas",
  TIPOS_PECAS: "tipos_pecas",
  LIBERACAO_FINANCEIRA: "liberacao_financeira",
  OS_RETROATIVAS: "os_retroativas",
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

    const restrictedByLicense: Record<LicencaTipo, string[]> = {
      S: [
        RESTRICTED_FEATURES.PECAS,
        RESTRICTED_FEATURES.TIPOS_PECAS,
        RESTRICTED_FEATURES.LIBERACAO_FINANCEIRA,
        RESTRICTED_FEATURES.OS_RETROATIVAS,
      ],
      G: [RESTRICTED_FEATURES.OS_RETROATIVAS],
      P: [],
    };

    return restrictedByLicense[licencaTipo]?.includes(feature) ?? false;
  };

  const canAccessPecasModule = (): boolean => !isFeatureRestricted(RESTRICTED_FEATURES.PECAS);
  const canAccessTiposPecasModule = (): boolean =>
    !isFeatureRestricted(RESTRICTED_FEATURES.TIPOS_PECAS);
  const canAccessLiberacaoFinanceira = (): boolean =>
    !isFeatureRestricted(RESTRICTED_FEATURES.LIBERACAO_FINANCEIRA);
  const canAccessOsRetroativasModule = (): boolean =>
    !isFeatureRestricted(RESTRICTED_FEATURES.OS_RETROATIVAS);

  return {
    licencaTipo,
    loading,
    isFeatureRestricted,
    canAccessPecasModule,
    canAccessTiposPecasModule,
    canAccessLiberacaoFinanceira,
    canAccessOsRetroativasModule,
  };
}
