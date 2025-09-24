"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MobileHeader from "@/components/tecnico/MobileHeader";
import packageInfo from "../../../../package.json";

export default function SobrePage() {
  const [apiVersion, setApiVersion] = useState<string>("não definido");
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const version = localStorage.getItem("versao_api") || "não definido";
      setApiVersion(version);
    }
  }, []);
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <MobileHeader title="Sobre o OnJob" onMenuClick={() => router.back()} />

      <main className="flex-1 flex flex-col items-center px-4 py-8 max-w-md w-full mx-auto">
        <div className="bg-white rounded-3xl p-8 w-full border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-white font-bold text-xl">OJ</span>
            </div>
            <h1 className="text-2xl font-light text-gray-900 mb-2">OnJob</h1>
            <p className="text-gray-600">
              Propriedade da{" "}
              <span className="font-medium">Colet Sistemas de Gestão</span>
            </p>
          </div>

          {/* Contact Section */}
          <div className="space-y-5 mb-8">
            <div className="group">
              <p className="text-sm text-gray-500 mb-1">
                Conheça nossas soluções:
              </p>
              <a
                href="https://www.coletsistemas.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-700 transition-colors font-medium"
              >
                www.coletsistemas.com.br
              </a>
            </div>

            <div className="group">
              <p className="text-sm text-gray-500 mb-1">Suporte técnico</p>
              <a
                href="mailto:suporte_onjob@coletsistemas.com.br"
                className="text-purple-600 hover:text-purple-700 transition-colors font-medium"
              >
                suporte_onjob@coletsistemas.com.br
              </a>
            </div>

            <div className="group">
              <p className="text-sm text-gray-500 mb-1">Sugestões</p>
              <a
                href="mailto:onjob@coletsistemas.com.br"
                className="text-purple-600 hover:text-purple-700 transition-colors font-medium"
              >
                onjob@coletsistemas.com.br
              </a>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              Suas sugestões serão avaliadas e, se aprovadas, poderão ser
              incluídas em versões futuras.
            </p>
          </div>

          {/* Version Info */}
          <div className="border-t border-gray-100 pt-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500 mb-1">App</p>
                <p className="font-mono text-sm text-gray-900">
                  {packageInfo.version}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">API</p>
                <p className="font-mono text-sm text-gray-900">
                  {isMounted ? apiVersion : "carregando..."}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              © 2000–2025 Colet Sistemas de Gestão
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
