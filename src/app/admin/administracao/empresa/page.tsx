"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Building2, Users, Package } from "lucide-react";
import PageHeader from "@/components/admin/ui/PageHeader";
import { Loading } from "@/components/LoadingPersonalizado";
import MapComponent from "@/components/admin/ui/MapComponent";
import packageInfo from "../../../../../package.json";
import { useTitle } from "@/context/TitleContext";
import {
  getEmpresaFromStorage,
  formatEmpresaAddress,
  type EmpresaData,
} from "@/utils/maps";

interface VersaoInfo {
  versaoApp: string;
  versaoApi: string;
}

const ConsultaEmpresa: React.FC = () => {
  const [empresaData, setEmpresaData] = useState<EmpresaData | null>(null);
  const [versaoInfo, setVersaoInfo] = useState<VersaoInfo>({
    versaoApp: "",
    versaoApi: "",
  });
  const [loading, setLoading] = useState(true);

  const { setTitle } = useTitle();

  // Definir o título da página apenas uma vez
  useEffect(() => {
    setTitle("Empresa / Licenças / Versões");
  }, [setTitle]);

  useEffect(() => {
    const fetchEmpresa = async () => {
      try {
        const empresa = getEmpresaFromStorage();

        if (empresa) {
          setEmpresaData(empresa);
        } else {
          console.warn("Dados da empresa não encontrados no localStorage");
        }
      } catch (error) {
        console.error("Erro ao carregar dados da empresa:", error);
      }
    };

    const fetchVersoes = async () => {
      try {
        const versaoApi = localStorage.getItem("versao_api") || "";
        const versaoApp =
          process.env.NEXT_PUBLIC_APP_VERSION || packageInfo.version;
        setVersaoInfo({
          versaoApp,
          versaoApi,
        });
      } catch (error) {
        console.error("Erro ao carregar versões:", error);
      }
    };

    const carregarDados = async () => {
      try {
        await Promise.all([fetchEmpresa(), fetchVersoes()]);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  const enderecoCompleto = useMemo(
    () => (empresaData ? formatEmpresaAddress(empresaData) : ""),
    [empresaData]
  );

  const EmpresaInfoCard = useCallback(
    ({
      label,
      value,
      icon,
    }: {
      label: string;
      value: string | null | undefined;
      icon?: React.ReactNode;
    }) => (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 transition-all duration-300 hover:border-gray-300 hover:shadow-sm">
          <span className="text-black font-semibold flex items-center gap-2">
            {icon}
            {value || "Não informado"}
          </span>
        </div>
      </div>
    ),
    []
  );

  const LicencaCard = useCallback(
    ({
      label,
      value,
      bgColor,
      textColor,
    }: {
      label: string;
      value: number | undefined;
      bgColor: string;
      textColor: string;
    }) => (
      <div
        className={`flex justify-between items-center p-4 ${bgColor} rounded-lg border transition-all duration-300 hover:shadow-md`}
      >
        <span className="font-medium text-gray-700">{label}</span>
        <span className={`text-2xl font-bold ${textColor}`}>
          {value !== undefined ? value : "-"}
        </span>
      </div>
    ),
    []
  );

  // Componente de skeleton para carregamento
  const EmpresaInfoSkeleton = () => (
    <div className="animate-pulse space-y-4">
      <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
      <div className="h-12 bg-gray-200 rounded-lg"></div>
      <div className="h-5 w-24 bg-gray-200 rounded mb-2"></div>
      <div className="h-12 bg-gray-200 rounded-lg"></div>
      <div className="h-5 w-40 bg-gray-200 rounded mb-2"></div>
      <div className="h-12 bg-gray-200 rounded-lg"></div>
    </div>
  );

  const LicencaSkeleton = () => (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-16 bg-gray-200 rounded-lg"></div>
        <div className="h-16 bg-gray-200 rounded-lg"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-16 bg-gray-200 rounded-lg"></div>
        <div className="h-16 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Informações da Empresa"
        config={{ type: "form", backLink: "admin/dashboard" }}
      />

      <div className="max-w-8xl mx-auto space-y-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 transition-all duration-300 hover:shadow-md">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-100">
            <Building2 className="h-6 w-6 text-[var(--primary)]" />
            <h3 className="text-lg font-semibold text-[var(--neutral-graphite)]">
              Dados da Empresa
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              {loading ? (
                <EmpresaInfoSkeleton />
              ) : (
                <>
                  <EmpresaInfoCard
                    label="Razão Social"
                    value={empresaData?.razao_social}
                  />

                  <EmpresaInfoCard label="CNPJ" value={empresaData?.cnpj} />

                  <EmpresaInfoCard
                    label="Endereço Completo"
                    value={enderecoCompleto}
                  />

                  {empresaData?.latitude && empresaData?.longitude && (
                    <EmpresaInfoCard
                      label="Coordenadas"
                      value={`${empresaData.latitude.toFixed(
                        6
                      )}, ${empresaData.longitude.toFixed(6)}`}
                    />
                  )}
                </>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localização no Mapa
              </label>

              {loading ? (
                <div className="h-[320px] w-full rounded-lg flex items-center justify-center bg-gray-50 border">
                  <Loading
                    size="medium"
                    text="Carregando mapa..."
                    preventScroll={false}
                  />
                </div>
              ) : (
                <div className="transition-all duration-300 rounded-lg overflow-hidden hover:shadow-lg">
                  <MapComponent
                    height="320px"
                    zoom={17}
                    showAddress={false}
                    className="border border-gray-300 rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-10 gap-6">
          <div className="md:col-span-6 bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 transition-all duration-300 hover:shadow-md">
            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-100">
              <Users className="h-6 w-6 text-[var(--primary)]" />
              <h3 className="text-lg font-semibold text-[var(--neutral-graphite)]">
                Licença
              </h3>
            </div>

            {loading ? (
              <LicencaSkeleton />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <LicencaCard
                    label="Usuários Licenciados"
                    value={empresaData?.usuarios_licenciados}
                    bgColor="bg-green-50 border-green-200"
                    textColor="text-green-600"
                  />

                  <LicencaCard
                    label="Usuários Ativos"
                    value={empresaData?.usuarios_ativos}
                    bgColor="bg-green-50 border-green-200"
                    textColor="text-green-600"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <LicencaCard
                    label="Usuários Cadastrados"
                    value={empresaData?.usuarios_cadastrados}
                    bgColor="bg-yellow-50 border-yellow-200"
                    textColor="text-yellow-600"
                  />

                  <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg border border-yellow-200 transition-all duration-300 hover:shadow-md">
                    <span className="font-medium text-gray-700 flex items-center gap-2">
                      Data de validade
                    </span>
                    <span className="text-lg font-bold text-yellow-700">
                      {empresaData?.data_validade ?? "Data não informada"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-4 bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 transition-all duration-300 hover:shadow-md">
            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-100">
              <Package className="h-6 w-6 text-[var(--primary)]" />
              <h3 className="text-lg font-semibold text-[var(--neutral-graphite)]">
                Versões
              </h3>
            </div>

            {loading ? (
              <LicencaSkeleton />
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg border border-purple-200 transition-all duration-300 hover:shadow-md">
                  <span className="font-medium text-gray-700">
                    Versão da Aplicação
                  </span>
                  <span className="text-lg font-bold text-purple-600">
                    {packageInfo.version}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg border border-purple-200 transition-all duration-300 hover:shadow-md">
                  <span className="font-medium text-gray-700">
                    Versão da API
                  </span>
                  <span className="text-lg font-bold text-purple-600">
                    {versaoInfo.versaoApi || "N/A"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ConsultaEmpresa;
