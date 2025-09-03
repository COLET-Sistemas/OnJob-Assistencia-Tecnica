"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Building2,
  Users,
  Package,
  MapPin,
  Shield,
  Calendar,
} from "lucide-react";
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
    setTitle("Licença e Empresa");
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

  // Componente de skeleton para carregamento
  const Skeleton = () => (
    <div className="animate-pulse space-y-6">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  );

  const InfoCard = useCallback(
    ({
      title,
      value,
      icon,
    }: {
      title: string;
      value: string | number | undefined;
      icon: React.ReactNode;
    }) => (
      <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-lg h-[100px]">
        <div className="p-3 bg-gray-50 rounded-full">{icon}</div>
        <div className="flex-1">
          <p className="text-xs text-gray-500 font-medium">{title}</p>
          <p className="text-[var(--neutral-graphite)] font-semibold">
            {value || "Não informado"}
          </p>
        </div>
      </div>
    ),
    []
  );

  return (
    <>
      <PageHeader
        title="Informações da Empresa"
        config={{ type: "form", backLink: "admin/dashboard" }}
      />

      <div className="max-w-8l mx-auto space-y-6">
        {/* Seção de informações da empresa */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dados principais */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden h-[450px]">
              <div className="p-6 h-full flex flex-col">
                <h3 className="text-lg font-medium mb-6 text-[var(--neutral-graphite)] flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[var(--primary)]" />
                  Dados Corporativos
                </h3>

                {loading ? (
                  <div className="flex-1 flex items-center">
                    <Skeleton />
                  </div>
                ) : (
                  <div className="space-y-4 flex-1 flex flex-col justify-center">
                    <InfoCard
                      title="Razão Social"
                      value={empresaData?.razao_social}
                      icon={
                        <Building2 className="h-5 w-5 text-[var(--primary)]" />
                      }
                    />

                    <InfoCard
                      title="CNPJ"
                      value={empresaData?.cnpj}
                      icon={
                        <Shield className="h-5 w-5 text-[var(--primary)]" />
                      }
                    />

                    <InfoCard
                      title="Endereço"
                      value={enderecoCompleto}
                      icon={
                        <MapPin className="h-5 w-5 text-[var(--primary)]" />
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Versões */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden h-[250px]">
              <div className="p-6 h-full flex flex-col">
                <h3 className="text-lg font-medium mb-6 text-[var(--neutral-graphite)] flex items-center gap-2">
                  <Package className="h-5 w-5 text-[var(--primary)]" />
                  Versões
                </h3>

                {loading ? (
                  <div className="flex flex-col gap-4 flex-1 justify-center">
                    <div className="h-[40px] bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-[40px] bg-gray-100 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 flex-1">
                    <div className="p-4 bg-white border border-gray-100 rounded-lg flex justify-between items-center">
                      <p className="text-md text-gray-500 font-medium">
                        Aplicação
                      </p>
                      <p className="text-lg font-bold text-[var(--primary)]">
                        {packageInfo.version}
                      </p>
                    </div>

                    <div className="p-4 bg-white border border-gray-100 rounded-lg flex justify-between items-center">
                      <p className="text-md text-gray-500 font-medium">API</p>
                      <p className="text-lg font-bold text-[var(--primary)]">
                        {versaoInfo.versaoApi || "N/A"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mapa e licenças */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mapa */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden h-[450px]">
              <div className="p-6 h-full flex flex-col">
                <h3 className="text-lg font-medium mb-4 text-[var(--neutral-graphite)] flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[var(--primary)]" />
                  Localização
                </h3>

                {loading ? (
                  <div className="flex-1 w-full rounded-lg flex items-center justify-center bg-gray-50 border">
                    <Loading
                      size="medium"
                      text="Carregando mapa..."
                      preventScroll={false}
                    />
                  </div>
                ) : (
                  <div className="transition-all duration-300 rounded-lg overflow-hidden flex-1">
                    <MapComponent
                      height="100%"
                      zoom={17}
                      showAddress={false}
                      className="border border-gray-100 rounded-lg h-full"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Licença */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden h-[250px]">
              <div className="p-6 h-full flex flex-col">
                <h3 className="text-lg font-medium mb-4 text-[var(--neutral-graphite)] flex items-center gap-2">
                  <Users className="h-5 w-5 text-[var(--primary)]" />
                  Informações de Licença
                </h3>
                <div className="flex-1 flex flex-col gap-3">
                  {/* Usuários */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex justify-between items-center p-4 rounded-lg border border-gray-100 bg-white">
                      <span className="text-sm text-gray-500">
                        Usuários Licenciados
                      </span>
                      <span className="text-xl font-bold text-[var(--primary)]">
                        {empresaData?.usuarios_licenciados ?? "-"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-lg border border-gray-100 bg-white">
                      <span className="text-sm text-gray-500">
                        Usuários Ativos
                      </span>
                      <span className="text-xl font-bold text-green-600">
                        {empresaData?.usuarios_ativos ?? "-"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-lg border border-gray-100 bg-white">
                      <span className="text-sm text-gray-500">
                        Usuários Cadastrados
                      </span>
                      <span className="text-xl font-bold text-blue-600">
                        {empresaData?.usuarios_cadastrados ?? "-"}
                      </span>
                    </div>
                  </div>

                  {/* Validade */}
                  <div className="flex items-center gap-3 p-4 bg-[#f8f5ff] border border-[#e9e1fa] rounded-lg">
                    <Calendar className="h-5 w-5 text-[var(--primary)]" />
                    <div className="flex flex-col justify-center">
                      <p className="text-xs text-gray-500 font-medium">
                        Validade da Licença
                      </p>
                      <p className="text-[var(--primary)] font-semibold">
                        {empresaData?.data_validade ?? "Data não informada"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConsultaEmpresa;
