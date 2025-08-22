"use client";
import React, { useState, useEffect } from "react";
import { Building2, Users, Shield, Package } from "lucide-react";
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

  useEffect(() => {
    setTitle("Empresa / Licenças / Versões");
  }, [setTitle]);

  useEffect(() => {
    carregarDadosEmpresa();
    carregarVersoes();
  }, []);

  const carregarDadosEmpresa = () => {
    try {
      // Usar a função utilitária para recuperar dados da empresa
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

  const carregarVersoes = async () => {
    try {
      const versaoApi = localStorage.getItem("versao_api") || "";
      const versaoApp = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";
      setVersaoInfo({
        versaoApp,
        versaoApi,
      });
    } catch (error) {
      console.error("Erro ao carregar versões:", error);
    } finally {
      setLoading(false);
    }
  };

  // Usar a função utilitária para formatar endereço
  const enderecoCompleto = empresaData ? formatEmpresaAddress(empresaData) : "";

  if (loading) {
    return (
      <Loading
        fullScreen={true}
        preventScroll={false}
        text="Carregando informações da empresa..."
        size="large"
      />
    );
  }

  return (
    <div className="min-h-screen p-2">
      <PageHeader
        title="Informações da Empresa"
        config={{ type: "form", backLink: "admin/dashboard" }}
      />

      <div className="max-w-8xl mx-auto space-y-6">
        {/* Dados da Empresa */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="h-6 w-6 text-[var(--primary)]" />
            <h3 className="text-lg font-semibold text-[var(--neutral-graphite)]">
              Dados da Empresa
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informações da empresa */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razão Social
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-black font-semibold">
                    {empresaData?.razao_social || "Não informado"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CNPJ
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-black font-semibold">
                    {empresaData?.cnpj || ""}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço Completo
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="text-black font-semibold">
                    {enderecoCompleto || "Não informado"}
                  </span>
                </div>
              </div>

              {/* Coordenadas */}
              {empresaData?.latitude && empresaData?.longitude && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coordenadas
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <span className="text-black font-semibold">
                      {empresaData.latitude.toFixed(6)},{" "}
                      {empresaData.longitude.toFixed(6)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Mapa usando o MapComponent */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Localização no Mapa
              </label>

              <MapComponent
                height="320px"
                zoom={17}
                showAddress={false}
                className="border border-gray-300 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Licença e Versão */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Licença */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="h-6 w-6 text-[var(--primary)]" />
              <h3 className="text-lg font-semibold text-[var(--neutral-graphite)]">
                Licença
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <span className="font-medium text-gray-700">
                  Usuários Licenciados
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  {empresaData?.usuarios_licenciados}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <span className="font-medium text-gray-700">
                  Usuários Ativos
                </span>
                <span className="text-2xl font-bold text-yellow-600">
                  {empresaData?.usuarios_ativos}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
                <span className="font-medium text-gray-700">
                  Usuários Cadastrados
                </span>
                <span className="text-2xl font-bold text-green-600">
                  {empresaData?.usuarios_cadastrados}
                </span>
              </div>

              {/* Data de validade da licença */}
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <span className="font-medium text-gray-700">
                  Data de validade da licença
                </span>
                <span className="text-lg font-bold text-gray-700">
                  {empresaData?.data_validade ?? "Data não informada"}
                </span>
              </div>
            </div>
          </div>

          {/* Versão */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Package className="h-6 w-6 text-[var(--primary)]" />
              <h3 className="text-lg font-semibold text-[var(--neutral-graphite)]">
                Versões
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <span className="font-medium text-gray-700">
                  Versão da Aplicação
                </span>
                <span className="text-lg font-bold text-purple-600">
                  {packageInfo.version}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <span className="font-medium text-gray-700">Versão da API</span>
                <span className="text-lg font-bold text-orange-600">
                  {versaoInfo.versaoApi}
                </span>
              </div>

              <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Sistema atualizado e funcionando corretamente
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultaEmpresa;
