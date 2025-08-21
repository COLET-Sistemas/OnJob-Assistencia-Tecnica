"use client";

import React, { useState, useEffect } from "react";
import { Building2, MapPin, Users, Shield, Package } from "lucide-react";
import PageHeader from "@/components/admin/ui/PageHeader";
import { Loading } from "@/components/LoadingPersonalizado";
import packageInfo from "../../../../../package.json";
import { useTitle } from "@/context/TitleContext";

interface EmpresaData {
  razao_social: string;
  cnpj: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  coordenadas: {
    latitude: number;
    longitude: number;
  };
}

interface UsuarioInfo {
  usuariosLicenciados: number;
  usuariosRegistrados: number;
}

interface VersaoInfo {
  versaoApp: string;
  versaoApi: string;
}

const ConsultaEmpresa: React.FC = () => {
  const [empresaData, setEmpresaData] = useState<EmpresaData | null>(null);
  const [usuarioInfo, setUsuarioInfo] = useState<UsuarioInfo>({
    usuariosLicenciados: 0,
    usuariosRegistrados: 0,
  });
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
    contarUsuarios();
    carregarVersoes();
  }, []);

  const carregarDadosEmpresa = () => {
    try {
      const nomeEmpresa = localStorage.getItem("razao_social") || "";
      const cnpj = localStorage.getItem("cnpj") || "";
      const endereco = localStorage.getItem("endereco_empresa") || "";
      const coordenadasStr = localStorage.getItem("coordenadas") || "";

      // Parse das coordenadas
      let coordenadas = { latitude: 0, longitude: 0 };
      if (coordenadasStr) {
        try {
          const coordenadasObj = JSON.parse(coordenadasStr);
          coordenadas = {
            latitude: parseFloat(coordenadasObj.latitude) || 0,
            longitude: parseFloat(coordenadasObj.longitude) || 0,
          };
        } catch (e) {
          console.warn("Erro ao fazer parse das coordenadas:", e);
        }
      }

      const enderecoPartes = endereco.split(", ");

      setEmpresaData({
        razao_social: nomeEmpresa,
        cnpj: cnpj,
        endereco: enderecoPartes[0] || endereco,
        numero: enderecoPartes[1] || "",
        bairro: enderecoPartes[2] || "",
        cidade: enderecoPartes[3] || "",
        uf: enderecoPartes[4] || "",
        cep: "00000-000",
        coordenadas,
      });
    } catch (error) {
      console.error("Erro ao carregar dados da empresa:", error);
    }
  };

  const contarUsuarios = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/usuarios", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const usuarios = await response.json();
        setUsuarioInfo((prev) => ({
          ...prev,
          usuariosRegistrados: usuarios.length || 0,
        }));
      }
    } catch (error) {
      console.error("Erro ao contar usuários:", error);
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

  const enderecoCompleto = empresaData
    ? `${empresaData.endereco}, ${empresaData.numero} - ${empresaData.bairro}, ${empresaData.cidade} - ${empresaData.uf}, ${empresaData.cep}`
    : "";

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const googleMapsUrl =
    empresaData &&
    empresaData.coordenadas.latitude &&
    empresaData.coordenadas.longitude &&
    googleMapsApiKey
      ? `https://www.google.com/maps/embed/v1/view?key=${googleMapsApiKey}&center=${empresaData.coordenadas.latitude},${empresaData.coordenadas.longitude}&zoom=15`
      : "";

  if (loading) {
    return (
      <Loading
        fullScreen={true}
        preventScroll={false}
        text="Carregando motivos de atendimento..."
        size="large"
      />
    );
  }

  return (
    <div className="min-h-screen  p-2">
      <PageHeader
        title="Informações da Empresa"
        config={{ type: "form", backLink: "/dashboard" }}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço Completo
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <span className="text-black font-semibold">
                  {enderecoCompleto || "Não informado"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mapa */}
        {googleMapsUrl && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="h-6 w-6 text-[var(--primary)]" />
              <h3 className="text-lg font-semibold text-[var(--neutral-graphite)]">
                Localização
              </h3>
            </div>

            <div className="w-full h-80 rounded-lg overflow-hidden border">
              <iframe
                src={googleMapsUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localização da Empresa"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informações de Licença */}
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
                  {usuarioInfo.usuariosLicenciados}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
                <span className="font-medium text-gray-700">
                  Usuários Registrados
                </span>
                <span className="text-2xl font-bold text-green-600">
                  {usuarioInfo.usuariosRegistrados}
                </span>
              </div>

              <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                {usuarioInfo.usuariosRegistrados <=
                usuarioInfo.usuariosLicenciados
                  ? "✅ Licença dentro do limite"
                  : "⚠️ Usuários registrados excedem a licença"}
              </div>
            </div>
          </div>

          {/* Informações de Versão */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Package className="h-6 w-6 text-[var(--primary)]" />
              <h3 className="text-lg font-semibold text-[var(--neutral-graphite)]">
                Versão
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
